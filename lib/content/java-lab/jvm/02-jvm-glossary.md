# JVM Internals & Performance Terminology — Interview Reference

## Why this matters in interviews

Senior Java interviews routinely probe JVM internals to assess whether a candidate can reason about production behavior — not just write correct code. Understanding garbage collection, JIT compilation, and memory areas lets you diagnose `OutOfMemoryError` incidents, tune throughput vs latency trade-offs, and explain why certain coding patterns (static collections, thread-locals, finalizers) are dangerous at scale. Interviewers at FAANG and fintech companies use these topics to separate engineers who know Java from those who understand the JVM.

## Concept

### JVM Architecture — ClassLoader Subsystem

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| Bootstrap ClassLoader | The root loader, written in native code (C++); loads `rt.jar` / core JDK classes (`java.lang.*`). Has no parent. | "The Bootstrap ClassLoader loads `String` and `Object` before any application code runs." |
| Extension / Platform ClassLoader | Child of Bootstrap; loads JDK extension JARs (`lib/ext/` in Java 8, named modules in Java 9+). | "In Java 11 the Extension ClassLoader was renamed Platform ClassLoader to align with the module system." |
| Application (System) ClassLoader | Child of Platform; loads classes from the application's classpath (`-cp`). | "All your business classes are loaded by the Application ClassLoader by default." |
| Custom ClassLoader | User-defined subclass of `ClassLoader`; enables hot-reload, isolation (OSGi, containers). | "Tomcat uses a custom ClassLoader per web application to isolate class versions." |
| Parent delegation model | Each ClassLoader asks its parent first before attempting to load a class itself; prevents rogue code from shadowing `java.lang.String`. | "Parent delegation means even if you put a fake `java.lang.String` on the classpath, the Bootstrap loader's version always wins." |
| Loading | JVM reads the `.class` bytecode and creates a `Class` object in the method area. | "Loading is triggered the first time a class is referenced by name." |
| Linking | Three sub-steps: **verification** (bytecode correctness), **preparation** (allocate static fields with defaults), **resolution** (symbolic refs → direct refs). | "Linking's verification phase catches corrupted or tampered bytecodes before execution." |
| Initializing | JVM executes `<clinit>` (static initializer blocks and static field assignments). | "A `NullPointerException` inside a static initializer causes `ExceptionInInitializerError` during the initializing phase." |
| Class unloading | A class is unloaded only when its ClassLoader becomes unreachable; rare in normal apps, common source of Metaspace leaks in dynamic frameworks. | "Each hot-redeploy without dereferencing the old ClassLoader causes class unloading to fail and Metaspace to grow." |

### JVM Architecture — Runtime Data Areas

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| Heap | Shared, GC-managed memory for object instances; divided into young gen and old gen. | "Most Java objects live on the heap unless escape analysis proves they can be stack-allocated." |
| Young generation | Short-lived objects; subdivided into **Eden** (new allocations), **Survivor 0 (S0)**, and **Survivor 1 (S1)**. | "Objects survive a minor GC by being copied from Eden to a Survivor space." |
| Eden space | Where new objects are allocated via bump-pointer; cheap and fast. | "A thread-local allocation buffer (TLAB) lets threads allocate in Eden without synchronization." |
| Survivor spaces (S0 / S1) | Two equal-size spaces used alternately; objects that survive minor GC are copied between them, incrementing their GC age. | "An object's GC age increments with each minor GC it survives; once it hits `MaxTenuringThreshold` it is promoted to old gen." |
| Old (Tenured) generation | Long-lived objects promoted from young gen; collected less frequently. | "A Full GC is expensive because it compacts the entire old gen while the world is stopped." |
| Method area / Metaspace | Shared area storing class metadata, bytecode, constant pool; called PermGen before Java 8, replaced by native-memory Metaspace in Java 8+. | "Metaspace grows automatically by default, so a classloader leak manifests as native memory exhaustion rather than `OutOfMemoryError: PermGen`." |
| JVM stack | Per-thread; holds stack frames pushed on method call and popped on return. | "A deep recursive call that never bottoms out will exhaust the JVM stack and throw `StackOverflowError`." |
| Stack frame | One frame per method invocation; contains **local variable array**, **operand stack**, and **frame data** (reference to runtime constant pool, return address). | "The operand stack is where the JVM computes intermediate values, analogous to CPU registers in a register machine." |
| PC (Program Counter) register | Per-thread register holding the address of the current bytecode instruction being executed. | "The PC register is undefined for native methods because they execute outside the JVM bytecode engine." |
| Native method stack | Per-thread stack used when a thread calls JNI (C/C++) methods. | "Calling `System.arraycopy()` transitions execution from the JVM stack to the native method stack." |
| Object header | Metadata prepended to every heap object; consists of the **mark word** and the **klass pointer**. | "A compressed object header is 12 bytes on a 64-bit JVM with `+UseCompressedOops`, vs 16 bytes without." |
| Mark word | First word of the object header; encodes lock state (unlocked / biased / lightweight / heavyweight), GC age bits, and identity hash code. | "When you call `System.identityHashCode(obj)` for the first time, the result is stored in the mark word." |
| Klass pointer | Second word of the object header; points to the class metadata (C++ `Klass` structure) in Metaspace. | "Compressed klass pointers (`+UseCompressedClassPointers`) reduce the klass pointer from 8 to 4 bytes." |

### Garbage Collection — Fundamentals

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| GC roots | The starting points for reachability analysis: active thread stack references, static fields, JNI global references, class objects held by classloaders. | "If no GC root can reach an object through any chain of references, the object is eligible for collection." |
| Strong reference | A normal Java reference (`Object o = new Object()`); keeps the referent alive as long as the reference exists. | "Caching with strong references is the most common cause of unintentional memory leaks." |
| Soft reference (`SoftReference`) | Cleared by the GC before `OutOfMemoryError`; suitable for memory-sensitive caches. | "Guava's `CacheBuilder.softValues()` uses `SoftReference` to let the GC reclaim cache entries under memory pressure." |
| Weak reference (`WeakReference`) | Cleared at the next GC cycle; used in `WeakHashMap` and canonical maps. | "`WeakHashMap` entries are collected as soon as the key has no strong referents, preventing listener-map leaks." |
| Phantom reference (`PhantomReference`) | Enqueued after the referent is finalized but before memory is reclaimed; used for post-mortem cleanup. | "NIO's `DirectByteBuffer` cleaner uses a phantom reference to free off-heap memory deterministically." |
| Mark-and-sweep | Two-phase algorithm: mark all reachable objects, then sweep (reclaim) unmarked objects; leaves heap fragmented. | "Mark-and-sweep is conceptually simple but fragmentation forces expensive compaction or wastes memory." |
| Mark-compact | Extension of mark-and-sweep that slides live objects to one end of the heap, eliminating fragmentation. | "CMS's concurrent mark phase is followed by a stop-the-world remark and compact step in some configurations." |
| Copying collection | Divides space into two halves; copies live objects to the other half, implicitly reclaiming the old half. | "Young-gen collection in HotSpot uses copying: live objects are copied from Eden/Survivor to the other Survivor or old gen." |
| Minor GC | Collects only the young generation; typically fast (< 10 ms) because most objects are dead. | "High minor GC frequency often means object allocation rate is too high or Survivor spaces are too small." |
| Major GC | Collects the old generation; often triggers a Full GC in some collectors. | "A major GC pause of several seconds is usually what triggers SLA breaches in latency-sensitive services." |
| Full GC | Collects young gen + old gen + Metaspace; always stop-the-world in most collectors. | "Calling `System.gc()` requests (but does not guarantee) a Full GC — avoid it in production code." |
| Stop-the-World (STW) pause | All application threads are halted while the GC performs certain phases; main source of latency spikes. | "G1GC's concurrent marking reduces STW pauses compared to Serial and Parallel GC, but evacuation pauses are still STW." |
| Generational hypothesis | Empirical observation that most objects die young; justifies the generational heap layout. | "The generational hypothesis is why young-gen collection is so effective: collecting a small, mostly-dead space is cheap." |

### Garbage Collection — G1GC

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| G1GC (Garbage-First) | Default GC since Java 9; divides heap into equal-sized regions and prioritizes collecting regions with the most garbage first. | "G1GC was designed to provide predictable pause times for heaps of 6 GB or larger." |
| Region | Fixed-size heap chunk (1–32 MB, power of two); dynamically assigned as Eden, Survivor, Old, or Humongous. | "Unlike traditional GC, G1 has no fixed Eden boundary — it can expand or shrink the number of Eden regions per cycle." |
| Humongous region | One or more contiguous regions used for objects larger than 50% of a region size; allocated directly in old gen. | "Excessive humongous allocations bypass the young gen and can trigger premature Full GCs — prefer pooling large arrays." |
| Remembered set (RSet) | Per-region card table tracking references into a region from other regions; lets G1 collect a region without scanning the whole heap. | "A large remembered set for a region signals many cross-region references and increases collection overhead." |
| Concurrent marking | G1 marks live objects concurrently with application threads (initial mark is STW, subsequent marking is concurrent). | "Concurrent marking lets G1 estimate liveness of each region to prioritize the most garbage-dense regions." |
| Evacuation pause | STW phase where G1 copies live objects out of selected (Collection Set) regions to free them. | "An evacuation pause failure — when G1 cannot find enough free regions — causes a fallback Full GC." |
| Mixed GC | A G1 cycle that collects young regions plus a subset of old regions; triggered when old gen liveness drops below a threshold. | "Tuning `-XX:G1MixedGCCountTarget` controls how many mixed GC rounds are used to empty old regions." |

### Garbage Collection — Low-Latency Collectors

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| ZGC | Low-latency GC (Java 15+ production); performs all expensive work concurrently, targeting sub-millisecond pauses regardless of heap size. | "ZGC achieves < 1 ms pauses on a 1 TB heap by doing relocation concurrently using load barriers." |
| Shenandoah | Red Hat's low-latency GC (available OpenJDK 12+); concurrent compaction with Brooks pointers. | "Shenandoah is often preferred over ZGC in environments where you control OpenJDK builds and need predictable pauses." |
| Concurrent compaction | Moving live objects while application threads run; requires special barriers to handle object references that change under the application. | "ZGC's concurrent compaction is what eliminates the long STW compaction pauses seen in G1 evacuation failures." |
| Load barrier | Code inserted by the JIT at every object reference read; used by ZGC/Shenandoah to intercept stale pointers during concurrent relocation. | "Load barriers add a small overhead (typically < 5%) to every heap reference dereference." |
| Colored pointers (ZGC) | ZGC stores GC metadata (marked, remapped, finalizable) in unused high bits of the 64-bit pointer itself rather than in a separate card table. | "Colored pointers allow ZGC to perform multi-phase marking and relocation concurrently without a separate mark bitmap per object." |

### Garbage Collection — Tuning Flags

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| `-Xms` | Initial heap size; set equal to `-Xmx` in production to avoid resize pauses. | "`-Xms2g -Xmx2g` gives the JVM a fixed 2 GB heap and eliminates heap-resize overhead." |
| `-Xmx` | Maximum heap size. | "Setting `-Xmx` too close to available RAM risks OS swapping, which is far worse than a GC pause." |
| `-Xmn` | Young generation size (not supported by G1; use `-XX:NewRatio` or `-XX:G1NewSizePercent` instead). | "`-Xmn512m` reserves 512 MB for young gen in Parallel GC, reducing promotion pressure." |
| `-XX:+UseG1GC` | Enables the G1 garbage collector (default in Java 9+). | "Explicitly passing `-XX:+UseG1GC` is good practice for documentation even when it's the default." |
| `-XX:MaxGCPauseMillis` | Soft pause-time goal for G1; G1 adjusts the collection set size to try to meet it. | "Setting `-XX:MaxGCPauseMillis=100` tells G1 to target 100 ms pauses, though it's not a hard guarantee." |
| `-XX:G1HeapRegionSize` | Overrides the auto-computed G1 region size (1–32 MB). | "For workloads creating many 2–4 MB objects, set `-XX:G1HeapRegionSize=8m` to avoid excessive humongous allocations." |

### JIT Compilation

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| Interpreter | The JVM's initial execution mode; bytecode is decoded and executed one instruction at a time — correct but slow. | "The interpreter kicks in at startup before the JIT has identified hot methods." |
| C1 (client) compiler | First-level JIT; fast compilation with lightweight optimizations; produces quickly-compiled but less-optimized native code. | "C1-compiled code runs roughly 5× faster than interpreted code with only a brief compilation pause." |
| C2 (server) compiler | Second-level JIT; slow, aggressive optimization (escape analysis, inlining, loop unrolling); produces the fastest native code. | "C2-compiled methods can run 10–100× faster than the interpreter at the cost of longer compilation time." |
| Tiered compilation | JVM automatically promotes a method through: Interpreted → C1 (level 1–3) → C2 (level 4); enabled by default since Java 8. | "Tiered compilation gives you fast startup (C1) and peak throughput (C2) without manual flags." |
| Hotspot detection | JVM counts invocations (method entry counter) and loop back-edges; when thresholds are exceeded, the method is queued for JIT. | "A method invoked 10,000 times triggers C2 compilation by default (`-XX:CompileThreshold=10000`)." |
| Compilation threshold | Default 10,000 invocations (with tiered compilation the effective threshold is lower); configurable via `-XX:CompileThreshold`. | "Reducing `-XX:CompileThreshold` speeds up JIT warm-up in benchmarks but can hurt throughput in short-lived processes." |
| Inlining | JIT replaces a method call with a copy of the callee's body at the call site; eliminates call overhead and enables further optimizations. | "Inlining is the most impactful JIT optimization — it allows the compiler to see across method boundaries." |
| Escape analysis | JIT determines whether an object's reference can escape the current method/thread; if not, heap allocation may be avoided. | "If escape analysis proves a `StringBuilder` only exists within one method, the JIT can allocate it on the stack instead of the heap." |
| Scalar replacement | Optimization enabled by escape analysis: non-escaping objects are decomposed into individual primitive fields, eliminating the object header overhead entirely. | "Scalar replacement turns `new Point(x, y)` into two local `int` variables when the Point never escapes." |
| Loop unrolling | JIT replicates loop body multiple times per iteration to reduce loop-overhead instructions (branch checks, counter updates). | "Loop unrolling is especially effective for tight numeric loops, enabling the CPU to pipeline more work per cycle." |
| Dead code elimination | JIT removes branches or statements it can prove are never reached. | "A method guarded by `if (false)` will have its body entirely eliminated by the JIT." |
| On-stack replacement (OSR) | JIT replaces an executing (interpreted) method mid-execution while it is running a long loop, substituting optimized compiled code. | "OSR allows a long-running loop to benefit from JIT optimization without waiting for the method to return." |
| Deoptimization | JIT reverts compiled code back to interpreter when an assumption (e.g., monomorphic call site) is violated. | "Adding a second subclass to a previously monomorphic call site triggers deoptimization of all callers that inlined the first type." |
| Method handle | A typed, directly executable reference to a method, constructor, or field accessor; used by `invokedynamic` (lambdas, string concat). | "The JIT can intrinsify method handles and compile them as efficiently as direct calls." |

### String Pool & Interning

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| String constant pool | JVM-managed table of unique `String` objects; string literals are automatically interned; stored in the heap since Java 7 (was PermGen in Java 6 and earlier). | "Moving the string pool to the heap in Java 7 allows it to be GC'd, fixing the PermGen string-leak problem." |
| `String.intern()` | Returns the canonical pool instance for the string's content; subsequent `intern()` calls for equal content return the same reference. | "Using `intern()` on millions of strings can reduce memory by deduplication but risks pool contention under high concurrency." |
| String deduplication | G1GC feature (`-XX:+UseStringDeduplication`) that identifies char arrays with identical content on the heap and replaces duplicates with a single shared array. | "String deduplication is transparent to application code — you don't need to call `intern()` — but only works with G1GC." |

### Memory Leaks & Diagnostics

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| Static collection leak | A static field holding a growing collection (e.g., `static List<byte[]> cache`) is a GC root and keeps all entries alive for the JVM's lifetime. | "An unbounded static cache is the most common Java memory leak pattern found in production postmortems." |
| Listener leak | Registering an object as a listener/observer without deregistering it keeps the listener alive through the event source's reference. | "Swing components holding references to application models via listeners are classic listener leak sources." |
| ThreadLocal leak | A `ThreadLocal` value stored in a thread's `ThreadLocalMap` survives as long as the thread lives; in thread pools, threads never die. | "Always call `threadLocal.remove()` in a `finally` block when using `ThreadLocal` with pooled threads." |
| ClassLoader leak | A custom ClassLoader retains references to all classes it loaded and their static fields; failing to dereference the loader prevents class unloading. | "Each hot-redeploy in a web container that leaks the old ClassLoader increases Metaspace usage until the server OOMs." |
| `jps` | Lists JVM processes with their PIDs; the starting point for any JVM diagnostics session. | "Run `jps -l` to see fully-qualified main class names alongside PIDs." |
| `jstack` | Captures a thread dump (all thread states and stack traces) for a running JVM process. | "`jstack <pid>` is the first tool to reach for when diagnosing a deadlock or high CPU spike." |
| `jmap` | Generates heap dumps or prints heap statistics for a running JVM. | "`jmap -dump:format=b,file=heap.hprof <pid>` captures a binary heap dump for analysis in VisualVM or MAT." |
| `jstat` | Monitors JVM statistics (GC frequency, heap utilization, class loading) at a polling interval. | "`jstat -gcutil <pid> 1000` prints GC statistics every second — useful for spotting rapid old-gen growth." |
| `jconsole` | GUI monitoring tool bundled with the JDK; connects to a JVM via JMX and shows live heap, threads, and MBeans. | "`jconsole` is useful for quick dashboards but `VisualVM` and async-profiler are preferred for deeper analysis." |
| VisualVM | Standalone profiling tool (formerly bundled with JDK); supports heap dump analysis, CPU/memory profiling, and GC visualization. | "Open a `.hprof` heap dump in VisualVM to find the dominator objects responsible for a memory leak." |
| async-profiler | Low-overhead sampling profiler that captures CPU, allocation, and lock profiles using Linux `perf_events`; no safepoint bias. | "async-profiler's allocation profiling identifies which call sites are responsible for object churn driving GC." |
| Heap dump | Binary snapshot of the entire JVM heap at a point in time; analyzed offline with MAT or VisualVM. | "Set `-XX:+HeapDumpOnOutOfMemoryError` so the JVM automatically writes a heap dump when it crashes with OOM." |
| Thread dump | Text snapshot of all thread states and stack traces; essential for deadlock and liveness analysis. | "Three thread dumps taken 5 seconds apart reveal whether threads are truly deadlocked or merely slow." |
| `-verbose:gc` | Enables basic GC logging to stderr. | "`-verbose:gc` is the quickest way to confirm GC activity without configuring a log file." |
| `-XX:+PrintGCDetails` | Extends GC log with per-generation sizes before and after each collection (deprecated in Java 9+; use `-Xlog:gc*` instead). | "In Java 8, `-XX:+PrintGCDetails -XX:+PrintGCDateStamps` gives timestamped GC logs suitable for offline analysis." |
| `-XX:+HeapDumpOnOutOfMemoryError` | Instructs the JVM to write a heap dump to disk when an `OutOfMemoryError` is thrown. | "Always set this flag in production; the dump is your only forensic evidence after an OOM crash." |

### Common JVM Errors

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| `OutOfMemoryError: Java heap space` | JVM cannot allocate a new object because no heap region is large enough, even after a Full GC. | "Increase `-Xmx` or fix the memory leak — if the old gen is consistently > 80% after Full GC, the heap is genuinely undersized." |
| `OutOfMemoryError: Metaspace` | Native memory for class metadata is exhausted; typically caused by a classloader leak generating new classes endlessly. | "Dynamic bytecode frameworks (reflection proxies, CGLIB, Groovy scripts) can fill Metaspace if generated classes are not cached." |
| `OutOfMemoryError: GC overhead limit exceeded` | JVM spent more than 98% of CPU time in GC but reclaimed less than 2% of heap; effectively a liveness guarantee violation. | "This error often precedes a full heap space OOM — treat it as a signal to profile allocation and fix leaks." |
| `StackOverflowError` | Thread's JVM stack depth exceeded its limit (default 512 KB–1 MB); caused by deep or infinite recursion. | "A mutually recursive `equals()` or `toString()` override on a circular object graph is a classic `StackOverflowError` source." |

## Key rules / gotchas

- **Parent delegation is security-critical:** Without it, a malicious JAR could shadow `java.lang.String`. Custom classloaders that break delegation (like some hot-reload frameworks) require explicit security consideration.
- **Metaspace is unlimited by default:** Unlike PermGen, Metaspace has no fixed ceiling unless you set `-XX:MaxMetaspaceSize`. A classloader leak will silently consume native memory until the OS kills the process.
- **`System.gc()` is a hint, not a command:** The JVM may ignore it. Never rely on it in production code. Use it only in controlled benchmarks or tests — and always note that it may trigger a Full GC, halting all threads.
- **Escape analysis can be fooled:** Passing an object to a method that the JIT cannot inline prevents stack allocation, even if the object never truly escapes. Keep performance-critical value-like objects small and contained.
- **Soft references are cleared lazily:** The GC clears `SoftReference`s "before" OOM, but "before" can mean "very close to" — your cache may still get cleared during a GC pause that precedes OOM. Never use soft references for critical data.
- **`WeakHashMap` keys are the referents, not the values:** Values in a `WeakHashMap` can still prevent GC if values hold strong references back to keys (circular reference), defeating the purpose of the weak map.
- **G1 pause targets are soft goals:** `-XX:MaxGCPauseMillis` is G1's target, not a hard real-time guarantee. Evacuation failures can still cause longer STW pauses. Use ZGC or Shenandoah for hard latency requirements.
- **TLAB exhaustion causes contention:** When a thread's Thread-Local Allocation Buffer (TLAB) is full, it must synchronize to request a new one. Excessive TLAB refills show up as allocation stalls in async-profiler.
- **`StackOverflowError` is recoverable (barely):** Unlike most `Error`s it can be caught, but the stack is still nearly full at the catch site — attempting significant work in the handler is dangerous.
- **Deoptimization cascades:** A class hierarchy change (e.g., adding a new subtype at runtime via reflection or class loading) can trigger mass deoptimization of previously JIT-compiled call sites, causing a temporary performance cliff.

## Code example

```java
import java.lang.ref.WeakReference;

public class JavaLabRunner {

    public static void main(String[] args) throws InterruptedException {
        // ── 1. Runtime memory inspection ─────────────────────────────────
        Runtime rt = Runtime.getRuntime();
        long maxHeap   = rt.maxMemory();      // -Xmx value
        long totalHeap = rt.totalMemory();    // currently committed heap
        long freeHeap  = rt.freeMemory();     // free within committed heap
        long usedHeap  = totalHeap - freeHeap;

        System.out.printf("Max heap   : %,d bytes (%.1f MB)%n", maxHeap,   mb(maxHeap));
        System.out.printf("Committed  : %,d bytes (%.1f MB)%n", totalHeap, mb(totalHeap));
        System.out.printf("Used       : %,d bytes (%.1f MB)%n", usedHeap,  mb(usedHeap));
        System.out.printf("Free       : %,d bytes (%.1f MB)%n", freeHeap,  mb(freeHeap));
        System.out.printf("CPU cores  : %d%n%n", rt.availableProcessors());

        // ── 2. ClassLoader hierarchy traversal ───────────────────────────
        System.out.println("=== ClassLoader hierarchy ===");
        ClassLoader loader = JavaLabRunner.class.getClassLoader();
        while (loader != null) {
            System.out.println("  " + loader.getClass().getName() + " → " + loader);
            loader = loader.getParent();
        }
        // Parent of Application ClassLoader is Platform (or Bootstrap), which is null
        System.out.println("  [Bootstrap ClassLoader — native, no Java object]");
        System.out.println();

        // ── 3. WeakReference behavior ─────────────────────────────────────
        System.out.println("=== WeakReference demo ===");
        Object strongRef = new Object();                      // strong reference
        WeakReference<Object> weakRef = new WeakReference<>(strongRef);

        System.out.println("Before nulling strong ref: weakRef.get() = " + weakRef.get());

        strongRef = null;   // remove the only strong reference
        // Hint GC — NOTE: System.gc() is advisory only; never use in prod
        System.gc();
        Thread.sleep(100);  // give GC a moment (not reliable in all JVMs)

        Object afterGc = weakRef.get();
        System.out.println("After GC hint            : weakRef.get() = " + afterGc);
        // Expected: null — the GC is free to collect it now
        System.out.println();

        // ── 4. String interning and pool comparison ───────────────────────
        System.out.println("=== String pool / intern demo ===");
        String a = "hello";                      // goes to string constant pool
        String b = "hello";                      // same pool entry
        String c = new String("hello");          // new heap object, NOT pooled
        String d = c.intern();                   // returns the pooled "hello"

        System.out.println("a == b            : " + (a == b));       // true  — same pool object
        System.out.println("a == c            : " + (a == c));       // false — c is on heap
        System.out.println("a == d            : " + (a == d));       // true  — d is the pool object
        System.out.println("a.equals(c)       : " + a.equals(c));    // true  — content equal
        System.out.println();

        // ── 5. Trigger GC + re-check memory (with caveat) ─────────────────
        System.out.println("=== Memory after allocating & GC hinting ===");
        // Allocate some garbage
        for (int i = 0; i < 100_000; i++) {
            @SuppressWarnings("unused")
            byte[] trash = new byte[1024]; // immediately unreachable after each iteration
        }

        long beforeGc = rt.totalMemory() - rt.freeMemory();
        System.gc(); // ADVISORY — JVM may ignore this; never rely on it in production
        Thread.sleep(100);
        long afterGcMem = rt.totalMemory() - rt.freeMemory();

        System.out.printf("Used before GC hint: %.1f MB%n", mb(beforeGc));
        System.out.printf("Used after  GC hint: %.1f MB%n", mb(afterGcMem));
        System.out.println("(Results are JVM-dependent; System.gc() is not guaranteed to run)");
    }

    private static double mb(long bytes) {
        return bytes / (1024.0 * 1024.0);
    }
}
```

## Interview questions you should be able to answer

- **Q:** Why does the JVM use parent delegation in the ClassLoader hierarchy, and what problem does it solve?
  > Parent delegation ensures that a class is always loaded by the highest-level ClassLoader willing to handle it, typically Bootstrap. This prevents malicious or accidental replacement of core JDK classes (e.g., a rogue `java.lang.String` on the classpath could not override the Bootstrap-loaded one). It also guarantees that `instanceof` and cast checks work correctly — two classes with the same name loaded by different ClassLoaders are distinct types in the JVM, which would break type safety if core classes were duplicated.

- **Q:** How does G1GC's region-based layout differ from the classic generational heap, and why does this matter for pause times?
  > Classic generational collectors (Parallel GC, old CMS) divide the heap into fixed contiguous zones (Eden, two Survivors, Old). G1 splits the entire heap into many equal-sized regions (1–32 MB) that are dynamically assigned roles. This means G1 can select a **Collection Set** of only the most garbage-dense regions to collect in each pause, bounding pause duration regardless of total heap size. In contrast, a Full GC on a traditional collector must process the entire old-gen contiguously, making pause time proportional to heap size.

- **Q:** What is escape analysis, and how can it eliminate heap allocation for a Java object?
  > Escape analysis is a JIT optimization that determines whether an object's reference can leave ("escape") the scope of the method where it is created — either by being stored in a field, returned, or passed to a method the JIT cannot inline. If the object does not escape, the JIT can apply **scalar replacement**: it decomposes the object into its constituent primitive fields and keeps them as local variables (in registers or on the stack), never allocating a heap object at all. This eliminates GC pressure and object header overhead entirely for short-lived value-like objects such as iterators, `Optional`, and small DTOs.

- **Q:** Why did Java 8 replace PermGen with Metaspace, and what are the practical implications?
  > PermGen was a fixed-size JVM-managed heap region for class metadata, notoriously prone to `OutOfMemoryError: PermGen space` when applications loaded many classes (dynamic proxies, JSP compilation, CGLIB). Metaspace uses native OS memory instead, has no fixed upper bound by default, and is subject to the OS's virtual memory limits rather than an arbitrary JVM setting. The practical implication is that Metaspace leaks (classloader leaks) do not crash with an obvious OOM immediately — instead they silently consume native memory until the JVM process is killed by the OS. You must set `-XX:MaxMetaspaceSize` in production to get a predictable failure mode, and monitor native memory alongside heap.

- **Q:** How would you diagnose a memory leak in a production JVM without restarting it?
  > Start with `jstat -gcutil <pid> 5000` to confirm old-gen is growing over time without being reclaimed by Full GCs. Then take a heap dump with `jmap -dump:format=b,file=heap.hprof <pid>` (or pre-configure `-XX:+HeapDumpOnOutOfMemoryError`). Analyze the dump in Eclipse MAT or VisualVM: use the "Leak Suspects" report and dominator tree to identify which object graph is retaining the most memory. Check for static collections, unbounded caches, undrained queues, and ThreadLocal values in pooled threads. If the leak is in Metaspace rather than heap, use `jcmd <pid> VM.native_memory` (with `-XX:NativeMemoryTracking=summary`) to see classloader-allocated native memory growth, and check which ClassLoaders are accumulating loaded class counts with `jstat -class`.

- **Q:** What is the difference between a minor GC and a Full GC, and when does each occur?
  > A **minor GC** collects only the young generation (Eden + Survivor spaces). It is triggered when Eden fills up. Because most objects are short-lived (generational hypothesis), nearly all of Eden is garbage, making minor GC fast — typically under 10 ms. A **Full GC** collects young gen, old gen, and Metaspace together and always involves a stop-the-world compaction phase. It is triggered when old gen fills (promotion failure), when Metaspace fills, when the GC overhead limit is exceeded, or when `System.gc()` is called. Full GC pauses can range from hundreds of milliseconds to many seconds depending on heap size and live object count. The goal of GC tuning is to minimize Full GC frequency and duration while keeping minor GC pauses acceptable.

## Further reading

- [JVM Specification — Chapter 2: The Structure of the Java Virtual Machine](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html)
- [HotSpot Virtual Machine Garbage Collection Tuning Guide (Java 21)](https://docs.oracle.com/en/java/docs/books/performance/GarbageCollectionTuning.pdf)
- [G1GC Garbage First Garbage Collector — Oracle official doc](https://www.oracle.com/technical-resources/articles/java/g1gc.html)
- [ZGC — The Z Garbage Collector (OpenJDK wiki)](https://wiki.openjdk.org/display/zgc)
- [async-profiler — GitHub](https://github.com/async-profiler/async-profiler)
- [Eclipse Memory Analyzer (MAT)](https://eclipse.dev/mat/)
- [Aleksey Shipilëv's JVM anatomy quarks (deep JIT & GC internals)](https://shipilev.net/jvm/anatomy-quarks/)
- [Java Performance: The Definitive Guide — Scott Oaks (O'Reilly)](https://www.oreilly.com/library/view/java-performance-the/9781492056102/)
