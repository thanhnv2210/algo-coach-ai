# Big-Data Concurrency Patterns

**Category:** Concurrency
**Lesson:** 10
**Tags:** `race-condition` `atomic` `thread-pool` `CompletableFuture` `memory-model` `DCL`
**Level:** Senior

---

## Overview

At scale, concurrency bugs stop being theoretical and start causing production incidents. This lesson covers five patterns that appear in every senior Java interview and every high-throughput system: atomic counters, concurrent maps, thread lifecycle cost, async pipeline blocking, and the Java Memory Model trap that has burned engineers for two decades. Each section shows the broken approach first, explains the failure mode, then shows the correct solution.

---

## Pattern 1 — Shared Mutable Counter Without Synchronisation

### Mistake

```java
// MISTAKE: sharedInt++ is not atomic — it is three separate CPU instructions:
//   1. READ  the current value from memory into a register
//   2. ADD   1 to the register value
//   3. WRITE the result back to memory
//
// Two threads can both READ the same stale value, both ADD 1, and both WRITE
// the same incremented value — effectively dropping one increment.
// Under heavy contention you can lose thousands of updates per second.

public class JavaLabRunner {
    static int counter = 0; // plain int — NO synchronisation

    public static void main(String[] args) throws InterruptedException {
        Runnable increment = () -> {
            for (int i = 0; i < 100_000; i++) {
                counter++; // READ-MODIFY-WRITE race condition
            }
        };

        Thread t1 = new Thread(increment);
        Thread t2 = new Thread(increment);
        t1.start(); t2.start();
        t1.join();  t2.join();

        // Expected: 200000 — Actual: anything less (non-deterministic)
        System.out.println("Mistake counter = " + counter);
    }
}
```

**What goes wrong:** `counter++` compiles to three bytecode instructions (GETFIELD, IADD, PUTFIELD). The JIT can keep the value in a CPU register between iterations, and two threads executing concurrently interleave those three operations, producing lost updates. The loss is non-deterministic — the bug may not reproduce in testing but will appear under load.

---

### Best Practice

```java
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.LongAdder;

public class JavaLabRunner {
    // AtomicInteger uses a single Compare-And-Swap (CAS) CPU instruction.
    // CAS is hardware-atomic: read, compare, and conditionally write happen
    // in one uninterruptible machine operation — no lock required.
    static AtomicInteger atomicCounter = new AtomicInteger(0);

    // LongAdder maintains a set of internal cells — each thread increments
    // its own cell, reducing CAS contention. sum() merges the cells.
    // Under very high contention (millions of increments/sec), LongAdder
    // can be 3-10x faster than AtomicLong.
    static LongAdder adderCounter = new LongAdder();

    public static void main(String[] args) throws InterruptedException {
        Runnable increment = () -> {
            for (int i = 0; i < 100_000; i++) {
                atomicCounter.incrementAndGet(); // single CAS — always correct
                adderCounter.increment();        // cell-striped — lowest contention
            }
        };

        Thread t1 = new Thread(increment);
        Thread t2 = new Thread(increment);
        t1.start(); t2.start();
        t1.join();  t2.join();

        System.out.println("AtomicInteger = " + atomicCounter.get()); // always 200000
        System.out.println("LongAdder     = " + adderCounter.sum());  // always 200000
    }
}
```

**Why it wins:** `AtomicInteger.incrementAndGet()` maps to a single `LOCK XADD` instruction on x86, which the CPU guarantees is atomic. There is no lock object, no monitor contention, no context switching. `LongAdder` goes further: it distributes writes across an array of `Cell` objects (one per contending thread), eliminating CAS retries almost entirely. Call `sum()` only when you need the final total — it is not a snapshot.

**Decision rule:** Use `AtomicInteger`/`AtomicLong` for moderate contention or when you need compare-and-swap semantics; switch to `LongAdder`/`LongAccumulator` when profiling shows CAS spin contention on a hot counter.

---

## Pattern 2 — `synchronized` HashMap vs `ConcurrentHashMap`

### Mistake

```java
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public class JavaLabRunner {
    // Collections.synchronizedMap wraps EVERY method in synchronized(this).
    // That is a single global mutex — reads block writes, writes block reads,
    // and all threads queue up behind one lock regardless of which key they touch.
    static Map<String, Integer> syncMap =
        Collections.synchronizedMap(new HashMap<>());

    public static void main(String[] args) throws InterruptedException {
        // Even a simple read-heavy workload serialises all threads.
        // At 8 threads on an 8-core machine you get 1-core throughput.
        Runnable writer = () -> {
            for (int i = 0; i < 10_000; i++) {
                syncMap.put("key-" + (i % 100), i); // blocks ALL readers
            }
        };
        Runnable reader = () -> {
            for (int i = 0; i < 10_000; i++) {
                syncMap.get("key-" + (i % 100)); // blocks ALL writers AND other readers
            }
        };

        Thread w = new Thread(writer);
        Thread r = new Thread(reader);
        w.start(); r.start();
        w.join();  r.join();
        System.out.println("syncMap size = " + syncMap.size());
    }
}
```

**What goes wrong:** Every `get()` and `put()` acquires the same intrinsic lock. Reads are serialised even though they would be safe to parallelise. Under a 90% read / 10% write workload typical of caches, you discard most of your CPU parallelism. Compound operations like `if (!map.containsKey(k)) map.put(k, v)` are also not atomic despite both methods individually being synchronised.

---

### Best Practice

```java
import java.util.concurrent.ConcurrentHashMap;

public class JavaLabRunner {
    // ConcurrentHashMap uses:
    //   - Volatile reads for get() — NO lock at all for reads
    //   - Stripe-level locking (per-bucket CAS) for writes — 16+ parallel writers by default
    //   - Fully atomic compound operations: putIfAbsent, computeIfAbsent, compute, merge
    static ConcurrentHashMap<String, Integer> cmap = new ConcurrentHashMap<>();

    public static void main(String[] args) throws InterruptedException {
        // putIfAbsent: atomically inserts only if key is absent — replaces
        // the non-atomic "containsKey + put" compound operation.
        cmap.putIfAbsent("counter", 0);

        // computeIfAbsent: atomically computes and inserts a value.
        // The lambda runs AT MOST ONCE per key — safe for expensive initialisation.
        cmap.computeIfAbsent("list-key", k -> 42);

        // compute: atomically reads the old value and writes a new one.
        // Replaces the non-atomic "get + increment + put" pattern.
        Runnable safeIncrement = () -> {
            for (int i = 0; i < 10_000; i++) {
                cmap.compute("counter", (k, v) -> v == null ? 1 : v + 1);
            }
        };

        Thread t1 = new Thread(safeIncrement);
        Thread t2 = new Thread(safeIncrement);
        t1.start(); t2.start();
        t1.join();  t2.join();

        System.out.println("counter = " + cmap.get("counter")); // always 20000

        // CRITICAL GOTCHA — this is NOT atomic, even with ConcurrentHashMap:
        // int size = cmap.size();   // snapshot A
        // cmap.put("new", 1);       // another thread could insert here
        // Both lines are individually thread-safe, but the pair is not.
        // Always use putIfAbsent/compute for compound logic.
    }
}
```

**Why it wins:** `get()` on `ConcurrentHashMap` is lock-free — it reads a volatile array element and follows a volatile node reference, with no mutex acquisition. Writes lock only the single hash bucket involved, so 16 threads writing to 16 different buckets proceed in parallel. `computeIfAbsent` and `compute` are guaranteed atomic, eliminating the class of "check-then-act" races that `synchronizedMap` still exposes.

**Decision rule:** Always prefer `ConcurrentHashMap` over `synchronizedMap`; use `compute`/`putIfAbsent` for any compound read-modify-write operation, and never rely on `size()` for correctness logic.

---

## Pattern 3 — `new Thread()` Per Task vs Thread Pool

### Mistake

```java
import java.util.ArrayList;
import java.util.List;

public class JavaLabRunner {
    // Spawning a new OS thread per request is the fastest path to an OutOfMemoryError.
    // Thread creation cost: ~1ms on Linux (clone syscall + kernel stack allocation).
    // Default stack size: 512KB on most JVMs (-Xss flag).
    // 1000 concurrent requests = 1000 threads = 500MB of stack space — before
    // you allocate a single byte of heap for actual work.
    // Under sustained load the JVM crashes with: java.lang.OutOfMemoryError: unable to create native thread

    public static void main(String[] args) throws InterruptedException {
        List<Thread> threads = new ArrayList<>();

        for (int i = 0; i < 200; i++) {
            int taskId = i;
            Thread t = new Thread(() -> {
                // Simulate work — each of these 200 threads is a brand new OS thread.
                // In production this would be 10000+ threads.
                long sum = 0;
                for (int j = 0; j < 1_000_000; j++) sum += j;
                // result discarded — thread dies, stack memory freed — wasted creation cost
            });
            t.start();
            threads.add(t);
        }

        for (Thread t : threads) t.join();
        System.out.println("Mistake: spawned 200 raw threads — expensive and uncontrolled");
    }
}
```

**What goes wrong:** Every request pays the OS thread creation overhead. There is no upper bound on threads, so a traffic spike creates thousands of threads, exhausting native memory. There is no backpressure — the application accepts more work than it can handle instead of queuing or rejecting excess requests gracefully.

---

### Best Practice

```java
import java.util.concurrent.*;

public class JavaLabRunner {

    public static void main(String[] args) throws InterruptedException {
        int cores = Runtime.getRuntime().availableProcessors();

        // CPU-bound sizing: N_cores + 1 threads.
        // The +1 handles the one thread that may be waiting on a page fault or GC pause.
        int cpuBoundPoolSize = cores + 1;

        // IO-bound sizing: N_cores × (1 + wait_time / compute_time).
        // If a DB call takes 100ms and processing takes 10ms, ratio = 10,
        // so pool size = cores × 11. Tune empirically with a load test.
        double waitOverComputeRatio = 10.0;
        int ioBoundPoolSize = (int) (cores * (1 + waitOverComputeRatio));

        // ThreadPoolExecutor with bounded queue + CallerRunsPolicy:
        // - Bounded ArrayBlockingQueue: caps memory consumption.
        // - CallerRunsPolicy: when queue is full, the CALLER'S thread runs
        //   the task — this naturally slows down the producer and provides
        //   backpressure without dropping work or throwing exceptions.
        ThreadPoolExecutor pool = new ThreadPoolExecutor(
            cpuBoundPoolSize,          // corePoolSize — always-live threads
            cpuBoundPoolSize,          // maximumPoolSize — same: fixed-size pool
            0L, TimeUnit.MILLISECONDS,
            new ArrayBlockingQueue<>(500),   // bounded work queue
            new ThreadPoolExecutor.CallerRunsPolicy() // backpressure on overflow
        );

        long start = System.currentTimeMillis();
        for (int i = 0; i < 200; i++) {
            pool.submit(() -> {
                long sum = 0;
                for (int j = 0; j < 1_000_000; j++) sum += j;
                return sum;
            });
        }

        pool.shutdown();
        pool.awaitTermination(60, TimeUnit.SECONDS);
        long elapsed = System.currentTimeMillis() - start;

        System.out.println("Pool size      : " + cpuBoundPoolSize);
        System.out.println("IO pool size   : " + ioBoundPoolSize);
        System.out.println("200 tasks done : " + elapsed + "ms");
        System.out.println("Threads reused — no 200x creation overhead");
    }
}
```

**Why it wins:** Threads are created once and reused across thousands of tasks. Peak memory is bounded by `corePoolSize × stackSize` plus the queue capacity. `CallerRunsPolicy` implements backpressure without a separate rate-limiter: when the pool is saturated, the submitting thread does work itself, which naturally reduces the submission rate to match the processing rate.

**Decision rule:** Never use `new Thread()` in application code — always submit to a `ThreadPoolExecutor`; size CPU-bound pools at `N+1` and IO-bound pools at `N × (1 + wait/compute)`, and always bound the queue to cap memory under load.

---

## Pattern 4 — Blocking Inside a `CompletableFuture` Pipeline

### Mistake

```java
import java.util.concurrent.*;

public class JavaLabRunner {
    // Simulates a blocking IO call (DB query, HTTP request, etc.)
    static String blockingDbCall(String id) throws Exception {
        Thread.sleep(50); // simulate 50ms network/DB latency
        return "result-for-" + id;
    }

    public static void main(String[] args) throws Exception {
        // thenApply runs its function on the thread that completed the previous
        // stage — which is typically a thread from ForkJoinPool.commonPool.
        // That pool defaults to N_cores - 1 threads and is SHARED across the JVM
        // (used by parallel streams, other CompletableFutures, etc.).
        //
        // A blocking call inside thenApply PARKS the ForkJoinPool thread for 50ms.
        // With 8 cores (7 commonPool threads), 7 concurrent pipelines block ALL of
        // them — no other async work in the JVM can progress. This is thread starvation.

        CompletableFuture<String> bad = CompletableFuture
            .supplyAsync(() -> "user-123")  // runs on commonPool
            .thenApply(id -> {              // ALSO runs on commonPool
                try {
                    return blockingDbCall(id); // BLOCKS a commonPool thread — BAD
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            });

        System.out.println("Mistake result: " + bad.get());
        System.out.println("ForkJoinPool thread was blocked for 50ms during DB call");
    }
}
```

**What goes wrong:** `thenApply` inherits the completing thread, which is a `ForkJoinPool` worker. `ForkJoinPool` is designed for short, non-blocking, CPU-bound tasks. Blocking a `ForkJoinPool` thread with IO stalls the pool because it cannot steal work from a parked thread. Under concurrency, all pool threads park on IO and the entire async layer grinds to a halt.

---

### Best Practice

```java
import java.util.concurrent.*;

public class JavaLabRunner {
    static String blockingDbCall(String id) throws Exception {
        Thread.sleep(50);
        return "result-for-" + id;
    }

    // A dedicated IO pool: many threads, all allowed to block.
    // Virtual threads (Java 21+) are ideal here, but a cached pool works for Java 17.
    static ExecutorService ioPool = Executors.newFixedThreadPool(50);

    public static void main(String[] args) throws Exception {
        // thenApply   — runs on the COMPLETING thread (no dispatch overhead)
        //               correct only for fast, non-blocking CPU transforms.
        // thenApplyAsync(fn)          — dispatches to ForkJoinPool.commonPool
        // thenApplyAsync(fn, executor) — dispatches to the specified executor

        CompletableFuture<String> good = CompletableFuture
            .supplyAsync(() -> "user-123")                      // fast — commonPool OK
            .thenApplyAsync(id -> {                             // DISPATCH to ioPool
                try {
                    return blockingDbCall(id);                  // blocks an ioPool thread — OK
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }, ioPool)                                          // <-- explicit IO executor
            .thenApply(result -> result.toUpperCase());         // fast CPU transform — no dispatch needed

        System.out.println("Good result: " + good.get());

        // Alternative: supplyAsync with ioPool from the start when the first
        // operation is itself a blocking IO call:
        CompletableFuture<String> alt = CompletableFuture
            .supplyAsync(() -> {
                try { return blockingDbCall("user-456"); }
                catch (Exception e) { throw new RuntimeException(e); }
            }, ioPool) // <-- IO call goes directly to ioPool
            .thenApply(r -> "processed: " + r); // CPU step back on commonPool

        System.out.println("Alt result: " + alt.get());

        ioPool.shutdown();
    }
}
```

**Why it wins:** Separating executors by workload type matches thread resources to task characteristics. The `ForkJoinPool` stays free for short CPU tasks and work-stealing remains effective. The `ioPool` can have many threads (50–200 is common) because they are mostly parked on IO, consuming minimal CPU. `thenApply` is a zero-dispatch optimisation for cheap transforms that do not need a pool handoff.

**Decision rule:** Use `thenApply` only for fast, non-blocking CPU transforms; route every IO or blocking operation through `thenApplyAsync(fn, ioExecutor)` or `supplyAsync(() -> ioCall(), ioExecutor)` with a dedicated thread pool.

---

## Pattern 5 — Double-Checked Locking Without `volatile`

### Mistake

```java
public class JavaLabRunner {

    // BROKEN singleton — missing volatile on instance.
    // The JIT and CPU are free to reorder the instructions inside "new Singleton()":
    //   Normal order:  allocate memory → call constructor → assign reference
    //   Allowed reorder: allocate memory → assign reference → call constructor
    //
    // Thread A is inside the synchronized block, reordered write makes instance
    // non-null BEFORE the constructor finishes. Thread B checks instance != null
    // in the outer if, skips the lock, and reads a PARTIALLY CONSTRUCTED OBJECT.
    // Fields that the constructor sets are still at their default values (0, null, false).
    // This is a Java Memory Model (JMM) violation — undefined behaviour.

    static class BrokenSingleton {
        private static BrokenSingleton instance; // NO volatile — BROKEN DCL

        private int config;

        private BrokenSingleton() {
            this.config = 42; // Thread B may see config == 0
        }

        public static BrokenSingleton getInstance() {
            if (instance == null) {              // check 1 — no lock
                synchronized (BrokenSingleton.class) {
                    if (instance == null) {      // check 2 — inside lock
                        instance = new BrokenSingleton(); // reorder risk here
                    }
                }
            }
            return instance; // may be partially constructed object
        }

        public int getConfig() { return config; }
    }

    public static void main(String[] args) {
        // Under normal load this may "work" because the JIT's reordering
        // only becomes visible across CPU cores under contention.
        // It will fail intermittently in production under high concurrency.
        System.out.println("Broken DCL config = " + BrokenSingleton.getInstance().getConfig());
        // May print 0 instead of 42 due to JMM violation
    }
}
```

**What goes wrong:** The Java Memory Model does not guarantee that writes made inside a constructor are visible to other threads unless there is a happens-before edge between the write and the read. `synchronized` creates a happens-before only for threads that actually acquire the lock. Thread B's outer `if (instance == null)` check happens without a lock, so it has no happens-before relationship with Thread A's constructor writes. `volatile` on the field establishes that happens-before edge via a memory barrier inserted after the store.

---

### Best Practice

```java
public class JavaLabRunner {

    // SOLUTION 1: volatile DCL — correct and fast after first construction.
    // volatile write (in synchronized block) happens-before volatile read (outer if).
    // This is the JMM guarantee that makes DCL safe.
    static class VolatileSingleton {
        private static volatile VolatileSingleton instance; // volatile — CORRECT

        private final int config;

        private VolatileSingleton() { this.config = 42; }

        public static VolatileSingleton getInstance() {
            if (instance == null) {
                synchronized (VolatileSingleton.class) {
                    if (instance == null) {
                        instance = new VolatileSingleton(); // volatile write — full memory barrier
                    }
                }
            }
            return instance; // safe: volatile read sees the fully constructed object
        }

        public int getConfig() { return config; }
    }

    // SOLUTION 2: Initialization-on-Demand Holder idiom — NO volatile needed.
    // The JVM guarantees that class initialisation is thread-safe under the
    // Class Loading Specification. The inner class is not loaded until
    // getInstance() is first called, achieving lazy initialisation without
    // any synchronisation in the hot path.
    static class HolderSingleton {
        private final int config;

        private HolderSingleton() { this.config = 42; }

        private static class Holder {
            static final HolderSingleton INSTANCE = new HolderSingleton();
            // Class initialiser is run exactly once, guarded by the JVM class loader lock.
        }

        public static HolderSingleton getInstance() {
            return Holder.INSTANCE; // no lock, no volatile — JVM guarantees safety
        }

        public int getConfig() { return config; }
    }

    // SOLUTION 3: Enum singleton — Joshua Bloch's "Effective Java" recommendation.
    // Serialisation-safe, reflection-safe, thread-safe by JVM spec.
    // Cannot be lazy-initialised, but correct for almost all singleton use cases.
    enum EnumSingleton {
        INSTANCE;
        private final int config = 42;
        public int getConfig() { return config; }
    }

    public static void main(String[] args) {
        System.out.println("volatile DCL   : " + VolatileSingleton.getInstance().getConfig()); // 42
        System.out.println("Holder idiom   : " + HolderSingleton.getInstance().getConfig());   // 42
        System.out.println("Enum singleton : " + EnumSingleton.INSTANCE.getConfig());          // 42

        // All three guarantee full construction visibility. Prefer Holder or Enum
        // for new code; understand volatile DCL because it is THE memory model
        // question in senior Java interviews.
    }
}
```

**Why it wins:** `volatile` inserts a StoreStore barrier before the write and a LoadLoad barrier after the read, preventing the JIT and CPU from reordering the reference publication ahead of the constructor. The Holder idiom delegates the synchronisation concern entirely to the JVM class loader, which already handles it correctly with no runtime overhead after first load. The Enum idiom adds serialisation and reflection safety.

**Decision rule:** Always add `volatile` to the instance field in any double-checked locking pattern, or eliminate the pattern entirely by using the Initialization-on-Demand Holder idiom; this is the most commonly tested Java Memory Model question at the senior level.

---

## Interview Q&A

**Q1: Why does `i++` on a shared `int` cause a race condition even if the operation looks atomic?**

`i++` is syntactic sugar for three separate operations: read the current value, add 1, write the result back. At the bytecode level these are distinct instructions (GETFIELD / IADD / PUTFIELD or their array equivalents), and the CPU can interleave them across threads at any point. Two threads can both read the same value of `i`, both compute `i+1`, and both write back the same result — effectively losing one increment. The operation is only "atomic" in the sense that the source code is one statement; at the machine level it is not. `AtomicInteger.incrementAndGet()` replaces all three steps with a single `LOCK XADD` instruction that the CPU hardware guarantees cannot be interrupted.

---

**Q2: What is the difference between `ConcurrentHashMap.putIfAbsent` and `computeIfAbsent`?**

`putIfAbsent(key, value)` requires you to construct the value before calling the method — even if the key already exists, the value object is created and then thrown away. It returns the existing value if the key was present, or null if the insertion happened. `computeIfAbsent(key, mappingFunction)` takes a lambda that is invoked only if the key is absent, and it is invoked atomically inside the map's lock for that bucket — the lambda runs at most once per missing key under concurrent access. `computeIfAbsent` is the correct choice when value construction is expensive (e.g., initialising a nested collection) because it avoids creating objects that will be discarded, and it prevents duplicate initialisation under concurrency.

---

**Q3: Why should you not block inside a `CompletableFuture` `thenApply`?**

`thenApply` executes its function on the thread that completed the previous stage, which under `CompletableFuture.supplyAsync` is a thread from `ForkJoinPool.commonPool`. That pool is designed for short, non-blocking, CPU-bound work — it defaults to `N_cores - 1` threads and is shared across the entire JVM (parallel streams, other async pipelines, etc.). When you perform a blocking IO call inside `thenApply`, you park a `ForkJoinPool` thread for the duration of the IO wait. The pool cannot steal work from a parked thread. Under concurrency, all pool threads become parked on IO, and no other async task in the JVM can make progress — this is thread starvation. The fix is `thenApplyAsync(fn, ioExecutor)`, which dispatches the blocking call to a dedicated pool sized for IO workloads, leaving `commonPool` free.

---

**Q4: Why does double-checked locking require `volatile`, and what is the alternative?**

Without `volatile`, the Java Memory Model permits the JIT compiler and CPU to reorder the write to the `instance` field ahead of the completion of the object's constructor — a phenomenon called publication without a happens-before edge. A second thread reading `instance` in the outer null-check (without holding the lock) can observe a non-null reference pointing to a partially constructed object whose fields still hold default values. `volatile` prevents this by inserting a StoreStore memory barrier before the write and a LoadLoad barrier after the read, guaranteeing that the fully constructed object is visible before the reference becomes visible to other threads. The cleaner alternative is the Initialization-on-Demand Holder idiom: a private static inner class holds the singleton instance as a `static final` field, and the JVM's class-loading specification guarantees that class initialisation is thread-safe and runs exactly once — no `volatile`, no `synchronized`, and no explicit memory barrier needed in application code.
