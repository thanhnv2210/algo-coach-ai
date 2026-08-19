# Synchronizers — CountDownLatch, CyclicBarrier, Semaphore, Phaser

## Why this matters in interviews

Synchronizers are the vocabulary of coordinated concurrency — knowing when to use a latch vs a barrier vs a semaphore signals that you have designed or debugged real concurrent systems. Senior interviewers use these topics to probe whether you understand happens-before guarantees, can identify deadlock vs livelock vs starvation, and can choose the right primitive to avoid over-synchronizing. They also commonly ask you to trace through race conditions in code that misuses these tools.

## Concept

### CountDownLatch

A one-shot, non-resettable countdown gate. Initialized with a count `N`; threads calling `await()` block until the count reaches zero. Threads call `countDown()` to decrement.

```
CountDownLatch(3)

  count = 3
  Thread A: await()  ─────────────────────────────────┐ (blocked)
  Thread B: await()  ─────────────────────────────────┤ (blocked)
                                                        │
  Worker 1: countDown() → count = 2                    │
  Worker 2: countDown() → count = 1                    │
  Worker 3: countDown() → count = 0  ──── latch opens ─┘

  Thread A and B unblock simultaneously — happens-before guaranteed
```

**Key properties:**
- Non-resettable: once count = 0, it stays open permanently.
- Any number of threads can `await()`; any number can `countDown()`.
- `countDown()` never blocks — it returns immediately regardless of count.
- `await(timeout, unit)` can time out and return `false` if the latch hasn't opened.

**Common patterns:**
1. **Start gate** — one latch at 1; all workers await; orchestrator calls `countDown()` once to start all simultaneously.
2. **End gate** — latch at N; all workers `countDown()` on completion; orchestrator `await()`s for all to finish.
3. **Service ready** — await until all dependent services have reported healthy (each calls `countDown()`).

### CyclicBarrier

A reusable rendezvous point where N threads must all arrive before any can proceed. Unlike `CountDownLatch`, it resets automatically for the next cycle.

```
CyclicBarrier(3)

  Round 1:
    Thread A: await()  ─────┐
    Thread B: await()  ─────┤ all 3 arrive → barrier opens → optional barrierAction runs
    Thread C: await()  ─────┘

  Barrier resets to count=3 automatically

  Round 2:
    Thread A: await()  ─────┐
    Thread B: await()  ─────┤ same thing again
    Thread C: await()  ─────┘
```

**Key properties:**
- Resettable: cycles automatically — designed for iterative parallel algorithms.
- Optional `barrierAction` (Runnable) runs once when the last thread arrives, before any thread is released.
- If any waiting thread is interrupted or times out, all other waiting threads receive `BrokenBarrierException` — the barrier is "broken" and unusable until `reset()` is called.
- `getNumberWaiting()` returns current count; `isBroken()` checks broken state.

**Classic use:** parallel matrix computation where each phase depends on all threads completing the previous phase.

```
Phase 1: compute submatrix rows [each thread] → await()
Phase 2: merge results          [each thread] → await()
Phase 3: verify                 [each thread] → done
```

### CountDownLatch vs CyclicBarrier

| Aspect | `CountDownLatch` | `CyclicBarrier` |
|---|---|---|
| Resettable | No (one-shot) | Yes (cycles automatically) |
| Who decrements | Any thread | Only the N participating threads |
| Decrement vs wait | Separate (one thread decrements, another waits) | Same threads both wait and "decrement" |
| Broken state | N/A | Yes — interrupt/timeout breaks all waiters |
| Barrier action | No | Optional Runnable on each cycle |
| Use | Waiting for external events | N threads synchronizing with each other |

### Semaphore

A counting permit mechanism. `acquire()` takes a permit (blocks if none available); `release()` returns one. Not tied to specific threads — any thread can release.

```
Semaphore(2)  — at most 2 threads in critical section

  permits = 2
  Thread A: acquire() → permits = 1  → enters critical section
  Thread B: acquire() → permits = 0  → enters critical section
  Thread C: acquire() → permits = 0  → BLOCKS (no permits)
  Thread D: acquire() → BLOCKS

  Thread A: release() → permits = 1  → Thread C unblocks
  Thread B: release() → permits = 1  → Thread D unblocks
```

**Key properties:**
- Binary semaphore (`Semaphore(1)`) is like a mutex but non-reentrant and not tied to the acquiring thread (any thread can release).
- `acquire(n)` and `release(n)` for bulk operations.
- `tryAcquire()` returns immediately (non-blocking); `tryAcquire(timeout, unit)` with timeout.
- Fair mode (`new Semaphore(permits, true)`) queues waiters in FIFO order — prevents starvation.

**Common uses:** database connection pool limits, rate limiting API calls, bounded resource access.

### Phaser

A flexible replacement for both `CountDownLatch` and `CyclicBarrier`. Supports dynamic registration/deregistration of parties, multiple phases, and hierarchical phasers for scalable tree structures.

```
Phaser phaser = new Phaser(3);  // 3 registered parties

Phase 0:
  Thread A: phaser.arriveAndAwaitAdvance()  ─┐
  Thread B: phaser.arriveAndAwaitAdvance()  ─┤ all 3 arrive → advance to phase 1
  Thread C: phaser.arriveAndAwaitAdvance()  ─┘

Phase 1:
  Thread C: phaser.arriveAndDeregister()    ─┐ deregisters; now 2 parties needed
  Thread A: phaser.arriveAndAwaitAdvance()  ─┤ advance to phase 2 with 2 parties
  Thread B: phaser.arriveAndAwaitAdvance()  ─┘
```

**Key methods:**

| Method | Description |
|---|---|
| `register()` | Dynamically add one party |
| `bulkRegister(n)` | Add n parties at once |
| `arrive()` | Signal arrival without waiting |
| `arriveAndAwaitAdvance()` | Signal arrival and wait for phase advance |
| `arriveAndDeregister()` | Arrive and permanently remove self from party count |
| `awaitAdvance(phase)` | Wait for a specific phase to complete |
| `onAdvance(phase, parties)` | Override to control phase completion (return true to terminate) |

### Exchanger

A synchronization point where exactly two threads exchange data bidirectionally. Each thread calls `exchange(V)` and blocks until the other thread calls `exchange(V)` — they swap values and both return.

```java
Exchanger<String> ex = new Exchanger<>();

Thread A: String result = ex.exchange("data from A");  // blocks
Thread B: String result = ex.exchange("data from B");  // both unblock

// Thread A gets "data from B"; Thread B gets "data from A"
```

Use cases: pipeline stages passing data, double-buffering (producer fills one buffer while consumer drains the other, then they swap).

### Deadlock, Livelock, and Starvation

**Deadlock** — two or more threads each hold a lock the other needs, forming a cycle. No thread can proceed.

```
Thread A holds Lock 1, waits for Lock 2
Thread B holds Lock 2, waits for Lock 1
→ Neither can proceed — deadlock
```

Detection: `ThreadMXBean.findDeadlockedThreads()`, thread dumps (`jstack`, `kill -3`).
Prevention strategies:
1. **Lock ordering** — always acquire locks in the same global order (e.g., by object identity hash).
2. **Try-lock with timeout** — `lock.tryLock(timeout)` and back off if not acquired.
3. **Lock-free data structures** — eliminate locking entirely.

**Livelock** — threads are not blocked but keep reacting to each other, making no progress.

```
Thread A detects conflict, backs off, retries
Thread B detects conflict, backs off, retries
Both back off at the same time, retry, detect conflict again — indefinitely
```

Prevention: randomized back-off intervals (exponential backoff with jitter).

**Starvation** — a thread is perpetually denied access to a resource because other threads continuously win contention.

```
Low-priority thread waits for lock that high-priority threads always acquire first
→ low-priority thread never runs
```

Prevention: fair locking (`new ReentrantLock(true)`), fair `Semaphore`, age-based priority escalation.

**Comparison table:**

| Condition | Threads blocked? | Making progress? | CPU usage |
|---|---|---|---|
| Deadlock | Yes | No | Near zero |
| Livelock | No | No | High (spinning) |
| Starvation | One or more | Others yes | Normal |

## Key rules / gotchas

- **`CountDownLatch` is not resettable:** Once it reaches zero, all subsequent `await()` calls return immediately without blocking. If you need cyclic behavior, use `CyclicBarrier` or `Phaser`.
- **`CyclicBarrier` broken state is permanent until `reset()`:** If any thread is interrupted while waiting, every other waiter gets `BrokenBarrierException`. Call `barrier.reset()` before reusing — or discard and create a new one.
- **Semaphore is not reentrant:** If a thread acquires and then calls `acquire()` again without releasing, it does not get the second permit automatically (unlike `ReentrantLock`). This can self-deadlock.
- **`Semaphore.release()` can exceed the initial permit count:** If you call `release()` without a matching `acquire()`, the permit count exceeds the initial value — new threads get permits that should not exist. Always pair acquire/release in try/finally.
- **`Phaser.onAdvance` returning `true` terminates the phaser:** Override `onAdvance(phase, parties)` to return `true` to signal that the phaser is done; subsequent `arriveAndAwaitAdvance` calls return immediately. Useful for bounded-phase algorithms.
- **`CountDownLatch` happens-before guarantee:** The Java Memory Model guarantees all actions performed before `countDown()` are visible to threads that return from `await()`. You do not need additional synchronization for data hand-off through a latch.
- **Exchanger with odd thread count:** If three threads share an `Exchanger` and one calls `exchange()` without a partner, it blocks indefinitely. `Exchanger` is strictly a two-thread primitive.

## Code example

```java
import java.util.concurrent.*;
import java.util.*;

public class JavaLabRunner {
    public static void main(String[] args) throws InterruptedException, BrokenBarrierException {
        int THREADS = 3;

        // CountDownLatch — start gate pattern
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch endGate = new CountDownLatch(THREADS);

        for (int i = 0; i < THREADS; i++) {
            final int id = i;
            new Thread(() -> {
                try {
                    startGate.await(); // all wait for start signal
                    System.out.println("Thread " + id + " running");
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    endGate.countDown();
                }
            }).start();
        }
        Thread.sleep(5);
        System.out.println("GO!");
        startGate.countDown(); // release all
        endGate.await();       // wait for all to finish
        System.out.println("All done.");

        // Semaphore — limit concurrent access
        Semaphore sem = new Semaphore(2); // max 2 concurrent
        ExecutorService pool = Executors.newFixedThreadPool(5);
        for (int i = 0; i < 5; i++) {
            final int id = i;
            pool.submit(() -> {
                try {
                    sem.acquire();
                    System.out.println("Thread " + id + " in critical section");
                    Thread.sleep(10);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    sem.release();
                }
            });
        }
        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);
    }
}
```

## Interview questions you should be able to answer

- **Q:** What is the fundamental difference between `CountDownLatch` and `CyclicBarrier`, and which would you choose to coordinate N worker threads that need to process data in multiple rounds?
  > `CountDownLatch` is one-shot and non-resettable — once the count reaches zero it stays open permanently, and the parties that decrement (`countDown`) and the parties that wait (`await`) can be different threads. `CyclicBarrier` requires all N registered parties to be the same threads that both arrive and wait, and it resets automatically for the next cycle. For multi-round coordination where the same N workers must synchronize at the end of each round before starting the next, `CyclicBarrier` is the correct choice — its automatic cycling eliminates the need to create a new synchronizer per round, and its optional `barrierAction` can merge partial results between phases.

- **Q:** How can a `Semaphore` cause a self-deadlock, and how do you prevent it?
  > A `Semaphore` is non-reentrant. If a thread that already holds a permit calls `acquire()` again, it waits for a permit that it effectively holds — if the semaphore has only one permit, the thread blocks itself forever (self-deadlock). This also happens when a thread calls `acquire()` in a code path it is not expecting to re-enter (e.g., a recursive call). Prevention: track permit acquisition per-thread with a `ThreadLocal<Boolean>`, use `tryAcquire()` to fail-fast, or redesign so re-entrant code paths do not acquire the semaphore again. If mutual exclusion is the goal, `ReentrantLock` is safer because it handles re-entry explicitly.

- **Q:** Thread A holds `lockA` and tries to acquire `lockB`; Thread B holds `lockB` and tries to acquire `lockA`. You cannot modify how threads are created. How do you break the deadlock?
  > The standard prevention technique when you cannot change thread creation is lock ordering: assign a consistent global order to locks (e.g., by `System.identityHashCode()`) and always acquire them in ascending order. If both threads must acquire lockA and lockB, whichever has the lower identity hash is always acquired first — the cycle is impossible. An alternative is to replace `lock.lock()` with `lock.tryLock(timeout, unit)`: if a thread cannot acquire the second lock within the timeout, it releases the first lock and retries, breaking the hold-and-wait condition. A third option is to merge both locks into one coarser lock, eliminating the two-lock scenario entirely at the cost of reduced parallelism.

- **Q:** How does `Phaser` improve on `CyclicBarrier` for dynamic workloads where the number of participating threads can change mid-execution?
  > `CyclicBarrier` requires the party count to be fixed at construction — you cannot add or remove participants. `Phaser` supports `register()` to add a new party and `arriveAndDeregister()` to permanently remove a party mid-flight. This is essential for fork-join style parallelism where a task may split into sub-tasks (register them dynamically) or terminate early (deregister). `Phaser` also supports hierarchical phasers (a tree of Phasers) to scale coordination to thousands of threads without a single bottleneck, and its `onAdvance` hook lets you terminate the phaser when a completion condition is met, returning `true` to signal termination.

- **Q:** Describe how you would implement a bounded connection pool (max 10 connections) using a `Semaphore`. What are the trade-offs vs a dedicated pool library?
  > Initialize `Semaphore(10, true)` (fair mode to prevent starvation). Acquiring a connection: `semaphore.acquire()` then `return pool.poll()`. Returning a connection: `pool.offer(connection)` then `semaphore.release()`. Always wrap in try/finally so the semaphore is released even on exception. Trade-offs vs a library like HikariCP: the semaphore approach is simple but lacks connection validation (dead connections stay in the pool), no eviction of idle connections, no metrics/JMX, no connection creation on demand (you must pre-allocate all 10), and no timeout with detailed diagnostics. Production use should prefer a battle-tested pool, but the Semaphore pattern is valid for lightweight resource limiting of non-connection resources (thread slots, file descriptors).

- **Q:** What is the difference between deadlock and livelock, and how do you diagnose each in a production JVM?
  > In a deadlock, threads are blocked indefinitely waiting for each other's locks — CPU usage drops near zero for those threads. In a livelock, threads are actively running but making no useful progress — they keep reacting to each other's state changes (e.g., both back off and retry simultaneously) — CPU usage remains high. Diagnosing deadlock: take a thread dump (`jstack <pid>` or `kill -3`) and look for "BLOCKED" threads with a cyclic dependency chain in the "waiting to lock" annotations; programmatically use `ThreadMXBean.findDeadlockedThreads()`. Diagnosing livelock: thread dumps show threads in "RUNNABLE" state but application-level metrics (throughput, queue depth) show no forward progress; add counters/logging to detect retry loops that never terminate. Fix livelock with randomized exponential backoff and jitter so threads don't synchronize their retry timing.

## Further reading

- "Java Concurrency in Practice" — Goetz et al., Chapter 14 (Building Custom Synchronizers)
- Doug Lea's Java Concurrency course notes: http://gee.cs.oswego.edu/dl/cpj/
- JEP 428 — Structured Concurrency (Java 21): https://openjdk.org/jeps/428
- Baeldung — Guide to CountDownLatch: https://www.baeldung.com/java-countdown-latch
- Baeldung — CyclicBarrier in Java: https://www.baeldung.com/java-cyclic-barrier
