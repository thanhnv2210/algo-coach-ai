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

## Cheat Sheet

```
map     → T → R                    (1 to 1)
flatMap → T → Stream<R>            (1 to many, flattens)

Optional.map     → T → R           (wraps in Optional)
Optional.flatMap → T → Optional<R> (no double-wrapping)

orElse(val)     → always evaluates val
orElseGet(fn)   → lazy, evaluates fn only when empty  ← prefer this

sorted() in parallel = expensive (merge step is sequential)
forEach in parallel  = unsafe with mutable shared state
collect(toList())    = thread-safe in parallel

Top-N big data      = PriorityQueue min-heap size N
At-least-N check    = filter().limit(N).count() == N  (short-circuit)
Numeric stats       = mapToInt().summaryStatistics()   (single pass, no boxing)
```
