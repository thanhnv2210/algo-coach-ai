# Collectors & Stream Aggregation

## Why this matters in interviews

`Collectors` is where stream pipelines become genuinely useful for real business logic, and it is the area most senior candidates get partially right but rarely fully right. Interviewers use collector questions to test whether you can go beyond basic `toList()` — specifically whether you can `groupingBy` with a downstream collector, spot a `toMap` duplicate-key crash before it happens in production, and know when to reach for `summarizingInt` instead of chaining three separate streams. Mastery of collectors is a strong differentiator because it separates developers who understand functional composition from those who just know the API surface.

## Concept

### The `Collector` Contract

A `Collector<T, A, R>` is a recipe with four components:

| Component | Type | Role |
|---|---|---|
| `supplier` | `Supplier<A>` | Creates the mutable accumulation container |
| `accumulator` | `BiConsumer<A, T>` | Folds one element into the container |
| `combiner` | `BinaryOperator<A>` | Merges two containers (used in parallel) |
| `finisher` | `Function<A, R>` | Converts the container to the final result |

You rarely implement this directly — `Collectors` factory methods cover almost every case. But knowing the contract explains *why* collectors compose: a downstream collector is simply a `Collector` whose output becomes the input to an outer collector's finisher.

### Basic Collectors

| Collector | Result type | Notes |
|---|---|---|
| `Collectors.toList()` | `List<T>` | Mutable `ArrayList`; order preserved |
| `Collectors.toUnmodifiableList()` | `List<T>` | Immutable; Java 10+ |
| `.toList()` (stream method) | `List<T>` | Unmodifiable shorthand; Java 16+ |
| `Collectors.toSet()` | `Set<T>` | No order guarantee; deduplicates |
| `Collectors.toUnmodifiableSet()` | `Set<T>` | Immutable; Java 10+ |
| `Collectors.toCollection(TreeSet::new)` | `Collection<T>` | Custom collection type |
| `Collectors.counting()` | `Long` | Count of elements |
| `Collectors.joining(delim, prefix, suffix)` | `String` | String concatenation |

### `toMap` — and Its Trap

```java
Collectors.toMap(keyMapper, valueMapper)
Collectors.toMap(keyMapper, valueMapper, mergeFunction)
Collectors.toMap(keyMapper, valueMapper, mergeFunction, mapFactory)
```

The two-argument form throws `IllegalStateException` on duplicate keys. In production, duplicate keys are common (e.g., grouping by an enum that two records share). Always supply a `mergeFunction` when duplicates are possible:

```java
// keeps the last value for duplicate keys
.collect(Collectors.toMap(Person::dept, Person::salary, (a, b) -> b))
```

To get a `LinkedHashMap` (insertion-order) instead of an unordered `HashMap`:
```java
.collect(Collectors.toMap(k, v, (a, b) -> a, LinkedHashMap::new))
```

### `groupingBy` — Single and Multi-Level

`groupingBy(classifier)` partitions the stream into a `Map<K, List<T>>`:

```
people → groupingBy(dept) →  { "Eng" → [Alice, Bob, Eve],
                                "HR"  → [Carol, Dave] }
```

With a downstream collector, you replace the default `toList()` accumulation:

| Downstream | What it replaces | Result type |
|---|---|---|
| `counting()` | `toList()` → count | `Map<K, Long>` |
| `summingInt(fn)` | `toList()` → integer sum | `Map<K, Integer>` |
| `averagingInt(fn)` | `toList()` → double average | `Map<K, Double>` |
| `summarizingInt(fn)` | `toList()` → full stats object | `Map<K, IntSummaryStatistics>` |
| `mapping(fn, toList())` | transform then collect | `Map<K, List<U>>` |
| `toSet()` | `toList()` → dedup | `Map<K, Set<T>>` |
| `joining(delim)` | concatenate strings | `Map<K, String>` |
| `maxBy(comparator)` | find max in group | `Map<K, Optional<T>>` |
| `collectingAndThen(c, fn)` | post-process the result | `Map<K, R>` |

**Multi-level grouping** (group by department, then by seniority level):
```java
Map<String, Map<String, List<Person>>> nested =
    people.stream()
        .collect(groupingBy(Person::dept,
                 groupingBy(Person::level)));
```

### `partitioningBy` — Boolean Split

`partitioningBy` is a specialized `groupingBy` with a `Predicate`. It always returns a `Map<Boolean, List<T>>` with both `true` and `false` keys present (even if one group is empty). It also accepts a downstream collector:

```java
Map<Boolean, Long> countBySeniority =
    people.stream()
        .collect(partitioningBy(p -> p.salary() >= 100_000, counting()));
```

Use `partitioningBy` over `groupingBy(p -> predicate, ...)` when the split is genuinely binary — the API communicates intent clearly.

### Numeric Summary Collectors

For a single numeric property, you have three options depending on what you need:

| Collector | Return type | Computes |
|---|---|---|
| `summingInt(fn)` | `Integer` | Sum only |
| `averagingInt(fn)` | `Double` | Average only |
| `summarizingInt(fn)` | `IntSummaryStatistics` | Count, sum, min, max, average — **in one pass** |

`IntSummaryStatistics` (and its `Long`/`Double` siblings) is the senior answer when an interviewer asks "how would you compute min, max, and average in a single stream pass."

### `joining`

```java
Collectors.joining()                    // concatenate
Collectors.joining(", ")               // with delimiter
Collectors.joining(", ", "[", "]")     // delimiter + prefix + suffix
```

Operates on `Stream<String>`. For non-string streams, use `.map(Object::toString)` first, or `.map(Person::name)`.

### `collectingAndThen`

Wraps another collector and applies a finishing function to its result:

```java
// toList() then make it unmodifiable
Collectors.collectingAndThen(Collectors.toList(), Collections::unmodifiableList)

// groupingBy counting, then get the max-count entry
Map.Entry<String, Long> topDept = people.stream()
    .collect(collectingAndThen(
        groupingBy(Person::dept, counting()),
        map -> map.entrySet().stream().max(Map.Entry.comparingByValue()).orElseThrow()
    ));
```

### `Collectors.teeing` (Java 12+)

`teeing` passes every element to *two* downstream collectors simultaneously and merges their results with a `BiFunction`. This is the idiomatic way to compute two aggregations in one pass:

```java
// compute min and max salary in a single pass
record Range(int min, int max) {}

Range salaryRange = people.stream()
    .collect(Collectors.teeing(
        Collectors.minBy(Comparator.comparingInt(Person::salary)),
        Collectors.maxBy(Comparator.comparingInt(Person::salary)),
        (min, max) -> new Range(
            min.map(Person::salary).orElse(0),
            max.map(Person::salary).orElse(0))
    ));
```

Before Java 12, achieving this required either `summarizingInt` (when the stats fit) or two separate stream passes.

### Custom `Collector` via `Collector.of`

When built-in collectors do not compose to what you need, implement one directly:

```java
// Collect into an ImmutableList (Guava example)
Collector<T, ImmutableList.Builder<T>, ImmutableList<T>> toImmutableList =
    Collector.of(
        ImmutableList::builder,           // supplier
        ImmutableList.Builder::add,       // accumulator
        (b1, b2) -> b1.addAll(b2.build()), // combiner
        ImmutableList.Builder::build      // finisher
    );
```

## Key rules / gotchas

- **`toMap` with duplicate keys throws at runtime:** the `IllegalStateException` message includes the duplicate key value, but it only appears under the data that triggers it — often a production data set that your test data did not cover. Always supply a merge function.
- **`groupingBy` does not accept a null key:** if the classifier returns `null` for any element, it throws `NullPointerException`. Use `Optional` or replace nulls before grouping.
- **`toList()` (Java 16 stream method) returns an unmodifiable list:** adding to it throws `UnsupportedOperationException`. Use `Collectors.toList()` when the caller needs a mutable result.
- **`groupingByConcurrent` for parallel streams:** when using a parallel stream with `groupingBy`, the result is still correct but the collector serializes access to each group list. `groupingByConcurrent` uses a `ConcurrentMap` and allows true parallel accumulation — at the cost of losing encounter order within groups.
- **Downstream `averagingInt` returns `0.0` on empty groups:** for groups created by `groupingBy`, there are no empty groups (elements only appear where they match). But if you use `collectingAndThen` and the source is empty, numeric collectors return their identity (`0.0`, `0`). Be explicit about empty-source semantics.
- **`joining` on a non-string stream gives a compile error:** `Collectors.joining()` requires a `Stream<CharSequence>`. If you call it on a `Stream<Person>` without `.map(Person::name)` first, the code will not compile — a helpful guardrail.
- **`summarizingInt` wraps `int` via `applyAsInt`:** the function is an `ToIntFunction<T>`, so method references like `Person::salary` work only if `salary()` returns `int`, not `Integer`.

## Code example

```java
import java.util.*;
import java.util.stream.*;
import java.util.function.*;

public class JavaLabRunner {
    record Person(String name, String dept, int salary) {}

    public static void main(String[] args) {
        List<Person> people = List.of(
            new Person("Alice", "Eng",  90000),
            new Person("Bob",   "Eng",  85000),
            new Person("Carol", "HR",   70000),
            new Person("Dave",  "HR",   72000),
            new Person("Eve",   "Eng",  95000)
        );

        // groupingBy — map of lists
        Map<String, List<Person>> byDept = people.stream()
            .collect(Collectors.groupingBy(Person::dept));
        System.out.println("By dept: " + byDept.keySet());

        // groupingBy + downstream: count per dept
        Map<String, Long> countByDept = people.stream()
            .collect(Collectors.groupingBy(Person::dept, Collectors.counting()));
        System.out.println("Count by dept: " + countByDept);

        // groupingBy + downstream: average salary
        Map<String, Double> avgSalary = people.stream()
            .collect(Collectors.groupingBy(Person::dept, Collectors.averagingInt(Person::salary)));
        System.out.println("Avg salary: " + avgSalary);

        // partitioningBy — boolean split
        Map<Boolean, List<Person>> highEarners = people.stream()
            .collect(Collectors.partitioningBy(p -> p.salary() >= 85000));
        System.out.println("High earners: " + highEarners.get(true).stream().map(Person::name).toList());

        // joining
        String names = people.stream()
            .map(Person::name)
            .collect(Collectors.joining(", ", "[", "]"));
        System.out.println("Names: " + names);

        // toMap — watch for duplicate key exception
        Map<String, Integer> nameSalary = people.stream()
            .collect(Collectors.toMap(Person::name, Person::salary));
        System.out.println("Alice salary: " + nameSalary.get("Alice"));

        // summarizingInt — stats in one pass
        IntSummaryStatistics stats = people.stream()
            .collect(Collectors.summarizingInt(Person::salary));
        System.out.printf("Salary: min=%d, max=%d, avg=%.0f%n",
            stats.getMin(), stats.getMax(), stats.getAverage());
    }
}
```

## Interview questions you should be able to answer

- **Q:** You need to group a list of transactions by currency and compute the total amount per currency in one stream pass. How do you write this, and what is the return type?
  > `Collectors.groupingBy(Transaction::currency, Collectors.summingLong(Transaction::amount))` — returns `Map<String, Long>`. The downstream `summingLong` replaces the default `toList()` accumulation with summation, so the map values are totals rather than lists of transactions. This is a single-pass O(n) operation with no intermediate collection.

- **Q:** `Collectors.toMap` throws in production on data that worked in your tests. What is the most likely cause and how do you fix it?
  > Duplicate keys. `toMap(keyMapper, valueMapper)` throws `IllegalStateException` the first time two elements map to the same key. Test data often has unique keys by construction. Fix: supply a merge function as the third argument — `(existing, replacement) -> existing` to keep the first, `(a, b) -> b` to keep the last, or a combining function like `(a, b) -> a + b` for numeric accumulation. For complex types, the merge function can apply domain-specific conflict resolution.

- **Q:** What does `collectingAndThen` do, and give a real-world example where it is useful?
  > `collectingAndThen(downstream, finisher)` applies `downstream` first, then passes its result through `finisher`. A common use: `collectingAndThen(toList(), Collections::unmodifiableList)` wraps the collected list in an unmodifiable view before returning it — enforcing immutability at the collection boundary. Another use: wrap `groupingBy(counting())` with a finisher that extracts the maximum-count entry, doing a two-level reduction in one collector expression.

- **Q:** How would you compute the minimum salary, maximum salary, and employee count for each department in a single stream pass?
  > Use `groupingBy(Person::dept, summarizingInt(Person::salary))` — returns `Map<String, IntSummaryStatistics>`. `IntSummaryStatistics` holds count, sum, min, max, and average, all computed in one accumulation pass per element with no intermediate objects. Alternatively, for Java 12+, `teeing` with `minBy` and `maxBy` plus a separate `counting()` downstream can be composed, though `summarizingInt` is more concise here.

- **Q:** Why should you use `groupingByConcurrent` instead of `groupingBy` when the stream is parallel?
  > `groupingBy` on a parallel stream is correct but uses a concurrent merge step: each thread builds its own partial map, and the combiner then merges them — this involves locking or copying per merge. `groupingByConcurrent` returns a `ConcurrentMap` and allows all threads to accumulate into the *same* map concurrently using fine-grained locking (e.g., `ConcurrentHashMap`), avoiding the merge phase entirely. The trade-off: `groupingByConcurrent` does not guarantee encounter order within each group's list. If order matters, use `groupingBy`; if throughput matters, use `groupingByConcurrent`.

- **Q:** What is `Collectors.teeing` and when is it the right tool?
  > `teeing(c1, c2, merger)` (Java 12+) feeds every element to two independent downstream collectors simultaneously and merges their results with a `BiFunction`. It is the right tool when you need two different aggregations over the same stream and do not want to iterate the source twice. Example: compute min and max salary in one pass using `minBy` and `maxBy` as the two downstreams, then merge into a `Range` record. Before Java 12, this required either `summarizingInt` (only works for numeric stats) or two separate stream operations.

## Further reading

- [Collectors (Java 21 API)](https://docs.oracle.com/en/java/docs/api/java.base/java/util/stream/Collectors.html)
- [Collector (Java 21 API)](https://docs.oracle.com/en/java/docs/api/java.base/java/util/stream/Collector.html)
- [JEP 334 — JVM Constants API (context for Java 12 teeing)](https://openjdk.org/jeps/334)
- [Stuart Marks — Collectors deep dive (Devoxx)](https://www.youtube.com/watch?v=pGroX3gmeP8)
