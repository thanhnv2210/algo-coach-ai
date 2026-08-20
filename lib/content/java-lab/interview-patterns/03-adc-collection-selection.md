# ADC: Which Java Collection Should I Use?

## Why It Matters

Choosing the wrong collection is one of the most common performance mistakes in production Java. The difference between `ArrayList` and `LinkedList` for random access is O(1) vs O(n). The difference between `HashMap` and `TreeMap` is O(1) vs O(log n) per lookup. Under concurrency, picking `Collections.synchronizedList` over `CopyOnWriteArrayList` (or vice versa) can cause either lock contention bottlenecks or GC pressure from excessive copying.

Interviewers use collection-choice questions to assess whether you think about **access patterns**, **mutability frequency**, **ordering requirements**, **concurrency guarantees**, and **memory trade-offs** — not just "does it work."

---

## Decision Matrix

| Need | Best Choice | Avoid |
|---|---|---|
| Fast random access by index | `ArrayList` | `LinkedList` |
| Frequent head/tail insert + remove | `ArrayDeque` | `LinkedList`, `ArrayList` |
| Insertion-order iteration + fast lookup | `LinkedHashMap` | `TreeMap` (slower) |
| Sorted key iteration | `TreeMap` | `HashMap` (unordered) |
| Unique elements, fast membership test | `HashSet` | `TreeSet` (unless sorted needed) |
| Unique elements, sorted order | `TreeSet` | `HashSet` (unordered) |
| Fixed known enum keys | `EnumMap` / `EnumSet` | Any hash-based map/set |
| Priority-ordered processing | `PriorityQueue` | `ArrayDeque` (no ordering) |
| High-read, low-write concurrent list | `CopyOnWriteArrayList` | `synchronizedList` |
| High-write concurrent list | `ConcurrentLinkedQueue` | `CopyOnWriteArrayList` |
| General concurrent map | `ConcurrentHashMap` | `Collections.synchronizedMap` |
| FIFO queue in single thread | `ArrayDeque` | `LinkedList`, `Stack` |
| Blocking producer-consumer queue | `LinkedBlockingQueue` | `ArrayDeque` (not thread-safe) |

---

## 1. List: ArrayList vs LinkedList vs ArrayDeque

### Context
You need an ordered, indexed sequence of elements. The question is how you access and mutate it.

### Options and Trade-offs

**ArrayList**
- Backed by a contiguous array. Random access is O(1). Appending to the end is amortized O(1).
- Hidden cost: inserting or removing at an arbitrary index is O(n) due to element shifting. Resizing doubles the internal array and copies everything.
- Wins when: you read by index frequently, append to the tail, or iterate in bulk.

**LinkedList**
- Doubly linked nodes. Insertion and removal at a known node is O(1). Implements both `List` and `Deque`.
- Hidden cost: random access by index is O(n) because it must traverse from the head. Each node carries two pointer references — significant memory overhead per element compared to `ArrayList`. CPU cache locality is poor because nodes are scattered on the heap.
- Wins when: almost never in practice. The pointer overhead and cache miss penalty make it slower than `ArrayList` even for many insert/remove workloads.

**ArrayDeque**
- Circular array. O(1) add/remove at both head and tail. Faster than `LinkedList` as a deque and faster than `Stack` as a stack.
- Hidden cost: no indexed access (not a `List`). Cannot store `null`.
- Wins when: you need a stack or a double-ended queue.

### Decision Rule
Default to `ArrayList`. Reach for `ArrayDeque` when you need a stack or queue. Never use `LinkedList` unless you have a benchmark proving it wins.

---

## 2. Map: HashMap vs LinkedHashMap vs TreeMap vs ConcurrentHashMap

### Context
You need key-value association. Ordering, thread safety, and lookup cost differ across implementations.

### Options and Trade-offs

**HashMap**
- Hash table with O(1) average get/put. Buckets use linked lists that convert to red-black trees at depth 8 (Java 8+).
- Hidden cost: no ordering guarantee. Iteration order can change on resize. `null` keys are permitted (one only).
- Wins when: you only need fast lookup and don't care about order.

**LinkedHashMap**
- Extends `HashMap` with a doubly linked list threading all entries. Maintains insertion order (or access order if constructed with `accessOrder=true` for LRU cache behavior).
- Hidden cost: slightly higher memory (two extra pointers per entry) and marginally slower put than plain `HashMap`.
- Wins when: you need predictable iteration order or want to implement an LRU cache with `removeEldestEntry`.

**TreeMap**
- Red-black tree. Keys are sorted by natural order or a provided `Comparator`. get/put/remove are O(log n).
- Hidden cost: every operation is O(log n), not O(1). Keys must be `Comparable` or a comparator must be supplied.
- Wins when: you need `floorKey`, `ceilingKey`, `headMap`, `tailMap`, `subMap`, or range queries — i.e., sorted key navigation.

**ConcurrentHashMap**
- Segment-level (Java 7) / node-level (Java 8+) locking. Reads are lock-free. Writes lock only the affected bucket.
- Hidden cost: does not allow `null` keys or values. `size()` is approximate under concurrent mutation. Compound operations (check-then-act) still need explicit coordination with `computeIfAbsent` or similar atomic methods.
- Wins when: multiple threads read and write simultaneously. Far superior throughput to `Collections.synchronizedMap` under contention.

### Decision Rule
Use `HashMap` by default. Use `LinkedHashMap` for insertion-order iteration or LRU. Use `TreeMap` only when you need sorted keys or range queries. Use `ConcurrentHashMap` whenever multiple threads share the map.

---

## 3. Set: HashSet vs LinkedHashSet vs TreeSet vs EnumSet

### Context
You need unique elements with no duplicates. The question is whether you need ordering and what the element type is.

### Options and Trade-offs

**HashSet**
- Backed by a `HashMap`. O(1) add/contains/remove on average. No ordering.
- Hidden cost: same hash collision degradation as `HashMap`. Does not preserve any order.
- Wins when: deduplication with fast membership testing and order is irrelevant.

**LinkedHashSet**
- Backed by `LinkedHashMap`. Preserves insertion order. Slightly more memory than `HashSet`.
- Hidden cost: same pointer overhead as `LinkedHashMap`.
- Wins when: you need deduplication and predictable iteration order (e.g., building a pipeline that processes elements in the order they were first seen).

**TreeSet**
- Backed by `TreeMap`. Sorted order. O(log n) operations. Supports `floor`, `ceiling`, `headSet`, `tailSet`.
- Hidden cost: O(log n) per operation vs O(1) for `HashSet`. Elements must be `Comparable`.
- Wins when: you need a sorted unique collection or want range views.

**EnumSet**
- Bit-vector backed. Extremely compact and fast — all operations are O(1) and typically a single long bitwise operation.
- Hidden cost: elements must be of a single `enum` type. Cannot hold arbitrary objects.
- Wins when: the element domain is an enum. Always prefer `EnumSet` over `HashSet<MyEnum>`.

### Decision Rule
Use `HashSet` by default. Use `LinkedHashSet` for stable iteration order. Use `TreeSet` for sorted navigation. Use `EnumSet` whenever the elements are enum constants.

---

## 4. Queue/Stack: ArrayDeque vs PriorityQueue vs LinkedBlockingQueue

### Context
You need FIFO processing, priority-ordered processing, or a producer-consumer channel between threads.

### Options and Trade-offs

**ArrayDeque**
- Circular array. O(1) offer/poll at both ends. Implements `Deque`, so it works as both a queue and a stack. Faster than `LinkedList` and faster than `Stack`.
- Hidden cost: not thread-safe. Cannot store `null`.
- Wins when: single-threaded FIFO queue or stack use.

**PriorityQueue**
- Binary min-heap. poll/offer are O(log n). peek is O(1).
- Hidden cost: iteration order is not sorted — only the head is guaranteed to be the minimum. Removal of arbitrary elements is O(n).
- Wins when: you need to process elements by priority (e.g., Dijkstra, task scheduling, top-K problems).

**LinkedBlockingQueue**
- Optionally bounded FIFO queue backed by linked nodes. Thread-safe. put blocks when full; take blocks when empty.
- Hidden cost: per-node allocation (like `LinkedList`). Two separate locks for head and tail allow concurrent producers and consumers, but there is still lock overhead.
- Wins when: classic producer-consumer pattern where threads must block waiting for work.

### Decision Rule
Use `ArrayDeque` for single-threaded queues and stacks. Use `PriorityQueue` when element ordering matters. Use `LinkedBlockingQueue` (or `ArrayBlockingQueue` for bounded capacity) in multi-threaded producer-consumer scenarios.

---

## 5. Thread-safe List: CopyOnWriteArrayList vs Collections.synchronizedList vs ConcurrentLinkedQueue

### Context
Multiple threads share a list. You need to decide how to synchronize access.

### Options and Trade-offs

**CopyOnWriteArrayList**
- On every write (add, set, remove), the entire backing array is copied into a new array. Reads are completely lock-free and iterate a stable snapshot.
- Hidden cost: writes are O(n) in time and memory due to array copy. GC pressure increases with write frequency. Iterators never throw `ConcurrentModificationException` but may see a stale view.
- Wins when: reads vastly outnumber writes (e.g., a list of event listeners, plugin registry, feature flags read on every request but updated rarely).

**Collections.synchronizedList**
- Wraps any `List` and synchronizes every method on a single mutex. Simple and correct.
- Hidden cost: a single lock means all reads and writes are serialized — poor throughput under contention. Compound operations (iteration, contains+add) must be manually synchronized by the caller: `synchronized(list) { for (...) }`.
- Wins when: you need a thread-safe `List` with mixed read/write frequency and don't want `CopyOnWriteArrayList` copy overhead. Acceptable when contention is low.

**ConcurrentLinkedQueue**
- Lock-free FIFO queue using CAS operations. High throughput under concurrent producers and consumers.
- Hidden cost: does not implement `List`, so no indexed access. `size()` is O(n). Not suitable if you need `get(index)`.
- Wins when: you need a high-throughput, non-blocking queue shared across threads and don't need random access.

### Decision Rule
If reads dominate (10:1 or more over writes), use `CopyOnWriteArrayList`. If writes are frequent, use `Collections.synchronizedList` for simplicity or `ConcurrentLinkedQueue` if FIFO semantics are sufficient. Never use `synchronizedList` for iteration without external synchronization on the lock object.

---

## Code Example

```java
import java.util.*;
import java.util.concurrent.*;

public class JavaLabRunner {

    public static void main(String[] args) {
        demonstrateListChoice();
        demonstrateMapChoice();
        demonstrateSetChoice();
        demonstrateQueueChoice();
        demonstrateConcurrentListChoice();
    }

    // 1. List choices
    static void demonstrateListChoice() {
        System.out.println("=== List Choices ===");

        // ArrayList: fast random access and append
        List<String> arrayList = new ArrayList<>();
        arrayList.add("alpha");
        arrayList.add("beta");
        arrayList.add("gamma");
        System.out.println("ArrayList get(1): " + arrayList.get(1)); // O(1)

        // ArrayDeque as stack (faster than Stack class)
        Deque<String> stack = new ArrayDeque<>();
        stack.push("first");
        stack.push("second");
        stack.push("third");
        System.out.println("ArrayDeque stack pop: " + stack.pop()); // third (LIFO)

        // ArrayDeque as queue (faster than LinkedList as queue)
        Deque<String> queue = new ArrayDeque<>();
        queue.offer("first");
        queue.offer("second");
        queue.offer("third");
        System.out.println("ArrayDeque queue poll: " + queue.poll()); // first (FIFO)
    }

    // 2. Map choices
    static void demonstrateMapChoice() {
        System.out.println("\n=== Map Choices ===");

        // HashMap: fast lookup, no ordering
        Map<String, Integer> hashMap = new HashMap<>();
        hashMap.put("banana", 2);
        hashMap.put("apple", 1);
        hashMap.put("cherry", 3);
        System.out.println("HashMap (unordered): " + hashMap);

        // LinkedHashMap: insertion-order preserved
        Map<String, Integer> linkedHashMap = new LinkedHashMap<>();
        linkedHashMap.put("banana", 2);
        linkedHashMap.put("apple", 1);
        linkedHashMap.put("cherry", 3);
        System.out.println("LinkedHashMap (insertion order): " + linkedHashMap);

        // TreeMap: sorted by key
        Map<String, Integer> treeMap = new TreeMap<>();
        treeMap.put("banana", 2);
        treeMap.put("apple", 1);
        treeMap.put("cherry", 3);
        System.out.println("TreeMap (sorted): " + treeMap);
        System.out.println("TreeMap floorKey('b'): " + ((TreeMap<String, Integer>) treeMap).floorKey("b"));

        // ConcurrentHashMap: thread-safe, atomic compute
        ConcurrentMap<String, Integer> concurrentMap = new ConcurrentHashMap<>();
        concurrentMap.put("count", 0);
        concurrentMap.computeIfAbsent("newKey", k -> k.length());
        concurrentMap.merge("count", 1, Integer::sum);
        System.out.println("ConcurrentHashMap count: " + concurrentMap.get("count"));
    }

    // 3. Set choices
    static void demonstrateSetChoice() {
        System.out.println("\n=== Set Choices ===");

        // HashSet: fast dedup, no order
        Set<String> hashSet = new HashSet<>(Arrays.asList("c", "a", "b", "a"));
        System.out.println("HashSet (no order): " + hashSet);

        // LinkedHashSet: dedup + insertion order
        Set<String> linkedHashSet = new LinkedHashSet<>(Arrays.asList("c", "a", "b", "a"));
        System.out.println("LinkedHashSet (insertion order): " + linkedHashSet);

        // TreeSet: sorted unique elements
        Set<String> treeSet = new TreeSet<>(Arrays.asList("c", "a", "b", "a"));
        System.out.println("TreeSet (sorted): " + treeSet);
        System.out.println("TreeSet headSet('b'): " + ((TreeSet<String>) treeSet).headSet("b"));

        // EnumSet: most efficient set for enums
        enum Day { MON, TUE, WED, THU, FRI, SAT, SUN }
        Set<Day> weekend = EnumSet.of(Day.SAT, Day.SUN);
        Set<Day> weekdays = EnumSet.range(Day.MON, Day.FRI);
        System.out.println("EnumSet weekend: " + weekend);
        System.out.println("EnumSet weekdays size: " + weekdays.size());
    }

    // 4. Queue and Stack choices
    static void demonstrateQueueChoice() {
        System.out.println("\n=== Queue/Stack Choices ===");

        // PriorityQueue: min-heap by default
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        minHeap.offer(30);
        minHeap.offer(10);
        minHeap.offer(20);
        System.out.println("PriorityQueue poll order: " + minHeap.poll() + ", " + minHeap.poll()); // 10, 20

        // Max-heap with reversed comparator
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
        maxHeap.offer(30);
        maxHeap.offer(10);
        maxHeap.offer(20);
        System.out.println("Max-heap poll: " + maxHeap.poll()); // 30

        // LinkedBlockingQueue: bounded blocking producer-consumer
        LinkedBlockingQueue<String> blockingQueue = new LinkedBlockingQueue<>(3);
        blockingQueue.offer("task-1");
        blockingQueue.offer("task-2");
        System.out.println("LinkedBlockingQueue poll: " + blockingQueue.poll());
        System.out.println("LinkedBlockingQueue remaining capacity: " + blockingQueue.remainingCapacity());
    }

    // 5. Concurrent list choices
    static void demonstrateConcurrentListChoice() throws RuntimeException {
        System.out.println("\n=== Concurrent List Choices ===");

        // CopyOnWriteArrayList: safe iteration without locks, best for rare writes
        List<String> cowList = new CopyOnWriteArrayList<>();
        cowList.add("listener-1");
        cowList.add("listener-2");
        // Safe to iterate while another thread might write — reads a stable snapshot
        for (String listener : cowList) {
            System.out.println("COW iterate: " + listener);
        }
        cowList.add("listener-3"); // Creates new backing array, does not affect current iterator

        // Collections.synchronizedList: simple wrapper, but iteration must be externally synced
        List<String> syncList = Collections.synchronizedList(new ArrayList<>());
        syncList.add("item-1");
        syncList.add("item-2");
        synchronized (syncList) { // Required for safe iteration
            for (String item : syncList) {
                System.out.println("SyncList iterate: " + item);
            }
        }

        // ConcurrentLinkedQueue: lock-free FIFO, high-throughput
        ConcurrentLinkedQueue<String> clq = new ConcurrentLinkedQueue<>();
        clq.offer("job-1");
        clq.offer("job-2");
        System.out.println("ConcurrentLinkedQueue poll: " + clq.poll());
        System.out.println("ConcurrentLinkedQueue size (O(n)): " + clq.size());
    }
}
```

---

## Interview Q&As

Q: Everyone knows LinkedList has O(1) insertion — so why should I avoid it?

A: The O(1) insertion is real but misleading. To insert at the middle of a `LinkedList`, you first have to find the position, which is O(n) traversal — so the overall operation is still O(n). For random access by index, `LinkedList` is always O(n) vs `ArrayList`'s O(1). Beyond algorithmic complexity, `LinkedList` nodes are individually heap-allocated, which means poor CPU cache locality. An `ArrayList` or `ArrayDeque` stores elements in a contiguous array, so sequential iteration triggers hardware prefetch and is several times faster in practice. The only case where `LinkedList` is genuinely superior is insertion/removal at a known iterator position without index traversal, which is rare in real code. `ArrayDeque` beats `LinkedList` even as a stack or queue because array-based resizing is amortized O(1) with much better cache behavior.

---

Q: What exactly is the trade-off between HashMap and ConcurrentHashMap — why not just always use ConcurrentHashMap to be safe?

A: `ConcurrentHashMap` is not free. In a single-threaded context it adds CAS (compare-and-swap) overhead and memory barriers that `HashMap` avoids entirely. `ConcurrentHashMap` also forbids `null` keys and `null` values, which can break code that relies on `map.get(key) == null` as a sentinel — you must use `containsKey` instead. Most importantly, `ConcurrentHashMap` only guarantees atomicity at the individual operation level. Compound operations like "check-then-put" are still not atomic unless you use `computeIfAbsent`, `merge`, or `compute`. Developers sometimes use `ConcurrentHashMap` and then still write unsafe check-then-act code, giving false confidence. Reserve `ConcurrentHashMap` for maps genuinely shared across threads. For single-threaded or externally-synchronized contexts, `HashMap` is simpler, faster, and permissive with `null`.

---

Q: When does CopyOnWriteArrayList beat Collections.synchronizedList, and when does it lose?

A: `CopyOnWriteArrayList` wins when reads vastly outnumber writes — the classic example is a list of registered event listeners or observers. Reads are completely lock-free: every thread reads a stable snapshot of the backing array with no synchronization at all. Iterators never throw `ConcurrentModificationException`. `Collections.synchronizedList` loses here because every `get` and iteration acquires a mutex, serializing readers. `CopyOnWriteArrayList` loses when writes are frequent: each write allocates a new array and copies all existing elements, giving O(n) write cost and GC pressure proportional to list size times write rate. `Collections.synchronizedList` also loses for iteration if callers forget to synchronize externally — iterating without `synchronized(list) {}` is a data race. For high-write, high-concurrency workloads, neither is ideal; prefer `ConcurrentLinkedQueue` for FIFO access or redesign with thread-local structures.

---

Q: When would you choose TreeMap over HashMap in a production system?

A: Whenever the algorithm requires sorted key access or range queries. Concrete examples: implementing a rate limiter where keys are timestamps and you call `headMap(cutoff).clear()` to remove expired entries in one operation; building an auction order book where bids are sorted by price and you call `floorKey(marketPrice)` to find the best bid; or implementing an LRU cache with TTL where `firstKey()` gives the oldest entry. `TreeMap` also wins when you need `NavigableMap` methods: `ceilingKey`, `floorKey`, `higherKey`, `lowerKey`, `subMap`, `headMap`, `tailMap`. The cost is O(log n) per operation instead of O(1), which matters at scale. If you only need "does this key exist and what is its value," use `HashMap`. If you need to ask questions about the relative ordering or range of keys, use `TreeMap`.
