# Thread Lifecycle & Java Memory Model (JMM)

## Why this matters in interviews

Senior engineers are expected to diagnose concurrency bugs without running code. Interviewers probe thread state transitions to expose gaps in understanding of blocking vs. waiting, and they use JMM questions to reveal whether you actually know why `volatile` exists or are just cargo-culting it. Misunderstanding happens-before is the root cause of most subtle production concurrency defects, and companies that have been burned by them test for it explicitly.

## Concept

### Thread States

Java defines six states in `Thread.State`. A thread lives in exactly one state at any moment.

```
  [NEW]
    |
    | thread.start()
    v
[RUNNABLE] <----------+
    |                  |
    | OS scheduler     |
    v                  |
 running / ready       |
    |                  |
    +--synchronized--> [BLOCKED]   (waiting to acquire an intrinsic lock)
    |                       |
    |                  lock available
    |                       |
    +<----------------------+
    |
    +--Object.wait() -----> [WAITING]        (released lock, parked indefinitely)
    +--Thread.join()------> [WAITING]
    +--LockSupport.park()-> [WAITING]
    |                           |
    |                  notify / join completes / unpark
    |                           |
    +<--------------------------+
    |
    +--Thread.sleep(n)----> [TIMED_WAITING]  (parked for bounded time)
    +--Object.wait(n)-----> [TIMED_WAITING]
    +--Thread.join(n)-----> [TIMED_WAITING]
    |                           |
    |                  timeout or notification
    |                           |
    +<--------------------------+
    |
    | run() returns or throws
    v
[TERMINATED]
```

**BLOCKED vs. WAITING — the crucial distinction:**

| State | Cause | Who wakes it? |
|---|---|---|
| BLOCKED | Trying to enter a `synchronized` block another thread holds | JVM automatically when lock is released |
| WAITING | Called `wait()`, `join()`, or `park()` — voluntarily parked | Another thread calls `notify()`/`notifyAll()`/`unpark()` or join completes |
| TIMED_WAITING | Same as WAITING but with a timeout argument | Timeout expiry OR explicit notification |

A thread cannot be in BLOCKED state waiting for a `ReentrantLock` — it will be in WAITING (via `LockSupport.park`). This surprises many developers who assume BLOCKED covers all lock contention.

### Daemon Threads

Daemon threads are JVM housekeeping threads (GC, finalizer). The JVM exits when all non-daemon threads finish, even if daemon threads are still running.

```java
Thread t = new Thread(task);
t.setDaemon(true); // must be called BEFORE start()
t.start();
```

- The main thread is non-daemon by default.
- Threads inherit daemon status from their creator.
- Daemon threads should never own resources that need explicit cleanup (file handles, DB connections) because they can be killed mid-execution on JVM shutdown.

### Java Memory Model (JMM) and Happens-Before

The JMM defines when writes by one thread are guaranteed visible to reads by another. Without a happens-before (HB) relationship, the JVM and CPU are free to reorder instructions and cache writes in registers or CPU caches — the reading thread may never see the updated value.

**Core happens-before rules:**

```
1. Program order rule
   Each action in a thread HB every subsequent action in the same thread.

2. Monitor lock rule
   An unlock on a monitor HB every subsequent lock on that same monitor.
   (synchronized release  -HB->  synchronized acquire)

3. Volatile variable rule
   A write to a volatile field HB every subsequent read of that field.

4. Thread start rule
   Thread.start() HB every action in the started thread.

5. Thread termination rule
   Every action in a thread HB Thread.join() returning in another thread.

6. Transitivity
   If A HB B and B HB C, then A HB C.
```

**The visibility problem without HB:**

```
CPU 0 (Thread A)             CPU 1 (Thread B)
-----------------            -----------------
flag = true;                 while (!flag) { }   // may spin forever!
                             // CPU 1 cache still holds flag = false
```

Each CPU has its own cache hierarchy (L1/L2/L3). Without a memory barrier, Thread B reads a stale cached value. The JVM is also allowed to hoist the read of `flag` out of the loop entirely (register caching), making the loop infinite even if flag is in shared DRAM.

### volatile — Visibility Without Atomicity

Declaring a field `volatile` inserts:
- A **store barrier** after every write (flushes the value to main memory, prevents preceding writes from being reordered past the store).
- A **load barrier** before every read (forces a fresh read from main memory, prevents subsequent reads from being reordered before the load).

```
volatile write  -HB->  volatile read (of the same field)
```

**What volatile guarantees:**
- Every write is immediately visible to all threads that subsequently read the field.
- Reads always see the most recently written value (no stale caches).
- Prevents reordering of instructions around the volatile access.

**What volatile does NOT guarantee:**
- Atomicity for compound operations. `i++` is three bytecode instructions: `GETFIELD`, `IADD`, `PUTFIELD`. Two threads can both read the same value, both increment, and both write back the same result — a lost update.

```
volatile int i = 0;

Thread A: read i (0), compute 1
Thread B: read i (0), compute 1   // interleaved before A writes
Thread A: write i = 1
Thread B: write i = 1             // LOST UPDATE — expected 2, got 1
```

### Thread.join(), sleep(), and interrupt()

**join()** — the calling thread enters WAITING until the target thread reaches TERMINATED. Uses the HB thread-termination rule, so all writes by the joined thread are visible after join() returns.

**sleep(millis)** — puts the current thread into TIMED_WAITING. Does NOT release any held monitors. Use it for introducing delays, not for coordination.

**interrupt()** — sets the target thread's interrupt flag. If the thread is in WAITING/TIMED_WAITING (sleeping, joining, or waiting), it immediately throws `InterruptedException`. If the thread is RUNNABLE, the flag is set but no exception is thrown — the thread must poll `Thread.currentThread().isInterrupted()` itself.

```
interrupt() on WAITING thread  → throws InterruptedException, clears flag
interrupt() on RUNNABLE thread → sets flag only; check isInterrupted() manually
```

## Key rules / gotchas

- **BLOCKED is only for intrinsic locks:** A thread contending for a `ReentrantLock` is in WAITING, not BLOCKED, because `ReentrantLock` uses `LockSupport.park` internally.
- **sleep() holds locks:** `Thread.sleep()` does not release synchronized monitors. `Object.wait()` does.
- **volatile is not a replacement for synchronized:** It solves visibility and ordering but not atomicity. Never use `volatile` for a counter that multiple threads increment.
- **Happens-before is not causal ordering:** Two unrelated threads with no HB edge can see each other's actions in any order, including never.
- **InterruptedException clears the flag:** After catching `InterruptedException`, the interrupted status is cleared. If you catch and swallow it, the interrupt is lost. Always re-interrupt or rethrow.
- **Daemon thread cleanup:** Do not use daemon threads for work that must complete (e.g., flushing a write buffer). The JVM can kill them instantly on shutdown.
- **setDaemon must precede start():** Calling `setDaemon(true)` after `start()` throws `IllegalThreadStateException`.

## Code example

```java
public class JavaLabRunner {
    static volatile boolean running = true;

    public static void main(String[] args) throws InterruptedException {
        Thread worker = new Thread(() -> {
            System.out.println("Worker state: " + Thread.currentThread().getState());
            while (running) { }
            System.out.println("Worker stopped.");
        });

        System.out.println("Before start: " + worker.getState()); // NEW
        worker.start();
        System.out.println("After start: " + worker.getState());  // RUNNABLE

        Thread.sleep(10);
        running = false;
        worker.join();
        System.out.println("After join: " + worker.getState());   // TERMINATED
    }
}
```

**What this demonstrates:**
- State transitions: NEW → RUNNABLE → TERMINATED.
- Without `volatile`, the JVM could cache `running = true` in a register and the worker would spin forever even after the main thread sets `running = false`.
- `worker.join()` creates a happens-before edge: the main thread sees `running = false` reflected and `"Worker stopped."` is guaranteed to be printed before join returns completes from the worker's perspective.

## Interview questions you should be able to answer

- **Q:** What is the difference between BLOCKED and WAITING thread states?
  > BLOCKED means a thread is trying to enter a `synchronized` block and is queued by the JVM waiting for the monitor to be released. WAITING means the thread voluntarily suspended itself by calling `Object.wait()`, `Thread.join()`, or `LockSupport.park()`. The key distinction is that a BLOCKED thread is competing for a lock, while a WAITING thread has released its lock (in the case of `wait()`) and needs an explicit signal from another thread to resume.

- **Q:** Why can removing `volatile` from a boolean flag cause an infinite loop even on a multicore machine where memory is physically shared?
  > Each CPU core has its own L1/L2 cache. Without `volatile`, the JVM does not insert a memory barrier, so the reading thread may read a stale cached value indefinitely. Additionally, the JIT compiler is allowed to hoist the read out of the loop (register caching), producing bytecode equivalent to `boolean local = flag; while (!local) {}`, which loops forever regardless of what other threads write to `flag`.

- **Q:** What happens-before relationships are established by `Thread.join()`?
  > The thread termination rule in the JMM states that every action in thread T happens-before the return of `T.join()` in the joining thread. This means all writes performed by the joined thread are guaranteed visible to the joining thread immediately after `join()` returns, with no additional synchronization needed.

- **Q:** If `volatile` does not guarantee atomicity, why is `volatile long` or `volatile double` still useful?
  > On 32-bit JVMs, reads and writes to `long` and `double` (64-bit primitives) are not guaranteed to be atomic — the JVM may perform two separate 32-bit operations, producing a torn read. Declaring them `volatile` forces atomic 64-bit reads and writes in addition to the visibility guarantee. On 64-bit JVMs `long`/`double` reads are typically atomic anyway, but `volatile` is still needed for the visibility and ordering guarantees.

- **Q:** What is the correct way to handle `InterruptedException` in a worker thread that runs a loop?
  > You should catch `InterruptedException`, then either re-interrupt the current thread (`Thread.currentThread().interrupt()`) so callers up the stack can observe the interruption, or rethrow it. Swallowing it silently destroys the interrupt signal. If you re-interrupt, your loop condition should also check `Thread.currentThread().isInterrupted()` to exit cleanly.

- **Q:** A thread is in TIMED_WAITING because of `Thread.sleep(5000)`. Another thread calls `interrupt()` on it. What exactly happens?
  > `sleep()` immediately throws `InterruptedException`, clearing the thread's interrupt flag. The thread exits TIMED_WAITING and enters RUNNABLE. The exception propagates up the call stack; if caught and not re-interrupted, the interrupted status is gone. Critically, `sleep()` does not release any held monitors, so any synchronized blocks the thread holds remain locked during the sleep and would remain locked until execution leaves the synchronized scope.

## Further reading

- JLS §17 — Threads and Locks (the authoritative JMM specification): https://docs.oracle.com/javase/specs/jls/se17/html/jls-17.html
- "Java Concurrency in Practice" — Brian Goetz et al. (Chapters 3 and 16 cover JMM and visibility in depth)
- OpenJDK JMM FAQ by Jeremy Manson: http://www.cs.umd.edu/~pugh/java/memoryModel/jsr-133-faq.html
- `java.lang.Thread.State` Javadoc: https://docs.oracle.com/en/java/docs/api/java.base/java/lang/Thread.State.html
