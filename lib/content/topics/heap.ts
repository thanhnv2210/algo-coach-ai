import type { TopicContent } from "@/lib/content/types"

export const topic: TopicContent = {
  slug: "heap",
  name: "Heap",
  category: "advanced",
  order: 10,
  description:
    "A heap is a complete binary tree satisfying the heap property: in a min-heap, every parent is ≤ its children; in a max-heap, every parent is ≥ its children. This guarantees O(1) access to the minimum (or maximum) element and O(log n) insertion/deletion. Heaps power priority queues and the top-K family of problems.",
  keyIdeas: [
    "Min-heap: root is always the smallest element — peek min in O(1)",
    "Max-heap: root is always the largest element",
    "Python's heapq module is a min-heap; negate values for max-heap behaviour",
    "Building a heap from n elements takes O(n) — faster than n × O(log n) insertions",
    "Top-K largest elements: maintain a min-heap of size K; O(n log K)",
    "Median of a data stream: two heaps — max-heap for lower half, min-heap for upper half",
  ],
  complexity: [
    { operation: "Peek min/max",     time: "O(1)",     space: "O(1)" },
    { operation: "Insert",          time: "O(log n)",  space: "O(1)" },
    { operation: "Extract min/max", time: "O(log n)",  space: "O(1)" },
    { operation: "Build heap",      time: "O(n)",      space: "O(n)" },
    { operation: "Heap sort",       time: "O(n log n)", space: "O(1)" },
  ],
  patterns: [
    { name: "Top-K Elements",      description: "Push all elements; pop K times. Or maintain a size-K heap for O(n log K)." },
    { name: "K-way Merge",         description: "Push the head of each sorted list into a min-heap; repeatedly extract min and advance that list." },
    { name: "Two-heap Median",     description: "Lower half in max-heap, upper half in min-heap; balance sizes to read median in O(1)." },
    { name: "Dijkstra's (greedy)", description: "Priority queue of (cost, node); always process the cheapest unvisited node first." },
  ],
  codeExample: {
    language: "python",
    label: "K-th largest element in an array",
    code: `import heapq

def find_kth_largest(nums: list[int], k: int) -> int:
    # Min-heap of size k — root is k-th largest
    min_heap: list[int] = []

    for num in nums:
        heapq.heappush(min_heap, num)
        if len(min_heap) > k:
            heapq.heappop(min_heap)   # evict smallest

    return min_heap[0]   # root = k-th largest`,
  },
  tips: "Whenever a problem mentions 'top K', 'K closest', or 'K most frequent', reach for a heap.",
  relatedSlugs: ["tree", "graph"],
}
