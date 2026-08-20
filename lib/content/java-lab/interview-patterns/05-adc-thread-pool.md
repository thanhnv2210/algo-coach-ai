# Architecture Decision Card: Which Thread Pool / Executor Should I Use?

## Why It Matters

Thread pool selection is one of the most consequential decisions in a concurrent Java application. The wrong choice causes silent OOM crashes under load, starvation of critical tasks, or missed deadlines on scheduled work. Senior engineers are expected to justify the choice — not just pick `Executors.newFixedThreadPool(10)` and move on.

Every `ExecutorService` makes three implicit choices:
1. **How many threads** can run concurrently
2. **How many tasks** can wait in the queue before being rejected
3. **What happens** when the pool is saturated

Getting any of these wrong produces systems that work in staging and collapse in production.

---

## Decision Matrix

| Executor | Core Threads | Max Threads | Queue | Best For | Risk |
|---|---|---|---|---|---|
| `newFixedThreadPool(N)` | N | N | Unbounded `LinkedBlockingQueue` | CPU-bound work | OOM via queue growth |
| `newCachedThreadPool()` | 0 | `Integer.MAX_VALUE` | `SynchronousQueue` (no buffering) | Short IO bursts | OOM via thread growth |
| `newScheduledThreadPool(N)` | N | `Integer.MAX_VALUE` | `DelayedWorkQueue` | Crons, retries, health checks | Missed schedules if tasks block |
| `ForkJoinPool` / `commonPool` | CPU count | CPU count | Per-thread deque (work-stealing) | Recursive divide-and-conquer | Starvation if blocking tasks mixed in |
| Custom `ThreadPoolExecutor` | Tunable | Tunable | Bounded `ArrayBlockingQueue` | **Production default** | Requires explicit sizing |

---

## Trade-off Analysis

### 1. `newFixedThreadPool(N)` — CPU-Bound Tasks

**Context:** You have tasks that are computationally intensive (sorting, hashing, encryption, image processing) with minimal blocking. You want to saturate all CPU cores without context-switch overhead.

**Options:**
- Use `newFixedThreadPool(N_cpu + 1)` for CPU-bound tasks
- Use a larger pool to "hide" latency

**Trade-off:**
- The `+1` extra thread ensures the CPU stays busy when one thread stalls briefly on a cache miss or OS scheduling jitter
- The queue backing this pool is an **unbounded** `LinkedBlockingQueue`. Under sustained overload, tasks pile up in memory with no backpressure signal. The application silently consumes heap until it crashes with `OutOfMemoryError`
- There is no built-in rejection mechanism — the queue will always accept new tasks

**Decision rule:** Use `newFixedThreadPool(N_cpu + 1)` only when task submission rate is bounded and you control the producer. For untrusted or unbounded producers, use a custom `ThreadPoolExecutor` with a bounded queue instead.

---

### 2. `newCachedThreadPool()` — Short IO Bursts

**Context:** You have a burst of short-lived IO tasks (DNS lookups, cache fetches, lightweight HTTP calls) where each task completes in milliseconds and the burst is transient.

**Options:**
- `newCachedThreadPool()` for elastic short-burst work
- A sized thread pool with a queue

**Trade-off:**
- Threads are created on demand and reused if idle within 60 seconds. For a genuine burst, this is efficient: no threads sit idle between bursts
- Max threads is `Integer.MAX_VALUE`. Under **sustained** load, the JVM spawns thousands of threads. Each thread consumes ~512 KB of stack by default. 4,000 threads = ~2 GB of stack space → `OutOfMemoryError` or OS-level thread exhaustion
- There is no queue — tasks are either picked up by a thread immediately or a new thread is created

**Decision rule:** `newCachedThreadPool()` is acceptable for **development**, **test harnesses**, and **genuinely transient bursts** where you have hard knowledge the burst ends. **NEVER use it in production for sustained or unpredictable load.** Replace with a custom `ThreadPoolExecutor` with bounded queue and rejection policy.

---

### 3. `newScheduledThreadPool(N)` — Periodic and Delayed Tasks

**Context:** You need to run work on a schedule: health checks every 30 seconds, exponential-backoff retries, metrics flush every minute, cache warming on startup.

**Options:**
- `newScheduledThreadPool(N)` for cron-style or delayed execution
- A general-purpose pool with manual `Thread.sleep()` loops (anti-pattern)

**Trade-off:**
- `ScheduledExecutorService` provides `scheduleAtFixedRate` and `scheduleWithFixedDelay` with correct handling of missed fires and exception isolation per task
- Core threads are fixed. Max threads is `Integer.MAX_VALUE`, but the `DelayedWorkQueue` serializes submissions by trigger time, so unbounded thread growth is rare in practice
- If a scheduled task **blocks** (e.g., makes a slow DB call), it occupies a core thread and delays subsequent scheduled tasks. For any scheduled task with IO, keep it short or delegate to a separate executor

**Decision rule:** Use `newScheduledThreadPool(N)` for any time-driven work. N = 2–4 is sufficient for most applications since tasks should be short. If scheduled tasks involve IO, delegate actual work to a separate executor and return quickly from the scheduled callback.

---

### 4. `ForkJoinPool` / `commonPool` — Recursive Divide-and-Conquer

**Context:** You have a large dataset that can be recursively split into independent sub-problems: parallel sort, tree traversal, bulk data transformation, recursive fibonacci.

**Options:**
- `ForkJoinPool` with `RecursiveTask` / `RecursiveAction`
- `commonPool` implicitly via parallel streams (`stream().parallel()`)

**Trade-off:**
- Work-stealing: idle threads steal tasks from the tail of other threads' deques. This maximizes CPU utilization when subtask sizes are uneven
- `commonPool` is shared across the entire JVM. If any code submits blocking tasks (JDBC, file IO, HTTP) to `commonPool`, it starves parallel stream operations elsewhere in the same process
- Ideal for **CPU-bound recursive algorithms** only. The pool size defaults to `Runtime.getRuntime().availableProcessors() - 1`
- Blocking tasks in a `ForkJoinPool` require `ForkJoinPool.ManagedBlocker` to avoid starvation; few teams implement this correctly

**Decision rule:** Use `ForkJoinPool` / `commonPool` for divide-and-conquer algorithms and bulk in-memory data processing via parallel streams. Never submit IO-bound or blocking tasks to `commonPool`. If you need parallelism with IO, use a custom `ThreadPoolExecutor`.

---

### 5. Custom `ThreadPoolExecutor` — Production Default

**Context:** You are building production services that process requests, jobs, or events from an external source (HTTP, message queue, database polling) with unpredictable arrival rates.

**Options:**
- One of the factory methods from `Executors`
- Custom `ThreadPoolExecutor` with explicit bounds

**Trade-off:**
- Full control over core threads, max threads, keep-alive time, queue capacity, and rejection policy
- `ArrayBlockingQueue(capacity)` provides a **bounded** buffer. Once full, the rejection handler fires — giving you explicit backpressure rather than a silent OOM
- Requires intentional sizing decisions (see Sizing Formulas below), which is a feature, not a burden

**Decision rule:** For any production service that processes external work, always use a custom `ThreadPoolExecutor` with a bounded `ArrayBlockingQueue` and an explicit `RejectedExecutionHandler`. This is the correct default for production Java services.

---

### 6. Rejection Policies — Backpressure Strategy

When a bounded queue is full and all threads are busy, the `RejectedExecutionHandler` fires. The choice encodes your **backpressure contract**.

**`CallerRunsPolicy`** — The submitting thread runs the task itself. Submission blocks until the pool has capacity. This provides natural backpressure: the producer slows down automatically. Best for: batch jobs, internal pipelines where slowing down the producer is acceptable.

**`AbortPolicy`** (default) — Throws `RejectedExecutionException`. The caller must catch it and decide what to do. Best for: services where you want explicit failure signaling and can propagate an error response (e.g., return HTTP 503).

**`DiscardOldestPolicy`** — Drops the oldest waiting task and accepts the new one. Best for: real-time telemetry or sensor data where recent data is more valuable than old data and loss is acceptable.

**`DiscardPolicy`** — Silently drops the new task. Generally an anti-pattern — you lose work with no signal. Avoid unless the task is explicitly fire-and-forget with zero consequence on loss.

**Decision rule:** Default to `CallerRunsPolicy` for internal batch work (it cannot cause OOM and requires no error handling). Use `AbortPolicy` when callers need explicit rejection feedback. Use `DiscardOldestPolicy` only for time-sensitive telemetry where staleness matters more than completeness.

---

## Sizing Formulas

### CPU-Bound Tasks
```
N_threads = N_cpu + 1
```
The `+1` keeps the CPU busy when one thread stalls on a minor OS scheduling pause or cache miss. Going higher wastes context-switch budget without adding throughput.

### IO-Bound Tasks
```
N_threads = N_cpu × (1 + wait_time / compute_time)
```
**Example:** 4-core machine, tasks spend 90% of their time waiting on DB and 10% computing.
```
N_threads = 4 × (1 + 0.9 / 0.1) = 4 × 10 = 40
```
The multiplier reflects that threads block most of the time, so many more can be active before CPU becomes the bottleneck. Validate with load testing — this formula is a starting estimate, not a guarantee.

---

## Code Example

```java
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

public class JavaLabRunner {

    // ---------------------------------------------------------------
    // 1. Custom ThreadPoolExecutor — Production Default
    //    Bounded queue + CallerRunsPolicy for backpressure
    // ---------------------------------------------------------------
    static void demonstrateCustomThreadPool() throws InterruptedException {
        int cpuCores = Runtime.getRuntime().availableProcessors();
        int coreThreads = cpuCores + 1;           // CPU-bound sizing
        int maxThreads  = cpuCores + 1;
        int queueCapacity = 50;                   // bounded: OOM-safe

        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            coreThreads,
            maxThreads,
            60L, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(queueCapacity),
            new ThreadFactory() {
                private final AtomicInteger count = new AtomicInteger(0);
                @Override
                public Thread newThread(Runnable r) {
                    Thread t = new Thread(r, "worker-" + count.incrementAndGet());
                    t.setDaemon(false);
                    return t;
                }
            },
            new ThreadPoolExecutor.CallerRunsPolicy()  // backpressure: slow the producer
        );

        System.out.println("=== Custom ThreadPoolExecutor ===");
        System.out.printf("CPU cores: %d | Core threads: %d | Queue capacity: %d%n",
            cpuCores, coreThreads, queueCapacity);

        // Submit tasks — if queue fills up, CallerRunsPolicy runs task on calling thread
        for (int i = 1; i <= 10; i++) {
            final int taskId = i;
            executor.submit(() -> {
                String thread = Thread.currentThread().getName();
                System.out.printf("  Task %2d running on [%s]%n", taskId, thread);
                simulateCpuWork(5);
            });
        }

        executor.shutdown();
        executor.awaitTermination(30, TimeUnit.SECONDS);

        System.out.printf("Completed. Tasks run: %d%n%n",
            executor.getCompletedTaskCount());
    }

    // ---------------------------------------------------------------
    // 2. ScheduledExecutorService — periodic and delayed tasks
    // ---------------------------------------------------------------
    static void demonstrateScheduledPool() throws InterruptedException {
        // N=2: one thread for fixed-rate health check, one for retry logic
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

        System.out.println("=== ScheduledExecutorService ===");

        // Delayed one-shot: simulate startup probe after 200ms
        scheduler.schedule(() ->
            System.out.println("  [startup-probe] running 200ms after start"),
            200, TimeUnit.MILLISECONDS);

        // Fixed-rate: simulate health check every 300ms, starting after 100ms
        AtomicInteger healthCheckCount = new AtomicInteger(0);
        ScheduledFuture<?> healthCheck = scheduler.scheduleAtFixedRate(() -> {
            int n = healthCheckCount.incrementAndGet();
            System.out.printf("  [health-check] ping #%d on [%s]%n",
                n, Thread.currentThread().getName());
        }, 100, 300, TimeUnit.MILLISECONDS);

        // Fixed-delay: simulate exponential-backoff retry (delay measured after task ends)
        AtomicInteger retryCount = new AtomicInteger(0);
        ScheduledFuture<?> retryTask = scheduler.scheduleWithFixedDelay(() -> {
            int n = retryCount.incrementAndGet();
            System.out.printf("  [retry] attempt #%d%n", n);
        }, 150, 400, TimeUnit.MILLISECONDS);

        // Let it run for 1.1 seconds, then cancel
        Thread.sleep(1100);
        healthCheck.cancel(false);
        retryTask.cancel(false);

        scheduler.shutdown();
        scheduler.awaitTermination(5, TimeUnit.SECONDS);
        System.out.println();
    }

    // ---------------------------------------------------------------
    // 3. Rejection policy comparison — AbortPolicy vs CallerRunsPolicy
    // ---------------------------------------------------------------
    static void demonstrateRejectionPolicies() throws InterruptedException {
        System.out.println("=== Rejection Policies ===");

        // Tiny pool + tiny queue so rejection fires quickly
        ThreadPoolExecutor abortPool = new ThreadPoolExecutor(
            1, 1, 0L, TimeUnit.MILLISECONDS,
            new ArrayBlockingQueue<>(2),
            new ThreadPoolExecutor.AbortPolicy()
        );

        for (int i = 1; i <= 5; i++) {
            final int id = i;
            try {
                abortPool.submit(() -> {
                    simulateCpuWork(200);
                    System.out.printf("  [AbortPolicy] task %d completed%n", id);
                });
                System.out.printf("  [AbortPolicy] task %d accepted%n", id);
            } catch (RejectedExecutionException e) {
                System.out.printf("  [AbortPolicy] task %d REJECTED — caller handles error%n", id);
            }
        }
        abortPool.shutdown();
        abortPool.awaitTermination(5, TimeUnit.SECONDS);

        System.out.println();

        // CallerRunsPolicy: same tiny pool — rejected tasks run on the submitting thread
        ThreadPoolExecutor callerPool = new ThreadPoolExecutor(
            1, 1, 0L, TimeUnit.MILLISECONDS,
            new ArrayBlockingQueue<>(2),
            new ThreadPoolExecutor.CallerRunsPolicy()
        );

        for (int i = 1; i <= 5; i++) {
            final int id = i;
            callerPool.submit(() -> {
                String t = Thread.currentThread().getName();
                System.out.printf("  [CallerRunsPolicy] task %d on [%s]%n", id, t);
                simulateCpuWork(50);
            });
        }
        callerPool.shutdown();
        callerPool.awaitTermination(5, TimeUnit.SECONDS);
        System.out.println();
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------
    static void simulateCpuWork(long millis) {
        long end = System.currentTimeMillis() + millis;
        while (System.currentTimeMillis() < end) {
            Math.sqrt(Math.random()); // burn CPU
        }
    }

    public static void main(String[] args) throws InterruptedException {
        demonstrateCustomThreadPool();
        demonstrateScheduledPool();
        demonstrateRejectionPolicies();

        System.out.println("=== Sizing Reference ===");
        int n = Runtime.getRuntime().availableProcessors();
        System.out.printf("This machine: %d CPU cores%n", n);
        System.out.printf("CPU-bound pool size:  N+1 = %d%n", n + 1);
        System.out.printf("IO-bound example (90%% wait): N×(1 + 9) = %d%n", n * 10);
    }
}
```

---

## Interview Q&As

**Q: Why is `newCachedThreadPool()` dangerous in production?**

`newCachedThreadPool()` has no upper bound on thread count (`Integer.MAX_VALUE`). Under sustained load, the JVM spawns a new thread for every task that does not find an idle thread. Each thread consumes stack memory (typically 512 KB by default). At a few thousand threads the process runs out of heap or the OS exhausts its thread limit, causing `OutOfMemoryError` or `Cannot create native thread` errors. The `SynchronousQueue` backing it provides no buffering, so there is no queue to absorb bursts — threads are the only buffer. In production, replace it with a custom `ThreadPoolExecutor` with a bounded `ArrayBlockingQueue` and a `RejectedExecutionHandler` so that the system degrades gracefully rather than crashing.

---

**Q: What is `CallerRunsPolicy` and why is it useful?**

`CallerRunsPolicy` is a `RejectedExecutionHandler` that, when the thread pool queue is full and all threads are busy, runs the rejected task on the **thread that called `submit()` or `execute()`**. This has two consequences: first, the task is not lost. Second, the calling thread is occupied running the task and cannot submit more work until it finishes, which automatically slows the producer down to the rate the pool can handle. This is called **natural backpressure**: the system self-throttles without any explicit rate-limiting code. It is the right choice for batch processing pipelines and internal job queues where slowing the producer is acceptable and losing tasks is not.

---

**Q: How do you size a thread pool for IO-bound tasks?**

Use the formula: `N_threads = N_cpu × (1 + wait_time / compute_time)`. The intuition is that IO-bound threads spend most of their time blocked waiting on a network socket, disk, or database, so the CPU is idle during that wait. You can schedule many more threads than CPU cores before the CPU becomes the bottleneck. For example, on a 4-core machine with tasks that are 90% waiting and 10% computing, the ratio is 9, so the formula gives `4 × (1 + 9) = 40 threads`. Treat this as a starting point. Validate under realistic load using thread pool metrics (`getActiveCount()`, `getQueue().size()`) and tune from there. If the queue is consistently full, increase threads or queue capacity. If threads are mostly idle, reduce them.

---

**Q: What is the difference between `ForkJoinPool` and a fixed thread pool?**

A fixed thread pool uses a single shared queue. Worker threads pull tasks from the front of that queue. When a task is submitted it waits its turn. This model works well for independent, uniform tasks but is inefficient for recursive algorithms that generate subtasks, because subtasks must wait in the global queue behind unrelated work.

`ForkJoinPool` gives each worker thread its **own double-ended deque**. A worker pushes its own subtasks to the front of its local deque and processes them LIFO, which improves cache locality. Idle workers **steal** tasks from the back of other workers' deques, which keeps all threads busy when workloads are uneven. This work-stealing design is ideal for recursive divide-and-conquer algorithms (`RecursiveTask`, `RecursiveAction`) and parallel streams. However, `ForkJoinPool` assumes tasks are **non-blocking and CPU-bound**. Mixing blocking IO tasks into a `ForkJoinPool` starves the pool because blocked threads cannot steal work, and the pool does not add replacement threads the way a standard `ThreadPoolExecutor` can.
