# Concurrency Terminology — Interview Reference

## Why this matters in interviews

Senior interviewers expect you to use precise vocabulary without hesitation. Saying "the thread can see stale data because of caching" is weaker than "without a happens-before edge, the JMM permits the JIT to keep the value in a register — there's no visibility guarantee." This lesson is a reference dictionary: read it before your interview, use it during.

## Concept

### Thread & Scheduling

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **Thread** | A lightweight unit of execution within a process, sharing heap memory but having its own stack | "I spawn a thread per request, but that doesn't scale — I'd use a thread pool instead." |
| **Daemon thread** | A background thread the JVM kills when all non-daemon threads finish | "The GC thread is a daemon thread — it doesn't prevent JVM shutdown." |
| **Context switch** | The OS saving one thread's CPU state and loading another's | "Excessive context switching is why `newCachedThreadPool` hurts under high load." |
| **Thread starvation** | A thread never gets CPU time because higher-priority threads always run first | "With an unfair lock, a low-priority thread can starve indefinitely." |

---

### Memory & Visibility

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **Java Memory Model (JMM)** | The spec that defines how threads read/write shared variables across CPU caches | "The JMM is why you can't assume a write in Thread A is visible in Thread B without synchronization." |
| **Happens-before** | A formal guarantee: if A happens-before B, B sees A's writes | "A `volatile` write happens-before every subsequent read of that variable." |
| **Visibility** | Whether a write by one thread is seen by another | "Without `volatile`, the compiler can cache the flag in a register — no visibility guarantee." |
| **Memory barrier / fence** | A CPU instruction that flushes/invalidates cache to enforce ordering | "`volatile` inserts a StoreStore barrier on write and a LoadLoad barrier on read." |
| **Reordering** | The CPU or JIT rearranging instructions for performance | "The JIT can reorder `instance = new Singleton()` — that's why DCL needs `volatile`." |
| **Cache line** | A 64-byte block of CPU cache that's loaded/evicted atomically | "Two `AtomicLong` fields on the same cache line cause false sharing — `LongAdder` avoids this by striping." |

---

### Synchronization Primitives

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **Monitor** | The intrinsic lock built into every Java object | "When you call `synchronized(obj)`, the thread acquires `obj`'s monitor." |
| **Intrinsic lock** | Same as monitor — the implicit lock from `synchronized` | "Intrinsic locks are not interruptible; `ReentrantLock` is." |
| **Mutex** | Mutual exclusion — only one thread holds it at a time | "`ReentrantLock` is a mutex; `ReadWriteLock` is not (multiple readers allowed)." |
| **Reentrant** | A thread that already holds a lock can acquire it again without deadlocking | "Intrinsic locks are reentrant by default — a `synchronized` method can call another `synchronized` method on the same object." |
| **Fairness** | Whether threads acquire a lock in arrival order (FIFO) | "A fair `ReentrantLock` prevents starvation but has 5–10x lower throughput than unfair." |

---

### Concurrency Problems

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **Race condition** | Outcome depends on the non-deterministic timing of threads | "`i++` on a shared `int` is a race condition — it's three operations: read, increment, write." |
| **Deadlock** | Two threads each hold a lock the other needs — both block forever | "Thread A locks `L1` then `L2`; Thread B locks `L2` then `L1` — classic deadlock." |
| **Livelock** | Threads keep responding to each other but make no progress | "Two threads each back off when they see a collision but keep retrying at the same time." |
| **Starvation** | A thread is perpetually denied access to a resource | "Using `notify()` instead of `notifyAll()` can cause starvation if the wrong thread is woken." |
| **False sharing** | Two unrelated variables share a CPU cache line, causing unnecessary invalidation | "Padding `AtomicLong` fields to 64 bytes apart eliminates false sharing." |

---

### Lock-Free / CAS

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **CAS (Compare-And-Swap)** | Atomic CPU instruction: "set to new value only if current value equals expected" | "`AtomicInteger.compareAndSet(12, 100)` succeeds only if the current value is still 12." |
| **Spin / busy-wait** | A thread repeatedly checks a condition without sleeping | "CAS-retry loops are a form of spin — fine for low contention, wasteful under high." |
| **ABA problem** | Value changes from A→B→A; CAS sees A and thinks nothing changed | "Use `AtomicStampedReference` to add a version stamp and detect ABA." |
| **Lock-free** | Progress is guaranteed for at least one thread system-wide | "`ConcurrentLinkedQueue` is lock-free — threads always make forward progress even under contention." |
| **Wait-free** | Every thread makes progress in a bounded number of steps | "Wait-free is stronger than lock-free; `AtomicInteger.get()` is wait-free." |

---

### Thread Pool

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **Core pool size** | The number of threads always kept alive, even when idle | "Set core = number of CPU cores for CPU-bound tasks." |
| **Max pool size** | The upper thread count limit when the queue is full | "New threads above core size are only created once the work queue fills up." |
| **Work queue** | Holds submitted tasks waiting for a thread | "`LinkedBlockingQueue` is unbounded — can cause OOM under sustained load; prefer `ArrayBlockingQueue`." |
| **Keep-alive time** | How long idle threads above core size wait before being killed | "60-second keep-alive means surplus threads die after 1 minute of no work." |
| **Rejection policy** | What happens when both queue and max threads are full | "`CallerRunsPolicy` runs the task on the submitting thread — natural backpressure." |
| **Thread pool sizing** | CPU-bound: `N+1` threads; IO-bound: `N × (1 + wait/compute)` | "If DB calls take 100ms and processing takes 10ms, target `N × 11` threads." |

---

### Async / Future

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **`Future`** | A handle to an async result — only `get()` (blocking) to retrieve it | "Old `Future` has no way to chain callbacks — you have to block or poll." |
| **`CompletableFuture`** | A non-blocking future with a full pipeline API | "`CompletableFuture` lets you chain transforms without blocking any thread." |
| **`thenApply`** | Synchronous transform on the result (like `map`) | "`thenApply(String::toUpperCase)` runs on the completing thread." |
| **`thenCompose`** | Async chaining — takes a function returning another `CompletableFuture` (like `flatMap`) | "Use `thenCompose` when your next step is itself async, to avoid `CompletableFuture<CompletableFuture<T>>`." |
| **`thenCombine`** | Merges two independent futures when both complete | "`f1.thenCombine(f2, (a,b) -> a + b)` — neither future depends on the other." |
| **`exceptionally`** | Error recovery — provides a fallback value if the future fails | "`exceptionally(ex -> \"default\")` swallows the exception and returns a fallback." |

---

### Synchronizers

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **`CountDownLatch`** | One-shot barrier: threads `await()` until count reaches zero | "Start all worker threads simultaneously with a latch of 1 — release with `countDown()`." |
| **`CyclicBarrier`** | Reusable barrier: all N threads wait until everyone arrives | "Use `CyclicBarrier` for parallel computation phases — resets automatically each round." |
| **`Semaphore`** | Counts available permits — `acquire()` blocks when none left | "A semaphore of 10 limits concurrent DB connections to 10." |
| **`Phaser`** | Flexible replacement for both latch and barrier; supports dynamic registration | "Use `Phaser` when you don't know the number of parties upfront." |
| **`Exchanger`** | Two threads swap an object at a synchronization point | "A pipeline stage hands off its output to the next stage via `Exchanger`." |

## Key rules / gotchas

- **Happens-before is transitive**: A hb B and B hb C implies A hb C. Chain these rules to reason about any visibility guarantee.
- **`volatile` ≠ atomic**: `volatile int i; i++` is still a race condition — read-modify-write is three steps.
- **Deadlock requires four conditions**: mutual exclusion, hold-and-wait, no preemption, circular wait. Breaking any one prevents it.
- **Lock-free ≠ wait-free**: lock-free only guarantees *some* thread makes progress. Under extreme contention one thread may keep losing the CAS retry.
- **Thread pool sizing is workload-dependent**: never use a magic number — measure your `wait/compute` ratio.
- **`thenApply` vs `thenCompose`**: same as `map` vs `flatMap` — use `thenCompose` when the next step itself returns a `CompletableFuture`.

## Code example

```java
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.concurrent.locks.*;

public class JavaLabRunner {
    // Demonstrates several vocabulary terms in one place
    static final ReentrantLock mutex = new ReentrantLock(true); // fair mutex
    static final AtomicInteger casCounter = new AtomicInteger(0);
    static final Semaphore permits = new Semaphore(2); // max 2 concurrent
    static volatile boolean stop = false; // visibility guarantee via happens-before

    public static void main(String[] args) throws Exception {
        // CAS — compare-and-swap
        boolean swapped = casCounter.compareAndSet(0, 42);
        System.out.println("CAS succeeded: " + swapped + ", value: " + casCounter.get());

        // Mutex (fair ReentrantLock) — reentrant
        mutex.lock();
        try {
            System.out.println("Hold count (reentrant depth): " + mutex.getHoldCount()); // 1
            mutex.lock(); // reentrant — same thread can lock again
            try {
                System.out.println("Hold count after reentry: " + mutex.getHoldCount()); // 2
            } finally { mutex.unlock(); }
        } finally { mutex.unlock(); }

        // Semaphore — limits concurrency to 2
        ExecutorService pool = Executors.newFixedThreadPool(4);
        CountDownLatch done = new CountDownLatch(4); // one-shot barrier
        for (int i = 0; i < 4; i++) {
            final int id = i;
            pool.submit(() -> {
                try {
                    permits.acquire(); // blocks if 2 already inside
                    System.out.println("Thread " + id + " acquired permit");
                    Thread.sleep(20);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    permits.release();
                    done.countDown(); // decrement latch
                }
            });
        }
        done.await(); // main thread blocks until all 4 finish
        System.out.println("All threads completed (CountDownLatch released)");

        // volatile stop flag — visibility via happens-before
        Thread worker = new Thread(() -> {
            while (!stop) { /* spin */ }
            System.out.println("Worker saw stop=true (volatile visibility)");
        });
        worker.start();
        Thread.sleep(5);
        stop = true; // volatile write happens-before the next volatile read
        worker.join();

        pool.shutdown();
    }
}
```

## Interview questions you should be able to answer

- **Q:** What is the difference between a race condition, a deadlock, and a livelock?
  > Race condition: non-deterministic outcome from unsynchronized shared access. Deadlock: circular lock dependency — all threads block forever. Livelock: threads keep reacting to each other but no thread makes progress (no blocking, but no work either).

- **Q:** What does "happens-before" mean in the JMM?
  > A formal ordering guarantee: if action A happens-before action B, all writes visible at A are guaranteed to be visible at B. Sources include: program order, monitor release/acquire, volatile write/read, thread start/join, and transitivity.

- **Q:** What is the difference between lock-free and wait-free?
  > Lock-free guarantees that *at least one* thread makes progress system-wide — other threads may starve. Wait-free guarantees *every* thread completes in a bounded number of steps regardless of contention. Wait-free is strictly stronger and harder to implement.

- **Q:** What is false sharing and how do you fix it?
  > Two variables on the same 64-byte CPU cache line. When Thread A writes one, Thread B's cache line for the other is invalidated — causing cache thrashing with no logical sharing. Fix: pad structs to 64 bytes, or use `@Contended` (JVM flag `-XX:-RestrictContended`). `LongAdder` avoids this by distributing counters across separate cache lines (cells).

- **Q:** When would you use `CallerRunsPolicy` as a rejection policy?
  > When you want natural backpressure — if the pool is saturated, the submitting thread executes the task itself, slowing down the producer and giving workers time to drain the queue. Avoids dropping tasks or throwing exceptions.

- **Q:** What is the ABA problem and which Java class solves it?
  > A CAS reads value A, another thread changes it to B then back to A. The CAS succeeds even though the state changed — in linked structures this can cause a node to be relinked incorrectly. `AtomicStampedReference` adds a version stamp alongside the value so `compareAndSet` checks both the reference and the stamp.

## Further reading

- [JSR-133 Java Memory Model](https://www.cs.umd.edu/~pugh/java/memoryModel/jsr133.pdf)
- [Java Concurrency in Practice — Goetz et al.](https://jcip.net/)
- [OpenJDK: AbstractQueuedSynchronizer](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/concurrent/locks/AbstractQueuedSynchronizer.java)
