# PriorityQueue & Comparator

## Why this matters in interviews

`PriorityQueue` is the go-to structure for problems involving the K-th largest/smallest element, median maintenance, task scheduling, and Dijkstra's algorithm. Interviewers use it to test heap knowledge without requiring manual implementation. A candidate who can compose a custom `Comparator` fluently — and knows when to flip to a max-heap — stands out immediately.

## Concept

Java's `PriorityQueue<E>` is a **binary min-heap** stored in an array.

```
Min-heap array representation:
  index:  0   1   2   3   4   5
  value: [1] [3] [2] [7] [4] [5]

Tree view:
        1
       / \
      3   2
     / \ /
    7  4 5
```

- **offer / add** — O(log n), sifts the element up
- **poll / remove** — O(log n), removes root, sifts last element down
- **peek** — O(1), reads the root (minimum)
- **contains** — O(n), no index structure
- **Does not guarantee sorted order during iteration** — only the root is guaranteed to be the minimum

### Default ordering

Elements must be `Comparable`, or you must supply a `Comparator`. By default, the smallest element is at the head (min-heap).

### Max-heap

```java
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
```

### Custom Comparator

```java
// Sort by string length, then alphabetically
PriorityQueue<String> pq = new PriorityQueue<>(
    Comparator.comparingInt(String::length).thenComparing(Comparator.naturalOrder())
);
```

### Common interview patterns

| Problem | Heap strategy |
|---------|--------------|
| K smallest elements | Max-heap of size K — evict the largest when size > K |
| K largest elements | Min-heap of size K — evict the smallest when size > K |
| Median of a stream | Max-heap (lower half) + Min-heap (upper half), rebalance after each insert |
| Dijkstra shortest path | Min-heap on `(distance, node)` pairs |
| Merge K sorted lists | Min-heap on the head of each list |

## Key rules / gotchas

- **Not thread-safe.** Use `PriorityBlockingQueue` in concurrent contexts.
- **Iteration does not return elements in priority order.** `poll()` them one by one instead.
- **`remove(Object o)` is O(n)** — it scans the backing array. Don't use it in hot paths.
- For the **K smallest** pattern, use a **max-heap** of size K, not a min-heap of all elements. A max-heap of size K gives O(n log K) total vs O(n log n) for sorting.
- **Comparator.reverseOrder() vs reversed()**: `Comparator.reverseOrder()` creates a new reversed comparator for `Comparable` types. `.reversed()` is a method on an existing `Comparator` instance.
- When using `Comparator.comparingInt` on objects, make sure the key extractor never returns `null` — it will throw NPE during comparison.

## Code example

```java
import java.util.*;

public class JavaLabRunner {
    record Task(String name, int priority, int id) {}

    public static void main(String[] args) {
        // ── Min-heap (default) ────────────────────────────────
        PriorityQueue<Integer> minHeap = new PriorityQueue<>();
        for (int n : new int[]{5, 1, 8, 3, 2}) minHeap.offer(n);
        System.out.print("Min-heap poll order: ");
        while (!minHeap.isEmpty()) System.out.print(minHeap.poll() + " ");
        System.out.println();

        // ── Max-heap ──────────────────────────────────────────
        PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
        for (int n : new int[]{5, 1, 8, 3, 2}) maxHeap.offer(n);
        System.out.print("Max-heap poll order: ");
        while (!maxHeap.isEmpty()) System.out.print(maxHeap.poll() + " ");
        System.out.println();

        // ── Top-K smallest (max-heap of size K) ───────────────
        int[] nums = {3, 1, 4, 1, 5, 9, 2, 6, 5, 3};
        int k = 4;
        PriorityQueue<Integer> topK = new PriorityQueue<>(Comparator.reverseOrder());
        for (int n : nums) {
            topK.offer(n);
            if (topK.size() > k) topK.poll(); // evict the largest
        }
        System.out.println("Top-" + k + " smallest: " + topK); // order within not guaranteed

        // ── Median of a stream ────────────────────────────────
        // maxHeap holds the lower half, minHeap the upper half
        PriorityQueue<Integer> lower = new PriorityQueue<>(Comparator.reverseOrder());
        PriorityQueue<Integer> upper = new PriorityQueue<>();
        int[] stream = {5, 15, 1, 3, 8, 7, 9, 2};

        for (int n : stream) {
            lower.offer(n);
            upper.offer(lower.poll()); // balance: push max of lower to upper
            if (upper.size() > lower.size())
                lower.offer(upper.poll()); // keep lower >= upper in size
        }
        double median = lower.size() > upper.size()
            ? lower.peek()
            : (lower.peek() + upper.peek()) / 2.0;
        System.out.println("Median of stream: " + median);

        // ── Custom Comparator ─────────────────────────────────
        PriorityQueue<Task> tasks = new PriorityQueue<>(
            Comparator.comparingInt(Task::priority)
                      .thenComparingInt(Task::id) // stable tie-break by arrival order
        );
        tasks.offer(new Task("Deploy", 2, 1));
        tasks.offer(new Task("Fix bug", 1, 2));
        tasks.offer(new Task("Review PR", 1, 3));
        tasks.offer(new Task("Write docs", 3, 4));
        System.out.println("\nTask execution order:");
        while (!tasks.isEmpty()) {
            Task t = tasks.poll();
            System.out.printf("  [priority=%d] %s%n", t.priority(), t.name());
        }
    }
}
```

## Interview questions you should be able to answer

- **Q:** What is the time complexity of building a `PriorityQueue` from a list of N elements?
  > O(n) using Java's `PriorityQueue(Collection)` constructor, which uses the heapify algorithm. Adding elements one by one would be O(n log n). This distinction matters when you start with all data available.

- **Q:** How do you find the Kth largest element in an unsorted array efficiently?
  > Maintain a min-heap of size K. Iterate the array: if the heap has fewer than K elements, add; otherwise if the current element > heap's min, replace it (`poll` then `offer`). The heap's minimum at the end is the Kth largest. O(n log K) time, O(K) space.

- **Q:** Why use a max-heap for "K smallest" instead of sorting?
  > Sorting is O(n log n). A max-heap of size K gives O(n log K) — strictly better when K ≪ n. It also works on streams where n is unknown or infinite.

- **Q:** Is `PriorityQueue` thread-safe?
  > No. Use `java.util.concurrent.PriorityBlockingQueue` for concurrent producers/consumers. It is unbounded and blocks on `take()` when empty.

- **Q:** How do you implement a stable priority queue (preserve insertion order for equal priorities)?
  > Add a sequence number (arrival counter) to each entry and include it as a tiebreaker in the `Comparator`. This ensures FIFO ordering within the same priority level.

## Further reading

- [Java PriorityQueue docs](https://docs.oracle.com/en/java/docs/api/java.base/java/util/PriorityQueue.html)
- [Baeldung: PriorityQueue guide](https://www.baeldung.com/cs/priority-queue)
- [Median of data stream — LeetCode 295](https://leetcode.com/problems/find-median-from-data-stream/)
