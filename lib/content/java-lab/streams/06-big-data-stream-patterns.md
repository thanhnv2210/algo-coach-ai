# Big-Data Stream Patterns

Senior Java engineers treat the Stream API as a lazy computation graph, not a loop replacement.
This lesson covers five patterns that separate correct-but-slow code from production-grade pipelines.

---

## Pattern 1 — Double Collect: Collect Then Stream Again

### Mistake

```java
// Mistake: two materialisations for no reason
List<String> step1 = names.stream()
        .map(String::toUpperCase)
        .collect(Collectors.toList());   // first List allocated on heap

List<String> result = step1.stream()    // re-wraps the List into a new Stream
        .filter(s -> s.startsWith("A"))
        .collect(Collectors.toList());   // second List allocated on heap
```

**What goes wrong:**
- Two `ArrayList` objects live on the heap simultaneously.
- The JVM GC must collect `step1` after `result` is built — unnecessary promotion pressure in a generational GC.
- For large datasets this doubles peak memory: if `step1` is 500 MB, you briefly hold ~1 GB.
- The intermediate `collect` forces eager evaluation, killing lazy fusion — the JVM cannot eliminate the intermediate objects even with escape analysis.

### Best Practice

```java
// Best: single pipeline, one materialisation
List<String> result = names.stream()
        .map(String::toUpperCase)
        .filter(s -> s.startsWith("A"))  // fused with map — zero intermediate List
        .collect(Collectors.toList());
```

**Why it wins:**
The Stream engine fuses `map` + `filter` into a single pass over the source.
One `ArrayList` is allocated, sized, and populated in one traversal.
The GC only sees the final result — no short-lived survivor objects.

**Decision rule:** Never call `.collect()` in the middle of a pipeline unless you genuinely need a reusable snapshot or a random-access structure for a downstream algorithm.

---

## Pattern 2 — flatMap vs addAll Loop

### Mistake

```java
// Mistake: imperative loop — correct but blocks lazy composition
List<List<String>> groups = List.of(
        List.of("Alice", "Bob"),
        List.of("Carol"),
        List.of("Dave", "Eve", "Frank")
);

List<String> flat = new ArrayList<>();
for (List<String> inner : groups) {
    flat.addAll(inner);                  // eager — inner is fully consumed before next iteration
}
// flat.stream().filter(...) — too late to fuse with the flattening step
```

**What goes wrong:**
- `addAll` is eager: every inner list is fully materialised into `flat` before any filtering starts.
- You cannot chain lazy operations (e.g., `filter`, `limit`) before the full structure is built.
- The imperative style breaks composability — you cannot pass this logic as a `Function` reference.

### Best Practice

```java
// Best: flatMap — lazy, composable, no intermediate list
List<String> flat = groups.stream()
        .flatMap(Collection::stream)     // 1-to-N: each inner List becomes stream elements
        .filter(name -> name.length() > 3)
        .collect(Collectors.toList());
```

**map vs flatMap — the core distinction:**

| Operation | Cardinality | Output type for `Stream<List<String>>` |
|-----------|-------------|----------------------------------------|
| `.map(Collection::stream)` | 1-to-1 | `Stream<Stream<String>>` — nested! |
| `.flatMap(Collection::stream)` | 1-to-N | `Stream<String>` — one level flattened |

`map` wraps each element in the function's return type.
`flatMap` applies the function and then *flattens one level* of nesting — it is `map` + `flatten` in a single step.

**Decision rule:** Reach for `flatMap` whenever your mapping function returns a `Collection` or `Stream` and you want to operate on the individual elements downstream.

---

## Pattern 3 — Parallel Stream on Small or IO-Bound Data

### Mistake

```java
// Mistake: parallel overhead on a tiny list
List<Integer> tenItems = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

int sum = tenItems.parallelStream()
        .mapToInt(Integer::intValue)
        .sum();
// ForkJoinPool.commonPool splits, queues tasks, synchronises — for 10 elements
// the coordination cost is orders of magnitude larger than the computation
```

**What goes wrong:**
- `parallelStream()` submits tasks to `ForkJoinPool.commonPool` (shared across the JVM).
- Task splitting, work-stealing, and result merging all have fixed overhead (~microseconds per task).
- For 10 elements the overhead far exceeds the nanosecond-level additions.
- **Shared-pool risk:** `commonPool` is shared with every other `parallelStream()` call in the JVM (including library code). A blocking task (e.g., HTTP call, file read) inside a lambda will occupy a pool thread, starving all other parallel streams until the thread returns — potentially cascading into throughput collapse.

### Best Practice

```java
// Best: sequential for small / IO-bound data
int sum = tenItems.stream()
        .mapToInt(Integer::intValue)
        .sum();

// Best: parallel only when the workload justifies it
List<Integer> millionItems = generateLargeList(); // >10 000 CPU-bound elements
int bigSum = millionItems.parallelStream()
        .filter(n -> n % 2 == 0)                 // stateless predicate — safe to parallelise
        .mapToInt(Integer::intValue)
        .sum();
```

**When parallel stream earns its keep — all three must be true:**
1. Dataset is large (>10 000 elements is a rough heuristic; benchmark your actual case).
2. Work per element is CPU-bound (pure computation, no blocking I/O).
3. All lambdas are stateless and side-effect-free.

**Decision rule:** Default to sequential; switch to parallel only after profiling shows the sequential stream is the bottleneck, and only when all three conditions above are met.

---

## Pattern 4 — Stateful Lambda in Parallel Stream (Data Race)

### Mistake

```java
// Mistake: shared mutable state in a parallel stream — data race
List<String> shared = new ArrayList<>();

names.parallelStream()
        .filter(s -> s.length() > 3)
        .forEach(shared::add);           // ArrayList is NOT thread-safe
// Result: ConcurrentModificationException, silent data loss, or corrupted size field
// The bug is non-deterministic — may pass in test, blow up in production under load
```

**What goes wrong:**
- `ArrayList.add` is not atomic: it checks capacity, increments size, and writes the element — three separate memory operations.
- Two threads executing simultaneously can write to the same index, skip an index, or corrupt `elementData`.
- The race is non-deterministic: small lists may appear correct in low-thread tests but corrupt under production load.

### Best Practice

```java
// Best: let Collectors handle thread-safe accumulation
List<String> safeResult = names.parallelStream()
        .filter(s -> s.length() > 3)
        .collect(Collectors.toList());   // Collectors uses a combiner — thread-safe by design

// Best for grouping in parallel: groupingByConcurrent (uses ConcurrentHashMap internally)
Map<Integer, List<String>> byLength = names.parallelStream()
        .collect(Collectors.groupingByConcurrent(String::length));
// groupingBy (non-concurrent) would merge partial maps sequentially — slower
// groupingByConcurrent allows concurrent insertion — true parallel accumulation
```

**Why Collectors are safe:**
`Collectors.toList()` uses a supplier, accumulator, and combiner triple.
In parallel mode the stream splits into sub-streams, each builds its own partial list, and the combiner merges them — no shared mutable state during accumulation.

**Decision rule:** Never write to a shared mutable collection inside a parallel stream lambda; always use a terminal `collect` with the appropriate `Collector`.

---

## Pattern 5 — Files.lines() Lazy vs Loading the Entire File

### Mistake

```java
// Mistake: entire file loaded into heap
// (shown conceptually — not runnable without file I/O)
// List<String> lines = Files.readAllLines(Path.of("server.log"));
// lines.stream()
//      .filter(l -> l.contains("ERROR"))
//      .forEach(System.out::println);
//
// For a 4 GB log file this allocates a 4 GB List<String> before a single line is processed.
// OutOfMemoryError is likely on any heap < file size.
```

**What goes wrong:**
- `Files.readAllLines` reads every byte into memory before returning.
- Peak memory = full file size + overhead for the `ArrayList<String>` and `String` objects.
- GC pressure is enormous: millions of short-lived `String` objects are created and then discarded after filtering.

### Best Practice

```java
// Best: Files.lines() is a lazy Stream — lines are read on demand
// try-with-resources is MANDATORY — Files.lines opens a file handle that MUST be closed
//
// try (Stream<String> lines = Files.lines(Path.of("server.log"))) {
//     lines.filter(l -> l.contains("ERROR"))
//          .limit(100)
//          .forEach(System.out::println);
// }  // file handle closed here — even if an exception is thrown
//
// Memory: O(1) — only the current line is in memory at any time.
// limit(100) stops reading after 100 matches — the file is never fully traversed.
```

**Why try-with-resources is critical:**
`Files.lines()` returns a `Stream` backed by a `BufferedReader` which holds an OS file descriptor.
If you do not close the stream, the file descriptor leaks until GC finalises the reader — which may never happen under memory pressure, eventually causing "Too many open files" errors.
`Stream` implements `AutoCloseable`, so try-with-resources is the idiomatic and safe pattern.

**Decision rule:** Use `Files.lines()` inside try-with-resources for any file larger than a few MB; reserve `Files.readAllLines()` only for small config files where you need random access by line index.

---

## Runnable Demo

```java
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import java.util.stream.Stream;

public class JavaLabRunner {

    public static void main(String[] args) {
        doubleCollectDemo();
        flatMapDemo();
        parallelSmallDataDemo();
        statefulLambdaDemo();
        lazyFileSimulationDemo();
    }

    // Pattern 1 — compose in a single pipeline
    static void doubleCollectDemo() {
        System.out.println("=== Pattern 1: Single pipeline vs double collect ===");
        List<String> names = List.of("Alice", "Bob", "Anna", "Carol", "Aaron");

        // Mistake style (two collects)
        List<String> upper = names.stream()
                .map(String::toUpperCase)
                .collect(Collectors.toList());
        List<String> badResult = upper.stream()
                .filter(s -> s.startsWith("A"))
                .collect(Collectors.toList());

        // Best style (one pipeline)
        List<String> goodResult = names.stream()
                .map(String::toUpperCase)
                .filter(s -> s.startsWith("A"))
                .collect(Collectors.toList());

        System.out.println("Double-collect result : " + badResult);
        System.out.println("Single-pipeline result: " + goodResult);
        System.out.println("Results equal: " + badResult.equals(goodResult));
        System.out.println();
    }

    // Pattern 2 — flatMap vs addAll loop
    static void flatMapDemo() {
        System.out.println("=== Pattern 2: flatMap vs addAll loop ===");
        List<List<String>> groups = List.of(
                List.of("Alice", "Bob"),
                List.of("Carol"),
                List.of("Dave", "Eve", "Frank")
        );

        // Mistake style
        List<String> loopFlat = new ArrayList<>();
        for (List<String> inner : groups) {
            loopFlat.addAll(inner);
        }

        // Best style
        List<String> streamFlat = groups.stream()
                .flatMap(Collection::stream)
                .collect(Collectors.toList());

        System.out.println("Loop addAll : " + loopFlat);
        System.out.println("flatMap     : " + streamFlat);

        // map vs flatMap illustration
        List<Stream<String>> nested = groups.stream()
                .map(Collection::stream)         // Stream<Stream<String>> — NOT what we want
                .collect(Collectors.toList());
        System.out.println("map produces " + nested.size() + " Stream objects (nested)");
        System.out.println("flatMap produces " + streamFlat.size() + " String objects (flat)");
        System.out.println();
    }

    // Pattern 3 — parallel stream overhead on small data
    static void parallelSmallDataDemo() {
        System.out.println("=== Pattern 3: Sequential vs parallel on small data ===");
        List<Integer> small = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        long t0 = System.nanoTime();
        int seqSum = small.stream().mapToInt(Integer::intValue).sum();
        long seqNs = System.nanoTime() - t0;

        long t1 = System.nanoTime();
        int parSum = small.parallelStream().mapToInt(Integer::intValue).sum();
        long parNs = System.nanoTime() - t1;

        System.out.printf("Sequential sum=%d  time=%,d ns%n", seqSum, seqNs);
        System.out.printf("Parallel   sum=%d  time=%,d ns (note: parallel may be slower on 10 elements)%n", parSum, parNs);

        // Sensible parallel usage: large, CPU-bound, stateless
        int bigSum = IntStream.rangeClosed(1, 1_000_000)
                .parallel()
                .filter(n -> n % 2 == 0)
                .sum();
        System.out.println("Parallel sum of even numbers 1..1_000_000 = " + bigSum);
        System.out.println();
    }

    // Pattern 4 — stateful lambda in parallel stream
    static void statefulLambdaDemo() {
        System.out.println("=== Pattern 4: Stateful lambda — safe collect vs unsafe forEach ===");
        List<String> names = IntStream.rangeClosed(1, 20)
                .mapToObj(i -> "Name" + i)
                .collect(Collectors.toList());

        // Mistake style (race condition — running sequentially here so it appears to work,
        // but with parallelStream() and a real ArrayList this is undefined behaviour)
        List<String> unsafe = new ArrayList<>();
        names.stream()  // sequential here to avoid crashing the demo; in production parallelStream() would corrupt this
                .filter(s -> s.length() > 4)
                .forEach(unsafe::add);

        // Best style — Collectors is safe under parallelStream()
        List<String> safe = names.parallelStream()
                .filter(s -> s.length() > 4)
                .collect(Collectors.toList());

        System.out.println("Unsafe (sequential here, dangerous if parallel): " + unsafe.size() + " elements");
        System.out.println("Safe   (parallelStream + collect)               : " + safe.size() + " elements");

        // groupingByConcurrent for parallel grouping
        Map<Integer, List<String>> grouped = names.parallelStream()
                .collect(Collectors.groupingByConcurrent(String::length));
        System.out.println("groupingByConcurrent keys (lengths): " + grouped.keySet());
        System.out.println();
    }

    // Pattern 5 — lazy stream simulation (no real file I/O so it runs standalone)
    static void lazyFileSimulationDemo() {
        System.out.println("=== Pattern 5: Lazy stream processing (Files.lines simulation) ===");

        // Simulate a large log file as an in-memory stream
        // In production this would be: try (Stream<String> lines = Files.lines(path)) { ... }
        List<String> simulatedLog = IntStream.rangeClosed(1, 10_000)
                .mapToObj(i -> i % 100 == 0 ? "[ERROR] Problem at line " + i : "[INFO] OK at line " + i)
                .collect(Collectors.toList());

        System.out.println("Total simulated log lines: " + simulatedLog.size());

        // Mistake style: all lines already in memory — simulated by using the list directly
        long errorCountEager = simulatedLog.stream()
                .filter(l -> l.contains("ERROR"))
                .count();

        // Best style: lazy — using Stream directly, process line-by-line, stop early if needed
        // In real code: try (Stream<String> lines = Files.lines(path)) { ... }
        // Here we simulate with limit() to show early termination
        List<String> firstFiveErrors = simulatedLog.stream()  // lazy source
                .filter(l -> l.contains("ERROR"))
                .limit(5)                                       // stops reading after 5 matches
                .collect(Collectors.toList());

        System.out.println("Total ERROR lines: " + errorCountEager);
        System.out.println("First 5 errors (lazy, stops early): " + firstFiveErrors.size() + " lines");
        firstFiveErrors.forEach(System.out::println);

        System.out.println();
        System.out.println("Real-file pattern (not run here — requires a file):");
        System.out.println("  try (Stream<String> lines = Files.lines(Path.of(\"server.log\"))) {");
        System.out.println("      lines.filter(l -> l.contains(\"ERROR\"))");
        System.out.println("           .limit(100)");
        System.out.println("           .forEach(System.out::println);");
        System.out.println("  } // file handle closed automatically");
    }
}
```

---

## Interview Q&A

**Q: What is lazy evaluation in streams and what breaks it?**

A: Stream operations are lazy by default — intermediate operations (`map`, `filter`, `flatMap`, etc.) do not execute until a terminal operation (`collect`, `count`, `forEach`, `findFirst`, etc.) is invoked. The Stream builds a pipeline description; the actual iteration happens once, fused, when the terminal op is called. This enables short-circuiting (`limit`, `findFirst` stop early) and loop fusion (no intermediate collections). Laziness is broken by calling a terminal operation in the middle of what should be one pipeline — for example, calling `.collect()` to produce an intermediate `List` and then calling `.stream()` on it again. This forces eager evaluation at the collect point, materialises a heap object, and prevents the JVM from fusing the two halves of the pipeline.

---

**Q: When does parallel stream hurt performance instead of helping?**

A: Parallel stream hurts when the coordination overhead exceeds the computation savings. The main cases are: (1) small datasets — task splitting and work-stealing in `ForkJoinPool.commonPool` costs microseconds per task, which dominates nanosecond-level element processing; (2) IO-bound lambdas — blocking on network or disk ties up pool threads and starves other callers of `commonPool`, including library code; (3) stateful or ordered pipelines — maintaining encounter order in a parallel stream requires synchronisation barriers that eliminate most parallel gains; (4) heavily contended sources — data structures that do not split well (e.g., `LinkedList`) serialise the split phase. The rule of thumb: sequential by default, parallel only for large (>10k elements), CPU-bound, stateless, unordered workloads confirmed by profiling.

---

**Q: What is the difference between map and flatMap?**

A: `map` is a 1-to-1 transformation: it applies a function to each element and wraps the result, preserving the stream's element count and nesting. If the mapping function returns a `List`, you get a `Stream<List<T>>`. `flatMap` is 1-to-N: it applies a function that returns a `Stream` (or `Collection`) for each element, then *flattens one level of nesting*, merging all the inner streams into a single output stream. The element count grows (or shrinks if some inner streams are empty). Use `map` when each input produces exactly one output; use `flatMap` when each input can produce zero, one, or many outputs and you want to work with those outputs as individual elements.

---

**Q: Why is forEach on a parallel stream with a shared list dangerous?**

A: `ArrayList` is not thread-safe. Its `add` method performs three non-atomic steps: check and possibly grow the backing array, increment `size`, and write the element at `elementData[size-1]`. When two threads execute `add` concurrently, they can read the same `size` value, write to the same index (one value is lost), or corrupt `size` itself (final count is wrong). The result is silent data loss, an `ArrayIndexOutOfBoundsException`, or a `NullPointerElement` in the backing array — all non-deterministic and notoriously hard to reproduce in tests under low concurrency. The correct pattern is to use `collect(Collectors.toList())` as the terminal operation: the `Collector` framework gives each parallel sub-stream its own partial container and merges them safely after all threads complete, with no shared mutable state during accumulation.
