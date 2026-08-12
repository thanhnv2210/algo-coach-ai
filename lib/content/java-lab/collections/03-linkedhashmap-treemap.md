# LinkedHashMap & TreeMap

## Why this matters in interviews

Interviewers use this to distinguish candidates who know the *right tool* from those who reach for `HashMap` by default. `LinkedHashMap` is the key to the LRU cache problem (a classic system design coding question). `TreeMap` comes up whenever you need sorted keys or range queries.

## Concept

### LinkedHashMap

`LinkedHashMap` extends `HashMap` and adds a **doubly-linked list** threading through all entries.

- **Insertion-order mode** (default): entries iterated in the order they were first added.
- **Access-order mode** (`new LinkedHashMap<>(16, 0.75f, true)`): entries are reordered to the tail on every `get()` or `put()`. The head is the **least recently used** entry.

By overriding `removeEldestEntry()`, you get an O(1) LRU cache in ~5 lines.

```
LinkedList of entries (doubly-linked):
  head ↔ [banana,2] ↔ [apple,1] ↔ [cherry,3] ↔ tail
  Bucket array still present for O(1) lookup
```

### TreeMap

`TreeMap` is backed by a **red-black tree** (self-balancing BST). Keys are always kept in **sorted order** (natural ordering or a custom `Comparator`).

- All operations: O(log n)
- Implements `NavigableMap` — exposes `floorKey`, `ceilingKey`, `headMap`, `tailMap`, `subMap`
- `null` keys are **not** allowed (comparison would throw NPE)

```
Red-black tree:
        [banana]
       /        \
   [apple]   [cherry]
```

## Key rules / gotchas

- `LinkedHashMap` preserves insertion order — `HashMap` does not.
- Use access-order `LinkedHashMap` for LRU; the `removeEldestEntry` hook fires after every `put`.
- `TreeMap` sorts by key, not value. To sort by value you need an external `sort` on `entrySet()`.
- `TreeMap` requires keys to be `Comparable` or a `Comparator` to be provided — otherwise you get a `ClassCastException` at runtime on the first `put`.
- `subMap(from, to)` is **exclusive** of `to`. Use `subMap(from, true, to, true)` for inclusive bounds.

## Code example

```java
import java.util.*;

public class JavaLabRunner {
    public static void main(String[] args) {
        // LinkedHashMap: insertion-order preserved
        Map<String, Integer> linked = new LinkedHashMap<>();
        linked.put("banana", 2);
        linked.put("apple", 1);
        linked.put("cherry", 3);
        System.out.println("LinkedHashMap (insertion order): " + linked);

        // LRU cache: capacity 3
        Map<String, Integer> lru = new LinkedHashMap<>(16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, Integer> eldest) {
                return size() > 3;
            }
        };
        lru.put("a", 1); lru.put("b", 2); lru.put("c", 3);
        lru.get("a");    // 'a' now most recently used
        lru.put("d", 4); // evicts 'b' (least recently used)
        System.out.println("LRU after eviction: " + lru);

        // TreeMap: sorted keys, NavigableMap methods
        TreeMap<String, Integer> tree = new TreeMap<>();
        tree.put("banana", 2); tree.put("apple", 1); tree.put("cherry", 3);
        System.out.println("\nTreeMap (sorted): " + tree);
        System.out.println("floorKey(\"avocado\"): " + tree.floorKey("avocado"));
        System.out.println("ceilingKey(\"avocado\"): " + tree.ceilingKey("avocado"));
        System.out.println("subMap apple..cherry: " + tree.subMap("apple", "cherry"));
    }
}
```

## Interview questions you should be able to answer

- **Q:** How would you implement an LRU cache without using LinkedHashMap?
  > Manual approach: `HashMap<K, Node<K,V>>` for O(1) lookup + doubly-linked list for O(1) MRU eviction. LinkedHashMap in access-order mode gives you this out of the box.

- **Q:** What is the time complexity of `TreeMap.get()`?
  > O(log n) — the red-black tree must be traversed to find the key.

- **Q:** How do you sort a `Map` by value?
  > `map.entrySet().stream().sorted(Map.Entry.comparingByValue()).collect(Collectors.toList())`. Or `Collections.sort` on `entrySet()` with a custom comparator.

- **Q:** When would you choose `TreeMap` over sorting a `List`?
  > When you need ongoing sorted access with frequent insertions/deletions. `TreeMap` maintains sort order on every insert (O(log n)); sorting a `List` on demand is O(n log n).

- **Q:** What is the difference between `headMap`, `tailMap`, and `subMap`?
  > `headMap(toKey)` — all keys strictly less than `toKey`. `tailMap(fromKey)` — all keys ≥ `fromKey`. `subMap(from, to)` — keys from `from` (inclusive) to `to` (exclusive). All return **live views** — mutations are reflected in the original map.

## Further reading

- [Java LinkedHashMap docs](https://docs.oracle.com/en/java/docs/api/java.base/java/util/LinkedHashMap.html)
- [Java TreeMap docs](https://docs.oracle.com/en/java/docs/api/java.base/java/util/TreeMap.html)
- [Baeldung: LRU Cache in Java](https://www.baeldung.com/java-lru-cache)
