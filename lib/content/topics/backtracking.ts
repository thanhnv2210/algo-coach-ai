import type { TopicContent } from "@/lib/content/types"

export const topic: TopicContent = {
  slug: "backtracking",
  name: "Backtracking",
  category: "advanced",
  order: 12,
  description:
    "Backtracking is a systematic trial-and-error search that builds candidates incrementally and abandons (backtracks) a path as soon as it determines the path cannot lead to a valid solution. It explores a decision tree via DFS, pruning branches early to avoid unnecessary work.",
  keyIdeas: [
    "Template: choose → explore → unchoose (undo the choice after recursion returns)",
    "State is mutated and then restored — classic with append/pop on a path list",
    "Pruning is essential: check constraints before recursing, not after",
    "Subset problems: include or exclude each element → 2ⁿ leaves",
    "Permutation problems: swap elements in-place → n! leaves",
    "Combination problems: advance start index to avoid duplicates",
  ],
  complexity: [
    { operation: "Subsets",      time: "O(2ⁿ)",     space: "O(n)" },
    { operation: "Permutations", time: "O(n!)",      space: "O(n)" },
    { operation: "Combinations", time: "O(C(n,k))", space: "O(k)" },
    { operation: "N-Queens",     time: "O(n!)",      space: "O(n)" },
  ],
  patterns: [
    { name: "Choose / Explore / Unchoose", description: "Core template: mutate state, recurse, then restore state on return." },
    { name: "Subset / Power Set",          description: "At each index: include the element or skip it. Two recursive calls." },
    { name: "Permutations via Swap",       description: "Swap element at i with each subsequent element; recurse; swap back." },
    { name: "Constraint Pruning",          description: "Add guards before recursing — e.g. skip if current sum already exceeds target." },
  ],
  codeExample: {
    language: "python",
    label: "Generate all subsets",
    code: `def subsets(nums: list[int]) -> list[list[int]]:
    result: list[list[int]] = []
    path:   list[int]       = []

    def backtrack(start: int) -> None:
        result.append(list(path))   # snapshot current subset

        for i in range(start, len(nums)):
            path.append(nums[i])    # choose
            backtrack(i + 1)        # explore
            path.pop()              # unchoose

    backtrack(0)
    return result`,
  },
  tips: "Draw the decision tree first. Each level is a choice; each leaf is a complete candidate. Pruning removes entire subtrees.",
  relatedSlugs: ["graph", "dynamic-programming"],
}
