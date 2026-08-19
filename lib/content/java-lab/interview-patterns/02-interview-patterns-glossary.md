# Interview Coding Patterns — Reference Glossary

## Why this matters in interviews

Senior engineers are expected to recognize the underlying algorithmic pattern within the first minute of reading a problem — not rediscover it from scratch. This glossary gives you a canonical name, definition, and trigger condition for every major pattern so you can quickly map any LeetCode-style problem to the right approach, then reason about its complexity trade-offs with precision.

## Concept

### Array & String Patterns

| Term | Definition | When to use |
|------|-----------|-------------|
| Two pointers — opposite ends | Two indices start at opposite ends of an array and move toward each other. | Sorted array pair sum, palindrome check, container with most water. Requires sorted input or symmetric structure. |
| Two pointers — same direction | A slow pointer and a fast pointer both move left-to-right, but at different speeds or conditions. | Cycle detection in linked list (Floyd's), remove duplicates from sorted array, partition problems. |
| Sliding window — fixed size | Maintain a window of exactly k elements; slide by one each step, adding the new element and dropping the oldest. | Maximum/minimum sum subarray of size k, average of subarrays of size k. |
| Sliding window — variable size | Expand the window's right boundary greedily; shrink the left boundary whenever a constraint is violated. | Longest substring without repeating characters, minimum window substring, longest subarray with sum ≤ k. |
| Prefix sum | Build a running-total array `pre[i] = pre[i-1] + nums[i-1]`; range sum `[l,r]` = `pre[r+1] - pre[l]` in O(1). | Range sum queries, subarray sum equals k (pair prefix sums in a HashMap), 2D prefix sum for rectangle queries. |
| Kadane's algorithm | Track `currentMax = max(num, currentMax + num)` and `globalMax = max(globalMax, currentMax)` in a single pass. | Maximum subarray sum (contiguous). Extend to maximum product subarray by tracking both min and max. |
| Frequency map / count array | Store element occurrence counts in a `HashMap<T,Integer>` or a fixed-size `int[]` when alphabet is bounded. | Anagram check, character frequency comparison, top-K frequent elements (combine with a min-heap of size k). |

### Linked List Patterns

| Term | Definition | When to use |
|------|-----------|-------------|
| Fast & slow pointer / Floyd's cycle detection | Fast moves 2 steps, slow moves 1 step per iteration; they meet inside a cycle if one exists. | Detect cycle, find cycle entry point (reset one pointer to head after meeting), find middle node. |
| Reverse in-place (iterative) | Keep `prev = null`, `curr = head`; in each step `next = curr.next`, `curr.next = prev`, advance both. | Reverse entire list, reverse k-group, palindrome linked list check (reverse second half). |
| Reverse in-place (recursive) | Recurse to the tail; on the way back, wire `head.next.next = head` and `head.next = null`. | Same use cases; useful when the recursive structure maps cleanly to the problem (e.g., reverse in pairs). |
| Dummy head node | Create `ListNode dummy = new ListNode(0); dummy.next = head;` and operate on `dummy.next`. | Simplifies edge cases when the head itself might be removed or replaced (delete N-th from end, merge sorted lists). |
| Merge two sorted lists | Compare heads; attach the smaller node to the result; advance that list's pointer; repeat until one is exhausted. | Merge k sorted lists (use a min-heap of heads), sort list (merge sort variant). |

### Stack & Queue Patterns

| Term | Definition | When to use |
|------|-----------|-------------|
| Monotonic stack — increasing | Maintain a stack where elements are strictly increasing from bottom to top; pop when a smaller element arrives. | Next greater element (pop candidates when a larger value arrives), largest rectangle in histogram, daily temperatures. |
| Monotonic stack — decreasing | Maintain a stack where elements are strictly decreasing; pop when a larger element arrives. | Next smaller element, trapping rainwater. |
| Monotonic deque | A deque (double-ended queue) that maintains a monotone property on indices, evicting stale front elements. | Sliding window maximum/minimum in O(n) — front of deque is always the index of the window's max element. |
| BFS with queue | Push the start node(s); process level by level; mark nodes visited before enqueuing, not after. | Shortest path in unweighted graph, level-order tree traversal, word ladder, 01-matrix distance, rotting oranges. |

### Tree Patterns

| Term | Definition | When to use |
|------|-----------|-------------|
| DFS — recursive | Call `dfs(node.left)` and `dfs(node.right)` around the processing step; preorder/inorder/postorder vary order. | Path problems, height computation, validate BST (pass bounds down), diameter of binary tree. |
| DFS — iterative with stack | Push root; pop and process; push right then left child (so left is processed first). | Same as recursive DFS when stack overflow is a concern for deeply unbalanced trees. |
| BFS / level-order | Queue-based; record `queue.size()` at the start of each level to process exactly one level per outer loop. | Minimum depth, right side view, zigzag traversal, connect level-order next pointers. |
| Path sum | DFS carrying `remainingSum`; at leaf check `remainingSum == node.val`; backtrack by subtracting when returning. | Path sum I/II/III, binary tree paths, maximum path sum (track local max, update global on the way back). |
| LCA (lowest common ancestor) | If current node equals p or q, return it; recurse left and right; if both return non-null, current node is LCA. | LCA of binary tree, LCA of BST (use BST property to skip half the tree each step). |
| Serialize / deserialize | Preorder DFS; write node value then recurse; use a sentinel (e.g., `"#"`) for null nodes. | Codec for binary tree, verify if a preorder sequence is a valid BST serialization. |

### Graph Patterns

| Term | Definition | When to use |
|------|-----------|-------------|
| DFS on graph | Maintain a `Set<Integer> visited`; recurse through adjacency list; skip already-visited nodes. | Number of islands, detect cycle in directed graph (use gray/black coloring), clone graph, course schedule. |
| BFS on graph | Standard BFS with visited set and queue; guarantees shortest hop count in unweighted graphs. | Shortest path, word ladder, bipartite check, walls and gates. |
| 0-1 BFS with deque | Use a `Deque`; push weight-0 edges to the front, weight-1 edges to the back — generalizes Dijkstra for 0/1 weights. | Minimum cost path where edges cost 0 or 1, knight moves with obstacles. |
| Topological sort — Kahn's (BFS) | Compute in-degrees; enqueue all nodes with in-degree 0; process queue, decrement neighbors' in-degree, enqueue when 0. | Course schedule (detect cycle: result size < total nodes), task scheduling, build order. |
| Topological sort — DFS post-order | DFS; after visiting all descendants push node to stack; reverse stack = topological order. | Same use cases; cycle detection via recursion stack flag. |
| Union-Find / DSU | `find(x)` with path compression (`parent[x] = find(parent[x])`); `union(x, y)` by rank to keep tree shallow. | Connected components, detect cycle in undirected graph, number of islands (offline), accounts merge, redundant connection. |
| Connected components | DFS/BFS from each unvisited node, incrementing a counter per call. | Number of islands, friend circles, number of provinces. |

### Binary Search Patterns

| Term | Definition | When to use |
|------|-----------|-------------|
| Classic binary search | `lo=0, hi=n-1`; `mid=(lo+hi)>>>1`; compare `nums[mid]` to target; adjust `lo` or `hi`. | Search in sorted array O(log n). Always use unsigned right shift to avoid integer overflow on `mid`. |
| Binary search on answer | The answer lies in a numeric range `[lo, hi]`; define a monotone feasibility predicate `canAchieve(mid)`; binary search on the range. | Minimum capacity to ship packages in D days, koko eating bananas, minimum days to make m bouquets, split array largest sum. |
| Find first occurrence (left-biased) | When `nums[mid] == target`, set `hi = mid` (don't return immediately); loop until `lo == hi`. | First bad version, find left boundary of a target range. |
| Find last occurrence (right-biased) | When `nums[mid] == target`, set `lo = mid + 1`; answer is `lo - 1` after loop. | Find right boundary of a target range, ceiling/floor queries. |
| Rotated sorted array | Check which half is sorted (`nums[lo] <= nums[mid]`); decide which half target falls in; adjust boundaries. | Search in rotated sorted array I/II, find minimum in rotated sorted array. |

### Dynamic Programming Patterns

| Term | Definition | When to use |
|------|-----------|-------------|
| Memoization (top-down DP) | Recursive function with a `HashMap` or array cache; return cached result if seen before. | Natural fit when recursion already models the problem (e.g., coin change, word break, edit distance). |
| Tabulation (bottom-up DP) | Fill a DP table iteratively from base cases; no recursion stack overhead. | When recursion depth is large, or when you want to optimize space with rolling arrays. |
| State definition | `dp[i]` = the answer to the sub-problem ending at (or considering) index i. Getting this right is the hardest step. | Define before coding; wrong state = wrong recurrence. Typical: `dp[i]` = max profit on day i, min cost to reach step i. |
| 0/1 Knapsack | `dp[i][w]` = max value using first i items with capacity w; `dp[i][w] = max(dp[i-1][w], dp[i-1][w-wt[i]] + val[i])`. | Partition equal subset sum, target sum, last stone weight II. Optimize to 1D by iterating w in reverse. |
| Unbounded knapsack | Same as 0/1 but iterate capacity w forward so the same item can be used multiple times. | Coin change (minimum coins), coin change II (number of ways), perfect squares. |
| LCS (longest common subsequence) | `dp[i][j] = dp[i-1][j-1]+1` if chars match; else `max(dp[i-1][j], dp[i][j-1])`. O(n*m). | Edit distance variant, shortest common supersequence, delete to make strings equal. |
| LIS (longest increasing subsequence) | O(n²) DP or O(n log n) with patience sort — maintain `tails[]` array, binary search for insertion point. | Russian doll envelopes (sort by one dim, LIS on other), number of LIS. |
| Interval DP | `dp[i][j]` = answer for sub-problem on range `[i,j]`; fill by increasing interval length. | Burst balloons, palindrome partitioning II, matrix chain multiplication. |
| String DP | 2D table over two strings or over a single string's indices. | Edit distance, regular expression matching, wildcard matching, distinct subsequences. |

### Backtracking

| Term | Definition | When to use |
|------|-----------|-------------|
| Backtracking | Choose an option → explore recursively → undo the choice (backtrack); exhaustively explores the decision tree. | Permutations, combinations, subsets, N-Queens, Sudoku solver, word search on a grid. |
| Pruning | Before recursing, check if the current path can possibly lead to a valid solution; skip if not. | Reduces worst-case exponential branches; e.g., skip if remaining sum < 0 in combination sum, skip duplicates in subsets II. |
| State space tree | Mental model: each level = one decision point; each branch = one choice; leaf = complete solution candidate. | Use to reason about time complexity — number of leaves × work per node gives the upper bound. |

---

### Complexity Reference

| Pattern | Time | Space | Notes |
|---------|------|-------|-------|
| Two pointers | O(n) | O(1) | Requires sorted or specific structure |
| Sliding window | O(n) | O(k) | k = window size or charset |
| Prefix sum | O(n) preprocess, O(1) query | O(n) | 2D prefix sum is O(n·m) |
| Kadane's | O(n) | O(1) | Single pass |
| Monotonic stack | O(n) | O(n) | Each element pushed/popped at most once |
| BFS (graph) | O(V+E) | O(V) | Shortest path in unweighted graph |
| DFS (graph) | O(V+E) | O(V) | Recursion stack depth up to O(V) |
| Binary search | O(log n) | O(1) | Sorted input or monotone answer space |
| Binary search on answer | O(n log(hi-lo)) | O(1) | n = cost of feasibility check |
| Union-Find | O(α(n)) per op | O(n) | Practically O(1); α = inverse Ackermann |
| DP (2D) | O(n·m) | O(n·m) or O(m) with rolling | Rolling array cuts space to one row |
| LIS (patience sort) | O(n log n) | O(n) | Binary search on `tails[]` array |
| Backtracking | O(b^d) | O(d) | b = branching factor, d = depth (stack) |

---

## Key rules / gotchas

- **Sliding window shrink condition:** Always shrink from the left when the window violates the constraint — never skip this or the window grows unboundedly and gives wrong answers.
- **Two pointers vs sliding window:** Two pointers work best when you're comparing elements at two positions simultaneously (pair sum, palindrome). Sliding window is for a contiguous subarray/substring property (max, min, count).
- **Prefix sum HashMap trick:** `sum[0..j] - sum[0..i-1] == k` → store prefix sums in a map and look up `currentSum - k` in O(1). Handles negative numbers unlike sliding window.
- **Monotonic stack: what to store:** Usually store *indices*, not values — you need indices to compute widths (histogram) or positions.
- **Floyd's cycle start:** After fast and slow meet inside the cycle, reset one pointer to `head` and advance both one step at a time — they meet at the cycle entry.
- **Binary search `mid` overflow:** Use `mid = lo + (hi - lo) / 2` or `(lo + hi) >>> 1`; never `(lo + hi) / 2` when both are large positives.
- **Union-Find path compression:** `parent[x] = find(parent[x])` flattens the tree on every `find` call — without this, DSU degrades to O(log n) or worse.
- **DP state before recurrence:** Define `dp[i]` in plain English before writing the transition. Wrong state definition is the #1 source of incorrect DP solutions.
- **0/1 knapsack 1D space:** Iterate capacity `w` from `maxW` down to `wt[i]` when collapsing to 1D — going forward would allow using the same item twice (unbounded).
- **Backtracking with duplicates:** Sort the input first, then skip `candidates[i] == candidates[i-1]` at the same recursion depth to avoid duplicate result sets (subsets II, combination sum II).
- **Topological sort cycle detection:** With Kahn's algorithm, if the number of nodes in the topological order is less than the total number of nodes, a cycle exists.

## Code example

```java
import java.util.*;

public class JavaLabRunner {

    // ── 1. SLIDING WINDOW ──────────────────────────────────────────────────
    // Longest substring without repeating characters — O(n) time, O(charset) space
    static int lengthOfLongestSubstring(String s) {
        Map<Character, Integer> lastSeen = new HashMap<>();
        int best = 0;
        int left = 0;

        for (int right = 0; right < s.length(); right++) {
            char c = s.charAt(right);
            // If c was seen inside the current window, shrink from the left
            if (lastSeen.containsKey(c) && lastSeen.get(c) >= left) {
                left = lastSeen.get(c) + 1;
            }
            lastSeen.put(c, right);
            best = Math.max(best, right - left + 1);
        }
        return best;
    }

    // ── 2. MONOTONIC STACK ─────────────────────────────────────────────────
    // Next greater element — O(n) time, O(n) space
    // For each element, find the first element to its right that is greater.
    // Returns -1 if none exists.
    static int[] nextGreaterElement(int[] nums) {
        int n = nums.length;
        int[] result = new int[n];
        Arrays.fill(result, -1);

        // Stack stores indices of elements waiting for their "next greater"
        Deque<Integer> stack = new ArrayDeque<>(); // monotonic decreasing (values)

        for (int i = 0; i < n; i++) {
            // Pop all indices whose value is smaller than nums[i] — nums[i] is their answer
            while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) {
                result[stack.pop()] = nums[i];
            }
            stack.push(i);
        }
        return result;
    }

    // ── 3. BINARY SEARCH ON ANSWER ─────────────────────────────────────────
    // Minimum number of days to make m bouquets.
    // You need m bouquets; each bouquet needs k adjacent bloomed flowers.
    // flowers[i] = day on which flower i blooms. Find minimum day, or -1 if impossible.
    // O(n log(maxDay)) time, O(1) space
    static int minDays(int[] bloomDay, int m, int k) {
        int n = bloomDay.length;
        if ((long) m * k > n) return -1; // impossible even if all flowers bloom

        int lo = 1, hi = 0;
        for (int d : bloomDay) hi = Math.max(hi, d);

        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (canMakeBouquets(bloomDay, m, k, mid)) {
                hi = mid;          // mid works — try fewer days
            } else {
                lo = mid + 1;      // mid doesn't work — need more days
            }
        }
        return lo;
    }

    // Feasibility predicate: can we make m bouquets by day `day`?
    private static boolean canMakeBouquets(int[] bloomDay, int m, int k, int day) {
        int bouquets = 0, consecutive = 0;
        for (int d : bloomDay) {
            if (d <= day) {
                consecutive++;
                if (consecutive == k) {
                    bouquets++;
                    consecutive = 0;
                }
            } else {
                consecutive = 0; // gap — reset streak
            }
        }
        return bouquets >= m;
    }

    // ── MAIN ───────────────────────────────────────────────────────────────
    public static void main(String[] args) {

        // 1. Sliding window
        String input = "abcabcbb";
        System.out.println("=== Sliding Window ===");
        System.out.println("Input: \"" + input + "\"");
        System.out.println("Longest substring without repeating chars: "
                + lengthOfLongestSubstring(input)); // expected: 3 ("abc")

        // 2. Monotonic stack
        int[] nums = {2, 1, 5, 3, 6, 4};
        int[] nge  = nextGreaterElement(nums);
        System.out.println("\n=== Monotonic Stack ===");
        System.out.println("Input:           " + Arrays.toString(nums));
        System.out.println("Next greater:    " + Arrays.toString(nge));
        // expected:        [5, 5, 6, 6, -1, -1]

        // 3. Binary search on answer
        int[] bloomDay = {1, 10, 3, 10, 2};
        int m = 3, k = 1;
        System.out.println("\n=== Binary Search on Answer ===");
        System.out.println("bloomDay: " + Arrays.toString(bloomDay)
                + "  m=" + m + "  k=" + k);
        System.out.println("Minimum days: " + minDays(bloomDay, m, k)); // expected: 3

        int[] bloomDay2 = {1, 10, 3, 10, 2};
        m = 3; k = 2;
        System.out.println("bloomDay: " + Arrays.toString(bloomDay2)
                + "  m=" + m + "  k=" + k);
        System.out.println("Minimum days: " + minDays(bloomDay2, m, k)); // expected: -1
    }
}
```

## Interview questions you should be able to answer

- **Q:** When should you use a sliding window versus two pointers?
  > Use **two pointers** when comparing or matching two elements at separate positions simultaneously — e.g., sorted pair sum, palindrome check, or merging two arrays. Use a **sliding window** when you need a property over a *contiguous subarray or substring* — e.g., maximum sum, longest valid window, minimum covering window. The key distinction: two pointers doesn't require contiguity; sliding window does. Both are O(n), but sliding window maintains a range with explicit left/right boundaries and a shrink condition.

- **Q:** How do you recognize a dynamic programming problem versus one that can be solved greedily?
  > A problem is a **DP candidate** when: (1) it asks for an optimal value (max/min/count), (2) it has *overlapping subproblems* (the same sub-computation recurs), and (3) it has *optimal substructure* (the global optimum is built from local optima). A **greedy** solution works when a locally optimal choice at each step always leads to the global optimum — provable via an exchange argument. If you can swap a non-greedy choice with a greedy one and never make things worse, greedy is correct. When in doubt: try greedy, find a counterexample, then fall back to DP.

- **Q:** How does path compression work in Union-Find, and why does it matter?
  > Without path compression, `find(x)` walks up the parent chain one node at a time — O(log n) with union by rank, or O(n) in the worst case without it. **Path compression** rewires every node on the path directly to the root during `find`: `parent[x] = find(parent[x])`. This flattens the tree so future `find` calls on the same nodes are O(1). Combined with **union by rank** (always attach the shorter tree under the taller one), the amortized cost per operation drops to O(α(n)) — the inverse Ackermann function, effectively a constant below 5 for any realistic input size.

- **Q:** What is the invariant of a monotonic stack, and how do you decide when to use one?
  > A monotonic stack maintains a strict ordering property (increasing or decreasing) from bottom to top at all times. When a new element violates the property, elements are popped until the property is restored — and those pops are precisely the answers for "next greater / next smaller" queries. Use a monotonic stack whenever the problem involves finding, for each element, the *first element to its left or right* that satisfies a comparison condition: next greater element, largest rectangle in histogram (pop when a shorter bar arrives), daily temperatures, trapping rainwater. The amortized cost is O(n) because each element is pushed and popped at most once.

- **Q:** How do you recognize that a problem calls for binary search on the answer rather than binary search on an array?
  > Look for these signals: (1) the problem asks for a *minimum or maximum value* that satisfies some constraint, (2) the answer space is a contiguous numeric range (e.g., days, capacity, speed), and (3) you can write a *monotone feasibility function* — `canAchieve(mid)` returns true for all values above (or below) some threshold. Once you identify that predicate, binary search on the range `[lo, hi]` to find the boundary. Classic examples: "minimum capacity to ship packages in D days" (search capacity 1..sum), "koko eating bananas" (search speed 1..max), "minimum days to make m bouquets" (search days 1..maxDay).

- **Q:** How do you reason about the time complexity of a backtracking algorithm?
  > Model the recursion as a **state space tree**: each level represents one decision point and each branch represents one choice. If the branching factor is b (choices per level) and the maximum depth is d (length of a complete solution), the tree has at most O(b^d) nodes — giving a worst-case time complexity of O(b^d × work per node). For permutations of n elements: b starts at n and decreases (n! total leaves), so complexity is O(n · n!). **Pruning** cuts entire subtrees before exploring them — it doesn't change the worst case but dramatically reduces the average case. Always state the un-pruned upper bound first, then explain how pruning improves it in practice.

## Further reading

- LeetCode Explore — "Learn" section patterns (Two Pointers, Sliding Window, Binary Search, Dynamic Programming, Backtracking)
- *Grokking the Coding Interview* — pattern-first approach with categorized problems
- *Introduction to Algorithms (CLRS)* Ch. 15 (DP), Ch. 16 (Greedy), Ch. 21 (Union-Find), Ch. 22–26 (Graph algorithms)
- NeetCode.io — 150 curated problems organized by pattern with video explanations
- cp-algorithms.com — rigorous write-ups on monotonic stack, DSU, topological sort, and binary search on answer
- William Fiset's Union-Find series on YouTube — visual walkthrough of path compression and union by rank
