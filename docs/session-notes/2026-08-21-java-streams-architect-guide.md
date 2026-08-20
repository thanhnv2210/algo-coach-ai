# Java Collections, Optional & Stream API — Architect's Guide for Big Data

> Interview prep focus: architect-level reasoning on when, why, and trade-offs.
> All examples use `public class JavaLabRunner` — paste directly into Java Lab to run.

---

## Part 1 — Collections Under Load

### Memory Reality Check

Before choosing a collection, estimate its footprint:

| Collection | Per-element overhead | 1M integers |
|------------|---------------------|-------------|
| `int[]` | 4 bytes | ~4 MB |
| `ArrayList<Integer>` | ~16 bytes (boxed) + reference | ~20 MB |
| `HashMap<Integer,Integer>` | ~48 bytes per entry | ~48 MB |
| `LinkedList<Integer>` | ~40 bytes (node + 2 pointers) | ~40 MB |

**Architect rule:** For large numeric datasets, prefer primitive arrays or `int[]`/`long[]`. Boxing is the #1 hidden memory cost.

### Which Collection for Which Problem

| Problem | Wrong choice | Right choice | Why |
|---------|-------------|--------------|-----|
| Random access by index | `LinkedList` | `ArrayList` | O(1) vs O(n) |
| FIFO queue | `LinkedList` | `ArrayDeque` | No node allocation overhead |
| Sorted unique keys | `HashMap` | `TreeMap` | `floorKey`, `ceilingKey`, range queries |
| Deduplicate + maintain order | `HashSet` | `LinkedHashSet` | Insertion order preserved |
| Top-N from large stream | `List + sort` | `PriorityQueue(N)` | O(n log N) vs O(n log n) — heap only holds N elements |
| Concurrent counter | `AtomicInteger` | `LongAdder` | Striped cells = less contention under high write load |
| Thread-safe map | `Hashtable`, `synchronizedMap` | `ConcurrentHashMap` | Segment-level locking, not full-table lock |
| Frequency map | manual loops | `getOrDefault` / `merge` | Clean and safe for concurrent updates with `compute` |

### The PriorityQueue Pattern for Top-N (Critical for Big Data)

```java
// BAD for large data: sort entire list, then take 5
// O(n log n) time, O(n) space — loads everything into memory
List<Employee> top5 = employees.stream()
    .sorted(Comparator.comparingInt(Employee::getSalary).reversed())
    .limit(5)
    .collect(Collectors.toList());

// GOOD for large data: min-heap of size N
// O(n log N) time, O(N) space — heap never grows beyond 5 elements
PriorityQueue<Employee> minHeap = new PriorityQueue<>(
    Comparator.comparingInt(Employee::getSalary)); // min at top

for (Employee e : employees) {
    minHeap.offer(e);
    if (minHeap.size() > 5) {
        minHeap.poll(); // remove the smallest — keeps top 5
    }
}

// Drain heap (ascending order — reverse if you need descending)
List<Employee> top5 = new ArrayList<>(minHeap);
top5.sort(Comparator.comparingInt(Employee::getSalary).reversed());
```

**When it matters:** 100M records from a DB cursor — you cannot afford O(n) memory. The heap approach uses constant O(5) space regardless of input size.

---

## Part 2 — Optional: Correct Usage

### What Optional IS and IS NOT

- **IS:** A return type signal that says "this method may return nothing"
- **IS NOT:** A null replacement everywhere, a field type, a method parameter type

```java
// BAD — Optional as field (serialization breaks, no benefit)
class User {
    private Optional<String> email; // WRONG
}

// BAD — Optional as parameter (callers can pass Optional.empty() or null — ambiguous)
void send(Optional<String> email) { } // WRONG

// GOOD — Optional as return type only
Optional<User> findById(String id) { ... }
```

### The Key Operations

```java
Optional<String> opt = Optional.ofNullable(getValue());

// orElse       — always evaluates the default (eager)
String a = opt.orElse(expensiveDefault()); // expensiveDefault() runs even if opt has value

// orElseGet    — lazy, only evaluates if empty (ALWAYS prefer for expensive defaults)
String b = opt.orElseGet(() -> expensiveDefault()); // only runs if empty

// orElseThrow  — explicit exception, preferred over get()
String c = opt.orElseThrow(() -> new NotFoundException("Not found"));

// map          — transform the value if present
Optional<Integer> length = opt.map(String::length);

// filter       — keep value only if condition passes
Optional<String> longStr = opt.filter(s -> s.length() > 10);

// ifPresent    — side effect only
opt.ifPresent(s -> log.info("Found: {}", s));

// ifPresentOrElse (Java 9+) — handle both cases
opt.ifPresentOrElse(
    s -> log.info("Found: {}", s),
    () -> log.warn("Not found")
);
```

### flatMap on Optional — Nested Nullables

```java
// Without flatMap: nested Optional<Optional<String>>
Optional<User> user = findUser(id);
Optional<Optional<Address>> bad = user.map(u -> u.getAddress()); // Optional<Optional<Address>>

// With flatMap: flattens to Optional<Address>
Optional<Address> address = user.flatMap(u -> u.getAddress());
Optional<String> city     = address.flatMap(a -> a.getCity());

// Chained (the power of flatMap — no null checks, no nested ifs)
Optional<String> city = findUser(id)
    .flatMap(User::getAddress)
    .flatMap(Address::getCity)
    .filter(c -> !c.isBlank());

// Without Optional (what you'd write instead):
String city = null;
User user = findUser(id);
if (user != null) {
    Address addr = user.getAddress();
    if (addr != null) {
        city = addr.getCity();
    }
}
```

**Architect rule:** `flatMap` is for methods that themselves return `Optional`. `map` is for methods that return plain values.

---

## Part 3 — Stream API Deep Dive

### How Streams Work Internally (Architect Mental Model)

```
source → [intermediate ops — lazy pipeline] → terminal op → result
```

- **Lazy:** intermediate operations (`filter`, `map`, `flatMap`, `sorted`) do NOT execute until a terminal operation is called
- **Fused:** the JVM can fuse filter + map into a single pass — no intermediate collection created
- **Short-circuit:** `findFirst`, `anyMatch`, `limit` stop processing as soon as the answer is known

```java
// This processes at most 1 element (short-circuit at findFirst)
Optional<Employee> found = employees.stream()
    .filter(e -> e.getDept().equals("TECH"))
    .filter(e -> e.getSalary() > 100_000)
    .findFirst(); // stops after first match

// This processes EVERY element (no short-circuit)
long count = employees.stream()
    .filter(e -> e.getSalary() > 100_000)
    .count(); // must see all elements
```

### map vs flatMap

```java
// map: 1 input → 1 output (transforms each element)
List<String> names = employees.stream()
    .map(Employee::getName)         // Employee → String
    .collect(Collectors.toList());

// flatMap: 1 input → 0..N outputs (flattens nested streams)
// Use when each element maps to a collection
List<String> allSkills = employees.stream()
    .flatMap(e -> e.getSkills().stream()) // Employee → Stream<String>
    .distinct()
    .sorted()
    .collect(Collectors.toList());

// Real example: orders → line items → total revenue
double totalRevenue = orders.stream()
    .flatMap(order -> order.getLineItems().stream()) // Order → Stream<LineItem>
    .mapToDouble(LineItem::getPrice)
    .sum();

// flatMap on Optional inside a stream
List<String> cities = users.stream()
    .map(User::getAddress)             // Stream<Optional<Address>>
    .flatMap(Optional::stream)         // flatten: remove empties, unwrap presents (Java 9+)
    .map(Address::getCity)
    .collect(Collectors.toList());
```

### Logging Inside a Stream: peek()

`peek()` is an intermediate operation for side effects. **Only use for debugging — never for business logic.**

```java
List<Employee> result = employees.stream()
    .peek(e -> log.debug("[STREAM] before filter: {}", e.getName()))
    .filter(e -> e.getSalary() > 80_000)
    .peek(e -> log.debug("[STREAM] after salary filter: {}", e.getName()))
    .filter(e -> e.getDept().equals("TECH"))
    .peek(e -> log.debug("[STREAM] after dept filter: {}", e.getName()))
    .collect(Collectors.toList());

// Pattern for production: conditional peek (log only when DEBUG enabled to avoid string building)
.peek(e -> { if (log.isDebugEnabled()) log.debug("Processing: {}", e.getId()); })
```

**Architect warning:** `peek()` is lazy — it only fires when the terminal operation pulls elements. Never rely on it for guaranteed side effects.

### Find Top 5 — Three Approaches

```java
// Approach 1: sorted + limit (simple, good for in-memory lists)
// O(n log n) time, O(n) space
List<Employee> top5 = employees.stream()
    .sorted(Comparator.comparingInt(Employee::getSalary).reversed())
    .limit(5)
    .collect(Collectors.toList());

// Approach 2: PriorityQueue collector (best for large data — O(n log 5) time, O(5) space)
int N = 5;
Comparator<Employee> bySalaryDesc = Comparator.comparingInt(Employee::getSalary).reversed();
List<Employee> top5 = employees.stream()
    .collect(Collectors.collectingAndThen(
        Collectors.toCollection(() -> new PriorityQueue<>(N + 1,
            Comparator.comparingInt(Employee::getSalary))), // min-heap
        heap -> {
            List<Employee> result = new ArrayList<>(heap);
            result.sort(bySalaryDesc);
            return result;
        }
    ));

// Approach 3: minHeap manual reduce (most explicit, interview-friendly)
PriorityQueue<Employee> heap = employees.stream()
    .collect(() -> new PriorityQueue<>(N + 1, Comparator.comparingInt(Employee::getSalary)),
             (h, e) -> { h.offer(e); if (h.size() > N) h.poll(); },
             (h1, h2) -> { h1.addAll(h2); while (h1.size() > N) h1.poll(); });
```

**Interview answer:** "For in-memory lists under ~100K, `sorted + limit` is readable and fine. For streaming large datasets from DB or files where I can't hold everything in memory, I use a min-heap of size N — constant space, single pass."

### Find At Least 5 Objects Matching a Condition

```java
// Exactly: find AT LEAST 5 — verify count meets threshold
List<Employee> result = employees.stream()
    .filter(e -> e.getYearsOfExperience() >= 5 && e.getDept().equals("TECH"))
    .limit(10)        // cap how many we collect (avoid loading millions)
    .collect(Collectors.toList());

boolean hasEnough = result.size() >= 5;

// Or: short-circuit check without collecting
long matchCount = employees.stream()
    .filter(e -> e.getStatus() == Status.ACTIVE)
    .limit(5)          // stop counting after 5 — short-circuit!
    .count();
boolean atLeast5 = matchCount >= 5;

// Or: anyMatch-style with counter (Java has no built-in "atLeastN match")
// Best: use limit(N).count() == N pattern above — it's O(first N matches), not O(n)
```

### Collectors Deep Dive

```java
// groupingBy — frequency / aggregation (the most powerful collector)
Map<String, List<Employee>> byDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::getDept));

// groupingBy + downstream aggregation
Map<String, Long> countByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::getDept, Collectors.counting()));

Map<String, Double> avgSalaryByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::getDept,
        Collectors.averagingInt(Employee::getSalary)));

Map<String, Optional<Employee>> highestPaidByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::getDept,
        Collectors.maxBy(Comparator.comparingInt(Employee::getSalary))));

// partitioningBy — binary split (true/false)
Map<Boolean, List<Employee>> partition = employees.stream()
    .collect(Collectors.partitioningBy(e -> e.getSalary() > 100_000));
List<Employee> highPaid = partition.get(true);
List<Employee> lowPaid  = partition.get(false);

// toMap — must handle duplicates explicitly
Map<String, Employee> byId = employees.stream()
    .collect(Collectors.toMap(
        Employee::getId,
        e -> e,
        (existing, replacement) -> existing // merge fn: keep first on duplicate key
    ));

// joining — String concatenation
String names = employees.stream()
    .map(Employee::getName)
    .collect(Collectors.joining(", ", "[", "]")); // [Alice, Bob, Charlie]
```

---

## Part 4 — Parallel Streams

### When Parallel Helps vs Hurts

| Scenario | Parallel | Why |
|----------|----------|-----|
| CPU-bound, large data (>10K elements), no shared state | YES | Work split across ForkJoinPool |
| IO-bound (DB calls, HTTP) | NO | Threads block on IO — use CompletableFuture instead |
| Small collections (<1K) | NO | Fork/join overhead > benefit |
| Ordered operations (`findFirst`, `forEachOrdered`) | CAREFUL | Requires re-merging order — negates speed gain |
| Shared mutable state | NEVER | Race conditions, data corruption |
| `sorted()` | CAREFUL | Must merge sorted sub-lists — expensive |

```java
// GOOD: CPU-bound computation, stateless, large data
double totalRevenue = orders.parallelStream()
    .mapToDouble(o -> o.getAmount() * o.getFxRate()) // pure computation
    .sum();

// BAD: shared mutable state — race condition
List<Employee> results = new ArrayList<>(); // NOT thread-safe
employees.parallelStream()
    .filter(e -> e.getSalary() > 100_000)
    .forEach(results::add); // DATA CORRUPTION — use collect() instead

// CORRECT: thread-safe collection
List<Employee> results = employees.parallelStream()
    .filter(e -> e.getSalary() > 100_000)
    .collect(Collectors.toList()); // Collectors.toList() is thread-safe in parallel
```

### Custom Thread Pool for Parallel Streams

By default, parallel streams use the **common ForkJoinPool** (shared across the entire JVM). This is a problem in Spring Boot — one slow parallel stream can starve other requests.

```java
// PROBLEM: common pool is shared — a slow stream blocks other parallel work in the JVM
employees.parallelStream().filter(...).collect(...); // uses common ForkJoinPool

// SOLUTION: submit to a dedicated ForkJoinPool
ForkJoinPool customPool = new ForkJoinPool(4); // 4 threads, isolated from common pool
try {
    List<Employee> result = customPool.submit(() ->
        employees.parallelStream()
            .filter(e -> e.getSalary() > 100_000)
            .collect(Collectors.toList())
    ).get();
} finally {
    customPool.shutdown();
}

// Better: inject as a Spring bean with fixed pool size
@Bean("streamPool")
public ForkJoinPool streamProcessingPool() {
    return new ForkJoinPool(
        Runtime.getRuntime().availableProcessors() / 2 // don't starve web threads
    );
}
```

### Parallel Stream vs CompletableFuture

```java
// Parallel stream: best for CPU-bound, in-memory transformations
List<Report> reports = transactions.parallelStream()
    .map(this::generateReport) // pure CPU work
    .collect(Collectors.toList());

// CompletableFuture: best for IO-bound (DB, HTTP calls)
List<CompletableFuture<CustomerProfile>> futures = customerIds.stream()
    .map(id -> CompletableFuture.supplyAsync(
        () -> profileClient.fetch(id),  // IO-bound: HTTP call
        Executors.newFixedThreadPool(20) // dedicated IO pool, not ForkJoinPool
    ))
    .collect(Collectors.toList());

List<CustomerProfile> profiles = futures.stream()
    .map(CompletableFuture::join)
    .collect(Collectors.toList());
```

---

## Part 5 — Big Data Architect Patterns

### Rule 1: Never Collect What You Don't Need

```java
// BAD: collect 10M records into memory, then process
List<Transaction> all = txnRepo.findAll(); // OutOfMemoryError waiting to happen
long count = all.stream().filter(...).count();

// GOOD: push the filter to the DB, return only the count
long count = txnRepo.countByStatusAndCreatedAtAfter(Status.PENDING, cutoff);

// GOOD: use a DB cursor / streaming query (Spring Data)
@Query("SELECT t FROM Transaction t WHERE t.status = :status")
@QueryHints(@QueryHint(name = HINT_FETCH_SIZE, value = "1000"))
Stream<Transaction> streamByStatus(@Param("status") Status status);

// Then consume as a stream — never materializes all rows
try (Stream<Transaction> stream = txnRepo.streamByStatus(Status.PENDING)) {
    stream
        .filter(t -> t.getAmount().compareTo(THRESHOLD) > 0)
        .forEach(this::process); // processes in chunks, constant memory
}
```

### Rule 2: Chunk Large Processing Jobs

```java
// Process 10M records in batches of 1000 — safe memory footprint
int batchSize = 1000;
int offset = 0;
List<Transaction> batch;

do {
    batch = txnRepo.findAllByStatus(Status.PENDING, PageRequest.of(offset / batchSize, batchSize));
    batch.stream()
        .filter(this::requiresProcessing)
        .forEach(this::processTransaction);
    offset += batchSize;
} while (batch.size() == batchSize);
```

### Rule 3: Short-Circuit Aggressively

```java
// Does ANY transaction exceed the fraud threshold?
// Stop at the first match — don't scan all 10M
boolean hasSuspicious = transactions.stream()
    .anyMatch(t -> t.getAmount().compareTo(FRAUD_THRESHOLD) > 0); // O(1) best case

// Find the first unprocessed item
Optional<Transaction> next = transactions.stream()
    .filter(t -> t.getStatus() == Status.PENDING)
    .findFirst(); // stops at first match
```

### Rule 4: Prefer Primitive Streams for Numeric Aggregations

```java
// BAD: Stream<Integer> — boxing overhead on every element
OptionalDouble avg = employees.stream()
    .map(Employee::getSalary)          // Stream<Integer> — boxed
    .mapToDouble(Integer::doubleValue) // unbox
    .average();

// GOOD: go directly to primitive stream
OptionalDouble avg = employees.stream()
    .mapToInt(Employee::getSalary)     // IntStream — no boxing
    .average();

// For stats summary in one pass:
IntSummaryStatistics stats = employees.stream()
    .mapToInt(Employee::getSalary)
    .summaryStatistics();
// stats.getMin(), getMax(), getAverage(), getSum(), getCount() — all in O(n), single pass
```

### Rule 5: Detect N+1 in Streams

```java
// CLASSIC N+1: 1 query for employees + N queries for each employee's department
employees.stream()
    .map(e -> deptRepo.findById(e.getDeptId())) // N DB calls inside stream!
    .collect(Collectors.toList());

// FIX: batch load departments, then join in memory
Set<String> deptIds = employees.stream()
    .map(Employee::getDeptId)
    .collect(Collectors.toSet());
Map<String, Department> deptMap = deptRepo.findAllById(deptIds).stream()
    .collect(Collectors.toMap(Department::getId, d -> d)); // 1 query

List<EmployeeDTO> result = employees.stream()
    .map(e -> new EmployeeDTO(e, deptMap.get(e.getDeptId()))) // in-memory join
    .collect(Collectors.toList());
```

---

## Part 6 — Interview Scenarios with Answers

### Q: "Find the top 5 highest-paid employees in each department."

```java
Map<String, List<Employee>> top5ByDept = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::getDept,
        Collectors.collectingAndThen(
            Collectors.toList(),
            list -> list.stream()
                .sorted(Comparator.comparingInt(Employee::getSalary).reversed())
                .limit(5)
                .collect(Collectors.toList())
        )
    ));
```

**Architect caveat:** If each department has millions of employees, the `collectingAndThen` approach loads all of them into the intermediate list. For massive datasets, group at the DB level with `ROW_NUMBER() OVER (PARTITION BY dept ORDER BY salary DESC)`.

---

### Q: "From a list of orders, find all products that appear in at least 5 orders."

```java
// Step 1: flatMap orders → products, build frequency map
Map<String, Long> productOrderCount = orders.stream()
    .flatMap(order -> order.getProductIds().stream()) // Order → Stream<String>
    .collect(Collectors.groupingBy(id -> id, Collectors.counting()));

// Step 2: filter by threshold
Set<String> popularProducts = productOrderCount.entrySet().stream()
    .filter(e -> e.getValue() >= 5)
    .map(Map.Entry::getKey)
    .collect(Collectors.toSet());
```

---

### Q: "Process a list of transactions in parallel but ensure no duplicate processing."

```java
// Use ConcurrentHashMap as a processed-set guard
ConcurrentHashMap<String, Boolean> processed = new ConcurrentHashMap<>();

transactions.parallelStream()
    .filter(t -> processed.putIfAbsent(t.getId(), Boolean.TRUE) == null) // atomic check+mark
    .forEach(this::processTransaction);
```

---

### Q: "What's wrong with this code?"

```java
// Interviewer shows you:
List<String> results = new ArrayList<>();
transactions.parallelStream()
    .filter(t -> t.getAmount() > 1000)
    .forEach(t -> results.add(t.getId())); // BUG

// Your answer:
// ArrayList is not thread-safe. parallelStream() runs forEach on multiple threads.
// Results in race condition: lost updates, ConcurrentModificationException, wrong size.
// Fix: use collect(Collectors.toList()) which is thread-safe in parallel context.

List<String> results = transactions.parallelStream()
    .filter(t -> t.getAmount() > 1000)
    .map(Transaction::getId)
    .collect(Collectors.toList()); // CORRECT
```

---

### Q: "Why does sorted() hurt parallel stream performance?"

```java
// sorted() in parallel requires:
// 1. Split data across threads (fast)
// 2. Sort each partition (parallel — good)
// 3. MERGE sorted partitions back into one sorted stream (sequential bottleneck)
//
// The merge step is O(n) and sequential — it serializes the benefit of parallelism.
// For truly large sorted operations: use a DB ORDER BY instead.
```

---

### Q: "When would you NOT use Stream API?"

1. **Simple loop with early exit based on external state** — a plain `for` loop is cleaner
2. **Stack/recursion algorithms** (DFS, tree traversal) — streams are not designed for recursive decomposition
3. **Modifying the source collection while iterating** — `ConcurrentModificationException`
4. **When you need the index** — streams don't expose indices naturally (`IntStream.range` is a workaround but ugly)
5. **Exception-heavy code** — checked exceptions in lambdas require ugly wrappers

```java
// Ugly: checked exception in stream
files.stream()
    .map(f -> {
        try { return Files.readString(f); }
        catch (IOException e) { throw new UncheckedIOException(e); } // boilerplate
    })
    .collect(Collectors.toList());

// Cleaner: plain for loop
List<String> contents = new ArrayList<>();
for (Path f : files) {
    contents.add(Files.readString(f)); // IOException propagates naturally
}
```

---

## Quick Reference Cheat Sheet

```
STREAM OPERATIONS
─────────────────
Intermediate (lazy):   filter, map, flatMap, distinct, sorted, peek, limit, skip
Terminal (triggers):   collect, forEach, count, findFirst, anyMatch, allMatch, noneMatch, reduce, sum, min, max

FLATMAP RULE
────────────
map     → when the mapping function returns a plain value (T → R)
flatMap → when the mapping function returns a Stream/Optional (T → Stream<R> or T → Optional<R>)

OPTIONAL RULE
─────────────
map     → when the mapping function returns a plain value (T → R) → Optional<R>
flatMap → when the mapping function already returns Optional (T → Optional<R>) → Optional<R>

PARALLEL STREAM DECISION TREE
──────────────────────────────
Is data > 10K elements?        NO  → sequential
Is work CPU-bound (no IO)?     NO  → CompletableFuture with IO thread pool
Is there shared mutable state? YES → sequential or use thread-safe collectors
Is order important?            YES → careful with sorted/findFirst
→ All YES: parallelStream() with dedicated ForkJoinPool

TOP-N STRATEGY
──────────────
< 100K in memory  → stream().sorted().limit(N)
> 100K or streaming → PriorityQueue min-heap of size N (O(n log N), O(N) space)
From DB            → SQL: ORDER BY salary DESC LIMIT 5

COLLECTORS CHEAT SHEET
───────────────────────
toList()                    → List
toSet()                     → Set (deduped)
toMap(key, val, mergeFunc)  → Map (always provide merge fn to avoid exception on dupe keys)
groupingBy(classifier)      → Map<K, List<V>>
groupingBy(c, downstream)   → Map<K, R> (with counting, summing, maxBy, etc.)
partitioningBy(predicate)   → Map<Boolean, List<V>>
joining(delim, prefix, suf) → String
counting()                  → Long
summingInt/Long/Double      → numeric aggregate
averagingInt/Long/Double    → double average
collectingAndThen(c, fn)    → apply fn after collection (e.g. unmodifiableList)
```

---

## Last-Minute Interview Rules

1. **Always ask about data size before choosing algorithm.** "How many records are we talking about?"
2. **Never sort to find top-N in big data.** Use a min-heap / PriorityQueue.
3. **Parallel stream ≠ always faster.** Mention the common ForkJoinPool risk in Spring Boot.
4. **`orElseGet` not `orElse` for expensive defaults.** `orElse` always evaluates.
5. **`flatMap` flattens one level.** If you have `Stream<Stream<T>>`, flatMap gives you `Stream<T>`.
6. **`peek` is for debugging only.** Never rely on it for business logic — it's not guaranteed to fire.
7. **`collect(Collectors.toList())` is thread-safe in parallel.** `new ArrayList<> + forEach` is not.
8. **Push filtering to the DB.** A stream over 10M rows loaded into a Java List is always wrong.
9. **`IntSummaryStatistics` for multi-stat aggregation.** Single pass for min, max, avg, count, sum.
10. **Checked exceptions don't work cleanly in lambdas.** Know how to wrap them (`UncheckedIOException`, etc.) or when to use a plain loop instead.
