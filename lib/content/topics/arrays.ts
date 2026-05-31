import type { TopicContent } from "@/lib/content/types"

export const topic: TopicContent = {
  slug: "arrays",
  name: "Arrays",
  category: "fundamentals",
  order: 1,
  description:
    "An array is a contiguous block of memory storing elements of the same type. It is the most fundamental data structure and the backbone of many algorithms. Random access in O(1) makes arrays ideal for index-based lookups, but insertions and deletions in the middle are costly.",
  keyIdeas: [
    "Zero-indexed contiguous memory — element i lives at base + i × size",
    "Random access in O(1) by index; linear search O(n) without sorting",
    "Insertion or deletion at an arbitrary position shifts all following elements → O(n)",
    "Amortized O(1) append to a dynamic array (e.g. Python list, Java ArrayList)",
    "Two-pointer and sliding-window patterns eliminate nested loops for many subarray problems",
    "Prefix sums precompute cumulative totals to answer range queries in O(1)",
  ],
  complexity: [
    { operation: "Access by index", time: "O(1)",    space: "O(1)" },
    { operation: "Search (unsorted)", time: "O(n)", space: "O(1)" },
    { operation: "Insert at end",   time: "O(1)*",  space: "O(1)" },
    { operation: "Insert at middle", time: "O(n)",  space: "O(1)" },
    { operation: "Delete at end",   time: "O(1)",   space: "O(1)" },
    { operation: "Delete at middle", time: "O(n)",  space: "O(1)" },
  ],
  patterns: [
    { name: "Two Pointers",   description: "Left and right pointers converge inward — useful for sorted arrays, pair sums, and in-place reversals." },
    { name: "Sliding Window", description: "Expand/shrink a window of elements to track a running aggregate — avoids re-computation over subarrays." },
    { name: "Prefix Sum",     description: "Precompute cumulative sums so any subarray sum [i, j] = prefix[j] − prefix[i−1] in O(1)." },
    { name: "Kadane's Algorithm", description: "Track the maximum subarray sum ending at each index; update global max in one pass." },
  ],
  codeExample: {
    language: "python",
    label: "Two-pointer: reverse array in-place",
    code: `def reverse(arr: list[int]) -> None:
    left, right = 0, len(arr) - 1
    while left < right:
        arr[left], arr[right] = arr[right], arr[left]
        left  += 1
        right -= 1`,
  },
  tips: "When you see 'subarray' or 'contiguous', reach for sliding window or prefix sums before thinking O(n²).",
  relatedSlugs: ["strings", "sliding-window", "binary-search"],
}
