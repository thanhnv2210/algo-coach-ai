import type { TopicContent } from "@/lib/content/types"

export const topic: TopicContent = {
  slug: "binary-search",
  name: "Binary Search",
  category: "advanced",
  order: 11,
  description:
    "Binary search eliminates half the search space with each comparison, achieving O(log n). It works on any monotonic function — not just sorted arrays. The key insight is: if you can define a predicate that is false for a prefix and true for a suffix (or vice versa), binary search finds the boundary.",
  keyIdeas: [
    "Requires a sorted (or monotonic) search space",
    "Three templates: find exact match / find leftmost / find rightmost insertion point",
    "Use left + (right − left) // 2 to avoid integer overflow (important in Java/C++)",
    "Closing condition: left < right vs left ≤ right depends on whether the boundary index is included",
    "Binary search on the answer: search over the range of valid answers, not array indices",
    "Predicate trick: define a boolean function f(x) that is monotone — binary search finds the inflection point",
  ],
  complexity: [
    { operation: "Search in sorted array",   time: "O(log n)", space: "O(1)" },
    { operation: "Search on answer space",   time: "O(log(range) × check)", space: "O(1)" },
    { operation: "Rotated array search",     time: "O(log n)", space: "O(1)" },
  ],
  patterns: [
    { name: "Classic Binary Search",    description: "Find exact target; return −1 if not found." },
    { name: "Left / Right Boundary",    description: "Find first or last position of a target using biased mid rounding." },
    { name: "Binary Search on Answer",  description: "The answer is a value in a range; check feasibility at mid and shrink the range." },
    { name: "Predicate Search",         description: "Define is_ok(x) — binary search for the smallest x where is_ok(x) is true." },
  ],
  codeExample: {
    language: "python",
    label: "Find first position of target (left boundary)",
    code: `def search_left(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1
    result = -1

    while left <= right:
        mid = left + (right - left) // 2
        if nums[mid] == target:
            result = mid        # record and keep searching left
            right = mid - 1
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return result`,
  },
  tips: "If your O(n) linear scan feels unnecessary, ask: is the search space monotonic? Binary search may apply.",
  relatedSlugs: ["arrays", "tree", "heap"],
}
