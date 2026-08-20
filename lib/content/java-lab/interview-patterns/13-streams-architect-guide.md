# Collections, Optional & Stream API — Architect's Guide for Big Data

> Architect-level reasoning: when, why, and the trade-offs. All runnable.

---

## Part 1 — The PriorityQueue Pattern: Top-N in Large Data

```java
// BAD for large data: sort entire list O(n log n), O(n) memory
list.stream().sorted(Comparator.reversed()).limit(5).collect(...)

// GOOD: min-heap of size N — O(n log N) time, O(N) constant space
PriorityQueue<Employee> heap = new PriorityQueue<>(Comparator.comparingInt(Employee::getSalary));
for (Employee e : employees) {
    heap.offer(e);
    if (heap.size() > 5) heap.poll(); // evict smallest — keeps top 5
}
```

**Why it matters:** 100M records from a DB cursor — heap uses O(5) space, sort uses O(100M).

---

## Part 2 — Optional: flatMap vs map

```java
// map   → your function returns a plain value  (T → R)
Optional<Integer> len = opt.map(String::length);

// flatMap → your function already returns Optional  (T → Optional<R>)
Optional<Address> addr = findUser(id)
    .flatMap(User::getAddress)    // getAddress() returns Optional<Address>
    .flatMap(Address::getCity);   // getCity() returns Optional<String>
```

**orElseGet vs orElse:**
```java
// orElse: always evaluates the default (even when value present)
String a = opt.orElse(expensiveComputation()); // runs even if opt has value!

// orElseGet: lazy — only runs if empty
String b = opt.orElseGet(() -> expensiveComputation()); // always prefer this
```

---

## Part 3 — flatMap: Flattening Nested Structures

```java
// Orders → line items → total revenue (one pass, no intermediate lists)
double total = orders.stream()
    .flatMap(o -> o.getLineItems().stream()) // Order → Stream<LineItem>
    .mapToDouble(LineItem::getPrice)
    .sum();

// Users → Optional<Address> → cities (flatten Optional inside stream, Java 9+)
List<String> cities = users.stream()
    .map(User::getAddress)       // Stream<Optional<Address>>
    .flatMap(Optional::stream)   // flatten: removes empties, unwraps presents
    .map(Address::getCity)
    .collect(Collectors.toList());
```

---

## Part 4 — Logging Inside Streams: peek()

```java
List<Employee> result = employees.stream()
    .peek(e -> log.debug("[STREAM] input: {}", e.getName()))
    .filter(e -> e.getSalary() > 80_000)
    .peek(e -> log.debug("[STREAM] passed salary filter: {}", e.getName()))
    .filter(e -> "TECH".equals(e.getDept()))
    .peek(e -> log.debug("[STREAM] passed dept filter: {}", e.getName()))
    .collect(Collectors.toList());
```

**Rule:** `peek` is for debugging only — it's lazy and not guaranteed to fire if the terminal doesn't pull the element. Never use it for business logic.

---

## Part 5 — Parallel Streams: When They Help vs Hurt

```java
// GOOD: CPU-bound, large data, no shared state
double total = transactions.parallelStream()
    .mapToDouble(t -> t.getAmount() * t.getFxRate()) // pure computation
    .sum();

// BAD: shared mutable state — race condition
List<String> ids = new ArrayList<>();
transactions.parallelStream()
    .forEach(t -> ids.add(t.getId())); // DATA CORRUPTION

// CORRECT: collect() is thread-safe in parallel
List<String> ids = transactions.parallelStream()
    .map(Transaction::getId)
    .collect(Collectors.toList()); // thread-safe

// CRITICAL in Spring Boot: parallel stream uses common ForkJoinPool (shared JVM-wide)
// One slow stream starves all other parallel work. Use dedicated pool for heavy jobs:
ForkJoinPool pool = new ForkJoinPool(4);
List<Report> reports = pool.submit(() ->
    records.parallelStream().map(this::generateReport).collect(Collectors.toList())
).get();
pool.shutdown();
```

**Decision tree:**
- Data > 10K AND CPU-bound AND stateless → `parallelStream()` with dedicated pool
- IO-bound (DB, HTTP) → `CompletableFuture` with IO thread pool
- Everything else → sequential stream

---

## Part 6 — Key Collectors

```java
// groupingBy + downstream aggregation
Map<String, Long> countByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::getDept, Collectors.counting()));

Map<String, Optional<Employee>> topPaidByDept = employees.stream()
    .collect(Collectors.groupingBy(Employee::getDept,
        Collectors.maxBy(Comparator.comparingInt(Employee::getSalary))));

// partitioningBy: binary true/false split
Map<Boolean, List<Employee>> split = employees.stream()
    .collect(Collectors.partitioningBy(e -> e.getSalary() > 100_000));

// toMap: always provide merge fn to avoid exception on duplicate keys
Map<String, Employee> byId = employees.stream()
    .collect(Collectors.toMap(Employee::getId, e -> e, (a, b) -> a));

// collectingAndThen: apply transformation after collecting
List<Employee> unmodifiable = employees.stream()
    .collect(Collectors.collectingAndThen(Collectors.toList(), Collections::unmodifiableList));
```

---

## Part 7 — Big Data Architect Rules

**Rule 1: Push filtering to the DB — never load what you don't need.**
```java
// BAD: load 10M rows into Java heap
List<Transaction> all = repo.findAll();
long count = all.stream().filter(...).count(); // OOM risk

// GOOD: let the DB count it
long count = repo.countByStatusAndCreatedAtAfter(Status.PENDING, cutoff);
```

**Rule 2: DB cursor streaming for large result sets.**
```java
// Spring Data: stream the result set without materializing all rows
@Query("SELECT t FROM Transaction t WHERE t.status = :status")
Stream<Transaction> streamByStatus(@Param("status") Status status);

try (Stream<Transaction> stream = repo.streamByStatus(Status.PENDING)) {
    stream.filter(this::needsProcessing).forEach(this::process); // constant memory
}
```

**Rule 3: Avoid N+1 inside streams — batch load then join in memory.**
```java
// BAD: N DB calls inside stream
employees.stream().map(e -> deptRepo.findById(e.getDeptId())).collect(toList());

// GOOD: 1 batch query, in-memory join
Map<String, Dept> deptMap = deptRepo.findAllById(deptIds).stream()
    .collect(toMap(Dept::getId, d -> d));
employees.stream().map(e -> new DTO(e, deptMap.get(e.getDeptId()))).collect(toList());
```

**Rule 4: Primitive streams for numeric aggregation — no boxing overhead.**
```java
IntSummaryStatistics stats = employees.stream()
    .mapToInt(Employee::getSalary) // IntStream — no Integer boxing
    .summaryStatistics();
// stats.getMin(), getMax(), getAverage(), getSum(), getCount() — all in one pass
```

**Rule 5: Short-circuit aggressively.**
```java
// Stop at first match — don't scan all 10M records
boolean hasSuspicious = transactions.stream()
    .anyMatch(t -> t.getAmount() > FRAUD_THRESHOLD); // O(1) best case

// At-least-5 pattern: limit then count (short-circuits after 5 matches)
long count = records.stream().filter(condition).limit(5).count();
boolean atLeast5 = count >= 5;
```

---

## Interview Scenarios

### Top 5 highest-paid per department

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

### Products appearing in at least 5 orders

```java
// flatMap orders → productIds, count frequency, filter
Set<String> popular = orders.stream()
    .flatMap(o -> o.getProductIds().stream())
    .collect(Collectors.groupingBy(id -> id, Collectors.counting()))
    .entrySet().stream()
    .filter(e -> e.getValue() >= 5)
    .map(Map.Entry::getKey)
    .collect(Collectors.toSet());
```

### What's wrong with this?

```java
// BUG: ArrayList is not thread-safe under parallel stream
List<String> results = new ArrayList<>();
transactions.parallelStream().forEach(t -> results.add(t.getId())); // race condition

// FIX:
List<String> results = transactions.parallelStream()
    .map(Transaction::getId)
    .collect(Collectors.toList()); // thread-safe
```

---

---

## Part 8 — What Senior Interviews Actually Test (The Gaps)

### sorted() and distinct() Are O(n) Memory Traps

```java
// sorted() MUST buffer ALL elements before emitting the first one
// Even with limit(5) after it — sorted sees everything first
stream.sorted().limit(5) // O(n) memory, not O(5)

// distinct() maintains a HashSet of every seen element
// 10M unique values = 10M HashSet entries → huge memory
stream.distinct() // O(n) memory

// RULE: for big data, use DB ORDER BY / DISTINCT — never sort/distinct a large stream
```

### reduce() vs collect() — The Parallel Correctness Trap

```java
// reduce: pure immutable folding → a single value (correct in parallel)
int sum = employees.stream().mapToInt(Employee::getSalary).reduce(0, Integer::sum);

// WRONG: reduce to build a List — identity ArrayList is SHARED across parallel threads
List<String> bad = employees.parallelStream()
    .map(Employee::getName)
    .reduce(new ArrayList<>(),                            // SHARED identity — race condition
            (list, name) -> { list.add(name); return list; }, // mutates!
            (l1, l2) -> { l1.addAll(l2); return l1; });

// CORRECT: collect() gives each thread its own container, then merges
List<String> good = employees.parallelStream()
    .map(Employee::getName)
    .collect(Collectors.toList()); // thread-safe
```

### Streams Cannot Be Reused

```java
Stream<Employee> s = employees.stream().filter(e -> e.getSalary() > 100_000);
long count = s.count();             // terminal — stream consumed
List<Employee> list = s.collect(Collectors.toList()); // THROWS IllegalStateException

// FIX: use Supplier to create fresh streams
Supplier<Stream<Employee>> src = () -> employees.stream().filter(e -> e.getSalary() > 100_000);
long count = src.get().count();
List<Employee> list = src.get().collect(Collectors.toList());
```

### findFirst() vs findAny() in Parallel

```java
// findFirst(): guarantees encounter order — threads must coordinate → slower in parallel
employees.parallelStream().filter(...).findFirst(); // ordering overhead

// findAny(): returns whichever thread finds first → faster in parallel
employees.parallelStream().filter(...).findAny();   // no ordering constraint

// RULE: use findAny() in parallel when you just need "any matching element"
```

### Stream.iterate() for Lazy Pagination

```java
// Process 10M DB records without loading them all — Java 9+
Stream.iterate(0, page -> page + 1)
    .map(page -> repo.findAll(PageRequest.of(page, 1000)))
    .takeWhile(batch -> !batch.isEmpty())
    .flatMap(List::stream)
    .forEach(this::process); // constant memory, one page at a time
```

### Collectors.teeing() — Two Aggregations in One Pass (Java 12+)

```java
// WITHOUT teeing: scan data twice
long count = stream1.count();
double avg = stream2.mapToInt(...).average().orElse(0);

// WITH teeing: one pass, two results
record Stats(long count, double avg) {}
Stats s = employees.stream()
    .collect(Collectors.teeing(
        Collectors.counting(),
        Collectors.averagingInt(Employee::getSalary),
        Stats::new
    ));
```

### groupingByConcurrent for Parallel Grouping

```java
// groupingBy in parallel: threads collect locally, then MERGE maps (sequential overhead)
// groupingByConcurrent: all threads write directly to ONE ConcurrentHashMap — no merge
Map<String, List<Employee>> byDept = employees.parallelStream()
    .collect(Collectors.groupingByConcurrent(Employee::getDept)); // faster in parallel

// CAVEAT: does NOT preserve encounter order within groups
```

### Custom Collector with Collector.of()

```java
// Collect last N elements (ring buffer) — not possible with built-in collectors
static <T> Collector<T, ?, List<T>> lastN(int n) {
    return Collector.of(
        ArrayDeque::new,
        (deque, t) -> { deque.addLast(t); if (deque.size() > n) deque.pollFirst(); },
        (d1, d2) -> { d1.addAll(d2); while (d1.size() > n) d1.pollFirst(); return d1; },
        ArrayList::new
    );
}
// Usage:
List<Transaction> last5 = transactions.stream().collect(lastN(5));
```

### Exception Handling in Streams — Result Wrapper Pattern

```java
// Checked exceptions don't compile in lambdas — wrap or use result pattern
record Result<T>(T value, Exception error) {
    static <T> Result<T> of(Supplier<T> fn) {
        try { return new Result<>(fn.get(), null); }
        catch (Exception e) { return new Result<>(null, e); }
    }
    boolean isSuccess() { return error == null; }
}

// Collect successes and failures separately in one pass
Map<Boolean, List<Result<String>>> results = files.stream()
    .map(f -> Result.of(() -> Files.readString(f)))
    .collect(Collectors.partitioningBy(Result::isSuccess));

List<String> ok     = results.get(true).stream().map(r -> r.value()).toList();
List<Exception> err = results.get(false).stream().map(r -> r.error()).toList();
```

### WeakHashMap and SoftReference for Memory-Sensitive Caches

```java
// SoftReference: kept until JVM needs memory — GC'd before OutOfMemoryError
// Perfect for in-process report/image caches under memory pressure
Map<String, SoftReference<byte[]>> cache = new HashMap<>();

byte[] report = Optional.ofNullable(cache.get("key"))
    .map(SoftReference::get)   // null if already GC'd
    .orElseGet(() -> {
        byte[] fresh = generate();
        cache.put("key", new SoftReference<>(fresh));
        return fresh;
    });

// WeakHashMap: entry removed when KEY has no other strong references
// Perfect for: metadata caches keyed by objects that may become unreachable
Map<Object, Metadata> meta = new WeakHashMap<>();
```

| Type | GC'd When | Use For |
|------|-----------|---------|
| Strong ref | Never (while referenced) | Regular objects |
| `SoftReference` | Before OOM | Memory-sensitive cache |
| `WeakReference` | Next GC cycle | Listener registries |
| `WeakHashMap` | Key becomes unreachable | Metadata caches |

---

## Cheat Sheet

```
map     → T → R                    (1 to 1)
flatMap → T → Stream<R>            (1 to many, flattens)

Optional.map     → T → R           (wraps in Optional)
Optional.flatMap → T → Optional<R> (no double-wrapping)

orElse(val)     → always evaluates val (eager)
orElseGet(fn)   → lazy, only when empty  ← prefer for expensive defaults

sorted()  = O(n) memory — buffers ALL elements (even with limit after it)
distinct() = O(n) memory — HashSet of every seen element
→ For big data: push ORDER BY / DISTINCT to the DB

sorted() in parallel = expensive (merge step is sequential)
forEach in parallel  = unsafe with mutable shared state
collect(toList())    = thread-safe in parallel
reduce(mutableList)  = WRONG in parallel (shared identity)

findFirst() parallel = ordering overhead (thread coordination)
findAny()   parallel = faster (no ordering constraint)

Stream reuse         = IllegalStateException — use Supplier<Stream<T>>

Top-N big data      = PriorityQueue min-heap size N  (O(n log N), O(N) space)
At-least-N check    = filter().limit(N).count() == N  (short-circuit)
Two aggregations    = Collectors.teeing() — one pass
Numeric stats       = mapToInt().summaryStatistics()  (single pass, no boxing)
Parallel grouping   = groupingByConcurrent (no merge overhead)
Custom aggregation  = Collector.of(supplier, accumulator, combiner, finisher)
Exception in stream = Result<T> wrapper + partitioningBy(isSuccess)
Memory cache        = SoftReference (yields on pressure) / WeakHashMap (auto-evicts)
```
