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

## Part 9 — Loading Big Data Into a Stream

> The right source determines memory and latency. Each pattern below uses constant heap regardless of dataset size.

### 1. From a File (Lines)

```java
// Lines: lazy — reads one line at a time, never loads the whole file
try (Stream<String> lines = Files.lines(Path.of("/data/transactions.csv"))) {
    lines.skip(1)                              // skip CSV header
         .map(line -> line.split(","))
         .filter(cols -> "PENDING".equals(cols[2]))
         .map(cols -> new Transaction(cols[0], cols[1], cols[2]))
         .forEach(this::process);              // constant memory
}
// MUST close: Files.lines() opens a FileChannel — use try-with-resources

// Large binary file: read in chunks via BufferedReader
try (BufferedReader reader = new BufferedReader(new FileReader("/data/large.log"), 8192)) {
    reader.lines()
          .filter(line -> line.contains("ERROR"))
          .forEach(System.out::println);
}
```

### 2. From a Database (Spring Data Cursor Stream)

```java
// Repository: declare return type as Stream<T> — Spring keeps the cursor open
@Query("SELECT t FROM Transaction t WHERE t.status = :status")
@QueryHints(@QueryHint(name = HINT_FETCH_SIZE, value = "1000")) // fetch 1000 rows at a time from DB
Stream<Transaction> streamByStatus(@Param("status") Status status);

// Service: always wrap in try-with-resources + @Transactional (cursor needs an open session)
@Transactional(readOnly = true)
public void processAll() {
    try (Stream<Transaction> stream = repo.streamByStatus(Status.PENDING)) {
        stream.filter(this::needsProcessing)
              .forEach(this::process);         // O(fetch_size) memory, not O(total rows)
    }
}

// JdbcTemplate alternative (no JPA overhead):
jdbcTemplate.query(
    "SELECT id, amount, status FROM transactions WHERE status = 'PENDING'",
    rs -> {
        while (rs.next()) {
            process(new Transaction(rs.getString("id"), rs.getBigDecimal("amount")));
        }
    }
);
```

### 3. From a DB with Lazy Pagination (Stream.iterate)

```java
// When you can't stream the cursor directly (e.g. read-only replica, external API)
// Java 9+ — generates pages lazily; takeWhile stops when page is empty
Stream.iterate(0, page -> page + 1)
    .map(page -> repo.findAll(PageRequest.of(page, 1000)))
    .takeWhile(slice -> !slice.isEmpty())
    .flatMap(List::stream)
    .forEach(this::process);               // only one page (1000 rows) in memory at a time
```

### 4. From an HTTP / REST API (Paginated)

```java
// Page through an external API lazily — no List<T> accumulation
Stream.iterate(1, page -> page + 1)
    .map(page -> restTemplate.getForObject(
        "https://api.example.com/transactions?page={p}&size=200",
        TransactionPage.class, page))
    .takeWhile(page -> page != null && !page.getContent().isEmpty())
    .flatMap(page -> page.getContent().stream())
    .filter(t -> t.getAmount().compareTo(THRESHOLD) > 0)
    .forEach(this::process);

// With WebClient (reactive, non-blocking):
Flux<Transaction> flux = webClient.get()
    .uri("/transactions/stream")           // server sends application/x-ndjson or text/event-stream
    .retrieve()
    .bodyToFlux(Transaction.class);        // back-pressure: only pulls what consumer can handle

// Bridge reactive → Stream (blocking consumer):
flux.toStream().forEach(this::process);
```

### 5. From a Kafka / Message Queue

```java
// Kafka: manual poll loop → stream each batch
ConsumerRecords<String, Transaction> records = consumer.poll(Duration.ofMillis(500));
StreamSupport.stream(records.spliterator(), false)   // Iterable → Stream
    .map(ConsumerRecord::value)
    .filter(t -> t.getAmount().compareTo(THRESHOLD) > 0)
    .forEach(this::process);
consumer.commitSync();

// StreamSupport.stream() is the bridge from any Iterable / Spliterator to a Stream:
Stream<T> fromIterable = StreamSupport.stream(iterable.spliterator(), false /* parallel */);
```

### 6. From Generated / Test Data

```java
// Infinite sequential stream — limit() makes it finite
Stream<Transaction> testData = Stream.generate(() ->
    new Transaction(
        UUID.randomUUID().toString(),
        BigDecimal.valueOf(ThreadLocalRandom.current().nextDouble(1, 10_000)),
        Status.PENDING
    )
).limit(1_000_000);  // materializes lazily — only 1 element exists at a time

// Indexed sequence with Stream.iterate
Stream<Employee> employees = Stream.iterate(1, i -> i + 1)
    .limit(500_000)
    .map(i -> new Employee("emp-" + i, "TECH", 50_000 + i * 10));

// IntStream range → objects (most readable for indexed generation)
Stream<Transaction> byIndex = IntStream.range(0, 100_000)
    .mapToObj(i -> new Transaction("txn-" + i, BigDecimal.TEN, Status.PENDING));

// Random primitives without boxing:
IntStream randomSalaries = IntStream.generate(() -> ThreadLocalRandom.current().nextInt(40_000, 200_000))
    .limit(1_000_000);
```

### 7. From an InputStream / Network Socket

```java
// Binary stream: wrap InputStream in a custom Spliterator for back-pressure
public static Stream<byte[]> chunkedStream(InputStream in, int chunkSize) {
    return StreamSupport.stream(new Spliterators.AbstractSpliterator<byte[]>(
            Long.MAX_VALUE, Spliterator.ORDERED) {
        public boolean tryAdvance(Consumer<? super byte[]> action) {
            try {
                byte[] buf = in.readNBytes(chunkSize);
                if (buf.length == 0) return false;
                action.accept(buf);
                return true;
            } catch (IOException e) { throw new UncheckedIOException(e); }
        }
    }, false);
}

// Usage: process a 10GB S3 download without loading it into memory
try (InputStream s3Stream = s3Client.getObject(bucket, key)) {
    chunkedStream(s3Stream, 8192)
        .map(this::parseChunk)
        .forEach(this::persist);
}
```

### 8. From a Custom Iterator / Spliterator

```java
// Any data source that exposes hasNext()/next() can become a Stream
public class CursorSpliterator<T> extends Spliterators.AbstractSpliterator<T> {
    private final ResultSetCursor<T> cursor;
    public CursorSpliterator(ResultSetCursor<T> cursor) {
        super(Long.MAX_VALUE, Spliterator.ORDERED);
        this.cursor = cursor;
    }
    @Override
    public boolean tryAdvance(Consumer<? super T> action) {
        if (!cursor.hasNext()) return false;
        action.accept(cursor.next());
        return true;
    }
}

// Bridge:
Stream<MyRecord> stream = StreamSupport.stream(new CursorSpliterator<>(cursor), false);
```

### Source Selection Guide

| Source | API | Memory | Notes |
|--------|-----|--------|-------|
| File (text) | `Files.lines()` | O(1) | Must close — use try-with-resources |
| File (binary) | Custom `Spliterator` + `InputStream` | O(chunk) | Good for CSV/Parquet blobs |
| DB (JPA) | `Stream<T>` + `@Transactional(readOnly=true)` | O(fetch_size) | Cursor stays open; needs open session |
| DB (R2DBC) | `Flux<T>` via R2DBC repository | O(prefetch) | Non-blocking; no thread held during IO |
| DB (pagination) | `Stream.iterate` + `takeWhile` | O(page_size) | Works with read-only replicas |
| REST API | `Stream.iterate` + `takeWhile` | O(page_size) | Rate-limit awareness needed |
| REST API (streaming) | `WebClient.bodyToFlux` + `.toStream()` | O(1) | Server must support ndjson/SSE |
| Kafka batch | `StreamSupport.stream(records.spliterator())` | O(batch) | Commit after stream terminal |
| Generated/test | `Stream.generate` / `IntStream.range` | O(1) | Infinite until `limit()` |
| Any Iterable | `StreamSupport.stream(iterable.spliterator(), parallel)` | O(1) | Universal bridge |

---

## Part 10 — Spring WebFlux + R2DBC vs Lazy Stream: The Real Difference

> This is the most misunderstood topic at senior interviews. Both approaches use constant memory — the difference is **what the calling thread does while waiting for data**.

### The Mental Model

```
Lazy Stream (blocking)                  Reactive (non-blocking)
──────────────────────────────────────  ────────────────────────────────────────
Thread calls repo.stream()              Thread subscribes to repo.findAll()
  │                                       │
  │ ← thread is BLOCKED here              │ ← thread is RELEASED back to pool
  │   waiting for each DB row             │
  │                                     [DB row arrives]
  ↓ row arrives → process it              │ ← Reactor schedules onNext() on a
  ↓ row arrives → process it             ↓   scheduler thread (may be a different one)
  ↓ ...                                  ↓ onNext(row) → process it
  ↓ cursor closed → thread free          ↓ ...
                                         ↓ onComplete() → done
```

**Key insight:** A lazy `Stream<T>` over a DB cursor holds **one OS thread** for the entire duration. A `Flux<T>` from R2DBC releases the thread between each row — it can serve other requests while the DB is working.

---

### Side-by-Side: DB Read (JPA + Stream vs R2DBC + Flux)

```java
// ── BLOCKING: Spring Data JPA + cursor stream ──────────────────────────────
// One dedicated thread is pinned for the entire query duration.
// Works fine if thread pool is large enough and query is fast.

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {

    @Query("SELECT t FROM Transaction t WHERE t.status = :status")
    @QueryHints(@QueryHint(name = HINT_FETCH_SIZE, value = "1000"))
    Stream<Transaction> streamByStatus(@Param("status") Status status);
}

@Service
public class BlockingService {

    @Transactional(readOnly = true)          // keeps JPA session (and DB cursor) open
    public long countHighValue(Status status) {
        try (Stream<Transaction> stream = repo.streamByStatus(status)) {
            return stream
                .filter(t -> t.getAmount().compareTo(THRESHOLD) > 0)
                .count();
        }                                    // cursor + session closed here
    }
    // Thread model: 1 request = 1 thread held for the entire DB read
    // Suitable for: batch jobs, scheduled tasks, internal admin endpoints
}

// ── NON-BLOCKING: Spring Data R2DBC + Flux ────────────────────────────────
// No thread is held during DB IO. Reactor handles scheduling on IO events.

@Repository
public interface ReactiveTransactionRepository extends ReactiveCrudRepository<Transaction, String> {

    // R2DBC: returns Flux — the query runs lazily when subscribed
    @Query("SELECT * FROM transactions WHERE status = :status")
    Flux<Transaction> findByStatus(String status);
}

@Service
public class ReactiveService {

    public Mono<Long> countHighValue(String status) {
        return reactiveRepo.findByStatus(status)          // cold Flux — nothing runs yet
            .filter(t -> t.getAmount().compareTo(THRESHOLD) > 0)
            .count();                                      // terminal → subscribes → query runs
        // Thread model: 0 threads held during DB IO
        // Framework subscribes and hands control back; result delivered via callback
    }
    // Suitable for: high-concurrency APIs (payment submit, real-time dashboards)
}
```

---

### Side-by-Side: HTTP Streaming (RestTemplate vs WebClient)

```java
// ── BLOCKING: RestTemplate + Stream.iterate pagination ────────────────────
// Each HTTP call blocks the thread; thread sleeps between calls.

public void processPaged() {
    Stream.iterate(0, page -> page + 1)
        .map(page -> restTemplate.getForObject(
            "https://api.partner.com/txns?page={p}&size=500",
            TransactionPage.class, page))                 // blocks here for each page
        .takeWhile(p -> p != null && !p.getContent().isEmpty())
        .flatMap(p -> p.getContent().stream())
        .forEach(this::process);
    // Thread model: thread blocked during each HTTP round-trip
    // OK for offline batch; bad for serving concurrent users
}

// ── NON-BLOCKING: WebClient + Flux (server-sent events / ndjson) ──────────
// Thread is never blocked. Data arrives as events; Reactor drives processing.

public Mono<Void> processStreaming() {
    return webClient.get()
        .uri("https://api.partner.com/txns/stream")      // server streams ndjson
        .accept(MediaType.APPLICATION_NDJSON)
        .retrieve()
        .bodyToFlux(Transaction.class)                   // Flux<Transaction> — cold
        .filter(t -> t.getAmount().compareTo(THRESHOLD) > 0)
        .flatMap(t -> reactiveRepo.save(t))              // non-blocking DB write per item
        .then();                                         // Mono<Void> signals completion
    // Thread model: 0 threads held; back-pressure propagates to server
}
```

---

### Back-Pressure: The Reactive Superpower Stream Doesn't Have

```java
// Lazy Stream has NO back-pressure mechanism.
// The producer always generates as fast as possible; the consumer must keep up.
// If consumer is slow → items queue in heap → OOM.
Stream.generate(this::fetchFromKafka)   // producer goes as fast as it can
    .limit(10_000_000)
    .forEach(this::slowDbWrite);        // consumer can't signal "slow down"

// Flux propagates back-pressure via Project Reactor's demand protocol.
// Consumer requests N items; producer only emits N; then waits for next request.
Flux.fromIterable(kafkaRecords)
    .onBackpressureBuffer(1000)          // buffer up to 1000 if consumer is slow
    .flatMap(r -> reactiveRepo.save(r), 16) // max 16 concurrent saves (concurrency limit)
    .subscribe();

// limitRate: consumer pulls from upstream in bounded chunks (explicit back-pressure)
someFlux
    .limitRate(100)                      // request 100 at a time from upstream
    .flatMap(this::processAsync, 10)     // max 10 in flight
    .subscribe();
```

---

### Mixing Blocking and Reactive (Your Mixed-Stack Reality)

```java
// WRONG: never block inside a Reactor thread — starves the event loop
Flux<Transaction> flux = reactiveRepo.findAll()
    .map(t -> {
        // BAD: jdbcTemplate.query() blocks the Reactor scheduler thread
        Department dept = jdbcTemplate.queryForObject(...);
        return new DTO(t, dept);
    });

// CORRECT option A: subscribeOn(Schedulers.boundedElastic()) — offload to blocking pool
Flux<Transaction> flux = reactiveRepo.findAll()
    .flatMap(t ->
        Mono.fromCallable(() -> jdbcTemplate.queryForObject(...))  // wrap blocking call
            .subscribeOn(Schedulers.boundedElastic())              // run on IO thread pool
            .map(dept -> new DTO(t, dept))
    );

// CORRECT option B: batch the blocking work outside the Flux
// (your current pattern — avoids N+1 and keeps Reactor thread clean)
List<String> deptIds = transactions.stream().map(Transaction::getDeptId).distinct().collect(toList());
Map<String, Department> deptMap = deptRepo.findAllById(deptIds)   // 1 blocking JDBC call
    .stream().collect(toMap(Department::getId, d -> d));

Flux.fromIterable(transactions)
    .map(t -> new DTO(t, deptMap.get(t.getDeptId())))             // pure in-memory, safe
    .subscribe(this::emit);
```

---

### When to Use Which

| Dimension | Lazy Stream (JPA/JDBC) | Reactive (WebFlux/R2DBC) |
|-----------|----------------------|--------------------------|
| **Thread per request** | Yes — 1 thread held for query duration | No — thread released during IO |
| **Throughput under concurrency** | Limited by thread pool size | High — thousands of concurrent ops per core |
| **Back-pressure** | None — producer drives speed | Built-in — consumer controls rate |
| **Memory** | O(fetch_size) | O(prefetch) — configurable |
| **Error handling** | try-catch | `.onErrorResume()`, `.retry()`, `.timeout()` |
| **Debugging** | Stack traces are clear | Stack traces can be misleading (async frames) |
| **Learning curve** | Low | High — must understand Publisher/Subscriber contract |
| **Best for** | Batch jobs, scheduled tasks, admin endpoints | Payment APIs, real-time feeds, high-concurrency endpoints |

**Decision rule (for your stack):**
- Mixed R2DBC + JPA service → use **reactive at the API layer** (controller returns `Mono`/`Flux`), use **blocking calls wrapped in `boundedElastic()`** for legacy JPA calls
- Never block inside `flatMap` / `map` on a Reactor thread
- For true batch (overnight processing of 10M rows) → prefer a dedicated thread with JPA cursor stream — simpler, no Reactor overhead

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

--- Stream Sources (all constant memory) ---
File (text)         = Files.lines(path)  — try-with-resources, lazy line-by-line
File (binary)       = custom Spliterator + InputStream.readNBytes(chunk)
DB cursor           = @Transactional(readOnly) Stream<T> repository method + @QueryHint fetch size
DB pagination       = Stream.iterate(0, p->p+1).map(repo::findPage).takeWhile(!empty).flatMap
REST paged          = Stream.iterate(1, p->p+1).map(apiCall).takeWhile(!empty).flatMap
REST streaming      = WebClient.bodyToFlux(T.class).toStream()
Kafka batch         = StreamSupport.stream(records.spliterator(), false)
Generated/test      = Stream.generate(supplier).limit(N) / IntStream.range(0,N).mapToObj(fn)
Any Iterable        = StreamSupport.stream(iterable.spliterator(), parallel)

--- Lazy Stream vs Reactive ---
Lazy Stream         = constant memory, BUT 1 thread pinned for entire query duration
Reactive (R2DBC)    = constant memory AND 0 threads held — thread released during DB IO
Back-pressure       = Stream has none; Flux propagates demand upstream (limitRate / onBackpressureBuffer)
Blocking in Reactor = NEVER block inside flatMap/map on Reactor thread — wrap with Mono.fromCallable + subscribeOn(boundedElastic())
Mixed stack rule    = reactive at API layer (Mono/Flux controller) + blocking JPA wrapped in boundedElastic()
Batch jobs          = prefer JPA cursor stream (simpler, no Reactor overhead, dedicated thread is fine)
High-concurrency    = prefer R2DBC + Flux (payment APIs, real-time feeds)
```

---

## Practice — Interview Freeze Drills

> These are the exact patterns that cause brain-freeze under pressure. Drill until they are reflexes, not lookups.

### Drill 1 — Second Largest (the freeze problem)

**Problem:** Find the second largest unique value in `int[] numbers = {5, 12, 9, 21, 21, 7, 18}`.

**Step 1 — O(n log n) stream answer (know this cold):**

```java
// int[] → IntStream → .boxed() → Stream<Integer> (required for Comparator)
Optional<Integer> second = Arrays.stream(numbers)
    .boxed()                            // IntStream has no Comparator-based sort
    .distinct()                         // remove duplicates so two 21s don't steal both slots
    .sorted(Comparator.reverseOrder())  // descending
    .skip(1)                            // bypass the largest
    .findFirst();                       // returns Optional<Integer>

second.ifPresentOrElse(
    v -> System.out.println("Second largest: " + v),
    () -> System.out.println("No second unique value"));
```

**Step 2 — O(n) answer (say this out loud for senior credit):**

```java
// Min-heap of size 2 — same Top-N pattern, N=2
// Evicts smallest, keeping only the two largest seen so far
PriorityQueue<Integer> heap = new PriorityQueue<>(2);
Arrays.stream(numbers).distinct().forEach(n -> {
    heap.offer(n);
    if (heap.size() > 2) heap.poll();   // evict smallest
});
// heap.peek() = root of min-heap = second largest
int secondLargest = heap.peek();
System.out.println("Second largest (O(n)): " + secondLargest);
```

**Step 3 — O(n) single-pass reduce (pure stream):**

```java
// Pair tracks [max, secondMax] in one pass — no sort, no heap
int[] top = Arrays.stream(numbers)
    .distinct()
    .boxed()
    .reduce(
        new int[]{Integer.MIN_VALUE, Integer.MIN_VALUE},
        (pair, n) -> {
            if (n > pair[0]) return new int[]{n, pair[0]};
            if (n > pair[1]) return new int[]{pair[0], n};
            return pair;
        },
        (a, b) -> a  // combiner — not used in sequential stream
    );
System.out.println("Second largest (single-pass): " + top[1]);
```

**What to say in the interview:**
> _"My first instinct is distinct → sort descending → skip(1) → findFirst — that's clean but O(n log n). If the dataset is large I'd switch to a min-heap of size 2 for O(n) time and O(1) space — same pattern as Top-N."_

---

### Drill 2 — IntStream vs Stream\<Integer\> (the boxing trap)

```java
int[] arr = {3, 1, 4, 1, 5};

// Arrays.stream(int[]) returns IntStream — NOT Stream<Integer>
// IntStream.sorted() = ascending only; no Comparator support
// .boxed() is the bridge to Stream<Integer>

Arrays.stream(arr)           // IntStream
    .boxed()                 // Stream<Integer> ← needed for Comparator / distinct / skip
    .distinct()
    .sorted(Comparator.reverseOrder())
    .skip(1)
    .findFirst()
    .ifPresent(System.out::println);

// Staying in IntStream (no boxing) — works for ascending, sum, average
int sum    = Arrays.stream(arr).sum();
double avg = Arrays.stream(arr).average().orElse(0);

// Rule: need Comparator or object-level ops → .boxed() first
//       need numeric aggregation (sum/avg/stats) → stay in IntStream
```

---

### Drill 3 — Java Records (write from memory)

```java
// Syntax: record Name(fields...) {}
// Auto-generated: canonical constructor, accessors (field name = method name),
//                 equals(), hashCode(), toString()
// Fields are final — records are immutable by default

record Employee(String name, String dept, int salary) {}

// Usage — accessors use field name directly (no "get" prefix)
Employee e = new Employee("Alice", "TECH", 120_000);
System.out.println(e.name());    // "Alice"
System.out.println(e.dept());    // "TECH"
System.out.println(e.salary());  // 120000

// Compact constructor — add validation without re-assigning fields
record Range(int min, int max) {
    Range {  // no parameter list — implicitly uses (int min, int max)
        if (min > max) throw new IllegalArgumentException("min > max");
    }
}

// Custom method — records can have instance methods
record Money(double amount, String currency) {
    String display() { return String.format("%,.2f %s", amount, currency); }
}

// Records work perfectly as stream elements
List<Employee> staff = List.of(
    new Employee("Alice", "TECH", 120_000),
    new Employee("Bob",   "TECH",  95_000),
    new Employee("Carol", "FIN",  110_000)
);

staff.stream()
    .filter(emp -> emp.salary() > 100_000)
    .sorted(Comparator.comparingInt(Employee::salary).reversed())
    .forEach(emp -> System.out.println(emp.name() + " — " + emp.salary()));
```

---

### Drill 4 — The 10 Reflexes (read once, run all, internalize)

```java
import java.util.*;
import java.util.stream.*;

public class JavaLabRunner {
    record Employee(String name, String dept, int salary) {}

    public static void main(String[] args) {
        List<Employee> staff = List.of(
            new Employee("Alice",   "TECH",  120_000),
            new Employee("Bob",     "TECH",   95_000),
            new Employee("Carol",   "FIN",   110_000),
            new Employee("Diana",   "TECH",  135_000),
            new Employee("Eve",     "FIN",    88_000),
            new Employee("Frank",   "TECH",  102_000),
            new Employee("Grace",   "FIN",   145_000)
        );
        int[] nums = {5, 12, 9, 21, 21, 7, 18};

        // 1. Second largest — stream version
        System.out.println("1. Second largest:");
        Arrays.stream(nums).boxed().distinct()
            .sorted(Comparator.reverseOrder()).skip(1).findFirst()
            .ifPresent(v -> System.out.println("   " + v));

        // 2. Top N
        System.out.println("2. Top 3 paid:");
        staff.stream()
            .sorted(Comparator.comparingInt(Employee::salary).reversed())
            .limit(3)
            .forEach(e -> System.out.println("   " + e.name() + " " + e.salary()));

        // 3. Top N (big data) — min-heap
        System.out.println("3. Top 2 via min-heap:");
        PriorityQueue<Employee> heap =
            new PriorityQueue<>(Comparator.comparingInt(Employee::salary));
        staff.forEach(e -> { heap.offer(e); if (heap.size() > 2) heap.poll(); });
        new ArrayList<>(heap).stream()
            .sorted(Comparator.comparingInt(Employee::salary).reversed())
            .forEach(e -> System.out.println("   " + e.name() + " " + e.salary()));

        // 4. At-least-N short-circuit
        System.out.println("4. At least 3 in TECH?");
        boolean atLeast3 = staff.stream()
            .filter(e -> "TECH".equals(e.dept())).limit(3).count() >= 3;
        System.out.println("   " + atLeast3);

        // 5. Group + count
        System.out.println("5. Count per dept:");
        staff.stream()
            .collect(Collectors.groupingBy(Employee::dept, Collectors.counting()))
            .forEach((dept, cnt) -> System.out.println("   " + dept + ": " + cnt));

        // 6. Frequency map → filter (items appearing >= N times)
        System.out.println("6. Numbers appearing >= 2 times:");
        int[] repeated = {1, 2, 2, 3, 3, 3, 4};
        Arrays.stream(repeated).boxed()
            .collect(Collectors.groupingBy(n -> n, Collectors.counting()))
            .entrySet().stream()
            .filter(e -> e.getValue() >= 2)
            .forEach(e -> System.out.println("   " + e.getKey() + " × " + e.getValue()));

        // 7. Flatten nested lists
        System.out.println("7. Flatten depts → names:");
        Map<String, List<Employee>> byDept = staff.stream()
            .collect(Collectors.groupingBy(Employee::dept));
        byDept.values().stream()
            .flatMap(List::stream)
            .map(Employee::name)
            .sorted()
            .forEach(n -> System.out.println("   " + n));

        // 8. Optional chain
        System.out.println("8. Optional chain:");
        Optional.of("  alice  ")
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .map(String::toUpperCase)
            .ifPresentOrElse(
                v -> System.out.println("   " + v),
                () -> System.out.println("   empty"));

        // 9. Two stats in one pass — Collectors.teeing (Java 12+)
        System.out.println("9. Count + avg salary in one pass:");
        record Stats(long count, double avg) {}
        Stats s = staff.stream().collect(Collectors.teeing(
            Collectors.counting(),
            Collectors.averagingInt(Employee::salary),
            Stats::new));
        System.out.printf("   count=%d  avg=%,.0f%n", s.count(), s.avg());

        // 10. Reuse stream — Supplier<Stream<T>>
        System.out.println("10. Supplier<Stream> reuse:");
        Supplier<Stream<Employee>> src =
            () -> staff.stream().filter(e -> e.salary() > 100_000);
        System.out.println("   count=" + src.get().count());
        System.out.println("   names=" + src.get().map(Employee::name).collect(Collectors.toList()));
    }
}
```
