# HashSet, LinkedHashSet & TreeSet

## Why this matters in interviews

Set questions appear constantly in coding interviews — detecting duplicates, checking membership, and set-difference operations. Interviewers also use Set internals to probe whether you understand the equals/hashCode contract, which is a prerequisite for any senior Java role. Getting the contract wrong breaks HashMap and HashSet silently.

## Concept

All three classes implement `Set<E>` — no duplicate elements, no index-based access.

### HashSet

Backed by a `HashMap<E, Object>`. Every element is stored as a key; the value is a shared sentinel `Object`.

```
HashSet internally:
  HashMap { "apple" → PRESENT, "banana" → PRESENT, "cherry" → PRESENT }
```

- **add / contains / remove** — O(1) average (same as HashMap)
- **Iteration order** — undefined, can change on resize
- Allows one `null` element

### LinkedHashSet

Extends `HashSet`, adds a doubly-linked list through buckets (same as `LinkedHashMap`).

- **Insertion-order** preserved during iteration
- Slightly higher memory than `HashSet`
- Same O(1) complexity for add/contains/remove

### TreeSet

Backed by a `TreeMap<E, Object>`. Elements are kept in **sorted order** (natural or `Comparator`).

```
TreeSet (sorted ascending):
  Red-black tree: apple < banana < cherry
```

- **add / contains / remove** — O(log n)
- Implements `NavigableSet` — `floor`, `ceiling`, `headSet`, `tailSet`, `subSet`
- `null` elements **not allowed** (comparison throws NPE)

### Choosing the right Set

| Need | Use |
|------|-----|
| Fast membership test, no order | `HashSet` |
| Insertion-order preserved | `LinkedHashSet` |
| Sorted order, range queries | `TreeSet` |

## Key rules / gotchas

- **equals + hashCode contract is mandatory.** If you store custom objects in `HashSet` without overriding both, two "equal" objects will be treated as distinct — the most common senior interview trap.
- `TreeSet` requires keys to be `Comparable` or a `Comparator` to be passed at construction. Otherwise the first `add()` of a second element throws `ClassCastException`.
- `Set.of(...)` (Java 9+) returns an **immutable** Set — `add()` throws `UnsupportedOperationException`.
- `Collections.unmodifiableSet()` returns a live **view** — the underlying set can still change through other references.
- `HashSet` and `LinkedHashSet` permit one `null`; `TreeSet` does not.
- `retainAll`, `removeAll`, `addAll` implement intersection, difference, and union — handy in interviews.

## Code example

```java
import java.util.*;

public class JavaLabRunner {
    static class Point {
        int x, y;
        Point(int x, int y) { this.x = x; this.y = y; }

        @Override public boolean equals(Object o) {
            return o instanceof Point p && p.x == x && p.y == y;
        }
        @Override public int hashCode() { return Objects.hash(x, y); }
        @Override public String toString() { return "(" + x + "," + y + ")"; }
    }

    public static void main(String[] args) {
        // HashSet — no duplicates, unordered
        Set<Integer> hs = new HashSet<>(Arrays.asList(3, 1, 4, 1, 5, 9, 2, 6, 5));
        System.out.println("HashSet (no dupes): " + hs);

        // LinkedHashSet — insertion order preserved
        Set<Integer> lhs = new LinkedHashSet<>(Arrays.asList(3, 1, 4, 1, 5, 9, 2, 6, 5));
        System.out.println("LinkedHashSet (insertion order): " + lhs);

        // TreeSet — sorted, no dupes
        Set<Integer> ts = new TreeSet<>(Arrays.asList(3, 1, 4, 1, 5, 9, 2, 6, 5));
        System.out.println("TreeSet (sorted): " + ts);

        // NavigableSet methods
        TreeSet<Integer> nav = new TreeSet<>(ts);
        System.out.println("floor(4): " + nav.floor(4));       // 4
        System.out.println("ceiling(4): " + nav.ceiling(4));   // 4
        System.out.println("lower(4): " + nav.lower(4));       // 3
        System.out.println("higher(4): " + nav.higher(4));     // 5
        System.out.println("headSet(5): " + nav.headSet(5));   // [1,2,3,4]

        // Set operations
        Set<Integer> a = new HashSet<>(Arrays.asList(1, 2, 3, 4));
        Set<Integer> b = new HashSet<>(Arrays.asList(3, 4, 5, 6));
        Set<Integer> intersection = new HashSet<>(a);
        intersection.retainAll(b);
        System.out.println("\nIntersection: " + intersection);     // [3, 4]

        Set<Integer> union = new HashSet<>(a);
        union.addAll(b);
        System.out.println("Union: " + union);                     // [1,2,3,4,5,6]

        Set<Integer> difference = new HashSet<>(a);
        difference.removeAll(b);
        System.out.println("Difference (a - b): " + difference);   // [1, 2]

        // Custom object — needs equals + hashCode
        Set<Point> points = new HashSet<>();
        points.add(new Point(1, 2));
        points.add(new Point(1, 2)); // duplicate — rejected
        points.add(new Point(3, 4));
        System.out.println("\nPoints set (size should be 2): " + points.size());
        System.out.println("Contains (1,2): " + points.contains(new Point(1, 2)));
    }
}
```

## Interview questions you should be able to answer

- **Q:** Why does `HashSet` require `hashCode()` to be overridden alongside `equals()`?
  > `HashSet` uses `hashCode()` to find the bucket and `equals()` to confirm identity within the bucket. If `hashCode()` is not overridden, two logically equal objects land in different buckets and the set treats them as distinct elements.

- **Q:** What is the time complexity of `TreeSet.contains()` vs `HashSet.contains()`?
  > `HashSet` is O(1) average. `TreeSet` is O(log n) because it must traverse the red-black tree. Use `TreeSet` only when you need sorted order or range queries.

- **Q:** How would you find duplicate elements in a list in O(n) time?
  > Iterate the list, add each element to a `HashSet`. If `add()` returns `false`, the element is a duplicate. O(n) time, O(n) space.

- **Q:** What happens if you add a mutable object to a `HashSet` and then mutate it?
  > The object's `hashCode()` may change, putting it in a different bucket. The set can no longer find it with `contains()`, and you've effectively "lost" it in the set — a subtle, hard-to-debug bug.

- **Q:** How does `LinkedHashSet` preserve insertion order while maintaining O(1) lookup?
  > It extends `HashSet` (bucket array for O(1) access) and additionally maintains a doubly-linked list threading through all entries in insertion order. The extra memory overhead is one `prev`/`next` reference per entry.

## Further reading

- [Java HashSet docs](https://docs.oracle.com/en/java/docs/api/java.base/java/util/HashSet.html)
- [Java TreeSet docs](https://docs.oracle.com/en/java/docs/api/java.base/java/util/TreeSet.html)
- [Baeldung: HashSet vs TreeSet vs LinkedHashSet](https://www.baeldung.com/java-hashset-vs-treeset)
