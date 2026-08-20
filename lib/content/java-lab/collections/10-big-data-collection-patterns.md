# Big Data Collection Patterns — Mistakes vs Best Practices

## Why this matters in interviews

Senior engineers are expected to reason about **memory footprint, GC pressure, and load timing** — not just correctness. An interviewer who asks "how would you handle a million-row result set?" is not looking for `new ArrayList<>()`. The patterns here are the ones that separate a mid-level from a senior answer.

The core principle:

> **Never materialise data you don't need. Never load data before you need it. Never copy what you can view.**

---

## Pattern 1 — Lazy streaming vs eager materialisation

### Mistake

```java
// Copies the entire dataset into a List, then copies again to filter
List<Integer> all = new ArrayList<>();
for (int d : data) all.add(d);                          // allocation #1
List<Integer> evens = all.stream()
    .filter(x -> x % 2 == 0)
    .collect(Collectors.toList());                       // allocation #2
```

**What goes wrong:** Two full heap allocations for 1M integers = ~8 MB each (boxed `Integer`). The GC has to collect both. The filter runs *after* the full copy is built.

### Best Practice

```java
long count = Arrays.stream(data)     // IntStream — no boxing
                   .filter(x -> x % 2 == 0)   // lazy: nothing runs yet
                   .count();                    // terminal pulls data through
```

**Why it wins:**
- `IntStream` operates on primitives — zero boxing, zero `Integer` objects
- The pipeline is **lazy**: `filter` is only evaluated element-by-element as `count()` pulls
- No intermediate collection is ever allocated — O(1) extra memory

**Decision rule:** If you only need an aggregate (count, sum, max, any match), never collect to a List first. Use a terminal operation directly on the stream.

---

## Pattern 2 — Pagination vs loading the full table

### Mistake

```java
// Pulls all 10,000 rows into the JVM heap before the caller sees any
List<String> results = repo.findAll();   // 10k rows, all in RAM
return results;
```

**What goes wrong:** The entire dataset lives in RAM for the lifetime of the request. Under concurrent load (100 users × 10 MB each = 1 GB) this causes GC pauses and eventually OOM.

### Best Practice

```java
// Only fetch what the page needs
List<String> page = db.subList(pageNum * pageSize,
                               Math.min((pageNum + 1) * pageSize, db.size()));
// subList returns a VIEW — no copy
```

In a real DB context (Spring Data / JPA):

```java
Page<Order> page = orderRepo.findAll(PageRequest.of(pageNum, 20, Sort.by("createdAt")));
// Only 20 rows fetched from DB
```

**Why it wins:**
- `List.subList()` returns a **view** of the backing list — zero copy
- DB pagination (`LIMIT`/`OFFSET`) fetches only what's needed at the SQL level
- Memory usage is O(page size), not O(total rows)

**Decision rule:** Any API returning a list from a database must accept `page`/`size` parameters. Never return unbounded collections from service methods.

---

## Pattern 3 — `computeIfAbsent` vs get-check-put

### Mistake

```java
for (String word : words) {
    char key = word.charAt(0);
    if (!index.containsKey(key)) {         // lookup #1
        index.put(key, new ArrayList<>());  // lookup #2
    }
    index.get(key).add(word);              // lookup #3 — 3 hash computations total
}
```

**What goes wrong:** Three separate hash lookups per element. In a `ConcurrentHashMap` this is also a non-atomic check-then-act — a race condition between the `containsKey` and `put`.

### Best Practice

```java
for (String word : words)
    index.computeIfAbsent(word.charAt(0), k -> new ArrayList<>()).add(word);
    // one hash lookup, atomic, the ArrayList is only created if absent
```

**Why it wins:**
- Single hash computation — the bucket is found once
- The lambda `k -> new ArrayList<>()` only runs if the key is absent — no wasted allocation
- In `ConcurrentHashMap`, `computeIfAbsent` is **atomic** — no external synchronization needed
- More readable: intent is explicit

**Decision rule:** Any "group into a map of lists" pattern should use `computeIfAbsent`. Never `containsKey` + `get` + `put`.

---

## Pattern 4 — `WeakHashMap` for caches vs `HashMap` memory leaks

### Mistake

```java
// Application-level "cache" that never releases memory
static final Map<String, byte[]> cache = new HashMap<>();

void processRequest(String key) {
    if (!cache.containsKey(key)) {
        cache.put(key, loadHeavyData(key));  // never evicted → memory leak
    }
    use(cache.get(key));
}
```

**What goes wrong:** `HashMap` holds **strong references**. As long as the map exists (usually for the life of the JVM), none of the values can be GC'd. Under load the cache grows unbounded until OOM.

### Best Practice

```java
// WeakHashMap: entries are eligible for GC when the key has no strong references
static final Map<String, byte[]> cache = new WeakHashMap<>();

// Or for production: use a proper bounded cache with eviction
static final Map<String, byte[]> bounded = new LinkedHashMap<>(1024, 0.75f, true) {
    protected boolean removeEldestEntry(Map.Entry<String, byte[]> eldest) {
        return size() > 1024;   // evict LRU when over 1024 entries
    }
};
```

**Why it wins:**
- `WeakHashMap`: GC can reclaim entries when their keys are no longer strongly reachable — natural eviction under memory pressure
- `LinkedHashMap` with `removeEldestEntry`: explicit LRU with a size cap — predictable memory bound
- For production caches: Caffeine or Guava Cache add TTL, size-based eviction, and stats

**Decision rule:**
- Throw-away cache with short-lived keys → `WeakHashMap`
- Size-bounded LRU in single JVM → `LinkedHashMap.removeEldestEntry`
- Production cache with TTL/stats → Caffeine

---

## Pattern 5 — Pre-size collections to avoid rehashing

### Mistake

```java
Map<String, Integer> freq = new HashMap<>();  // default capacity 16
for (String word : millionWords) {
    freq.merge(word, 1, Integer::sum);
    // HashMap resizes at 75% full: 16→32→64→...→1M
    // Each resize: allocate new array + rehash all entries = O(n) work per resize
    // Total extra work: O(n log n) rehash operations
}
```

### Best Practice

```java
int expected = 1_000_000;
Map<String, Integer> freq = new HashMap<>((int)(expected / 0.75) + 1);
// capacity set so load factor never exceeds 0.75 for 1M entries → zero resizes
for (String word : millionWords) {
    freq.merge(word, 1, Integer::sum);
}
```

**Why it wins:**
- Zero resize operations → no `O(n)` rehash cost mid-insertion
- Formula: `initialCapacity = expectedSize / loadFactor + 1`
- For `ArrayList`: `new ArrayList<>(expectedSize)` avoids repeated `1.5×` array copies

**Decision rule:** Whenever you know (or can estimate) the final size, pre-size the collection. This is the single highest-ROI micro-optimisation for large maps.

---

## Key rules

- **Never collect to materialise** — if you only need count/sum/any, use a terminal stream op
- **Never `containsKey` + `get`** — use `getOrDefault`, `computeIfAbsent`, or `merge`
- **Never return unbounded lists from DB queries** — always paginate
- **Pre-size maps and lists** when final size is known or estimable
- **`subList` is a view** — use it for in-memory pagination instead of copying
- **`HashMap` is not a cache** — use `WeakHashMap`, `LinkedHashMap.removeEldestEntry`, or Caffeine

---

## Code example

```java
import java.util.*;
import java.util.stream.*;

public class JavaLabRunner {

    static List<Integer> mistakeEagerLoad(int[] data) {
        List<Integer> all = new ArrayList<>();
        for (int d : data) all.add(d);
        return all.stream().filter(x -> x % 2 == 0).collect(Collectors.toList());
    }

    static long bestLazyCount(int[] data) {
        return Arrays.stream(data).filter(x -> x % 2 == 0).count();
    }

    static List<String> bestPaginate(List<String> db, int page, int size) {
        int from = page * size;
        if (from >= db.size()) return List.of();
        return db.subList(from, Math.min(from + size, db.size()));
    }

    static void mistakeGrouping(List<String> words, Map<Character, List<String>> index) {
        for (String w : words) {
            char key = w.charAt(0);
            if (!index.containsKey(key)) index.put(key, new ArrayList<>());
            index.get(key).add(w);
        }
    }

    static void bestGrouping(List<String> words, Map<Character, List<String>> index) {
        for (String w : words)
            index.computeIfAbsent(w.charAt(0), k -> new ArrayList<>()).add(w);
    }

    public static void main(String[] args) {
        int[] million = IntStream.rangeClosed(1, 1_000_000).toArray();

        long t0 = System.nanoTime();
        List<Integer> eager = mistakeEagerLoad(million);
        long t1 = System.nanoTime();
        long lazyCount = bestLazyCount(million);
        long t2 = System.nanoTime();
        System.out.printf("Eager (2 allocs): %d evens, %,d ns%n", eager.size(), t1 - t0);
        System.out.printf("Lazy  (0 allocs): %d evens, %,d ns%n", lazyCount,   t2 - t1);

        List<String> db = IntStream.rangeClosed(1, 10_000)
                                   .mapToObj(i -> "row-" + i)
                                   .collect(Collectors.toList());
        List<String> page = bestPaginate(db, 3, 20);
        System.out.println("Page 3: " + page.get(0) + " … " + page.get(page.size() - 1));

        List<String> words = List.of("apple","avocado","banana","blueberry","cherry");
        Map<Character, List<String>> idx1 = new HashMap<>(), idx2 = new HashMap<>();
        mistakeGrouping(new ArrayList<>(words), idx1);
        bestGrouping(new ArrayList<>(words), idx2);
        System.out.println("Grouping equals: " + idx1.equals(idx2));

        // Pre-sizing vs default
        int expected = 100_000;
        Map<Integer, Integer> presized = new HashMap<>((int)(expected / 0.75) + 1);
        Map<Integer, Integer> defaultSized = new HashMap<>();
        long t3 = System.nanoTime();
        for (int i = 0; i < expected; i++) presized.put(i, i);
        long t4 = System.nanoTime();
        for (int i = 0; i < expected; i++) defaultSized.put(i, i);
        long t5 = System.nanoTime();
        System.out.printf("Pre-sized map:   %,d ns%n", t4 - t3);
        System.out.printf("Default map:     %,d ns%n", t5 - t4);
    }
}
```

---

## Interview questions you should be able to answer

- **Q:** You need to find the top 10 most frequent words in a 50 GB log file. Walk me through your Java approach.
  > Don't load the file into memory. Stream it line-by-line with `BufferedReader.lines()` or `Files.lines()` — which is lazy. Use a `HashMap` (pre-sized) for frequency counting. For top 10, use a min-heap `PriorityQueue` of size 10 — O(n log 10) = O(n). Never sort the full map: `Collections.sort` on a million entries is O(n log n) and unnecessary.

- **Q:** What is the difference between `merge` and `computeIfAbsent` on a Map?
  > `merge(key, value, remappingFn)` handles both insert and update in one call — insert `value` if absent, otherwise apply `remappingFn` to the old and new values. It's the right tool for frequency counting: `freq.merge(word, 1, Integer::sum)`. `computeIfAbsent` only runs the lambda when the key is absent and returns the (possibly new) value — right for "group into list" patterns. Neither does an unnecessary lookup.

- **Q:** Why is `subList` better than copying for in-memory pagination?
  > `subList` returns a **view** backed by the original list — no data is copied, and it runs in O(1). A copy with `new ArrayList<>(list.subList(...))` is O(page size) but still fine; the mistake is copying the *full* list first. The view also reflects mutations to the original, which can be a gotcha if you mutate the source after taking the view.

- **Q:** When would `WeakHashMap` cause a bug instead of solving one?
  > If the keys are interned strings or enum constants — they are always strongly reachable, so `WeakHashMap` never evicts them and behaves identically to `HashMap`. Also, `WeakHashMap` is not thread-safe and has no size bound or TTL — it only evicts when GC runs, which is non-deterministic. For a real production cache, use Caffeine with explicit size and TTL settings.

---

## Further reading

- [OpenJDK HashMap source — resize()](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/HashMap.java)
- [Caffeine cache — high-performance Java caching](https://github.com/ben-manes/caffeine)
- [Java Stream laziness — Oracle docs](https://docs.oracle.com/en/java/docs/api/java.base/java/util/stream/package-summary.html)
