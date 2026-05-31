import type { TopicContent } from "@/lib/content/types"

export const topic: TopicContent = {
  slug: "dynamic-programming",
  name: "Dynamic Programming",
  category: "advanced",
  order: 13,
  description:
    "Dynamic programming (DP) solves complex problems by breaking them into overlapping sub-problems and storing their results to avoid redundant computation. It applies when a problem has optimal substructure (the optimal solution contains optimal solutions to sub-problems) and overlapping sub-problems (the same sub-problem is solved more than once).",
  keyIdeas: [
    "Top-down (memoisation): recursive solution + cache to skip repeated sub-problems",
    "Bottom-up (tabulation): fill a DP table iteratively from base cases",
    "State definition is the hardest part: dp[i] must encode everything needed to answer sub-problems",
    "Transition equation defines how dp[i] is computed from previous states",
    "1D DP for sequence problems; 2D DP for two-sequence problems (e.g. LCS, edit distance)",
    "Space optimisation: many 2D DPs can be reduced to O(n) by keeping only the previous row",
  ],
  complexity: [
    { operation: "1D DP (Fibonacci, coin change)", time: "O(n)",   space: "O(n) or O(1)" },
    { operation: "2D DP (LCS, edit distance)",     time: "O(n·m)", space: "O(n·m) or O(m)" },
    { operation: "Knapsack (0/1)",                 time: "O(n·W)", space: "O(n·W) or O(W)" },
    { operation: "Matrix chain multiplication",    time: "O(n³)",  space: "O(n²)" },
  ],
  patterns: [
    { name: "Linear DP (1D)",      description: "dp[i] depends on previous few states — classic for Fibonacci, house robber, climbing stairs." },
    { name: "Knapsack",            description: "Include or exclude each item; dp[i][w] = max value using first i items with capacity w." },
    { name: "Two-sequence DP",     description: "dp[i][j] = answer for prefix s1[:i] and s2[:j] — used for LCS, edit distance." },
    { name: "Interval DP",         description: "dp[i][j] = answer over subarray [i, j]; fill by increasing length of interval." },
  ],
  codeExample: {
    language: "python",
    label: "Longest Common Subsequence — 2D DP",
    code: `def lcs(text1: str, text2: str) -> int:
    m, n = len(text1), len(text2)
    # dp[i][j] = LCS length of text1[:i] and text2[:j]
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i-1] == text2[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])

    return dp[m][n]`,
  },
  tips: "If you need all combinations (backtracking) but sub-problems repeat → DP. Start by writing the recursive solution, then add memoisation.",
  relatedSlugs: ["backtracking", "tree", "hash-map"],
}
