# ReentrantLock, ReadWriteLock & Condition

## Why this matters in interviews

`ReentrantLock` and its family are the building blocks for every high-performance concurrent data structure in the JDK. Interviewers ask about it at the senior level because it exposes whether you understand lock semantics beyond the happy path — can you handle lock acquisition failure gracefully? Can you implement producer-consumer without busy-waiting? Do you know why `ReadWriteLock` exists and when it actually helps? These are distinctions that separate engineers who have debugged concurrent systems from those who have only read about them.

## Concept

### ReentrantLock vs. synchronized

`ReentrantLock` (in `java.util.concurrent.locks`) provides the same mutual-exclusion and visibility guarantees as `synchronized` but exposes the lock as an object with additional capabilities.

```
synchronized (obj) { ... }          ReentrantLock lock = new ReentrantLock();
                                     lock.lock();
                                     try { ... }
                                     finally { lock.unlock(); }
```

**Capability comparison:**

| Feature | synchronized | ReentrantLock |
|---|---|---|
| Automatic release | Yes (by JVM) | No (must call unlock() in finally) |
| Interruptible acquisition | No | `lockInterruptibly()` |
| Timed acquisition | No | `tryLock(timeout, unit)` |
| Non-blocking try | No | `tryLock()` |
| Fairness policy | No (not fair) | `new ReentrantLock(true)` |
| Condition variables | `wait()`/`notify()` | `Condition` (multiple per lock) |
| Lock introspection | No | `isLocked()`, `getQueueLength()`, etc. |
| Hold count query | No | `getHoldCount()` |

### tryLock and lockInterruptibly

```
tryLock()
  ├── lock available?  YES → acquire, return true
  └── lock held?       NO  → return false immediately (no blocking)

tryLock(long timeout, TimeUnit unit)
  ├── lock available?  YES → acquire, return true
  ├── timeout elapsed? YES → return false
  └── interrupted?     YES → throw InterruptedException

lockInterruptibly()
  ├── acquires like lock(), BUT
  └── if interrupted while waiting → throws InterruptedException
      (synchronized blocking is NOT interruptible)
```

**Deadlock avoidance with tryLock:**

```java
// Lock ordering is the standard deadlock fix, but tryLock offers a timeout fallback:
boolean got1 = lock1.tryLock(50, TimeUnit.MILLISECONDS);
boolean got2 = false;
try {
    if (got1) {
        got2 = lock2.tryLock(50, TimeUnit.MILLISECONDS);
    }
    if (got1 && got2) {
        // critical section
    }
} finally {
    if (got2) lock2.unlock();
    if (got1) lock1.unlock();
}
```

### Fairness

A fair `ReentrantLock` grants the lock to the longest-waiting thread (FIFO queue). An unfair lock (default) allows lock stealing — the thread that just called `lock()` may acquire it before a thread that has been waiting longer.

```
Unfair (default):  higher throughput, lower latency (avoids context switch)
Fair:              prevents thread starvation, slightly lower throughput
```

Fairness does not extend to `tryLock()` with no arguments — it always barges regardless of fairness policy.

### Condition Variables

`Condition` replaces `Object.wait()` / `Object.notify()` and can be created per lock, giving you multiple wait-sets on the same mutex. This is essential for producer-consumer with separate "not empty" and "not full" conditions.

```java
ReentrantLock lock = new ReentrantLock();
Condition notEmpty = lock.newCondition();
Condition notFull  = lock.newCondition();

// Producer
lock.lock();
try {
    while (buffer.isFull())  notFull.await();  // releases lock, waits
    buffer.put(item);
    notEmpty.signal();                          // wake one consumer
} finally { lock.unlock(); }

// Consumer
lock.lock();
try {
    while (buffer.isEmpty()) notEmpty.await(); // releases lock, waits
    T item = buffer.take();
    notFull.signal();                          // wake one producer
} finally { lock.unlock(); }
```

`await()` atomically releases the lock and parks the thread. On return it reacquires the lock before `await()` returns. Always check the condition in a `while` loop (not `if`) to guard against spurious wakeups.

**Condition vs. Object.wait/notify:**

| | Object.wait/notify | Condition.await/signal |
|---|---|---|
| Number of wait-sets | One per object | Multiple per lock |
| Signal precision | notifyAll wakes everyone | Multiple Conditions, signal one set |
| Interruptible await | Yes | Yes (also `awaitUninterruptibly()`) |
| Timed wait | `wait(millis)` | `await(time, unit)` |

### ReadWriteLock

`ReentrantReadWriteLock` maintains two views of the same lock: a shared read lock and an exclusive write lock.

```
Read lock:   many threads may hold simultaneously IF no writer holds write lock
Write lock:  exclusive — no readers and no other writers allowed

State machine:
  Unlocked ──────────────────────► Read locked (N readers, 0 writers)
           ◄──────────────────────
  Unlocked ──────────────────────► Write locked (0 readers, 1 writer)
           ◄──────────────────────
  Read locked: additional readers CAN acquire read lock
  Read locked: writers MUST wait for all readers to release
  Write locked: readers AND writers must wait
```

**When it helps:** Read-heavy workloads (cache, configuration store) where writes are rare. Under pure read load, `ReadWriteLock` allows full concurrency. Under write-heavy load, the overhead of tracking reader/writer counts can make it slower than a plain `ReentrantLock`.

```java
ReadWriteLock rwLock = new ReentrantReadWriteLock();

// Any number of threads can read concurrently:
rwLock.readLock().lock();
try { return sharedData; }
finally { rwLock.readLock().unlock(); }

// Only one thread writes, blocks all readers:
rwLock.writeLock().lock();
try { sharedData = newValue; }
finally { rwLock.writeLock().unlock(); }
```

**Lock downgrading** (write → read, without releasing) is supported: acquire write lock, perform write, acquire read lock, release write lock. This ensures no other writer can interleave between your write and subsequent read.

Lock upgrading (read → write) is NOT supported and will deadlock (two readers both try to upgrade — neither can proceed).

### StampedLock and Optimistic Reads

`StampedLock` (Java 8+) adds a third mode on top of read/write: **optimistic read**.

```
long stamp = lock.tryOptimisticRead();  // no lock acquired, returns a stamp (version)
int x = sharedX;                        // read without locking
int y = sharedY;
if (!lock.validate(stamp)) {            // did a write happen since we read?
    stamp = lock.readLock();            // fall back to real read lock
    try { x = sharedX; y = sharedY; }
    finally { lock.unlockRead(stamp); }
}
// use x, y
```

Optimistic reads are lock-free. The cost is a `validate()` call that checks whether the write version changed. Under low write contention, this eliminates all lock overhead for reads.

**Caveats:** `StampedLock` is not reentrant, does not support `Condition`, and is harder to use correctly. Prefer `ReentrantReadWriteLock` unless profiling shows read-lock overhead is a bottleneck.

### Deadlock: Causes and Prevention

**Classic deadlock — lock ordering violation:**

```
Thread A:  lock(lock1) → tries lock(lock2) → WAITS
Thread B:  lock(lock2) → tries lock(lock1) → WAITS
                                    ↑ circular wait = deadlock
```

**Prevention strategies:**

1. **Consistent lock ordering:** All threads acquire multiple locks in the same global order. If every thread locks `lock1` before `lock2`, circular wait is impossible.
2. **tryLock with timeout:** Use `tryLock(timeout)` so threads can back off and retry rather than waiting indefinitely.
3. **Lock hierarchy / tiered locking:** Assign a numeric level to each lock; threads may only acquire a lock at a lower level than any lock they currently hold.
4. **Single lock:** Restructure to avoid needing multiple locks simultaneously.

## Key rules / gotchas

- **Always unlock in finally:** If an exception is thrown inside a `lock()` block without a `finally`, the lock is never released and the application deadlocks.
- **tryLock() with no args ignores fairness:** Even on a fair lock, `tryLock()` will barge to the front of the queue.
- **await() must be inside the lock:** Calling `condition.await()` without holding the associated lock throws `IllegalMonitorStateException`.
- **Spurious wakeups are real:** `await()` can return without being signalled. Always re-check the condition in a `while` loop.
- **ReadWriteLock does not support lock upgrading:** Acquiring a write lock while holding a read lock will deadlock because the read lock blocks the write lock, and the write lock acquisition is waiting for all read locks to be released — including your own.
- **StampedLock is not reentrant:** Calling `writeLock()` while holding `writeLock()` on the same `StampedLock` deadlocks. `ReentrantLock` would succeed.
- **getHoldCount() returns 0 after unlock:** It counts how many times the current thread has locked without unlocking. Used for debugging, not for production control flow.

## Code example

```java
import java.util.concurrent.locks.*;

public class JavaLabRunner {
    static final ReentrantLock lock = new ReentrantLock();
    static int counter = 0;

    // ReadWriteLock: multiple readers OR one writer
    static final ReadWriteLock rwLock = new ReentrantReadWriteLock();
    static String sharedData = "initial";

    static void safeIncrement() {
        lock.lock();
        try {
            counter++;
        } finally {
            lock.unlock(); // always in finally!
        }
    }

    static String readData() {
        rwLock.readLock().lock();
        try {
            return sharedData;
        } finally {
            rwLock.readLock().unlock();
        }
    }

    static void writeData(String data) {
        rwLock.writeLock().lock();
        try {
            sharedData = data;
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        // tryLock demo — non-blocking
        boolean acquired = lock.tryLock();
        if (acquired) {
            try {
                System.out.println("Lock acquired, counter: " + ++counter);
            } finally {
                lock.unlock();
            }
        }

        // ReadWriteLock demo
        writeData("hello");
        System.out.println("Read: " + readData());
        System.out.println("Hold count: " + lock.getHoldCount()); // 0 when unlocked
        System.out.println("Is fair: " + new ReentrantLock(true).isFair());
    }
}
```

## Interview questions you should be able to answer

- **Q:** What does `lockInterruptibly()` do that `lock()` does not, and when would you use it?
  > `lockInterruptibly()` throws `InterruptedException` if the waiting thread is interrupted before it acquires the lock. `lock()` ignores interrupts while waiting — the thread stays blocked until it acquires the lock, and the interrupt flag is set but not acted on. Use `lockInterruptibly()` in cancellable tasks (e.g., in an `ExecutorService` worker) where you need to be able to abort lock acquisition if the task is cancelled, something that is impossible with `synchronized` or plain `lock()`.

- **Q:** Why does `ReadWriteLock` not support lock upgrading (read → write)?
  > If two threads both hold the read lock and both try to upgrade to the write lock, each is waiting for the other to release the read lock before granting the write lock. Neither can proceed — this is a guaranteed deadlock. The JDK designers excluded upgrading entirely to prevent this class of bug. The workaround is to release the read lock and then acquire the write lock, accepting a window where another writer may interleave.

- **Q:** Explain the Condition spurious wakeup problem and the correct pattern to handle it.
  > A spurious wakeup is when `await()` returns without any thread calling `signal()` or `signalAll()`. The JVM specification explicitly permits this. The correct pattern is always to check the guarded condition in a `while` loop after `await()` returns: `while (!conditionMet()) condition.await();`. Using an `if` statement means the thread proceeds even if the condition is still false, leading to data corruption or incorrect behavior.

- **Q:** What is the AQS (AbstractQueuedSynchronizer) and what role does it play in ReentrantLock?
  > `AbstractQueuedSynchronizer` is the framework underlying most `java.util.concurrent` synchronizers: `ReentrantLock`, `Semaphore`, `CountDownLatch`, `ReentrantReadWriteLock`. It maintains a CLH (Craig, Landin, Hagersten) queue of waiting threads and a volatile `int` state field. `ReentrantLock` subclasses AQS and encodes the lock state and hold count in that integer. Lock acquisition is a CAS on the state field; failed CAS results in the thread being enqueued. This design avoids OS-level synchronization for uncontended acquisition.

- **Q:** When would you choose a fair `ReentrantLock` over the default unfair one, and what is the performance trade-off?
  > A fair lock prevents thread starvation — no thread waits indefinitely while others repeatedly barge ahead. Use it when predictable latency matters more than throughput (e.g., a task queue where every task must eventually run). The trade-off is performance: unfair locking allows the newly-unblocked thread that just released the lock (or the thread currently running on the CPU) to immediately reacquire, avoiding a context switch. Fair locking always parks the current thread and wakes the head of the queue, which requires a context switch. In benchmarks, unfair locks can be 5-10x faster under contention.

- **Q:** Describe lock downgrading with `ReentrantReadWriteLock` and give a use case.
  > Lock downgrading is the sequence: acquire write lock → perform write → acquire read lock (while still holding write lock) → release write lock. This atomically transitions from exclusive to shared mode, ensuring your own subsequent reads reflect the write you just made without allowing another writer to interleave. A classic use case is a cache that computes and stores a value: take the write lock to compute and cache, then downgrade to read lock before returning the value, so other readers can join without a window where the cached value could be replaced.

## Further reading

- `java.util.concurrent.locks` package Javadoc: https://docs.oracle.com/en/java/docs/api/java.base/java/util/concurrent/locks/package-summary.html
- "Java Concurrency in Practice" — Goetz et al., Chapter 13 (Explicit Locks) and Chapter 14 (Building Custom Synchronizers)
- Doug Lea's AQS paper "The java.util.concurrent Synchronizer Framework": https://dl.acm.org/doi/10.1145/1064979.1064993
- `StampedLock` Javadoc and usage guide: https://docs.oracle.com/en/java/docs/api/java.base/java/util/concurrent/locks/StampedLock.html
