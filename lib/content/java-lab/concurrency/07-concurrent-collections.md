# Concurrent Collections

## Why this matters in interviews

Choosing the wrong collection under concurrent access is one of the most common sources of data races, `ConcurrentModificationException`, and subtle performance cliffs in Java services. Interviewers at senior level expect you to articulate the internal locking model of `ConcurrentHashMap`, explain why `Collections.synchronizedMap` is insufficient for compound operations, and choose the correct `BlockingQueue` implementation for a producer-consumer design. This topic also surfaces in system design rounds when discussing thread-safe caching, work queues, and rate limiting.

## Concept

### ConcurrentHashMap Internals

**Java 7 — Segment locking:**

```
ConcurrentHashMap (Java 7)
├── Segment[0]  → HashEntry[] (has own ReentrantLock)
├── Segment[1]  → HashEntry[]
├── ...
└── Segment[15] → HashEntry[]   (default 16 segments)
```

Reads were lock-free (volatile reads). Writes locked only the relevant segment. Concurrency level = number of segments (default 16).

**Java 8+ — CAS + per-bucket synchronization:**

```
ConcurrentHashMap (Java 8+)
└── Node[] table (array of buckets)
     ├── bucket[0]  — null (empty)
     ├── bucket[1]  — Node (CAS on first insert; synchronized on head for collisions)
     ├── bucket[3]  — TreeBin (red-black tree when bucket length ≥ 8)
     └── ...
```

- **First insert** into an empty bucket uses a lock-free CAS operation — no lock acquired.
- **Collision resolution** (bucket already has a node) uses `synchronized(bucketHead)` — fine-grained per-bucket lock.
- Resizing uses a distributed transfer protocol where multiple threads cooperatively migrate buckets.
- `size()` uses a striped counter (`LongAdder`-style) — no global lock.

**Atomic compound operations:**

| Method | Atomicity guarantee |
|---|---|
| `putIfAbsent(k, v)` | check-then-act is atomic |
| `computeIfAbsent(k, fn)` | fn runs at most once per key; result atomically set |
| `compute(k, fn)` | fn receives current value (or null); result atomically replaced |
| `merge(k, v, fn)` | atomic: if absent → put v; if present → fn(existing, v) |
| `replace(k, oldV, newV)` | conditional atomic swap (compare-and-swap semantics) |

> **Critical gotcha:** `get` followed by `put` is NOT atomic. Use `compute`/`merge` for read-modify-write.

### Why `Collections.synchronizedMap` Falls Short

```java
Map<String, Integer> syncMap = Collections.synchronizedMap(new HashMap<>());

// BROKEN — compound operation is not atomic:
if (!syncMap.containsKey("key")) {        // acquires lock, releases
    syncMap.put("key", 1);               // acquires lock again
}
// Another thread can insert between the two calls!

// Even synchronized iteration requires external locking:
synchronized (syncMap) {
    for (Map.Entry<String, Integer> e : syncMap.entrySet()) { ... }
}
```

`synchronizedMap` wraps every individual method in a `synchronized(mutex)` block, but compound operations (check-then-act, iterate-then-modify) still require external synchronization. `ConcurrentHashMap` makes compound operations like `putIfAbsent` and `compute` intrinsically atomic without external locking, and its fine-grained locking yields far higher throughput under contention.

### CopyOnWriteArrayList

**Semantics:** Every mutating operation (`add`, `set`, `remove`) copies the entire backing array, applies the change to the copy, and atomically swaps the reference. Reads and iterations always see the snapshot at the time of iterator creation — no `ConcurrentModificationException`, ever.

```
Initial state:  array → [A, B, C]

Thread 1 iterating: iterator holds ref → [A, B, C]

Thread 2 calls add("D"):
  1. Copy → [A, B, C, D]  (new array)
  2. CAS  array ref → new array

Thread 1 still sees [A, B, C] — snapshot semantics
```

| Operation | Cost |
|---|---|
| Read / iterate | O(1) — no lock, no copy |
| Write (add/set/remove) | O(n) — full array copy |
| Memory | 2x array size during write |

**Use when:** reads vastly outnumber writes (e.g., listener/observer lists, rarely-changing config sets). **Never use** as a general-purpose list under heavy writes.

### BlockingQueue Implementations

```
BlockingQueue<E>
├── ArrayBlockingQueue      — bounded, single lock, FIFO, fair option
├── LinkedBlockingQueue     — optionally bounded, two locks (head/tail), higher throughput
├── SynchronousQueue        — zero capacity; put blocks until take is ready (rendezvous)
├── PriorityBlockingQueue   — unbounded, heap-ordered by Comparator; no fairness
├── DelayQueue              — elements available only after delay expires
└── LinkedTransferQueue     — combines SynchronousQueue + LinkedBlockingQueue (Java 7)
```

| Implementation | Bounded | Throughput | Use case |
|---|---|---|---|
| `ArrayBlockingQueue` | Yes | Medium | Classic bounded buffer; optional fairness |
| `LinkedBlockingQueue` | Optional | High | High-throughput producer-consumer (two-lock design) |
| `SynchronousQueue` | 0 capacity | Highest | Thread handoff, `newCachedThreadPool` internal |
| `PriorityBlockingQueue` | No | Medium | Task scheduling by priority |
| `DelayQueue` | No | Low | Delayed task execution, TTL-based expiry |

**`ArrayBlockingQueue` vs `LinkedBlockingQueue` internals:**

```
ArrayBlockingQueue:
  single ReentrantLock + 2 Conditions (notEmpty, notFull)
  → head and tail share one lock → lower throughput under high contention

LinkedBlockingQueue:
  two separate ReentrantLocks (takeLock, putLock)
  → producers and consumers don't contend with each other → higher throughput
```

### ConcurrentLinkedQueue

Lock-free, unbounded, FIFO queue using Michael-Scott CAS algorithm. `poll()` and `offer()` never block — they fail-fast. `size()` is O(n) (not O(1)) — avoid calling it in tight loops. Best for non-blocking producer-consumer where unbounded growth is acceptable.

### ConcurrentSkipListMap

Thread-safe sorted map (like `TreeMap`). Uses a probabilistic skip-list structure instead of a red-black tree:

```
Level 3: [head] -------> [30] -------> [tail]
Level 2: [head] -> [10] -> [30] -> [50] -> [tail]
Level 1: [head] -> [10] -> [20] -> [30] -> [40] -> [50] -> [tail]
```

- `get`/`put`/`remove`: O(log n) expected, lock-free reads
- `headMap`, `tailMap`, `subMap`: O(log n) views
- Use when you need a thread-safe `NavigableMap` (range queries, ceiling/floor operations)

## Key rules / gotchas

- **`ConcurrentHashMap` allows one null value/key? No:** Both key and value must be non-null. Attempting to `put(null, v)` or `put(k, null)` throws `NullPointerException`. `HashMap` allows one null key and null values.
- **`compute` fn can return null to remove the key:** If the remapping function passed to `compute` or `merge` returns `null`, the key is removed from the map. This is a deletion idiom.
- **`CopyOnWriteArrayList` iterator is a snapshot:** Mutations after iterator creation are invisible to that iterator. The iterator's `remove()` method throws `UnsupportedOperationException`.
- **`LinkedBlockingQueue()` default capacity is `Integer.MAX_VALUE`:** Calling `new LinkedBlockingQueue<>()` without a capacity creates an effectively unbounded queue — the same OOM risk as `newFixedThreadPool`. Always specify capacity in production.
- **`SynchronousQueue` has zero storage:** `put` blocks until another thread calls `take`, and vice versa. It is a thread rendezvous mechanism, not a buffer. `peek()` always returns `null`.
- **`PriorityBlockingQueue` is unbounded:** It grows without limit and never blocks on `put`. If you need bounded priority queuing, wrap it manually.
- **`size()` on `ConcurrentLinkedQueue` is O(n):** Iterates the entire queue to count nodes. Do not use it to check emptiness; use `isEmpty()` instead.

## Code example

```java
import java.util.concurrent.*;
import java.util.*;

public class JavaLabRunner {
    public static void main(String[] args) throws InterruptedException {
        // ConcurrentHashMap — atomic compound operations
        ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
        map.put("a", 1);

        // putIfAbsent, compute, merge — all atomic
        map.putIfAbsent("b", 2);
        map.compute("a", (k, v) -> v == null ? 1 : v + 10); // atomic update
        map.merge("c", 1, Integer::sum); // atomic increment
        System.out.println("ConcurrentHashMap: " + map);

        // CopyOnWriteArrayList — safe iteration, expensive writes
        CopyOnWriteArrayList<String> cowList = new CopyOnWriteArrayList<>();
        cowList.add("a");
        cowList.add("b");
        // Iterator sees snapshot at time of creation — no ConcurrentModificationException
        for (String s : cowList) {
            cowList.add("c"); // modifies but iterator won't see it
            System.out.println("COW iterate: " + s);
            break; // just demo once
        }

        // BlockingQueue — producer-consumer
        BlockingQueue<Integer> queue = new ArrayBlockingQueue<>(5);
        Thread producer = new Thread(() -> {
            try {
                for (int i = 1; i <= 3; i++) {
                    queue.put(i); // blocks if full
                    System.out.println("Produced: " + i);
                }
            } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });
        Thread consumer = new Thread(() -> {
            try {
                for (int i = 0; i < 3; i++) {
                    int val = queue.take(); // blocks if empty
                    System.out.println("Consumed: " + val);
                }
            } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        });
        producer.start(); consumer.start();
        producer.join(); consumer.join();
    }
}
```

## Interview questions you should be able to answer

- **Q:** Why is `map.get(key) == null ? map.put(key, val) : map.get(key)` not thread-safe on a `ConcurrentHashMap`, and what is the correct replacement?
  > Even though individual `get` and `put` calls on `ConcurrentHashMap` are thread-safe in isolation, the compound check-then-act is not atomic — another thread can insert the key between the `get` and the `put`, resulting in a lost update or incorrect overwrite. The correct replacement is `map.putIfAbsent(key, val)` (returns the existing value if present, atomically inserts otherwise) or `map.computeIfAbsent(key, k -> val)` when the value needs to be computed lazily. Both operations are atomic with respect to concurrent modifications.

- **Q:** How does `ConcurrentHashMap` achieve higher throughput than a `synchronized HashMap` or `Collections.synchronizedMap` under high concurrency?
  > `Collections.synchronizedMap` uses a single mutex for every read and write, so all threads serialize on that lock — throughput scales with the number of CPUs but degrades as a bottleneck. `ConcurrentHashMap` (Java 8+) uses CAS for inserts into empty buckets (no lock at all) and `synchronized` only on the individual bucket head for collision chains. This means up to `table.length` threads can concurrently write to different buckets without any contention. Reads are fully lock-free (volatile reads of node references). The result is near-linear throughput scaling up to the number of buckets.

- **Q:** When would you choose `ArrayBlockingQueue` over `LinkedBlockingQueue`, and vice versa?
  > `ArrayBlockingQueue` uses a pre-allocated array and a single lock for both producers and consumers. It is predictable in memory (no GC pressure from node allocation), supports optional FIFO fairness (`fair=true`), and is suitable for bounded buffers with moderate contention. `LinkedBlockingQueue` uses two separate locks (one for producers, one for consumers), so producers and consumers never contend with each other — giving significantly higher throughput under concurrent produce-and-consume workloads. Choose `ArrayBlockingQueue` when fairness or memory predictability matters; choose `LinkedBlockingQueue` when throughput is the priority and both producers and consumers are active simultaneously.

- **Q:** A `CopyOnWriteArrayList` is used as a listener registry. Under what conditions does this become a correctness or performance problem?
  > Performance problem: if listeners are frequently registered or removed, each mutation copies the full array — O(n) time and memory per write. With n listeners and m writes, cost is O(n*m). Correctness concern: iterators see a snapshot, so a listener added after an event fires will not receive that event (acceptable for most observer patterns, but must be understood). A more subtle correctness issue arises if listeners modify the list during notification — the modification is safe from `ConcurrentModificationException` but affects a new copy, not the snapshot being iterated, which may lead to missed or duplicated notifications depending on the design. For high write rates, prefer a `CopyOnWriteArrayList` alternative like a lock-protected `ArrayList` with a read-write lock.

- **Q:** What is the internal difference between `SynchronousQueue` and `ArrayBlockingQueue(1)`, and why does `newCachedThreadPool` use `SynchronousQueue`?
  > `ArrayBlockingQueue(1)` stores one element — a producer can insert and return immediately even if no consumer is waiting; the element is buffered. `SynchronousQueue` has zero internal storage — a producer's `put` blocks until a consumer calls `take` at the same time (a rendezvous). `newCachedThreadPool` uses `SynchronousQueue` because its design requires that each submitted task either be picked up by an existing idle thread immediately or cause a new thread to be created. Any buffering would defeat the "spawn a thread if no one is ready" semantics — the submit must fail to hand off (queue is always full) so the pool can respond by creating a new thread.

- **Q:** How would you implement a thread-safe frequency counter (multiple writers incrementing counts for string keys) with the lowest possible contention?
  > Use `ConcurrentHashMap<String, LongAdder>` with `computeIfAbsent` for initialization: `map.computeIfAbsent(key, k -> new LongAdder()).increment()`. `LongAdder` is designed for high-contention counting — it maintains per-thread cells and sums them only on `sum()` / `longValue()`, eliminating CAS failures under concurrent increments. This gives effectively O(1) amortized increment with minimal contention. An alternative is `map.merge(key, 1L, Long::sum)`, which is atomic but performs a CAS on every increment — it contends more than `LongAdder` when many threads update the same key.

## Further reading

- Java 8 ConcurrentHashMap source code walkthrough: https://cs.oswego.edu/dl/jsr166/dist/jsr166.jar (Doug Lea's implementation)
- "Java Concurrency in Practice" — Goetz et al., Chapter 5 (Building Blocks)
- JEP 354 — Switch Expressions (unrelated, but ConcurrentSkipListMap JEP): https://docs.oracle.com/en/java/docs/api/java.base/java/util/concurrent/ConcurrentSkipListMap.html
- Baeldung — Guide to java.util.concurrent: https://www.baeldung.com/java-util-concurrent
