# HashMap Internals

## Why this matters in interviews

HashMap is the single most-asked Java collections topic at Senior level. Interviewers probe whether you understand *why* get/put is O(1) on average, what breaks that guarantee, and the Java 8 treeification change. Expect follow-ups on the equals/hashCode contract and thread-safety.

## Concept

### Internal structure

A `HashMap<K,V>` is backed by an array of **buckets** (called `table`). Each bucket is either:
- `null` (empty)
- A linked list of `Node<K,V>` (collision chain)
- A red-black `TreeNode<K,V>` (when chain length ≥ 8, Java 8+)

```
table[]
  [0]  →  null
  [1]  →  Node("apple", 3) → Node("mango", 7)  ← collision chain
  [2]  →  TreeNode(...)                          ← treeified (≥ 8 nodes)
  ...
  [15] →  null
```

### put() algorithm

1. Compute `hash = key.hashCode()`, then spread high bits: `hash ^ (hash >>> 16)`
2. Bucket index: `i = hash & (n-1)` where `n` is table length (always power of 2)
3. If bucket is empty → insert new `Node`
4. If bucket occupied → walk the chain comparing `hash` and `equals()`
   - Found match → overwrite value
   - No match → append new node
5. If chain length reaches 8 → convert to red-black tree
6. If `size > capacity * loadFactor` → **resize** (double table, rehash all entries)

### Default parameters

| Parameter | Default | Why |
|-----------|---------|-----|
| Initial capacity | 16 | Small power-of-2 start |
| Load factor | 0.75 | Empirical sweet spot: time vs space |
| Treeify threshold | 8 | Linked list acceptable below this |
| Untreeify threshold | 6 | Hysteresis to avoid thrashing |

### Time complexity

| Operation | Average | Worst case |
|-----------|---------|------------|
| get / put | O(1) | O(log n) with treeification; O(n) without (Java 7) |
| remove | O(1) | O(log n) |
| Resize | O(n) | amortized O(1) per put |

## Key rules / gotchas

- **Iteration order is undefined** and changes on resize. Use `LinkedHashMap` for insertion order.
- **Not thread-safe.** Concurrent writes can cause an infinite loop (Java 6) or data corruption. Use `ConcurrentHashMap`.
- **Key immutability matters.** If you mutate a key after inserting it, its hash changes and you can no longer find the entry.
- **resize is expensive** — pre-size with `new HashMap<>(expectedSize / 0.75 + 1)` when you know the size upfront.
- `null` key is allowed (stored in bucket 0). `null` values are also allowed.

## Code example

```java
import java.util.*;

public class JavaLabRunner {
    public static void main(String[] args) {
        Map<String, Integer> map = new HashMap<>();
        map.put("apple", 3);
        map.put("banana", 5);
        map.put("cherry", 2);

        System.out.println("apple: " + map.get("apple"));

        map.putIfAbsent("apple", 99); // won't overwrite
        System.out.println("apple after putIfAbsent: " + map.get("apple"));
        System.out.println("mango (default): " + map.getOrDefault("mango", 0));

        // Frequency counting pattern
        String sentence = "hello world hello java";
        Map<String, Integer> freq = new HashMap<>();
        for (String word : sentence.split(" ")) {
            freq.merge(word, 1, Integer::sum);
        }
        System.out.println("Word frequencies: " + freq);
    }
}
```

## Interview questions you should be able to answer

- **Q:** What is the time complexity of `HashMap.get()`?
  > O(1) average. O(log n) worst-case since Java 8 due to treeification. O(n) in Java 7 when many keys hash to the same bucket.

- **Q:** What happens when two keys have the same hash code?
  > They land in the same bucket and form a collision chain. Java 8+ converts it to a red-black tree once the chain exceeds 8 nodes, keeping worst-case at O(log n).

- **Q:** Why must you override both `equals()` and `hashCode()` together?
  > The contract: if `a.equals(b)` then `a.hashCode() == b.hashCode()`. If you override `equals` but not `hashCode`, two "equal" objects can land in different buckets and the map will fail to find the key.

- **Q:** How is `HashMap` different from `Hashtable`?
  > `Hashtable` is synchronized (every method holds the lock), legacy, doesn't allow null keys/values. Prefer `ConcurrentHashMap` for thread-safety — it uses segment-level locking (Java 7) or CAS (Java 8+).

- **Q:** What is the purpose of the `>>>16` in the hash spread?
  > `HashMap` only uses the lower bits of the hash for bucket selection. Without spreading, objects whose `hashCode()` differs only in high bits would all collide in the same bucket.

## Further reading

- [OpenJDK HashMap source](https://github.com/openjdk/jdk/blob/master/src/java.base/share/classes/java/util/HashMap.java)
- [Baeldung: HashMap internals](https://www.baeldung.com/java-hashmap)
