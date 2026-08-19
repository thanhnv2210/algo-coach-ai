# Streams & Functional Java Terminology — Interview Reference

## Why this matters in interviews

Stream questions reveal whether you understand execution semantics, not just syntax. Interviewers at senior level will push past "chain filter-map-collect" to ask why `sorted()` breaks lazy evaluation, when `flatMap` is required over `map`, and why parallel streams can silently corrupt data. Knowing the precise vocabulary lets you answer confidently and concisely.

## Concept

### Core Pipeline Terms

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **Stream** | A lazy sequence of elements supporting sequential or parallel aggregate operations; single-use, not a data structure | "A stream does not store data — it computes on demand from a source." |
| **Source** | The origin of stream elements: a collection, array, generator, or I/O channel | "`collection.stream()`, `Stream.of(...)`, `Files.lines(path)`, `Stream.generate(...)` are all sources." |
| **Intermediate operation** | A stream operation that returns another stream; executes lazily — no work until a terminal op is called | "`filter`, `map`, `flatMap`, `sorted`, `distinct`, `peek`, `limit`, `skip` are all intermediate." |
| **Terminal operation** | Consumes the stream and produces a result or side effect; triggers all deferred intermediate work | "`collect`, `forEach`, `reduce`, `count`, `findFirst`, `anyMatch` are terminals." |
| **Pipeline** | A chain of one source, zero or more intermediate ops, and exactly one terminal op | "The pipeline `stream().filter(...).map(...).collect(...)` executes as a single pull loop." |
| **Lazy evaluation** | Intermediate operations are not executed until a terminal is reached | "Calling `.filter().map()` alone does zero work — the pipeline description is built but not run." |

---

### Execution Model

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **Pull model** | The terminal op drives execution by requesting elements from the last intermediate op, which pulls from the one before it, back to the source | "Elements flow through the pipeline one at a time — filter, then map, then collect — not in batch stages." |
| **Short-circuit** | A terminal (or intermediate) op that can stop the pipeline before exhausting the source | "`findFirst()` stops the pipeline the moment one element passes the filter — elements after it are never touched." |
| **Stateless operation** | An op that processes each element independently, with no knowledge of other elements | "`filter` and `map` are stateless — safe for parallel streams, no buffering required." |
| **Stateful operation** | An op that must see multiple elements before emitting output — introduces an internal buffer | "`sorted()` must consume all elements before emitting the first — it is an O(n) memory barrier in the pipeline." |
| **Encounter order** | The order in which elements appear in the source; preserved by ordered streams (e.g., from a `List`) | "`findFirst()` on a parallel ordered stream forces encounter-order resolution — use `findAny()` for better parallel performance." |
| **Spliterator** | The low-level cursor that streams use internally; carries both the data and characteristics (ORDERED, SIZED, DISTINCT, SORTED) | "A `Spliterator` over an `ArrayList` is ORDERED and SIZED; over a `HashSet` it is DISTINCT but not ORDERED." |

---

### Transformation Operations

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **`filter`** | Keeps only elements matching a predicate; stateless, 1-to-0-or-1 | "`filter(n -> n > 0)` — each element either passes or is dropped." |
| **`map`** | Transforms each element 1-to-1 using a `Function<T,R>`; stateless | "`map(String::toUpperCase)` — one input produces exactly one output." |
| **`flatMap`** | Maps each element to a stream, then flattens all sub-streams into one; stateless | "`flatMap(Collection::stream)` — one input produces zero or more outputs." |
| **`map` vs `flatMap`** | Use `map` when the transform returns a plain value; use `flatMap` when it returns a `Stream` (or `Optional`) | "If your mapping function returns `Optional<T>`, use `flatMap` — otherwise you get `Stream<Optional<T>>`." |
| **`peek`** | Non-transforming intermediate op; receives each element as a `Consumer` for side effects (debug only) | "`peek(System.out::println)` is only called when an element is actually pulled — never use it for business logic." |
| **`distinct`** | Removes duplicate elements using `equals`/`hashCode`; stateful, backed by a `HashSet` | "`distinct()` silently fails to deduplicate objects that don't override `equals`." |
| **`sorted`** | Returns a stream of elements in natural or comparator order; stateful, buffers all elements | "Placing `sorted()` before `filter()` sorts everything — place `filter()` first to sort fewer elements." |
| **`limit(n)`** | Truncates the stream to at most n elements; short-circuit intermediate | "`limit(5)` on an infinite `Stream.generate(...)` makes it finite." |
| **`skip(n)`** | Discards the first n elements | "`skip(10).limit(10)` — a simple pagination idiom." |

---

### Terminal Operations

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **`collect`** | Mutable reduction into a container using a `Collector` | "`collect(Collectors.toList())` — the most common terminal op." |
| **`reduce`** | Immutable fold: combines elements with a `BinaryOperator` into a single value | "`reduce(0, Integer::sum)` — sum all elements without a mutable accumulator." |
| **`forEach`** | Applies a `Consumer` to each element; returns void | "Do not use `forEach` to build a result — use `collect` or `reduce` instead." |
| **`count`** | Returns the number of elements; may short-circuit for SIZED sources | "`count()` on an `ArrayList` stream can skip traversal entirely by reading `size()`." |
| **`findFirst`** | Returns an `Optional` of the first element; short-circuit | "On a parallel stream, `findFirst` forces ordered traversal — `findAny` is faster if order does not matter." |
| **`anyMatch` / `allMatch` / `noneMatch`** | Short-circuit boolean terminal ops | "`anyMatch` stops at the first `true`; `allMatch` stops at the first `false`." |

---

### Collectors

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **`Collector`** | An interface with supplier, accumulator, combiner, finisher, and characteristics; used by `collect()` | "A `Collector` describes *how* to fold stream elements into a result container." |
| **`Collectors.toList()`** | Accumulates elements into a mutable `ArrayList` | "Returns a mutable list — if you want immutable, use `.toList()` (Java 16+)." |
| **`.toList()` (Java 16+)** | Terminal op (not a `Collector`) returning an unmodifiable list | "`.toList()` is shorter than `collect(Collectors.toList())` and returns an immutable list." |
| **`Collectors.groupingBy`** | Partitions elements into a `Map<K, List<V>>` by a classifier function | "`groupingBy(Person::dept)` — one entry per distinct department value." |
| **Downstream collector** | A secondary `Collector` passed to `groupingBy` (or similar) to further process each group | "`groupingBy(Person::dept, Collectors.counting())` — downstream `counting()` replaces `List<V>` with `Long`." |
| **`Collectors.partitioningBy`** | Special case of `groupingBy` with a `Predicate`; always produces a `Map<Boolean, List<T>>` | "`partitioningBy(p -> p.salary() > 80_000)` gives two groups: above and below threshold." |
| **`Collectors.joining`** | Concatenates `String` elements with optional delimiter, prefix, suffix | "`joining(\", \", \"[\", \"]\")` — formats a list as `[a, b, c]`." |
| **`Collectors.toMap`** | Produces a `Map<K,V>` from key and value extractor functions; throws on duplicate keys unless a merge function is provided | "`toMap(Person::name, Person::salary)` — throws `IllegalStateException` if two people share a name." |
| **`summarizingInt`** | Produces `IntSummaryStatistics` (count, sum, min, max, average) in a single pass | "Use `summarizingInt` instead of four separate stream passes for stats." |

---

### Optional

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **`Optional<T>`** | A container that holds either one value or nothing; designed for method return types to signal absence explicitly | "Never use `Optional` as a field, method parameter, or collection element — only as a return type." |
| **`Optional.of`** | Creates an `Optional` wrapping a non-null value; throws `NullPointerException` if null | "Use `Optional.ofNullable` when the value might be null." |
| **`Optional.ofNullable`** | Returns `Optional.empty()` if null, otherwise `Optional.of(value)` | "Safe wrapper for any value that might be null." |
| **`orElse`** | Returns the value if present, otherwise the given default — **always evaluates the default** | "`orElse(expensiveCompute())` — `expensiveCompute()` runs even if the value is present." |
| **`orElseGet`** | Returns the value if present, otherwise invokes a `Supplier` — **lazy, only evaluates if absent** | "Prefer `orElseGet(() -> expensiveCompute())` when the default is costly to produce." |
| **`orElseThrow`** | Returns the value if present, otherwise throws a supplied exception | "`orElseThrow(() -> new EntityNotFoundException(id))` — idiomatic in service layers." |
| **`map` (Optional)** | Transforms the contained value if present; returns `Optional.empty()` if absent or if the function returns null | "`optional.map(String::length)` — no value means no mapping." |
| **`flatMap` (Optional)** | Like `map`, but the function returns an `Optional`; prevents `Optional<Optional<T>>` nesting | "If `getUser()` returns `Optional<User>` and `getEmail(user)` returns `Optional<String>`, chain with `flatMap`." |
| **`ifPresent`** | Executes a `Consumer` if value is present; does nothing if absent | "`optional.ifPresent(System.out::println)` — replaces `if (optional.isPresent())` blocks." |
| **`Optional::stream`** (Java 9+) | Converts `Optional<T>` to a `Stream<T>` of 0 or 1 elements | "`list.stream().flatMap(Optional::stream)` — filters out empty optionals." |

---

### Parallel Streams

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **Parallel stream** | A stream that splits its source across multiple CPU cores using the `ForkJoinPool` | "`list.parallelStream()` — splits the list into partitions processed concurrently." |
| **`ForkJoinPool.commonPool`** | The shared pool all parallel streams use by default; sized to `Runtime.getRuntime().availableProcessors() - 1` | "Blocking inside a parallel stream starves the common pool for all other parallel tasks in the JVM." |
| **Spliterator characteristics** | Flags (ORDERED, SIZED, DISTINCT, SORTED, IMMUTABLE, CONCURRENT) the runtime uses to optimise splitting and merging | "A `SIZED` source lets the splitter divide evenly; an unsized source must estimate." |
| **`forEachOrdered`** | Parallel-safe terminal op that processes elements in encounter order | "Use `forEachOrdered` in a parallel pipeline when order matters — but it serialises the output phase." |

---

### Functional Interfaces

| Interface | Method | Used for |
|-----------|--------|----------|
| **`Function<T,R>`** | `R apply(T t)` | `map`, `flatMap` (returning non-stream) |
| **`Predicate<T>`** | `boolean test(T t)` | `filter`, `anyMatch`, `allMatch` |
| **`Consumer<T>`** | `void accept(T t)` | `forEach`, `peek` |
| **`Supplier<T>`** | `T get()` | `Stream.generate`, `orElseGet` |
| **`BinaryOperator<T>`** | `T apply(T a, T b)` | `reduce` |
| **`UnaryOperator<T>`** | `T apply(T t)` | `Stream.iterate`, `replaceAll` |

## Key rules / gotchas

- **No terminal op = silent no-op**: the entire pipeline is never executed; no warning is emitted.
- **`orElse` is eager**: the default value expression is always evaluated even when the `Optional` contains a value — use `orElseGet` with a `Supplier` for expensive defaults.
- **`flatMap` vs `map`**: if your `map` function returns `Stream<T>` or `Optional<T>`, you almost certainly want `flatMap` — otherwise you get a stream of streams or a stream of optionals.
- **`sorted()` is an O(n) memory barrier**: it must buffer all upstream elements before emitting the first output element. Always place `filter()` and `limit()` before `sorted()`.
- **`distinct()` requires correct `equals`/`hashCode`**: it is backed by a `HashSet`; objects that don't override both will not deduplicate correctly.
- **Stream is single-use**: once a terminal op fires, any further call on the same `Stream` instance throws `IllegalStateException`.
- **`toMap` throws on duplicate keys**: always provide a merge function `(existing, replacement) -> existing` when duplicates are possible.
- **`Collectors.toList()` returns mutable; `.toList()` (Java 16+) returns unmodifiable**: mixing them up causes `UnsupportedOperationException` at runtime.
- **Parallel + shared mutable state = data race**: adding to an `ArrayList` from multiple threads inside `forEach` silently produces incorrect results.

## Code example

```java
import java.util.*;
import java.util.stream.*;
import java.util.function.*;

public class JavaLabRunner {
    record Person(String name, String dept, int salary) {}

    public static void main(String[] args) {
        List<Person> people = List.of(
            new Person("Alice", "Eng", 90000),
            new Person("Bob",   "Eng", 85000),
            new Person("Carol", "HR",  70000),
            new Person("Dave",  "HR",  72000)
        );

        // map vs flatMap
        List<String> upper = people.stream()
            .map(p -> p.name().toUpperCase())       // 1-to-1
            .collect(Collectors.toList());
        System.out.println("map: " + upper);

        List<String> words = List.of("Hello World", "Java Streams");
        List<String> tokens = words.stream()
            .flatMap(s -> Arrays.stream(s.split(" "))) // 1-to-many, then flatten
            .collect(Collectors.toList());
        System.out.println("flatMap: " + tokens);

        // Stateful op: put filter before sorted
        people.stream()
            .filter(p -> p.salary() > 75000)       // reduce set first
            .sorted(Comparator.comparingInt(Person::salary))
            .map(Person::name)
            .forEach(System.out::println);

        // groupingBy + downstream
        Map<String, Double> avgByDept = people.stream()
            .collect(Collectors.groupingBy(
                Person::dept,
                Collectors.averagingInt(Person::salary)
            ));
        System.out.println("Avg salary: " + avgByDept);

        // Optional.flatMap to avoid Optional<Optional<T>>
        Optional<String> email = Optional.of("alice@example.com");
        Optional<String> domain = email
            .flatMap(e -> Optional.of(e.split("@")[1])); // function returns Optional
        System.out.println("Domain: " + domain.orElse("none"));

        // orElse (eager) vs orElseGet (lazy)
        Optional<String> empty = Optional.empty();
        String a = empty.orElse("default");          // "default" always evaluated
        String b = empty.orElseGet(() -> "lazy");    // Supplier called only when absent
        System.out.println("orElse: " + a + ", orElseGet: " + b);

        // Stream.generate (infinite) + limit (short-circuit)
        List<Double> randoms = Stream.generate(Math::random)
            .limit(5)
            .collect(Collectors.toList());
        System.out.println("5 randoms: " + randoms.size());
    }
}
```

## Interview questions you should be able to answer

- **Q:** What is the difference between `map` and `flatMap`?
  > `map` applies a 1-to-1 transformation — one input produces exactly one output element. `flatMap` applies a 1-to-many transformation — one input produces a `Stream` of zero or more outputs, which is then flattened into the main stream. Use `flatMap` whenever your mapping function returns a `Stream` or an `Optional`; using `map` in those cases gives you `Stream<Stream<T>>` or `Stream<Optional<T>>`, which requires an extra unwrap.

- **Q:** Why is `orElse` potentially problematic for expensive computations?
  > `orElse(expression)` evaluates `expression` eagerly — before checking whether the `Optional` contains a value. If the expression is a method call with side effects or high cost (e.g., a DB query), it runs even when the value is present and the result is thrown away. `orElseGet(() -> expression)` wraps the expression in a `Supplier` that is only invoked when the `Optional` is empty.

- **Q:** Why does `sorted()` break the element-by-element pull model of lazy evaluation?
  > `sorted()` is a stateful intermediate operation. It cannot emit any element until it has seen all upstream elements, because the first element in sorted order might be the last one in the source. This forces a full materialisation of all upstream elements into a buffer (O(n) memory), after which the sorted sequence is emitted. Every element before `sorted()` in the pipeline is fully consumed before the first element after `sorted()` is produced.

- **Q:** What happens when you call `Collectors.toMap` and two elements produce the same key?
  > It throws `java.lang.IllegalStateException: Duplicate key <value>`. Fix: provide a merge function as the third argument — `toMap(keyFn, valueFn, (existing, replacement) -> existing)` keeps the first value, `(e, r) -> r` keeps the last. When building a `Map` where duplicates are expected, also consider `groupingBy` which naturally collects duplicates into a list.

- **Q:** What is the difference between `findFirst` and `findAny`, and when does the choice matter?
  > Both return an `Optional` of one element that passes the filter. `findFirst` guarantees the first element in encounter order; `findAny` may return any element. On a sequential stream they behave identically. On a parallel stream, `findFirst` forces the runtime to track encounter order across all partitions, serialising result resolution. `findAny` allows the first partition to finish to win, giving better parallel throughput. Always prefer `findAny` in parallel pipelines when order is irrelevant.

- **Q:** When is it unsafe to use a parallel stream and why?
  > Parallel streams are unsafe when: (1) the pipeline mutates shared mutable state — multiple threads write to the same `ArrayList` or counter causing data races; (2) the source is not efficiently splittable — `LinkedList` or `Stream.iterate` splits poorly; (3) operations have side effects that must happen in order. The biggest silent failure mode is writing to an unsynchronised collection inside `forEach` — it produces wrong results with no exception.

## Further reading

- [java.util.stream package summary (OpenJDK)](https://docs.oracle.com/en/java/docs/api/java.base/java/util/stream/package-summary.html)
- [Java Collectors Javadoc](https://docs.oracle.com/en/java/docs/api/java.base/java/util/stream/Collectors.html)
- [Optional Javadoc (OpenJDK)](https://docs.oracle.com/en/java/docs/api/java.base/java/util/Optional.html)
