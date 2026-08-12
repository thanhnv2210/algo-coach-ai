# ArrayDeque vs Stack & Queue

## Why this matters in interviews

`ArrayDeque` is the workhorse of coding interviews — every DFS stack, BFS queue, and monotonic stack problem uses it. Interviewers expect you to reach for `ArrayDeque` rather than the legacy `Stack` class or `LinkedList`. Knowing _why_ ArrayDeque is faster than both, and how to use it as both a stack and a queue from the same interface, signals strong Java fluency.

## Concept

`ArrayDeque` (Array Double-Ended Queue) is backed by a **circular resizable array**. It supports O(1) add and remove at both ends — head and tail.

```
Circular array (capacity 8, head=2, tail=6):
  [_, _, A, B, C, D, E, _]
           ↑head      ↑tail
```

When the array fills, it doubles in size and copies elements.

### As a Stack (LIFO)

| Operation | Method | Complexity |
|-----------|--------|------------|
| Push | `push(e)` / `addFirst(e)` | O(1) |
| Pop  | `pop()` / `removeFirst()` | O(1) |
| Peek | `peek()` / `peekFirst()` | O(1) |

### As a Queue (FIFO)

| Operation | Method | Complexity |
|-----------|--------|------------|
| Enqueue | `offer(e)` / `addLast(e)` | O(1) |
| Dequeue | `poll()` / `removeFirst()` | O(1) |
| Peek    | `peek()` / `peekFirst()` | O(1) |

### Why not `java.util.Stack`?

`Stack` extends `Vector`, which synchronises **every** method. In single-threaded code (all interview environments) this is pure overhead. `Stack` also inherits `Vector`'s random-access methods (`get(i)`), which make no semantic sense for a stack.

### Why not `LinkedList` as a Queue?

`LinkedList` nodes are heap-allocated individually. Traversing them causes cache misses. `ArrayDeque`'s contiguous backing array is much more cache-friendly, making it 2–3× faster in benchmarks for the same push/pop operations.

## Key rules / gotchas

- `ArrayDeque` does **not** allow `null` elements — `null` is used internally as a sentinel. `LinkedList` does allow nulls.
- `peek()` returns `null` if the deque is empty; `element()` throws `NoSuchElementException`. Know which you want.
- `poll()` returns `null` if empty; `remove()` throws. Same pattern as `Queue`.
- Use `Deque<Integer> stack = new ArrayDeque<>()` — declare as the interface, not the concrete class.
- The `push`/`pop`/`peek` methods operate on the **front** (head). `offer`/`poll` also operate front-to-back.
- For monotonic stack problems: use `peekFirst()` to inspect the top without removing.

## Code example

```java
import java.util.*;

public class JavaLabRunner {
    public static void main(String[] args) {
        // ── Stack (LIFO) ──────────────────────────────────────
        Deque<Integer> stack = new ArrayDeque<>();
        stack.push(1); stack.push(2); stack.push(3);
        System.out.println("Stack peek: " + stack.peek());  // 3
        System.out.println("Stack pop:  " + stack.pop());   // 3
        System.out.println("Stack:      " + stack);         // [2, 1]

        // ── Queue (FIFO) ──────────────────────────────────────
        Queue<String> queue = new ArrayDeque<>();
        queue.offer("first"); queue.offer("second"); queue.offer("third");
        System.out.println("\nQueue peek:  " + queue.peek());   // first
        System.out.println("Queue poll:  " + queue.poll());    // first
        System.out.println("Queue:       " + queue);           // [second, third]

        // ── Monotonic stack — next greater element ────────────
        int[] nums = {2, 1, 2, 4, 3};
        int[] nextGreater = new int[nums.length];
        Arrays.fill(nextGreater, -1);
        Deque<Integer> mono = new ArrayDeque<>(); // stores indices

        for (int i = 0; i < nums.length; i++) {
            while (!mono.isEmpty() && nums[mono.peek()] < nums[i]) {
                nextGreater[mono.pop()] = nums[i];
            }
            mono.push(i);
        }
        System.out.println("\nNums:              " + Arrays.toString(nums));
        System.out.println("Next greater elem: " + Arrays.toString(nextGreater));

        // ── BFS skeleton ──────────────────────────────────────
        // (graph omitted — shows ArrayDeque as BFS queue)
        Queue<Integer> bfs = new ArrayDeque<>();
        bfs.offer(0); // enqueue start node
        Set<Integer> visited = new HashSet<>();
        while (!bfs.isEmpty()) {
            int node = bfs.poll();
            if (visited.add(node)) {
                System.out.println("BFS visit: " + node);
                // bfs.offer(neighbor) for each unvisited neighbor
            }
        }

        // ── Deque as sliding window maximum ───────────────────
        int[] arr = {1, 3, -1, -3, 5, 3, 6, 7};
        int k = 3;
        int[] maxWindow = new int[arr.length - k + 1];
        Deque<Integer> window = new ArrayDeque<>(); // stores indices, front = max

        for (int i = 0; i < arr.length; i++) {
            // Remove indices outside window
            while (!window.isEmpty() && window.peekFirst() < i - k + 1)
                window.pollFirst();
            // Remove smaller elements from back
            while (!window.isEmpty() && arr[window.peekLast()] < arr[i])
                window.pollLast();
            window.offerLast(i);
            if (i >= k - 1)
                maxWindow[i - k + 1] = arr[window.peekFirst()];
        }
        System.out.println("\nSliding window max (k=" + k + "): " + Arrays.toString(maxWindow));
    }
}
```

## Interview questions you should be able to answer

- **Q:** Why prefer `ArrayDeque` over `Stack` for DFS?
  > `Stack` extends `Vector`, which synchronises every method. In single-threaded code this is unnecessary overhead. `ArrayDeque` is unsynchronised, backed by a cache-friendly circular array, and faster in practice.

- **Q:** What is a monotonic stack and when do you use it?
  > A stack maintained in monotonically increasing or decreasing order. Used to find the next-greater / next-smaller element for every item in O(n) total — each element is pushed and popped at most once.

- **Q:** What is the difference between `offer` / `poll` and `add` / `remove`?
  > They differ only in failure behaviour. `offer` returns `false` on failure; `add` throws `IllegalStateException`. `poll` returns `null` if empty; `remove` throws `NoSuchElementException`. For unbounded `ArrayDeque`, `add` never fails, so the distinction is academic.

- **Q:** How does the sliding window maximum problem use a Deque?
  > A monotonic decreasing deque stores array indices. For each new element, indices of smaller elements are removed from the back (they can never be the maximum). Indices outside the window are removed from the front. The front always holds the index of the current window's maximum — O(n) overall.

- **Q:** When would `LinkedList` be preferable to `ArrayDeque`?
  > Rarely. One case: you hold a `ListIterator` and need O(1) insertion at the current cursor. Another: you must store `null` elements in the deque. Otherwise `ArrayDeque` wins on throughput.

## Further reading

- [Java ArrayDeque docs](https://docs.oracle.com/en/java/docs/api/java.base/java/util/ArrayDeque.html)
- [Baeldung: ArrayDeque guide](https://www.baeldung.com/java-array-deque)
- [Why you should use ArrayDeque over Stack](https://stackoverflow.com/questions/6163166/why-is-arraydeque-better-than-linkedlist)
