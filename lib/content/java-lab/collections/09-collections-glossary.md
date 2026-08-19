# Collections Terminology — Interview Reference

## Why this matters in interviews

Collections questions are the most frequent warm-up topic at every seniority level. Interviewers expect exact vocabulary: saying "HashMap uses buckets and a linked list for collisions, tree-binned at threshold 8" is far stronger than "it uses hashing." This lesson is a reference dictionary — read it before your interview.

## Concept

### Core Interfaces & Hierarchy

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **`Collection`** | Root interface for single-element containers; extends `Iterable` | "`List`, `Set`, and `Queue` all extend `Collection`." |
| **`List`** | Ordered, index-addressable collection; allows duplicates | "`ArrayList` and `LinkedList` implement `List`." |
| **`Set`** | Unordered collection with no duplicates | "`HashSet` uses `equals`/`hashCode`; `TreeSet` uses `Comparable` or a `Comparator`." |
| **`Map`** | Key-value pairs; keys unique, values may repeat | "`Map` does not extend `Collection` — it's a separate hierarchy." |
| **`Queue`** | FIFO access; `offer`/`poll`/`peek` are the safe API | "`ArrayDeque` is the preferred `Queue` implementation over `LinkedList`." |
| **`Deque`** | Double-ended queue; supports both stack (LIFO) and queue (FIFO) | "Prefer `ArrayDeque` over `java.util.Stack` — `Stack` is a legacy synchronized class." |

---

### Internal Data Structures

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **Backing array** | The raw array a collection stores elements in internally | "`ArrayList` grows its backing array by 50% when capacity is exceeded." |
| **Bucket** | A slot in a hash table's internal array | "Two keys with the same hash code land in the same bucket — a collision." |
| **Collision chain** | A linked list of `Node` entries within one bucket when multiple keys hash to the same index | "Java 7 kept collision chains as linked lists — worst-case `get` was O(n)." |
| **Treeification** | Converting a collision chain to a red-black tree when it reaches 8 nodes (Java 8+) | "Treeification caps worst-case `HashMap.get` at O(log n) instead of O(n)." |
| **Red-black tree** | A self-balancing BST used internally by `HashMap` (treeified buckets) and `TreeMap` | "`TreeMap` is always a red-black tree — every operation is O(log n)." |
| **Skip list** | A probabilistic layered linked list used by `ConcurrentSkipListMap` for lock-free sorted access | "`ConcurrentSkipListMap` gives sorted, thread-safe access without a global lock." |

---

### Hashing Concepts

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **`hashCode()`** | Maps an object to an `int` used to pick its bucket | "If two objects are `equal`, they must return the same `hashCode` — this is the contract." |
| **`equals()`** | Defines logical equality between two objects | "Override `equals` to compare fields; the default is identity (`==`)." |
| **`equals`/`hashCode` contract** | `a.equals(b)` → `a.hashCode() == b.hashCode()` (must); converse need not hold | "Break this contract and `HashMap` silently loses your key." |
| **Hash spread** | `HashMap` applies `hash ^ (hash >>> 16)` to mix high bits into low bits | "Prevents collisions when keys differ only in high-order bits." |
| **Load factor** | Ratio of entries to capacity that triggers a resize; default `0.75` | "At 75% full, `HashMap` doubles its table and rehashes all entries." |
| **Rehashing** | Recomputing bucket indices for all entries after a resize | "Rehash is O(n) but amortised O(1) per insertion over many inserts." |
| **Pre-sizing** | Setting initial capacity to avoid rehashing | "`new HashMap<>(expectedSize / 0.75 + 1)` avoids any resize." |

---

### Ordering & Sorting

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **Natural ordering** | The order defined by a class implementing `Comparable<T>` | "`String`, `Integer`, and `LocalDate` all have natural ordering." |
| **`Comparable`** | Interface with `compareTo(T o)` — defines the class's natural order | "`TreeMap` uses the key's `compareTo` when no `Comparator` is given." |
| **`Comparator`** | External ordering strategy passed to a collection or sort | "`Comparator.comparingInt(Person::age).thenComparing(Person::name)` — multi-key sort." |
| **Total order** | Every pair of elements is comparable — required by `TreeSet`/`TreeMap` | "A `Comparator` that returns 0 for unequal elements breaks `TreeSet` — it treats them as duplicates." |
| **Stable sort** | Equal elements preserve their original relative order | "`Arrays.sort` on objects (Timsort) is stable; `Arrays.sort` on primitives (dual-pivot quicksort) is not." |

---

### Iteration

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **`Iterator`** | Cursor that traverses a collection via `hasNext()`/`next()` | "Use `iterator.remove()` — never `list.remove()` inside an iterator loop." |
| **`ListIterator`** | Bidirectional iterator for `List`; supports `add`/`set`/`previous` | "`ListIterator` lets you traverse backwards and replace elements in-place." |
| **`Iterable`** | Interface with `iterator()` — enables the for-each loop | "Implement `Iterable` on your custom class to enable `for (X x : myClass)`." |
| **Fail-fast iterator** | Throws `ConcurrentModificationException` if the collection is structurally modified during iteration | "`ArrayList`'s iterator is fail-fast — detecting modification via `modCount`." |
| **Fail-safe iterator** | Iterates over a snapshot; no exception on concurrent modification, but may not reflect recent changes | "`CopyOnWriteArrayList`'s iterator is fail-safe — it reads the snapshot at creation time." |
| **`modCount`** | Internal counter incremented on structural modification; checked by fail-fast iterators | "If your iterator's `modCount` doesn't match the list's, it throws `ConcurrentModificationException`." |

---

### Complexity & Sizing

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **Amortised O(1)** | Individual ops may be costly but average cost over many ops is O(1) | "`ArrayList.add` is amortised O(1) — most adds are O(1); occasional resize is O(n)." |
| **Random access** | O(1) element lookup by index | "`ArrayList` supports random access; `LinkedList` is O(n) for `get(i)`." |
| **Structural modification** | An operation that changes the size of the collection (add/remove) | "Calling `list.add()` during for-each is a structural modification — use `Iterator.remove()` instead." |
| **Capacity vs size** | Capacity: allocated internal slots. Size: actual element count | "`new ArrayList<>(100)` has capacity 100 and size 0." |

---

### Key Class Characteristics

| Class | Ordering | Null key/value | Thread-safe | Complexity |
|-------|---------|---------------|-------------|------------|
| `ArrayList` | Insertion | — | No | get O(1), add O(1)†, insert O(n) |
| `LinkedList` | Insertion | — | No | get O(n), add-head O(1) |
| `HashMap` | None | Key: one null, value: yes | No | get/put O(1)† |
| `LinkedHashMap` | Insertion (or access) | Same as HashMap | No | get/put O(1) |
| `TreeMap` | Key natural/Comparator | No null key | No | get/put O(log n) |
| `HashSet` | None | One null | No | add/contains O(1)† |
| `TreeSet` | Natural/Comparator | No null | No | add/contains O(log n) |
| `ArrayDeque` | FIFO/LIFO | No null | No | offer/poll O(1) |
| `PriorityQueue` | Heap order | No null | No | offer O(log n), peek O(1) |

*† amortised*

---

### Utility & Factory

| Term | Definition | Example sentence |
|------|-----------|-----------------|
| **`Collections.unmodifiableList`** | Returns a view that throws on mutation; the backing list can still change | "Unmodifiable is not immutable — if someone holds the original list they can still mutate it." |
| **`List.of` / `Set.of` / `Map.of`** | Truly immutable factory (Java 9+); throws on any mutation; rejects null | "Prefer `List.of(...)` over `Collections.unmodifiableList` when you own the data." |
| **`Collections.synchronizedList`** | Wraps a list with a synchronized mutex; still needs external lock for iteration | "Use `CopyOnWriteArrayList` or synchronize manually during iteration — `synchronizedList` is not enough alone." |
| **`Arrays.asList`** | Fixed-size list backed by the array; supports `set` but not `add`/`remove` | "`Arrays.asList` throws `UnsupportedOperationException` on `add` — wrap with `new ArrayList<>(Arrays.asList(...))` to make it resizable." |

## Key rules / gotchas

- **Never put mutable objects as `HashMap` keys** — if you mutate a key after insertion, its `hashCode` changes and you can no longer find the entry.
- **`TreeSet` silently drops elements when `compareTo` returns 0** even if `equals` returns `false` — your `Comparator` must be consistent with `equals`.
- **`PriorityQueue` is not sorted** — `iterator()` traversal order is undefined. Only `poll()` gives elements in priority order.
- **`LinkedList` is rarely the right choice** — pointer overhead makes it slower than `ArrayList` in practice for most workloads despite O(1) head insert.
- **`List.of` rejects `null`** — use `ArrayList` or `Arrays.asList` if you need to store nulls.
- **`HashMap` allows one `null` key; `Hashtable` and `TreeMap` do not** — `TreeMap` would throw `NullPointerException` when calling `compareTo(null)`.
- **`equals`/`hashCode` must use the same fields** — include a field in `equals` but not `hashCode` and collisions skyrocket; include in `hashCode` but not `equals` and lookups silently fail.

## Code example

```java
import java.util.*;

public class JavaLabRunner {
    record Point(int x, int y) {} // records auto-generate equals/hashCode/toString

    public static void main(String[] args) {
        // Fail-fast iterator — correct removal pattern
        List<Integer> list = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5));
        Iterator<Integer> it = list.iterator();
        while (it.hasNext()) {
            if (it.next() % 2 == 0) it.remove(); // safe; list.remove() would throw
        }
        System.out.println("After removal: " + list); // [1, 3, 5]

        // HashMap pre-sizing to avoid rehash
        int expected = 1000;
        Map<String, Integer> map = new HashMap<>((int)(expected / 0.75) + 1);
        map.put("key", 42);
        System.out.println("Pre-sized map, no resize needed for 1000 entries");

        // TreeMap: sorted, no null keys, natural order
        TreeMap<String, Integer> tree = new TreeMap<>();
        tree.put("banana", 2); tree.put("apple", 1); tree.put("cherry", 3);
        System.out.println("TreeMap (sorted): " + tree);
        System.out.println("Floor of 'avocado': " + tree.floorKey("avocado")); // null
        System.out.println("Ceiling of 'avocado': " + tree.ceilingKey("avocado")); // banana

        // equals/hashCode contract with records
        Set<Point> points = new HashSet<>();
        points.add(new Point(1, 2));
        points.add(new Point(1, 2)); // duplicate — records compare by value
        System.out.println("Set size (should be 1): " + points.size());

        // List.of — truly immutable
        List<String> immutable = List.of("a", "b", "c");
        try {
            immutable.add("d");
        } catch (UnsupportedOperationException e) {
            System.out.println("List.of is immutable: " + e.getClass().getSimpleName());
        }

        // PriorityQueue — only poll() gives priority order
        PriorityQueue<Integer> pq = new PriorityQueue<>();
        pq.addAll(List.of(5, 1, 3, 2, 4));
        System.out.print("PriorityQueue poll order: ");
        while (!pq.isEmpty()) System.out.print(pq.poll() + " "); // 1 2 3 4 5
        System.out.println();
    }
}
```

## Interview questions you should be able to answer

- **Q:** Why does `HashMap` apply `hash ^ (hash >>> 16)` instead of using `hashCode()` directly?
  > Bucket index is `hash & (n-1)`, so only the lower bits matter. Objects whose `hashCode` differs only in high bits would all collide in the same bucket. XOR-ing with the upper half spreads those bits into the lower range, reducing collisions.

- **Q:** What is the difference between `Collections.unmodifiableList` and `List.of`?
  > `unmodifiableList` is a view — the underlying list can still be mutated by whoever holds the original reference. `List.of` produces a truly immutable list with no backing mutable reference; it also rejects null elements and has a more compact internal representation.

- **Q:** When would you use `LinkedHashMap` over `HashMap`?
  > When iteration order matters. `LinkedHashMap` preserves insertion order (or access order if constructed with `accessOrder=true`). The classic use case is an LRU cache — override `removeEldestEntry` to evict the least-recently-used entry when size exceeds the limit.

- **Q:** Why is `TreeSet` inconsistent with `equals` a problem?
  > `TreeSet` uses `compareTo` (or `Comparator`) for all operations — it never calls `equals`. If `compareTo` returns 0 for two objects that `equals` says are different, the set treats them as duplicates and silently drops one, violating the `Set` contract.

- **Q:** What is the `modCount` mechanism and why does it exist?
  > `ArrayList` (and most `AbstractList` subclasses) maintains a `modCount` counter incremented on every structural modification. The iterator captures `modCount` at creation; on each `next()` call it checks for a mismatch. If the list was modified outside the iterator, it throws `ConcurrentModificationException` immediately rather than returning corrupt data silently.

- **Q:** Why is `LinkedList` usually slower than `ArrayList` in practice despite having O(1) head/tail operations?
  > Each `LinkedList` node allocates a separate heap object with two pointer fields, causing pointer-chasing on traversal and high GC pressure. `ArrayList`'s contiguous backing array has excellent CPU cache locality. In benchmarks, `ArrayList` beats `LinkedList` even for prepend-heavy workloads until lists are very large, because cache misses dominate.

## Further reading

- [OpenJDK ArrayList source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/ArrayList.java)
- [OpenJDK HashMap source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/HashMap.java)
- [Baeldung: Java Collections Interview Questions](https://www.baeldung.com/java-collections-interview-questions)
