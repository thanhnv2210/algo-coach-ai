# ADC: Stream vs For-Loop vs Parallel Stream — When to Use Which

**Architecture Decision Card** | Interview Patterns | Senior Level

---

## Why It Matters

Choosing the wrong iteration strategy is one of the most common sources of subtle bugs and unnecessary performance regressions in Java codebases. Interviewers probe this topic to assess whether you reason about trade-offs rather than blindly following trends. Knowing *when not to use streams* is just as important as knowing how to write them.

The three broad options — imperative loops, sequential streams, and parallel streams — have distinct allocation profiles, readability characteristics, safety constraints, and performance break-even points. A senior engineer can explain the decision in 30 seconds and defend it under questioning.

---

## Decision Matrix

| Scenario | Recommended Approach |
|---|---|
| Index-dependent logic (`arr[i]` vs `arr[i-1]`) | `for`-loop |
| Frequent early exit (`break`) | `for`-loop |
| In-place mutation of the collection | `for`-loop |
| Simple iteration, no index needed | enhanced `for-each` |
| Remove elements during iteration | `Iterator.remove()` |
| Multi-step filter → map → collect pipeline | Stream |
| Aggregation: grouping, partitioning, joining | Stream (`Collectors.*`) |
| CPU-bound work, >10k elements, stateless ops | Parallel stream (after profiling) |
| IO-bound work | Neither parallel stream; use async/reactive |
| Shared mutable state across iterations | `for`-loop (never parallel stream) |

---

## Trade-off Analysis

### 1. For-Loop

**Context:** The fundamental imperative iteration construct. Direct bytecode — no object allocation beyond the loop variable.

**Trade-off:** Maximum control and performance for simple cases, but verbose for multi-step transformations. Cannot express a filter-map-collect pipeline readably.

**Decision rule:** Prefer when you need index arithmetic (`i`, `i-1`, `n-i`), a `break` or `continue` that exits mid-collection for correctness (not just optimization), or when you are mutating the array in-place. Zero allocation overhead makes it the default choice inside tight numerical loops.

---

### 2. Enhanced For-Each

**Context:** Syntactic sugar over `Iterable.iterator()`. Produces the same bytecode as a manual iterator loop.

**Trade-off:** Identical runtime performance to a `for`-loop for array and `ArrayList` iteration. Cannot track the current index. Cannot call `remove()` on the underlying collection — doing so throws `ConcurrentModificationException`.

**Decision rule:** Default for simple read-only traversal where index is not needed. Replace with `Iterator.remove()` the moment you need to delete elements mid-traversal.

---

### 3. Iterator.remove()

**Context:** The only structurally safe way to remove elements from a collection during iteration. The `Iterator` contract guarantees that `remove()` deletes the element returned by the most recent `next()` call without corrupting the iteration state.

**Trade-off:** Slightly more verbose than for-each. Required whenever structural modification during traversal is needed — there is no alternative that avoids `ConcurrentModificationException`.

**Decision rule:** Reach for `Iterator.remove()` immediately when the loop body may conditionally delete the current element. For `List`, also consider `removeIf(predicate)` (Java 8+) as a cleaner alternative.

---

### 4. Stream Pipeline

**Context:** Declarative, lazy pipeline of intermediate operations (filter, map, sorted, distinct, ...) terminated by a single terminal operation (collect, reduce, forEach, count, ...). Intermediate operations do not execute until the terminal operation is invoked — this is lazy evaluation.

**Trade-off:** Allocation cost includes a `Stream` object, lambda captures (each non-capturing lambda is a singleton, but capturing lambdas allocate per call), and the result container. For simple operations over small collections (<1000 elements), this overhead (~10–30 ns per element) is measurable. For multi-step transformations, the readability gain far outweighs the cost. `groupingBy` and `partitioningBy` would require a significant amount of imperative bookkeeping to replicate.

**Decision rule:** Default to streams when the operation involves two or more chained transformations, or when using `Collectors` aggregations. Avoid streams for a single iteration step over a small list where a for-each is just as readable.

---

### 5. Parallel Stream

**Context:** Splits the source, processes chunks on threads from `ForkJoinPool.commonPool()`, and merges results. Enabled by appending `.parallel()` or using `parallelStream()`.

**Trade-off:** The common pool is shared across the entire JVM. A long-running parallel stream can starve other tasks (including other parallel streams and `CompletableFuture` chains). Ordering guarantees are lost unless you call `.forEachOrdered()` or use `findFirst()`. Thread-safety of the accumulator is your responsibility — shared mutable state without synchronization causes data races.

Break-even is typically >10,000 elements for CPU-bound, stateless work. For IO-bound tasks, parallel streams provide no benefit and may introduce overhead; use `CompletableFuture` or reactive pipelines instead.

**Decision rule:** Never use parallel streams by default. Add `.parallel()` only after: (a) profiling shows the sequential version is a bottleneck, (b) the dataset exceeds ~10k elements, (c) each element's work is CPU-bound and stateless, and (d) order is irrelevant or explicitly handled.

---

### 6. `map` vs `flatMap`

**Context:** `map` applies a 1-to-1 function, producing `Stream<R>` from `Stream<T>`. `flatMap` applies a 1-to-N function that returns a `Stream<R>` per element, then *flattens* all those streams into a single `Stream<R>`.

**Trade-off:** Using `map` when you need `flatMap` produces `Stream<Stream<R>>` — a stream of streams — which is almost never what you want and is a classic interview mistake.

**Decision rule:** Use `map` when each input element produces exactly one output. Use `flatMap` when each input element expands into zero or more output elements (nested lists, optional chains, splitting strings into words).

---

### 7. `collect` vs `reduce`

**Context:** `reduce` performs an *immutable fold* — it combines elements using a pure `BinaryOperator<T>`, accumulating into a single value without modifying any existing object. `collect` performs *mutable container accumulation* — it uses a `Supplier`, an accumulator, and a combiner to build a mutable result container like `List`, `Map`, or `StringBuilder`.

**Trade-off:** `reduce` cannot efficiently build collections because it would need to create a new collection for every element combined. `collect` is optimized for exactly that use case via `Collectors`. `reduce` is appropriate for numeric aggregation (sum, product, min, max) or building a single immutable value.

**Decision rule:** Building a `List`, `Map`, `Set`, or `String` result → `collect`. Computing a scalar value from elements → `reduce` (or the specialized terminal ops `sum()`, `count()`, `min()`, `max()`).

---

## Decision Rules (Summary)

- **Default iteration:** enhanced for-each (readable, zero overhead).
- **Multi-step transformation or aggregation:** stream pipeline.
- **Need to remove elements during iteration:** `Iterator.remove()` or `List.removeIf()`.
- **Parallel processing:** only after profiling, dataset >10k elements, CPU-bound, stateless, order-insensitive.
- **Never:** parallel stream for IO-bound work, shared mutable state, or small collections.

---

## Code Example

```java
import java.util.*;
import java.util.stream.*;

public class JavaLabRunner {

    // --- 1. For-loop: index-dependent logic ---
    static int[] runningSum(int[] nums) {
        // Cannot express cleanly with streams — needs index i-1
        for (int i = 1; i < nums.length; i++) {
            nums[i] += nums[i - 1];
        }
        return nums;
    }

    // --- 2. For-loop vs Stream: same problem, both valid ---
    static List<String> filterLongWordsLoop(List<String> words) {
        List<String> result = new ArrayList<>();
        for (String w : words) {
            if (w.length() > 4) {
                result.add(w.toUpperCase());
            }
        }
        return result;
    }

    static List<String> filterLongWordsStream(List<String> words) {
        // Preferred when pipeline grows: readable, composable
        return words.stream()
                .filter(w -> w.length() > 4)
                .map(String::toUpperCase)
                .collect(Collectors.toList());
    }

    // --- 3. Iterator.remove(): safe structural modification ---
    static void removeShortWords(List<String> words) {
        Iterator<String> it = words.iterator();
        while (it.hasNext()) {
            if (it.next().length() <= 3) {
                it.remove(); // ConcurrentModificationException if you used for-each
            }
        }
        // Java 8+ cleaner alternative: words.removeIf(w -> w.length() <= 3);
    }

    // --- 4. flatMap: 1-to-N flattening ---
    static List<String> allWords(List<String> sentences) {
        // map would give Stream<String[]> — wrong
        // flatMap flattens each String[] into the outer stream
        return sentences.stream()
                .map(s -> s.split("\\s+"))      // Stream<String[]>
                .flatMap(Arrays::stream)         // Stream<String>  ← flatten
                .distinct()
                .collect(Collectors.toList());
    }

    // --- 5. groupingBy aggregation ---
    static Map<Integer, List<String>> groupByLength(List<String> words) {
        return words.stream()
                .collect(Collectors.groupingBy(String::length));
        // Replicating this with a for-loop requires a Map + conditional put — more error-prone
    }

    // --- 6. Parallel stream — with explicit caveats ---
    static long sumOfSquaresParallel(List<Long> numbers) {
        // Safe: stateless lambda, no shared mutable state, order irrelevant
        // Only beneficial if numbers.size() >> 10_000 and operation is CPU-bound
        return numbers.parallelStream()
                .mapToLong(n -> n * n)
                .sum();
        // WARNING: uses ForkJoinPool.commonPool() — can starve other tasks.
        // Always benchmark against the sequential version before shipping.
    }

    // --- 7. collect vs reduce ---
    static String joinWithReduce(List<String> words) {
        // reduce: immutable fold — fine for a scalar String result
        return words.stream()
                .reduce("", (a, b) -> a.isEmpty() ? b : a + ", " + b);
        // But: O(n^2) due to String concatenation — use Collectors.joining in practice
    }

    static String joinWithCollect(List<String> words) {
        // collect: mutable StringBuilder accumulation — O(n), correct
        return words.stream()
                .collect(Collectors.joining(", "));
    }

    public static void main(String[] args) {
        List<String> words = Arrays.asList("cat", "elephant", "dog", "giraffe", "ox", "tiger");

        System.out.println("=== for-loop filter ===");
        System.out.println(filterLongWordsLoop(words));

        System.out.println("\n=== stream filter (same result) ===");
        System.out.println(filterLongWordsStream(words));

        System.out.println("\n=== iterator remove (<=3 chars) ===");
        List<String> mutable = new ArrayList<>(words);
        removeShortWords(mutable);
        System.out.println(mutable);

        System.out.println("\n=== flatMap: sentences -> words ===");
        List<String> sentences = Arrays.asList("streams are lazy", "loops are fast");
        System.out.println(allWords(sentences));

        System.out.println("\n=== groupingBy length ===");
        groupByLength(words).forEach((len, ws) ->
                System.out.println("length " + len + ": " + ws));

        System.out.println("\n=== collect (joining) ===");
        System.out.println(joinWithCollect(words));

        System.out.println("\n=== parallel stream sum of squares ===");
        List<Long> numbers = new ArrayList<>();
        for (long i = 1; i <= 20; i++) numbers.add(i);
        System.out.println("Sum of squares: " + sumOfSquaresParallel(numbers));

        System.out.println("\n=== running sum (for-loop, index-dependent) ===");
        System.out.println(Arrays.toString(runningSum(new int[]{1, 2, 3, 4, 5})));
    }
}
```

**Expected output:**
```
=== for-loop filter ===
[ELEPHANT, GIRAFFE, TIGER]

=== stream filter (same result) ===
[ELEPHANT, GIRAFFE, TIGER]

=== iterator remove (<=3 chars) ===
[elephant, giraffe, tiger]

=== flatMap: sentences -> words ===
[streams, are, lazy, loops, fast]

=== groupingBy length ===
length 3: [cat, dog, ox]
length 8: [elephant, giraffe]
length 5: [tiger]

=== collect (joining) ===
cat, elephant, dog, giraffe, ox, tiger

=== parallel stream sum of squares ===
Sum of squares: 2870

=== running sum (for-loop, index-dependent) ===
[1, 3, 6, 10, 15]
```

> Note: `groupingBy` output order depends on hash codes and may vary between runs.

---

## Performance Notes

- **Stream overhead:** ~10–30 ns per element for simple single-operation pipelines. Irrelevant once the collection exceeds ~1,000 elements or the per-element work dominates. Do not micro-optimize away streams for small collections — prefer readability.
- **Parallel stream break-even:** empirically ~10,000 elements for CPU-bound, stateless work. Below this threshold, thread coordination overhead typically exceeds the parallelism gain. Always measure with a representative dataset and workload.
- **Lambda capture cost:** non-capturing lambdas (method references, lambdas that close over no variables) are cached as singletons. Capturing lambdas (closing over local variables) allocate a new object per invocation — a consideration in extremely hot paths.
- **`groupingBy` vs manual map-building:** the stream version is not faster, but it eliminates a class of bugs (missing `computeIfAbsent`, incorrect null handling) and is significantly shorter.

---

## Interview Q&As

**Q1: When would you use a for-loop over a stream?**

A: Three main situations. First, when the logic is index-dependent — for example, comparing `arr[i]` with `arr[i-1]`, or building a running sum. Streams do not expose the index without the `IntStream.range` workaround, which often reads less clearly than a plain loop. Second, when I need a reliable early exit via `break` that is load-bearing for correctness, not just a minor optimization — `findFirst()` on a stream terminates early too, but the intent is clearer with a loop when the break condition is complex. Third, when mutating the collection in-place, since streams are designed to be side-effect-free; a `for`-loop makes the mutation intent explicit. For simple read-only traversal without transformation I default to for-each; for multi-step pipelines I default to streams.

---

**Q2: What is lazy evaluation in streams and why does it matter?**

A: In a stream pipeline, intermediate operations — `filter`, `map`, `sorted`, `distinct`, and so on — do not process any elements when they are declared. They build a description of what to do. Processing begins only when a terminal operation (`collect`, `forEach`, `count`, `findFirst`, etc.) is invoked. This matters for two reasons. First, efficiency: if you chain `filter` before `map`, elements that fail the filter are never passed to `map` at all — the pipeline short-circuits per element. Second, short-circuiting terminals like `findFirst` or `anyMatch` can stop processing the entire source as soon as the answer is known, even on an infinite stream (`Stream.iterate`). Without laziness, you would have to materialize the entire filtered list before mapping it, wasting memory and time.

---

**Q3: map vs flatMap — when does flatMap apply?**

A: `map` is a 1-to-1 transformation: each element in the input stream produces exactly one element in the output stream. `flatMap` is for 1-to-N: each element produces a `Stream` of zero or more elements, and `flatMap` merges all those sub-streams into a single flat output stream. The classic interview example is splitting a list of sentences into individual words: `map(s -> s.split(" "))` gives you a `Stream<String[]>` — a stream of arrays — which is not what you want. `flatMap(s -> Arrays.stream(s.split(" ")))` gives you a `Stream<String>` with all words flattened. The same pattern appears when expanding optional values (`Optional::stream`), unwrapping nested collections, or joining multiple database result sets into a single sequence.

---

**Q4: What are the risks of parallel streams and when do they actually help?**

A: The main risks are: (1) **shared mutable state** — if the lambda modifies a shared variable without synchronization, you have a data race and non-deterministic results; (2) **ForkJoinPool starvation** — parallel streams use `ForkJoinPool.commonPool()`, which is shared across the JVM; a long-running parallel stream can block other tasks that depend on the same pool, including other parallel streams and `CompletableFuture.supplyAsync()` calls; (3) **ordering surprises** — `forEach` on a parallel stream does not preserve encounter order; you need `forEachOrdered` if order matters, which often defeats the parallelism benefit; (4) **premature optimization** — parallel streams add overhead even when they help; below ~10,000 elements the coordination cost usually exceeds the gain. They actually help when: the dataset is large (>10k elements), each element's computation is CPU-bound and stateless, no shared mutable state exists, and order is irrelevant. Always benchmark against the sequential version with a realistic workload before committing to parallel.
