# Executor Framework & ThreadPoolExecutor

## Why this matters in interviews

Senior engineers are expected to know why raw `new Thread()` creation is an anti-pattern at scale and how to tune a thread pool correctly for a given workload profile. Interviewers probe whether you can reason about saturation, queuing, and rejection under load — skills that separate engineers who have debugged production thread-starvation incidents from those who haven't. The Executor framework is also the foundation for `CompletableFuture`, reactive pipelines, and virtual threads, so gaps here signal shallow concurrency knowledge.

## Concept

### The Executor Hierarchy

```
Executor                          (execute(Runnable))
  └── ExecutorService             (submit, invokeAll, invokeAny, shutdown)
        ├── AbstractExecutorService
        │     └── ThreadPoolExecutor   ← the workhorse
        │           └── ScheduledThreadPoolExecutor
        └── ForkJoinPool               (work-stealing, used by commonPool)

ScheduledExecutorService          (schedule, scheduleAtFixedRate, scheduleWithFixedDelay)
  └── ScheduledThreadPoolExecutor
```

- **`Executor`** — single method `execute(Runnable)`, fire-and-forget, no return value.
- **`ExecutorService`** — adds lifecycle (`shutdown`, `awaitTermination`) and `submit()` which returns a `Future`.
- **`ScheduledExecutorService`** — adds time-based scheduling.

### ThreadPoolExecutor Internals

`ThreadPoolExecutor` is constructed with seven parameters:

```
ThreadPoolExecutor(
    int corePoolSize,          // threads kept alive even when idle
    int maximumPoolSize,       // ceiling when queue is full
    long keepAliveTime,        // idle time before excess threads die
    TimeUnit unit,
    BlockingQueue<Runnable> workQueue,
    ThreadFactory threadFactory,         // optional, default provided
    RejectedExecutionHandler handler     // what to do when queue + maxPool full
)
```

**Task lifecycle state machine:**

```
  submit(task)
       │
       ▼
  active threads < corePoolSize?
       │ YES → spawn new thread
       │ NO
       ▼
  workQueue.offer(task)
       │ queue not full → task queued, return
       │ queue FULL
       ▼
  active threads < maximumPoolSize?
       │ YES → spawn new thread (temporary)
       │ NO
       ▼
  RejectedExecutionHandler.rejectedExecution()
```

Key insight: **threads beyond `corePoolSize` are only created when the queue is full**, not when all core threads are busy. This surprises many engineers. An `unbounded` queue (e.g., `LinkedBlockingQueue` with no capacity arg) means `maximumPoolSize` is effectively irrelevant.

### Executors Factory Methods

| Factory method | coreSize | maxSize | Queue | Use case |
|---|---|---|---|---|
| `newFixedThreadPool(n)` | n | n | unbounded `LinkedBlockingQueue` | CPU-bound tasks with known parallelism |
| `newCachedThreadPool()` | 0 | `Integer.MAX_VALUE` | `SynchronousQueue` | Many short-lived tasks; risk: unbounded thread creation |
| `newSingleThreadExecutor()` | 1 | 1 | unbounded `LinkedBlockingQueue` | Ordered sequential tasks |
| `newScheduledThreadPool(n)` | n | `Integer.MAX_VALUE` | `DelayedWorkQueue` | Recurring scheduled tasks |
| `newWorkStealingPool(n)` | — | — | per-thread deques | Parallel recursive (ForkJoin) tasks |

> **Gotcha:** `Executors.newFixedThreadPool` uses an unbounded queue — if producers outpace consumers indefinitely, memory is exhausted with no rejection feedback.

### Thread Pool Sizing Formula

| Workload type | Formula | Rationale |
|---|---|---|
| CPU-bound | `N_cpu + 1` | Extra thread covers occasional page faults; 100% CPU utilization |
| IO-bound | `N_cpu × (1 + W/C)` | W = average wait time, C = average compute time |
| Mixed | Profile, then tune | Measure with `ThreadMXBean`, adjust iteratively |

`N_cpu = Runtime.getRuntime().availableProcessors()`

Example: 8-core machine, IO calls average 200 ms wait / 20 ms compute → `8 × (1 + 200/20) = 88 threads`.

### RejectedExecutionHandler Policies

| Policy | Behavior | When to use |
|---|---|---|
| `AbortPolicy` (default) | Throws `RejectedExecutionException` | Fail fast; caller handles backpressure |
| `CallerRunsPolicy` | Submitting thread runs the task | Natural throttle; slows producer |
| `DiscardPolicy` | Silently drops task | Fire-and-forget metrics/telemetry |
| `DiscardOldestPolicy` | Drops head of queue, retries submit | Prefer freshness (e.g., live sensor data) |

### submit() vs execute()

| | `execute(Runnable)` | `submit(Callable/Runnable)` |
|---|---|---|
| Return | void | `Future<T>` |
| Exception propagation | Uncaught handler only | Captured in `Future`; thrown on `.get()` |
| Use when | Fire-and-forget | You need result or error handling |

### shutdown() vs shutdownNow()

- **`shutdown()`** — stops accepting new tasks; previously submitted tasks finish. Graceful drain.
- **`shutdownNow()`** — attempts to cancel running tasks via `Thread.interrupt()`; returns list of queued-but-unstarted tasks. No guarantee running tasks honor interruption.
- **`awaitTermination(timeout, unit)`** — blocks until shutdown completes or timeout expires. Always call after `shutdown()` in production.

### Virtual Threads (Java 21)

```java
// Java 21: one virtual thread per task — no pool sizing needed
ExecutorService vte = Executors.newVirtualThreadPerTaskExecutor();
vte.submit(() -> blockingIOCall()); // platform thread not blocked
```

Virtual threads are **not** pooled — each task gets its own virtual thread. The JVM pins them to a small number of carrier (platform) threads and automatically unmounts during blocking calls. This makes `newCachedThreadPool` patterns safe at scale without pool tuning, but **CPU-bound tasks still saturate carrier threads** — use `ForkJoinPool` for those.

## Key rules / gotchas

- **Unbounded queue danger:** `newFixedThreadPool` and `newSingleThreadExecutor` use `LinkedBlockingQueue()` with no capacity — queued tasks accumulate unchecked. Always cap queue size in production services.
- **maximumPoolSize ignored with unbounded queue:** Extra threads beyond `corePoolSize` are never created because the queue never fills. Pass a bounded queue to make `maximumPoolSize` meaningful.
- **`Future.get()` swallows exceptions:** If the task threw, `get()` wraps it in `ExecutionException`. Always unwrap with `.getCause()`.
- **ThreadFactory naming:** Default thread names (`pool-1-thread-3`) are useless in stack traces. Always supply a named `ThreadFactory` (`Executors.defaultThreadFactory()` subclass or Guava's `ThreadFactoryBuilder`).
- **`submit(Runnable)` returns `Future<?>`:** Its `.get()` returns `null` on success but still propagates exceptions — use it when you need completion signaling without a result.
- **`invokeAny` cancels losers:** `invokeAny()` returns the first successful result and cancels all remaining tasks. The cancelled tasks must respond to interruption.
- **`shutdown()` is not immediate:** The service is "shutdown" but threads are still running. Always pair with `awaitTermination`.
- **Virtual threads and `synchronized`:** Java 21 virtual threads can pin to carrier threads inside `synchronized` blocks, reducing concurrency benefits. Prefer `ReentrantLock` in virtual-thread-heavy code.

## Code example

```java
import java.util.concurrent.*;
import java.util.List;

public class JavaLabRunner {
    public static void main(String[] args) throws InterruptedException, ExecutionException {
        // Fixed thread pool
        ExecutorService pool = Executors.newFixedThreadPool(3);

        // Submit Callable — returns Future
        Future<Integer> future = pool.submit(() -> {
            Thread.sleep(10);
            return 42;
        });

        // Submit Runnable
        pool.execute(() -> System.out.println("Running in: " + Thread.currentThread().getName()));

        System.out.println("Future result: " + future.get()); // blocks

        // invokeAll — wait for all
        List<Callable<String>> tasks = List.of(
            () -> "task1",
            () -> "task2",
            () -> "task3"
        );
        List<Future<String>> results = pool.invokeAll(tasks);
        for (Future<String> r : results) {
            System.out.println("Result: " + r.get());
        }

        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);

        // ThreadPoolExecutor with custom config
        ThreadPoolExecutor custom = new ThreadPoolExecutor(
            2,                              // corePoolSize
            4,                              // maxPoolSize
            60, TimeUnit.SECONDS,           // keepAliveTime
            new ArrayBlockingQueue<>(10),   // workQueue
            new ThreadPoolExecutor.CallerRunsPolicy() // reject policy
        );
        System.out.println("Active threads: " + custom.getActiveCount());
        custom.shutdown();
    }
}
```

## Interview questions you should be able to answer

- **Q:** Why does `newFixedThreadPool(10)` with 100 submitted tasks never create more than 10 threads, even though `maximumPoolSize` is also 10?
  > Because `newFixedThreadPool` uses an unbounded `LinkedBlockingQueue`. The ThreadPoolExecutor only creates threads beyond `corePoolSize` when the queue is full. An unbounded queue never fills, so `maximumPoolSize` is effectively `corePoolSize` — no extra threads are ever created.

- **Q:** How would you size a thread pool for a service making HTTP calls that each take ~150 ms of network wait and ~10 ms of CPU work on a 4-core machine?
  > Using Little's Law / IO-bound formula: `4 × (1 + 150/10) = 64 threads`. This keeps all CPU cores busy during the compute phase while other threads are blocked waiting for network responses. Add headroom (e.g., 70-80) and validate with load testing.

- **Q:** What is the difference between `shutdown()` and `shutdownNow()`, and when would you use each?
  > `shutdown()` puts the pool in a "draining" state — no new tasks are accepted but all queued and running tasks complete normally. Use it for graceful shutdown. `shutdownNow()` interrupts running threads and returns the list of queued-but-unstarted tasks — use it when you need to abort quickly (e.g., application shutdown under deadline). Note that tasks must check `Thread.isInterrupted()` to actually stop; `shutdownNow()` cannot force-stop tasks that ignore interruption.

- **Q:** What happens when `CallerRunsPolicy` is the rejection handler and the caller is the main thread?
  > The main thread executes the rejected task synchronously before it can submit new tasks. This creates natural back-pressure: the producer slows down automatically when the pool is saturated, preventing queue overflow and OOM. The trade-off is that the submitting thread is blocked from doing other work during that task's execution.

- **Q:** You have a `ThreadPoolExecutor` with `corePoolSize=5`, `maximumPoolSize=10`, and a bounded queue of 20. Walk through what happens as you submit tasks 1 through 36 sequentially.
  > Tasks 1-5: new core threads are created (up to corePoolSize). Tasks 6-25: placed in the bounded queue (queue capacity 20, so 5 running + 20 queued = 25 total). Tasks 26-30: queue is full, so new threads are created up to maximumPoolSize (5 extra threads). Tasks 31-36: pool is at max capacity (10 threads) AND queue is full — `RejectedExecutionHandler` is invoked for each of these 6 tasks.

- **Q:** Why are virtual threads not a drop-in replacement for a `ForkJoinPool` on CPU-bound workloads?
  > Virtual threads are multiplexed onto a small number of carrier platform threads (default: `N_cpu`). For CPU-bound tasks, each virtual thread continuously consumes its carrier thread — no voluntary unmounting occurs because there is no blocking call to trigger a park. You end up with the same degree of CPU parallelism as before with additional scheduling overhead. `ForkJoinPool` with work-stealing is the correct primitive for CPU-bound parallel tasks; virtual threads excel at IO-bound concurrency where threads spend most time blocked.

## Further reading

- Java 21 JEP 444 — Virtual Threads: https://openjdk.org/jeps/444
- "Java Concurrency in Practice" — Goetz et al., Chapter 8 (Applying Thread Pools)
- ThreadPoolExecutor Javadoc: https://docs.oracle.com/en/java/docs/api/java.base/java/util/concurrent/ThreadPoolExecutor.html
- Baeldung — Guide to java.util.concurrent.Future: https://www.baeldung.com/java-future
