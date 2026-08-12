# ArrayList vs LinkedList

## Why this matters in interviews

Interviewers ask this to test whether you understand the underlying data structure, not just the API. A common trap is reaching for `LinkedList` when you want fast insertions — but in practice `ArrayList` wins almost every benchmark due to CPU cache locality.

## Concept

**ArrayList** is backed by a resizable array. Elements sit contiguously in memory.

```
index:  0    1    2    3    4
       [10] [20] [30] [40] [50]
```

- **get(i)** — O(1) direct index
- **add(e)** at tail — O(1) amortized (doubles capacity when full)
- **add(i, e)** at index — O(n) because elements after `i` must shift right
- **remove(i)** — O(n) for same reason

**LinkedList** is a doubly-linked list. Each node holds `prev`, `next`, and `data`.

```
head ↔ [10] ↔ [20] ↔ [30] ↔ [40] ↔ [50] ↔ tail
```

- **get(i)** — O(n) must traverse from head or tail
- **add/remove at head or tail** — O(1)
- **add/remove at arbitrary index** — O(n) to find the node, then O(1) to relink

## Key rules / gotchas

- `LinkedList` is almost never the right choice in modern Java. Its cache-miss overhead defeats the O(1) insertion advantage for most realistic sizes.
- `ArrayList` is the default `List` — use it unless you have profiler evidence otherwise.
- **Iterator removal** is safe for both; `list.remove()` inside a for-each loop throws `ConcurrentModificationException`.
- `LinkedList` implements both `List` and `Deque` — so it can act as a queue/stack, but `ArrayDeque` is faster for that too.
- Capacity vs size: `ArrayList` has a `capacity` (internal array length) and `size` (elements stored). Call `trimToSize()` if you want to reclaim unused slots.

## Code example

```java
import java.util.*;

public class JavaLabRunner {
    public static void main(String[] args) {
        List<Integer> arrayList = new ArrayList<>();
        List<Integer> linkedList = new LinkedList<>();

        for (int i = 0; i < 5; i++) {
            arrayList.add(i);
            linkedList.add(i);
        }

        // Random access — O(1) vs O(n)
        System.out.println("ArrayList get(2): " + arrayList.get(2));
        System.out.println("LinkedList get(2): " + linkedList.get(2));

        // Insert at head — O(n) vs O(1)
        arrayList.add(0, 99);
        linkedList.add(0, 99);

        // Iterator removal (safe pattern)
        Iterator<Integer> it = arrayList.iterator();
        while (it.hasNext()) {
            if (it.next() % 2 == 0) it.remove();
        }
        System.out.println("ArrayList after removing evens: " + arrayList);
    }
}
```

## Interview questions you should be able to answer

- **Q:** Why is ArrayList generally faster than LinkedList for iteration even though both are O(n)?
  > ArrayList's contiguous memory layout benefits from CPU cache prefetching. LinkedList nodes are scattered across the heap, causing frequent cache misses.

- **Q:** When would you actually use LinkedList?
  > Rarely. One legitimate case: you hold an `Iterator` and need O(1) insertions at the current cursor position via `ListIterator.add()`. Even then, a `Deque` (ArrayDeque) is often better.

- **Q:** What happens when an ArrayList grows beyond its capacity?
  > It allocates a new array at 1.5× the old capacity, copies all elements, and discards the old array. This is the amortized O(1) cost of `add()`.

- **Q:** What is the fail-fast behavior of ArrayList's iterator?
  > The iterator tracks a `modCount`. If the list is structurally modified outside the iterator (add/remove while iterating with for-each), the next `next()` or `remove()` call throws `ConcurrentModificationException`. This is a best-effort check, not a guarantee.

## Further reading

- [Java ArrayList docs](https://docs.oracle.com/en/java/docs/api/java.base/java/util/ArrayList.html)
- [Baeldung: ArrayList vs LinkedList](https://www.baeldung.com/java-arraylist-linkedlist)
