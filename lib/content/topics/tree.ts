import type { TopicContent } from "@/lib/content/types"

export const topic: TopicContent = {
  slug: "tree",
  name: "Tree",
  category: "graphs_trees",
  order: 8,
  description:
    "A tree is a connected, acyclic graph with a designated root. Binary trees (at most 2 children) are the most common interview topic. Binary Search Trees (BSTs) maintain the invariant left < node < right, enabling O(log n) operations on balanced trees. DFS and BFS are the two fundamental traversal strategies.",
  keyIdeas: [
    "A tree with n nodes has exactly n−1 edges",
    "Height of a balanced binary tree is O(log n); degenerate (skewed) tree is O(n)",
    "DFS traversals: pre-order (root, left, right), in-order (left, root, right), post-order (left, right, root)",
    "In-order traversal of a BST visits nodes in sorted ascending order",
    "Recursive DFS is natural for trees; iterative uses an explicit stack",
    "Many tree problems follow: base case (null) → recurse left → recurse right → combine",
  ],
  complexity: [
    { operation: "Access / Search (balanced BST)", time: "O(log n)", space: "O(log n)" },
    { operation: "Access / Search (skewed BST)",   time: "O(n)",     space: "O(n)" },
    { operation: "Insert (balanced BST)",           time: "O(log n)", space: "O(log n)" },
    { operation: "Delete (balanced BST)",           time: "O(log n)", space: "O(log n)" },
    { operation: "Level-order traversal (BFS)",     time: "O(n)",     space: "O(n)" },
  ],
  patterns: [
    { name: "DFS — Top-down",    description: "Pass information from parent to children (e.g. current path sum, min/max seen so far)." },
    { name: "DFS — Bottom-up",   description: "Combine results from children before returning to parent (e.g. height, diameter)." },
    { name: "BFS / Level-order", description: "Process nodes level by level using a queue — useful for level-specific aggregations." },
    { name: "BST Properties",    description: "Use the BST invariant to prune half the tree at each step; validate by passing min/max bounds." },
  ],
  codeExample: {
    language: "python",
    label: "Max depth — bottom-up DFS",
    code: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val   = val
        self.left  = left
        self.right = right

def max_depth(root: TreeNode | None) -> int:
    if root is None:
        return 0
    left_depth  = max_depth(root.left)
    right_depth = max_depth(root.right)
    return 1 + max(left_depth, right_depth)`,
  },
  tips: "Draw the recursion tree before coding. If you can define the return value from a subtree, bottom-up DFS usually gives the cleanest solution.",
  relatedSlugs: ["graph", "heap", "binary-search", "dynamic-programming"],
}
