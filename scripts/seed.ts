import postgres from "postgres"
import { drizzle } from "drizzle-orm/postgres-js"
import { topics, questions } from "../lib/db/schema"
import { getAllTopics } from "../lib/content"

async function main() {
const client = postgres(process.env.DATABASE_URL!, { max: 1 })
const db = drizzle(client)

// ─── Seed Topics ──────────────────────────────────────────────────────────────

const contentTopics = getAllTopics()
await db.delete(questions)
await db.delete(topics)

await db.insert(topics).values(
  contentTopics.map((t) => ({
    slug: t.slug,
    name: t.name,
    category: t.category,
    description: t.description,
    order: t.order,
  }))
)
console.log(`Seeded ${contentTopics.length} topics.`)

// ─── Seed Questions ───────────────────────────────────────────────────────────

await db.insert(questions).values([
  // Arrays (4)
  { topicSlug: "arrays", title: "Two Sum", difficulty: "easy", link: "https://leetcode.com/problems/two-sum/", notes: "Classic hash map problem" },
  { topicSlug: "arrays", title: "Best Time to Buy and Sell Stock", difficulty: "easy", link: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", notes: "Greedy — track min price" },
  { topicSlug: "arrays", title: "Product of Array Except Self", difficulty: "medium", link: "https://leetcode.com/problems/product-of-array-except-self/", notes: "Prefix + suffix product, no division" },
  { topicSlug: "arrays", title: "Maximum Subarray", difficulty: "medium", link: "https://leetcode.com/problems/maximum-subarray/", notes: "Kadane's algorithm" },

  // Strings (3)
  { topicSlug: "strings", title: "Valid Anagram", difficulty: "easy", link: "https://leetcode.com/problems/valid-anagram/", notes: "Character frequency count" },
  { topicSlug: "strings", title: "Longest Substring Without Repeating Characters", difficulty: "medium", link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", notes: "Sliding window + set" },
  { topicSlug: "strings", title: "Group Anagrams", difficulty: "medium", link: "https://leetcode.com/problems/group-anagrams/", notes: "Sort key or frequency tuple" },

  // Hash Map (2)
  { topicSlug: "hash-map", title: "Contains Duplicate", difficulty: "easy", link: "https://leetcode.com/problems/contains-duplicate/", notes: "Simple set membership" },
  { topicSlug: "hash-map", title: "Top K Frequent Elements", difficulty: "medium", link: "https://leetcode.com/problems/top-k-frequent-elements/", notes: "Bucket sort or heap" },

  // Sliding Window (2)
  { topicSlug: "sliding-window", title: "Maximum Average Subarray I", difficulty: "easy", link: "https://leetcode.com/problems/maximum-average-subarray-i/", notes: "Fixed-size window" },
  { topicSlug: "sliding-window", title: "Minimum Size Subarray Sum", difficulty: "medium", link: "https://leetcode.com/problems/minimum-size-subarray-sum/", notes: "Variable window, shrink from left" },

  // Stack (2)
  { topicSlug: "stack", title: "Valid Parentheses", difficulty: "easy", link: "https://leetcode.com/problems/valid-parentheses/", notes: "Push open, pop on close" },
  { topicSlug: "stack", title: "Daily Temperatures", difficulty: "medium", link: "https://leetcode.com/problems/daily-temperatures/", notes: "Monotonic decreasing stack" },

  // Queue (2)
  { topicSlug: "queue", title: "Number of Recent Calls", difficulty: "easy", link: "https://leetcode.com/problems/number-of-recent-calls/", notes: "Deque sliding window" },
  { topicSlug: "queue", title: "Task Scheduler", difficulty: "medium", link: "https://leetcode.com/problems/task-scheduler/", notes: "Frequency count + cooling formula" },

  // Linked List (2)
  { topicSlug: "linked-list", title: "Reverse Linked List", difficulty: "easy", link: "https://leetcode.com/problems/reverse-linked-list/", notes: "Three-pointer iterative" },
  { topicSlug: "linked-list", title: "Linked List Cycle", difficulty: "easy", link: "https://leetcode.com/problems/linked-list-cycle/", notes: "Floyd's slow/fast pointers" },

  // Tree (3)
  { topicSlug: "tree", title: "Maximum Depth of Binary Tree", difficulty: "easy", link: "https://leetcode.com/problems/maximum-depth-of-binary-tree/", notes: "DFS — 1 + max(left, right)" },
  { topicSlug: "tree", title: "Invert Binary Tree", difficulty: "easy", link: "https://leetcode.com/problems/invert-binary-tree/", notes: "Recursive swap" },
  { topicSlug: "tree", title: "Lowest Common Ancestor of a BST", difficulty: "medium", link: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/", notes: "BST property narrows search" },

  // Graph (2)
  { topicSlug: "graph", title: "Number of Islands", difficulty: "medium", link: "https://leetcode.com/problems/number-of-islands/", notes: "DFS/BFS flood fill" },
  { topicSlug: "graph", title: "Clone Graph", difficulty: "medium", link: "https://leetcode.com/problems/clone-graph/", notes: "BFS + visited map" },

  // Heap (2)
  { topicSlug: "heap", title: "Kth Largest Element in an Array", difficulty: "medium", link: "https://leetcode.com/problems/kth-largest-element-in-an-array/", notes: "Min-heap of size k" },
  { topicSlug: "heap", title: "Find Median from Data Stream", difficulty: "hard", link: "https://leetcode.com/problems/find-median-from-data-stream/", notes: "Two heaps — max-heap + min-heap" },

  // Binary Search (2)
  { topicSlug: "binary-search", title: "Binary Search", difficulty: "easy", link: "https://leetcode.com/problems/binary-search/", notes: "Template: lo, hi, mid = lo + (hi-lo)//2" },
  { topicSlug: "binary-search", title: "Search in Rotated Sorted Array", difficulty: "medium", link: "https://leetcode.com/problems/search-in-rotated-sorted-array/", notes: "Determine which half is sorted" },

  // Backtracking (2)
  { topicSlug: "backtracking", title: "Subsets", difficulty: "medium", link: "https://leetcode.com/problems/subsets/", notes: "Include/exclude recursion" },
  { topicSlug: "backtracking", title: "Combination Sum", difficulty: "medium", link: "https://leetcode.com/problems/combination-sum/", notes: "Reuse elements, prune > target" },

  // Dynamic Programming (2)
  { topicSlug: "dynamic-programming", title: "Climbing Stairs", difficulty: "easy", link: "https://leetcode.com/problems/climbing-stairs/", notes: "Fibonacci pattern — dp[i] = dp[i-1] + dp[i-2]" },
  { topicSlug: "dynamic-programming", title: "Coin Change", difficulty: "medium", link: "https://leetcode.com/problems/coin-change/", notes: "Bottom-up DP, dp[i] = min coins for amount i" },
])
console.log("Seeded 30 questions.")
await client.end()
}

main().catch(console.error)
