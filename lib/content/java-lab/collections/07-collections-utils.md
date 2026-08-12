# Collections Utility Methods

## Why this matters in interviews

The `java.util.Collections` class is a library of static algorithms that interviewers expect senior engineers to use fluently. Reaching for `Collections.sort` with a custom comparator, `Collections.binarySearch`, or `Collections.frequency` shows you know the standard library rather than reinventing the wheel. Misusing `unmodifiableList` — thinking it makes the original list immutable — is a classic senior interview mistake.

## Concept

`Collections` is a utility class (no instances) with ~30 static methods covering four categories:

### 1. Sorting & searching

| Method | Complexity | Notes |
|--------|-----------|-------|
| `sort(list)` | O(n log n) | TimSort; list must be `Comparable` |
| `sort(list, cmp)` | O(n log n) | Custom Comparator |
| `binarySearch(list, key)` | O(log n) | List **must** be sorted first |
| `reverse(list)` | O(n) | In-place |
| `shuffle(list)` | O(n) | Random permutation |
| `rotate(list, dist)` | O(n) | Rotates elements by dist positions |

### 2. Aggregate operations

| Method | Notes |
|--------|-------|
| `min(collection)` | Uses natural order or Comparator |
| `max(collection)` | Same |
| `frequency(collection, obj)` | Counts occurrences |
| `disjoint(c1, c2)` | True if no elements in common |

### 3. Wrapper factories

| Method | Effect |
|--------|--------|
| `unmodifiableList(list)` | Returns a read-only **view** — original can still change |
| `synchronizedList(list)` | Thread-safe wrapper — iteration still needs external sync |
| `checkedList(list, type)` | Runtime type enforcement |
| `singletonList(e)` | Immutable single-element list |
| `nCopies(n, e)` | Immutable list of n copies |
| `emptyList()` | Immutable empty list (singleton) |

### 4. Copying & filling

| Method | Notes |
|--------|-------|
| `copy(dest, src)` | dest must be at least as large as src |
| `fill(list, obj)` | Replaces all elements |
| `swap(list, i, j)` | In-place swap |

## Key rules / gotchas

- **`unmodifiableList` is a view, not a copy.** Mutations through the original reference still affect it. For a true immutable copy use `List.copyOf(list)` (Java 10+) or `List.of(...)`.
- **`binarySearch` requires the list to be sorted first.** If it's not, the result is undefined. The method also requires the list to implement `RandomAccess` (i.e., `ArrayList`) for O(log n) performance; on `LinkedList` it degrades to O(n).
- **`synchronizedList` does not synchronise iteration.** You must manually synchronise on the list object when iterating: `synchronized(list) { for (T e : list) {...} }`.
- **`Collections.sort` vs `List.sort`:** `List.sort(cmp)` (Java 8+) is equivalent and slightly preferred as it's an instance method. Both use TimSort.
- **`nCopies` does not copy the object** — all N elements point to the same reference. Mutating one "copy" mutates all.
- `Collections.emptyList()`, `emptySet()`, `emptyMap()` are immutable singletons — safe to return from methods instead of `null`.

## Code example

```java
import java.util.*;

public class JavaLabRunner {
    public static void main(String[] args) {
        List<Integer> nums = new ArrayList<>(Arrays.asList(5, 2, 8, 1, 9, 3, 7, 4, 6));

        // ── Sort & search ──────────────────────────────────────
        Collections.sort(nums);
        System.out.println("Sorted: " + nums);

        int idx = Collections.binarySearch(nums, 7);
        System.out.println("Index of 7: " + idx);           // 6

        Collections.sort(nums, Comparator.reverseOrder());
        System.out.println("Reverse sorted: " + nums);

        // ── Aggregate ──────────────────────────────────────────
        System.out.println("Min: " + Collections.min(nums));
        System.out.println("Max: " + Collections.max(nums));

        List<String> words = Arrays.asList("apple", "banana", "apple", "cherry", "apple");
        System.out.println("Frequency of 'apple': " + Collections.frequency(words, "apple"));

        List<String> other = Arrays.asList("mango", "kiwi");
        System.out.println("Disjoint: " + Collections.disjoint(words, other)); // true

        // ── Unmodifiable view trap ─────────────────────────────
        List<String> original = new ArrayList<>(Arrays.asList("a", "b", "c"));
        List<String> view = Collections.unmodifiableList(original);

        try {
            view.add("d"); // throws
        } catch (UnsupportedOperationException e) {
            System.out.println("\nCannot modify view: " + e.getClass().getSimpleName());
        }
        original.add("d"); // original reference still works
        System.out.println("View reflects original change: " + view); // [a, b, c, d]

        // ── True immutable copy (Java 10+) ─────────────────────
        List<String> immutable = List.copyOf(original);
        System.out.println("Immutable copy: " + immutable);

        // ── Rotate ────────────────────────────────────────────
        List<Integer> rot = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5));
        Collections.rotate(rot, 2); // shift right by 2
        System.out.println("\nRotated by 2: " + rot); // [4, 5, 1, 2, 3]

        // ── nCopies + fill ────────────────────────────────────
        List<Integer> filled = new ArrayList<>(Collections.nCopies(5, 0));
        Collections.fill(filled, 99);
        System.out.println("Filled: " + filled);

        // ── swap ──────────────────────────────────────────────
        List<String> letters = new ArrayList<>(Arrays.asList("a", "b", "c", "d"));
        Collections.swap(letters, 0, 3);
        System.out.println("After swap(0,3): " + letters);

        // ── Shuffle (seed for reproducibility in tests) ───────
        List<Integer> deck = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5));
        Collections.shuffle(deck, new Random(42));
        System.out.println("Shuffled: " + deck);
    }
}
```

## Interview questions you should be able to answer

- **Q:** What is the difference between `Collections.unmodifiableList()` and `List.of()`?
  > `unmodifiableList()` returns a **view** of the original list — mutations through the original reference still propagate. `List.of()` creates a **new, truly immutable** list; the source data is copied and no reference to the original is retained.

- **Q:** What happens if you call `Collections.binarySearch` on an unsorted list?
  > The result is undefined — the method assumes sorted order. It may return a wrong index, a negative value, or even an out-of-bounds index. Always sort first.

- **Q:** How do you safely iterate a `synchronizedList` concurrently?
  > You must manually synchronise on the list during iteration: `synchronized(list) { for (E e : list) { ... } }`. Without this, another thread can structurally modify the list between iterator steps, causing `ConcurrentModificationException`.

- **Q:** Why does `Collections.nCopies(5, new ArrayList<>())` produce a dangerous result?
  > All 5 entries reference the **same** `ArrayList` object. Adding to any of them modifies all of them. Use a stream or a loop to create independent instances: `IntStream.range(0, 5).mapToObj(i -> new ArrayList<>()).collect(toList())`.

- **Q:** How do you rotate an array right by K positions using `Collections`?
  > Convert to `ArrayList`, call `Collections.rotate(list, k)`. For rotation left by K, use `Collections.rotate(list, -k)`.

## Further reading

- [Java Collections docs](https://docs.oracle.com/en/java/docs/api/java.base/java/util/Collections.html)
- [Baeldung: Collections utility methods](https://www.baeldung.com/java-collections)
- [List.of vs Collections.unmodifiableList](https://www.baeldung.com/java-unmodifiable-list)
