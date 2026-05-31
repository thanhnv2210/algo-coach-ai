import type { TopicContent } from "@/lib/content/types"

export const topic: TopicContent = {
  slug: "sliding-window",
  name: "Sliding Window",
  category: "fundamentals",
  order: 4,
  description:
    "Sliding window is a technique for reducing a nested loop over subarrays/substrings to a single O(n) pass. You maintain a window defined by two pointers (left, right) and expand or shrink it based on a constraint. It is the go-to pattern whenever the problem asks for a contiguous subarray or substring satisfying some condition.",
  keyIdeas: [
    "Fixed window: advance left and right together, keeping window size constant",
    "Variable window: expand right until constraint is violated, then shrink from left",
    "A hash map or counter inside the window tracks the current state efficiently",
    "The window never needs to restart from the beginning — each element is added/removed at most once, giving O(n) total",
    "Applicable when the problem has optimal substructure on contiguous ranges",
  ],
  complexity: [
    { operation: "Fixed-size window scan",    time: "O(n)", space: "O(1)" },
    { operation: "Variable window scan",      time: "O(n)", space: "O(k)" },
    { operation: "Window with frequency map", time: "O(n)", space: "O(k)" },
  ],
  patterns: [
    { name: "Fixed Window",    description: "Window size k is constant — track a running sum/product and subtract the outgoing element." },
    { name: "Variable Window (shrink on violation)", description: "Expand right freely; when constraint breaks, advance left to restore validity." },
    { name: "Minimum Window", description: "Find smallest window containing all required elements; use two counters — need vs. have." },
  ],
  codeExample: {
    language: "python",
    label: "Longest substring without repeating characters",
    code: `def length_of_longest_substring(s: str) -> int:
    char_index: dict[str, int] = {}
    left = 0
    best = 0

    for right, ch in enumerate(s):
        if ch in char_index and char_index[ch] >= left:
            left = char_index[ch] + 1   # shrink: skip past duplicate
        char_index[ch] = right
        best = max(best, right - left + 1)

    return best`,
  },
  tips: "If the brute-force is O(n²) because of a nested loop over start/end indices, the problem is likely a sliding window.",
  relatedSlugs: ["arrays", "strings", "hash-map"],
}
