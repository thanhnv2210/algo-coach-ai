# Stream Pipeline & Lazy Evaluation

## Why this matters in interviews

Stream pipelines are one of the highest-signal Java topics at the senior level because they expose whether a candidate understands execution semantics, not just syntax. Interviewers use them to test your mental model of lazy evaluation, your ability to reason about performance trade-offs (stateless vs stateful ops, primitive streams, parallelism), and whether you know the sharp edges that cause subtle bugs in production. A candidate who can only chain `.filter().map().collect()` is not senior — one who can explain *when* the elements move through the pipeline, *why* a sorted stream is fundamentally more expensive than a filtered one, and *when not* to reach for parallel streams is.

## Concept

### Stream Pipeline Structure

Every stream pipeline has exactly three layers:

```
Source  →  [Intermediate ops ...]  →  Terminal op
  ↑               ↑                        ↑
Creates        Lazy: build a               Triggers
the stream     description only            all execution
```

| Layer | Examples | Executes immediately? |
|---|---|---|
| **Source** | `collection.stream()`, `Stream.of(...)`, `Files.lines(...)`, `IntStream.range(...)` | No (deferred) |
| **Intermediate** | `filter`, `map`, `flatMap`, `sorted`, `distinct`, `peek`, `limit`, `skip` | No (lazy) |
| **Terminal** | `collect`, `forEach`, `reduce`, `count`, `findFirst`, `anyMatch`, `toList` | Yes |

**Key insight:** calling `.filter().map()` on a stream does zero work. It only builds a *pipeline description*. The moment a terminal operation is called, the JVM pulls elements through the entire chain one by one (in most cases), not in stages.

### Lazy Evaluation — Element-by-Element Pull

Consider this pipeline:

```
numbers = [1, 2, 3, 4, 5]

.filter(n -> n % 2 == 0)   ← intermediate
.map(n -> n * n)            ← intermediate
.findFirst()                ← terminal (short-circuit)
```

Execution order is **not** "filter all, then map all." It is:

```
pull 1 → filter(1%2==0)? NO  → stop, pull next
pull 2 → filter(2%2==0)? YES → map(2*2) = 4 → findFirst satisfied → DONE
elements 3,4,5 are never touched
```

This is the heart of lazy evaluation: the terminal op *pulls* elements through the pipeline on demand. For a `collect()` terminal, it pulls until the source is exhausted. For short-circuit terminals like `findFirst` or `anyMatch`, it stops as soon as it has what it needs.

### Stateless vs Stateful Intermediate Operations

This distinction is critical for performance and parallelism:

| Category | Operations | Why it matters |
|---|---|---|
| **Stateless** | `filter`, `map`, `flatMap`, `peek`, `mapToInt` | Each element is processed independently. Safe in parallel, no buffering. |
| **Stateful** | `sorted`, `distinct`, `limit` (ordered), `skip` (ordered) | Must see *some or all* elements before producing output. Can buffer internally. |

A `sorted()` in the middle of a pipeline breaks the lazy element-by-element flow for everything upstream of it — it must consume and buffer all preceding elements before it can emit a single sorted one. This makes `sorted` an O(n log n) barrier with O(n) memory.

**Performance rule:** put `filter` and `limit` *before* `sorted` or `distinct` to reduce the number of elements the stateful op must process.

### Short-Circuit Operations

Short-circuit ops allow the pipeline to terminate before consuming the full source:

| Operation | Type | Short-circuits when... |
|---|---|---|
| `findFirst()` | Terminal | First match found |
| `findAny()` | Terminal | Any match found (better for parallel) |
| `anyMatch(pred)` | Terminal | First `true` from predicate |
| `allMatch(pred)` | Terminal | First `false` from predicate |
| `noneMatch(pred)` | Terminal | First `true` from predicate |
| `limit(n)` | Intermediate | After n elements pass through |

### Stream Cannot Be Reused

A stream is a single-use cursor. Once a terminal operation is invoked, the stream is *consumed*. Attempting to call another terminal operation on the same stream instance throws `IllegalStateException: stream has already been operated upon or closed`. Always obtain a fresh stream from the source.

### Primitive Streams — Avoid Boxing Overhead

`Stream<Integer>` boxes each `int` into an `Integer` object. For numeric-heavy pipelines, use the specialized primitive variants:

| Type | Factory | Useful terminal ops |
|---|---|---|
| `IntStream` | `IntStream.of(...)`, `IntStream.range(a,b)`, `IntStream.rangeClosed(a,b)`, `stream.mapToInt(...)` | `sum()`, `average()`, `min()`, `max()`, `summaryStatistics()` |
| `LongStream` | `LongStream.of(...)`, `stream.mapToLong(...)` | same as above |
| `DoubleStream` | `DoubleStream.of(...)`, `stream.mapToDouble(...)` | same as above |

Bridging back: `.boxed()` converts `IntStream` → `Stream<Integer>`. `.mapToObj(...)` lets you go from primitive stream to object stream.

### Parallel Streams — When to Use and Pitfalls

`collection.parallelStream()` or `stream.parallel()` splits work across the common `ForkJoinPool` (sized to CPU cores by default).

**Use parallel when:**
- Large data set (> ~10k elements, though benchmark first)
- Computationally expensive per-element operation
- No shared mutable state
- Result ordering does not matter (or use `forEachOrdered` if it does)

**Pitfalls:**

| Pitfall | Consequence |
|---|---|
| Shared mutable state (e.g., mutating a list inside `forEach`) | Data races, incorrect results, no exception thrown |
| `sorted()` or `distinct()` in parallel | Forces a merge step; often slower than sequential |
| Small collections | Thread coordination overhead exceeds gains |
| `findFirst()` in parallel | Correct but forces ordering guarantee — use `findAny()` instead |
| Custom `ForkJoinPool` not used | All parallel streams share the common pool; one slow task starves others |

To isolate parallel stream work in a custom pool:
```java
ForkJoinPool pool = new ForkJoinPool(4);
pool.submit(() -> list.parallelStream().map(...).collect(...)).get();
```

### `peek()` — Debug, Not Logic

`peek()` is an intermediate op that lets you observe elements without transforming them. It is intended for debugging only. Never put side-effectful business logic in `peek()` — because of lazy evaluation, `peek()` is called only when a downstream op pulls an element. With short-circuit terminals, some elements may never be peeked. With parallel streams, order is non-deterministic.

## Key rules / gotchas

- **Laziness means no work until terminal:** if you forget the terminal op, the pipeline silently does nothing — no warning, no exception.
- **Reusing a stream throws at runtime:** the `IllegalStateException` only fires when the second terminal is invoked, which may be in a completely different method if the stream was passed as a parameter.
- **`sorted()` buffers everything:** a stream that would otherwise be O(1) memory becomes O(n) the moment you insert `sorted()`.
- **`distinct()` uses a `HashSet` internally:** elements must have correct `equals`/`hashCode` or `distinct()` will not deduplicate correctly.
- **`parallel()` on ordered sources can serialize:** `List` has encounter order; parallel operations that must respect order (e.g., `forEachOrdered`, `findFirst`) may perform no better than sequential.
- **`flatMap` is always eager in Java 8–10:** each nested stream is fully consumed before the next element is processed. This changed partially in later versions, but do not assume lazy `flatMap` in all JVM versions.
- **`Stream.of(array)` vs `Arrays.stream(array)`:** for primitive arrays, only `Arrays.stream(int[])` returns an `IntStream`; `Stream.of(int[])` returns `Stream<int[]>` (one element — the array itself).
- **`Collectors.toList()` vs `.toList()` (Java 16+):** `.toList()` returns an unmodifiable list; `Collectors.toList()` returns a mutable `ArrayList`. Mutating a `.toList()` result throws `UnsupportedOperationException`.

## Code example

```java
import java.util.*;
import java.util.stream.*;

public class JavaLabRunner {
    public static void main(String[] args) {
        List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // Basic pipeline: filter → map → collect
        List<Integer> result = numbers.stream()
            .filter(n -> n % 2 == 0)           // intermediate (lazy)
            .map(n -> n * n)                    // intermediate (lazy)
            .collect(Collectors.toList());      // terminal (triggers execution)
        System.out.println("Even squares: " + result);

        // Short-circuit: stops early
        Optional<Integer> first = numbers.stream()
            .filter(n -> n > 5)
            .findFirst();
        System.out.println("First > 5: " + first.orElse(-1));

        // Primitive stream — avoids boxing overhead
        int sum = IntStream.rangeClosed(1, 10).sum();
        System.out.println("Sum 1-10: " + sum);

        // peek() for debugging
        long count = numbers.stream()
            .peek(n -> System.out.print("filter? " + n + " "))
            .filter(n -> n % 3 == 0)
            .peek(n -> System.out.print("→ kept " + n + " "))
            .count();
        System.out.println("\nCount divisible by 3: " + count);

        // reduce
        int product = numbers.stream()
            .reduce(1, (a, b) -> a * b);
        System.out.println("Product: " + product);

        // flatMap — flatten nested lists
        List<List<Integer>> nested = List.of(List.of(1, 2), List.of(3, 4), List.of(5));
        List<Integer> flat = nested.stream()
            .flatMap(Collection::stream)
            .collect(Collectors.toList());
        System.out.println("Flattened: " + flat);
    }
}
```

## Interview questions you should be able to answer

- **Q:** Explain lazy evaluation in Java streams. When does actual computation happen, and why does it matter?
  > Nothing executes until a terminal operation is called. Intermediate operations build a pipeline description (a chain of `Spliterator` wrappers). The terminal op drives a pull loop — it requests the next element from the last intermediate op, which in turn pulls from the one before it, all the way to the source. This matters because (1) short-circuit terminals can exit early without processing the full source, (2) no unnecessary intermediate collections are created, and (3) a pipeline with no terminal is a silent no-op.

- **Q:** What is the difference between stateless and stateful intermediate operations, and why does the distinction matter for parallel streams?
  > Stateless ops (`filter`, `map`) process each element in isolation — they can be applied to any partition of data independently, making them trivially parallelizable with no coordination. Stateful ops (`sorted`, `distinct`) must see multiple elements to produce correct output — `sorted` must buffer all elements before emitting any. In parallel, stateful ops require a merge/sort phase across partitions, which involves synchronization and can negate parallel gains entirely. `sorted().parallel()` is often slower than `sorted()` alone.

- **Q:** You have a `Stream<T>` stored in a field. A colleague calls a terminal op on it in method A, then another terminal op in method B. What happens?
  > The second terminal op throws `java.lang.IllegalStateException: stream has already been operated upon or closed`. Streams are single-use. The correct pattern is to store the *source* (the `Collection` or `Supplier<Stream<T>>`) and call `.stream()` fresh for each operation. Storing a stream in a field is an anti-pattern.

- **Q:** When would you choose `IntStream` over `Stream<Integer>`, and what are the concrete performance implications?
  > `Stream<Integer>` boxes every primitive `int` into an `Integer` heap object, generating garbage and increasing memory traffic. `IntStream` keeps values on the stack as primitives throughout the pipeline. For pipelines over large numeric data sets, this can reduce allocation by hundreds of MB and eliminate GC pauses. `IntStream` also provides terminal ops like `sum()`, `average()`, `min()`, `max()`, and `summaryStatistics()` that compute all stats in a single pass without writing a custom reducer.

- **Q:** Under what conditions would you use a parallel stream, and what is the biggest pitfall to avoid?
  > Parallel streams are worth considering when: the collection is large (typically > 10k elements), the per-element operation is CPU-bound and takes meaningful time, and there is no shared mutable state. The single biggest pitfall is mutating shared state inside the pipeline (e.g., adding to an `ArrayList` from multiple threads) — this causes data races that produce silently wrong results with no exception. Always use thread-safe collectors (`Collectors.toList()`, `groupingByConcurrent`) or reduce to an immutable result.

- **Q:** What does `peek()` guarantee about execution, and why is it dangerous to use for side effects?
  > `peek()` provides no execution guarantee beyond "if an element is pulled past this point, the consumer will be called." With short-circuit terminals, later elements are never pulled, so `peek()` is never called for them. With parallel streams, elements are pulled across multiple threads in arbitrary order. With no terminal op at all, `peek()` is never called. Using `peek()` for production side effects (logging audit records, incrementing counters) will silently miss elements in all these cases. It should only be used for debug logging where missing some elements is acceptable.

## Further reading

- [java.util.stream package Javadoc (OpenJDK 21)](https://docs.oracle.com/en/java/docs/api/java.base/java/util/stream/package-summary.html)
- [Stream (Java 21 API)](https://docs.oracle.com/en/java/docs/api/java.base/java/util/stream/Stream.html)
- [IntStream (Java 21 API)](https://docs.oracle.com/en/java/docs/api/java.base/java/util/stream/IntStream.html)
- [When to use parallel streams — Stuart Marks (Inside Java)](https://inside.java/2021/06/24/parallel-stream-performance/)
