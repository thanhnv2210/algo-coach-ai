# ADC: Which Concurrency Primitive Should I Use?

## Why It Matters

Choosing the wrong concurrency primitive is one of the most common causes of bugs in multi-threaded Java code. Under-synchronize and you get data races and visibility failures. Over-synchronize and you introduce unnecessary contention, thread starvation, and throughput collapse.

Senior engineers are expected to reason about concurrency at the primitive level — not just reach for `synchronized` by default. Interviewers probe this with scenarios: "You have a counter hit by 200 threads; what do you use?" or "Your cache is read 99% of the time; how do you protect it?"

The six primitives covered here span the full spectrum from lightweight visibility hints to full lock objects with policy knobs. Knowing when each one applies — and why — separates a candidate who has read the docs from one who has written production concurrent code.

---

## Decision Matrix

| Primitive | Visibility | Atomicity | Blocking | Fairness Control | Throughput (high contention) |
|---|---|---|---|---|---|
| `volatile` | Yes | No (except 64-bit read/write) | No | N/A | Highest |
| `synchronized` | Yes | Yes | Yes | No | Low |
| `ReentrantLock` | Yes | Yes | Yes | Optional | Low–Medium |
| `ReadWriteLock` | Yes | Yes | Yes (write) / No (read) | Optional | High (read-heavy) |
| `AtomicInteger` / `AtomicReference` | Yes | Yes (CAS) | No | N/A | Medium |
| `LongAdder` | Yes | Yes (striped CAS) | No | N/A | Highest |
| `StampedLock` | Yes | Yes | Optional | No | Highest (read-heavy) |

---

## Option 1 — `volatile`

### Context
You need one thread's write to be immediately visible to all other threads, but you do not need compound operations (check-then-act, increment) to be atomic.

### Trade-off
- **Pro**: Zero locking overhead. No context switches. Compiler and CPU reordering fences are inserted automatically.
- **Con**: Does not provide atomicity. `i++` on a `volatile int` is still a read-modify-write race. Cannot protect critical sections involving more than one variable.

### Decision Rule
Use `volatile` when:
- There is exactly **one writer** and one or more readers (single-writer rule).
- The shared variable is a simple **boolean flag** (e.g., `volatile boolean running`).
- Implementing **Double-Checked Locking** (DCL) for lazy singleton initialization — the `volatile` prevents the JIT from reordering the constructor call with the reference publication.

Never use `volatile` as a substitute for `AtomicInteger` when you need `i++`.

---

## Option 2 — `synchronized` / Intrinsic Lock

### Context
You need mutual exclusion over a block of code that reads and writes shared state. The JVM provides every object with a built-in monitor lock.

### Trade-off
- **Pro**: Simplest API. Automatically releases on exception. Integrated with `Object.wait/notify` for condition signaling.
- **Con**: Non-interruptible. No timeout. No fairness guarantee. One condition queue per lock (must use `notifyAll` to avoid missed signals when there are multiple conditions). Prone to deadlock if lock order is not disciplined.

### Decision Rule
Use `synchronized` when:
- **Low to moderate contention** and the critical section is short.
- You need `wait/notify` semantics and do not want to manage `Condition` objects.
- The codebase values readability and the overhead of `ReentrantLock` is not justified.

---

## Option 3 — `ReentrantLock`

### Context
You need the same mutual exclusion as `synchronized` but require additional policy controls that the intrinsic lock cannot provide.

### Trade-off
- **Pro**: `tryLock()` for non-blocking acquisition. `tryLock(timeout, unit)` to avoid indefinite waiting. `lockInterruptibly()` so a blocked thread can respond to interruption. Optional **fairness** mode (FIFO ordering reduces starvation at the cost of throughput). Multiple `Condition` objects per lock (clean separation of `await/signal` per condition).
- **Con**: Must manually release in a `finally` block — forgetting this causes a permanent deadlock. More verbose. Fairness mode can halve throughput due to forced context switches.

### Decision Rule
Use `ReentrantLock` when you need any of:
- **`tryLock`** to implement lock-ordering or back-off strategies.
- **Timed acquisition** to implement timeouts in higher-level protocols.
- **Interruptible blocking** (e.g., cancellable tasks).
- **Multiple conditions** on one lock (e.g., `notFull` and `notEmpty` in a bounded buffer).
- **Fairness** to prevent thread starvation under high contention.

---

## Option 4 — `ReadWriteLock` (`ReentrantReadWriteLock`)

### Context
Shared state is read far more often than it is written — for example, an in-memory configuration registry or a cache. Allowing concurrent reads while serializing writes can dramatically increase throughput.

### Trade-off
- **Pro**: Multiple readers proceed simultaneously. Writers get exclusive access. Throughput improvement is proportional to the read/write ratio.
- **Con**: **Write starvation** is possible if readers constantly hold the lock. Acquiring a write lock requires all readers to drain — latency spikes under heavy read load. Bookkeeping overhead makes it slower than `synchronized` when reads and writes are balanced. **Lock downgrade** (write → read) is supported, but **lock upgrade** (read → write) is not (causes deadlock).

### Decision Rule
Use `ReadWriteLock` when:
- Reads outnumber writes by at least **5:1**.
- The read operation is non-trivial (a single field read is cheaper protected by `volatile`).
- Write starvation is acceptable or mitigated by application design.

---

## Option 5 — `AtomicInteger` / `AtomicReference` / `LongAdder`

### Context
You need atomic operations on a single variable without blocking. The JDK `java.util.concurrent.atomic` package uses **Compare-And-Swap (CAS)** CPU instructions.

### Trade-off — `AtomicInteger` / `AtomicReference`
- **Pro**: Lock-free. No context switch. Safe for single-variable counters, accumulators, and reference swaps. Supports complex CAS patterns via `compareAndSet`.
- **Con**: Under **high contention**, many threads spin retrying failed CAS operations — throughput collapses. Not suitable for protecting multi-variable invariants.

### Trade-off — `LongAdder`
- **Pro**: Internally **stripes** the counter across multiple cells, so competing threads update different cells with minimal collision. `sum()` aggregates all cells. Dramatically outperforms `AtomicLong` when many threads increment simultaneously.
- **Con**: `sum()` is not a point-in-time snapshot — it is eventually consistent. Not suitable when you need a precise current value mid-flight (e.g., enforcing a hard cap like "reject if counter > 1000").

### Decision Rule
- Single-variable counter, **low-to-moderate contention**: `AtomicInteger` / `AtomicLong`.
- Single-variable counter, **high contention**, approximate value is acceptable: `LongAdder`.
- Atomic **reference** swap or CAS-based linked structure: `AtomicReference` / `AtomicStampedReference` (if ABA problem is a concern).
- Need a precise **compare-and-set** on a long: `AtomicLong`.

---

## Option 6 — `StampedLock`

### Context
You want the highest possible read throughput on read-heavy workloads and are willing to handle the complexity of **optimistic reads**.

### Trade-off
- **Pro**: **Optimistic read mode** requires no lock acquisition — the reader just captures a stamp and validates it after the read. If no write occurred, the read completes with zero contention overhead. Can outperform `ReadWriteLock` by 2–3x on very read-heavy benchmarks.
- **Con**: **Not reentrant** — a thread that holds a `StampedLock` write lock and tries to acquire it again will deadlock. Optimistic reads can **fail** (return stamp 0) if a write occurred between capture and validate — the caller must fall back to a pessimistic read lock. More complex API increases the chance of misuse. No `Condition` support.

### When does an optimistic read fail?
`tryOptimisticRead()` returns a non-zero stamp. If a write lock is acquired by another thread before `validate(stamp)` is called, `validate` returns `false`. The caller must retry or escalate to a full read lock. Failure is expected and handled — it is not an error condition.

### Decision Rule
Use `StampedLock` when:
- Read/write ratio is **very high** (think 50:1 or more).
- You can implement the **validate-and-retry** pattern without excessive complexity.
- The data being read fits within a small, bounded critical section.
- Reentrancy is **not** needed.

---

## Summary — Contention × Operation → Primitive

| Contention | Operation | Use |
|---|---|---|
| N/A | Single-writer boolean flag | `volatile` |
| N/A | DCL singleton | `volatile` field + `synchronized` init block |
| Low | Simple mutual exclusion | `synchronized` |
| Any | Need tryLock / timeout / interruptible | `ReentrantLock` |
| Any | Need fairness or multiple conditions | `ReentrantLock` |
| Read-heavy (5:1+) | Read/write shared object | `ReentrantReadWriteLock` |
| Read-heavy (50:1+), perf-critical | Read/write shared object | `StampedLock` |
| Low–Medium | Single-variable counter | `AtomicInteger` / `AtomicLong` |
| High | Single-variable counter, approximate ok | `LongAdder` |
| Any | Atomic reference swap | `AtomicReference` |

---

## Code Example

```java
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class JavaLabRunner {

    // --- 1. volatile boolean flag ---
    static volatile boolean running = true;

    // --- 2. AtomicInteger counter ---
    static AtomicInteger atomicCounter = new AtomicInteger(0);

    // --- 3. LongAdder for high-contention counter ---
    static LongAdder adderCounter = new LongAdder();

    // --- 4. ReentrantReadWriteLock protecting a shared value ---
    static int sharedValue = 0;
    static final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();
    static final Lock readLock  = rwLock.readLock();
    static final Lock writeLock = rwLock.writeLock();

    // --- 5. StampedLock for optimistic reads ---
    static double stampedX = 1.0, stampedY = 2.0;
    static final StampedLock stampedLock = new StampedLock();

    public static void main(String[] args) throws InterruptedException {

        System.out.println("=== volatile flag demo ===");
        Thread worker = new Thread(() -> {
            int ticks = 0;
            while (running) {
                ticks++;
                if (ticks > 5_000_000) break; // safety bound
            }
            System.out.println("Worker stopped after " + ticks + " ticks");
        });
        worker.start();
        Thread.sleep(10);
        running = false;  // single-writer: safe with volatile
        worker.join();

        System.out.println("\n=== AtomicInteger vs LongAdder ===");
        int threads = 8;
        int increments = 100_000;
        ExecutorService pool = Executors.newFixedThreadPool(threads);

        CountDownLatch latch1 = new CountDownLatch(threads);
        long t1 = System.nanoTime();
        for (int i = 0; i < threads; i++) {
            pool.submit(() -> {
                for (int j = 0; j < increments; j++) atomicCounter.incrementAndGet();
                latch1.countDown();
            });
        }
        latch1.await();
        long atomicTime = System.nanoTime() - t1;

        CountDownLatch latch2 = new CountDownLatch(threads);
        long t2 = System.nanoTime();
        for (int i = 0; i < threads; i++) {
            pool.submit(() -> {
                for (int j = 0; j < increments; j++) adderCounter.increment();
                latch2.countDown();
            });
        }
        latch2.await();
        long adderTime = System.nanoTime() - t2;

        System.out.printf("AtomicInteger result: %d  time: %,d ns%n", atomicCounter.get(), atomicTime);
        System.out.printf("LongAdder    result: %d  time: %,d ns%n", adderCounter.sum(), adderTime);

        System.out.println("\n=== ReentrantReadWriteLock demo ===");
        // Writer sets value
        writeLock.lock();
        try {
            sharedValue = 42;
            System.out.println("Writer set sharedValue = " + sharedValue);
        } finally {
            writeLock.unlock();
        }
        // Multiple readers read concurrently
        CountDownLatch readLatch = new CountDownLatch(3);
        for (int i = 0; i < 3; i++) {
            pool.submit(() -> {
                readLock.lock();
                try {
                    System.out.println(Thread.currentThread().getName()
                        + " read sharedValue = " + sharedValue);
                } finally {
                    readLock.unlock();
                    readLatch.countDown();
                }
            });
        }
        readLatch.await();

        System.out.println("\n=== StampedLock optimistic read demo ===");
        double distance = distanceFromOrigin();
        System.out.printf("Distance from origin (optimistic): %.4f%n", distance);

        System.out.println("\n=== ReentrantLock tryLock demo ===");
        ReentrantLock rLock = new ReentrantLock();
        rLock.lock();
        try {
            // Simulate another thread failing to acquire within timeout
            boolean acquired = rLock.tryLock(10, TimeUnit.MILLISECONDS);
            // Same thread is reentrant — it will succeed here
            if (acquired) {
                System.out.println("tryLock acquired (reentrant)");
                rLock.unlock(); // release the extra acquisition
            } else {
                System.out.println("tryLock timed out (expected for non-reentrant scenario)");
            }
        } finally {
            rLock.unlock();
        }

        pool.shutdown();
        System.out.println("\nAll demos complete.");
    }

    // StampedLock optimistic read pattern
    static double distanceFromOrigin() {
        // 1. Try optimistic read — no lock acquired
        long stamp = stampedLock.tryOptimisticRead();
        double x = stampedX;
        double y = stampedY;

        // 2. Validate — did a write occur between tryOptimisticRead and now?
        if (!stampedLock.validate(stamp)) {
            // 3. Optimistic read failed — fall back to a full read lock
            stamp = stampedLock.readLock();
            try {
                x = stampedX;
                y = stampedY;
            } finally {
                stampedLock.unlockRead(stamp);
            }
            System.out.println("  (optimistic read failed, fell back to read lock)");
        } else {
            System.out.println("  (optimistic read succeeded)");
        }
        return Math.sqrt(x * x + y * y);
    }
}
```

---

## Interview Q&As

### Q1: What is the difference between `volatile` and `AtomicInteger`?

**Answer:**

`volatile` guarantees **visibility** — a write by one thread is immediately visible to all other threads. It does not guarantee **atomicity** for compound operations. The increment `i++` on a `volatile int` compiles to three separate operations (read, add, write) that can interleave across threads, producing a data race.

`AtomicInteger` uses a **Compare-And-Swap (CAS)** CPU instruction to make `incrementAndGet()` a single atomic operation. The CAS reads the current value, computes the new value, and writes it back only if the current value has not changed since the read. If another thread has intervened, the CAS fails and is retried in a spin loop.

Rule of thumb: use `volatile` for a single-writer flag or field that other threads only read. Use `AtomicInteger` whenever you need read-modify-write atomicity on an integer.

---

### Q2: What advantages does `ReentrantLock` have over `synchronized`?

**Answer:**

`ReentrantLock` provides four capabilities that the intrinsic lock cannot match:

1. **`tryLock()`** — attempts acquisition without blocking, returning immediately with `true` or `false`. Useful for avoiding deadlock by backing off when a lock is unavailable.
2. **`tryLock(long timeout, TimeUnit unit)`** — blocks for at most the given duration. Allows implementing request timeouts without leaving threads permanently hung.
3. **`lockInterruptibly()`** — a blocked thread can be interrupted via `Thread.interrupt()`. With `synchronized`, a thread waiting on a monitor cannot be interrupted.
4. **Fairness mode** — `new ReentrantLock(true)` uses FIFO ordering to prevent thread starvation under high contention. `synchronized` makes no fairness guarantee.
5. **Multiple `Condition` objects** — `lock.newCondition()` gives separate `await/signal` queues for different conditions on the same lock (e.g., `notFull` and `notEmpty` in a `BlockingQueue` implementation).

The trade-off is verbosity: `ReentrantLock` must be released in a `finally` block. If you do not need any of the above features, `synchronized` is cleaner and less error-prone.

---

### Q3: When does `LongAdder` beat `AtomicLong`?

**Answer:**

`AtomicLong` uses a single CAS on one memory location. Under high contention — many threads incrementing simultaneously — threads spin-retry their failed CAS operations. All threads fight over the same cache line, and throughput degrades roughly linearly as thread count increases.

`LongAdder` internally maintains a **base** value plus a dynamic array of **Cell** objects, each padded to occupy its own cache line. Competing threads are mapped to different cells and update them independently. `sum()` adds `base` plus all cells to produce the total.

The result: under high contention, `LongAdder` can be 5–10x faster than `AtomicLong` because threads rarely collide. The cost is that `sum()` is **not a point-in-time snapshot** — concurrent increments may or may not be included. This makes `LongAdder` unsuitable when you need a precise read-then-act (e.g., "reject if counter ≥ N").

Use `AtomicLong` when you need exact, up-to-date reads. Use `LongAdder` for high-throughput metrics, statistics counters, and rate trackers where an approximate aggregate is sufficient.

---

### Q4: What is a `StampedLock` optimistic read, and when does it fail?

**Answer:**

An optimistic read is a **lock-free** read attempt. The caller invokes `tryOptimisticRead()`, which returns a stamp (a version number) without acquiring any lock. The caller then reads the shared fields. Afterwards, it calls `validate(stamp)` — if no write lock was acquired between `tryOptimisticRead()` and `validate()`, the stamp is still valid and the read is considered consistent.

If a writer acquired the write lock during that window, `validate(stamp)` returns `false`. The stamp is invalidated because the internal version counter was incremented when the write lock was taken. At that point the caller **must not use the values it read** — they may be partially written — and must retry, either with another optimistic read or by escalating to a full `readLock()`.

An optimistic read fails when:
- A write lock is acquired between `tryOptimisticRead()` and `validate()`.
- `tryOptimisticRead()` itself returns 0, indicating that a write lock is already held at the moment of the call.

The optimistic path has zero blocking overhead, which is why `StampedLock` outperforms `ReentrantReadWriteLock` on very read-heavy workloads. The trade-off is the obligation to implement the validate-and-retry loop correctly, and the absence of reentrancy support — a thread that attempts to acquire a `StampedLock` it already holds a write lock on will deadlock.
