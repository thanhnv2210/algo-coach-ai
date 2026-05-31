import type { TopicContent } from "@/lib/content/types"

export const topic: TopicContent = {
  slug: "hash-map",
  name: "Hash Map",
  category: "fundamentals",
  order: 3,
  description:
    "A hash map (dictionary) maps keys to values using a hash function to compute an index into a backing array. It provides average-case O(1) for insert, delete, and lookup — making it the most versatile tool for trading space for speed. Hash sets offer the same performance for membership testing.",
  keyIdeas: [
    "Hash function converts a key to an index; a good hash minimises collisions",
    "Collisions handled by chaining (linked list per bucket) or open addressing",
    "Average O(1) insert/lookup; worst-case O(n) with many collisions (rare in practice)",
    "Use a hash map whenever you need fast lookup by an arbitrary key",
    "Two-sum pattern: store complement → index while iterating once",
    "Grouping pattern: map a canonical key (sorted string, tuple) → list of items",
  ],
  complexity: [
    { operation: "Insert",       time: "O(1) avg", space: "O(n)" },
    { operation: "Delete",       time: "O(1) avg", space: "O(1)" },
    { operation: "Lookup",       time: "O(1) avg", space: "O(1)" },
    { operation: "Iteration",    time: "O(n)",      space: "O(1)" },
  ],
  patterns: [
    { name: "Two Sum / Complement", description: "Store seen values and check if the complement of the current value exists." },
    { name: "Grouping / Bucketing", description: "Map a canonical form (e.g. sorted word) to a bucket of equivalent items." },
    { name: "Frequency Count",      description: "Count occurrences of elements for majority element, top-K, or anagram problems." },
    { name: "Memoisation",          description: "Cache computed results of sub-problems to avoid redundant work (dynamic programming)." },
  ],
  codeExample: {
    language: "python",
    label: "Two Sum — O(n) with complement map",
    code: `def two_sum(nums: list[int], target: int) -> list[int]:
    seen: dict[int, int] = {}       # value → index
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
  },
  tips: "If your brute-force is O(n²) due to searching, ask: can a hash map make the inner lookup O(1)?",
  relatedSlugs: ["arrays", "strings", "dynamic-programming"],
}
