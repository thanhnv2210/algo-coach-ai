import type { TopicContent } from "@/lib/content/types"

export const topic: TopicContent = {
  slug: "graph",
  name: "Graph",
  category: "graphs_trees",
  order: 9,
  description:
    "A graph is a set of nodes (vertices) connected by edges. Edges can be directed or undirected, weighted or unweighted. Graphs model networks, dependencies, and spatial problems. DFS and BFS are the core traversal algorithms; topological sort and union-find are essential for directed and connectivity problems respectively.",
  keyIdeas: [
    "Represented as adjacency list (space O(V+E)) or adjacency matrix (space O(V²))",
    "BFS finds shortest path in unweighted graphs; Dijkstra's for weighted",
    "DFS detects cycles, generates topological order, and finds connected components",
    "Topological sort: valid only for Directed Acyclic Graphs (DAGs) — used in dependency resolution",
    "Union-Find (Disjoint Set Union) tracks connected components in near-O(1) per operation",
    "Always track visited nodes to avoid infinite loops on cyclic graphs",
  ],
  complexity: [
    { operation: "BFS / DFS traversal", time: "O(V + E)", space: "O(V)" },
    { operation: "Topological sort (Kahn's)", time: "O(V + E)", space: "O(V)" },
    { operation: "Union-Find (path compression)", time: "O(α(n)) ≈ O(1)", space: "O(V)" },
    { operation: "Dijkstra's (min-heap)", time: "O((V+E) log V)", space: "O(V)" },
  ],
  patterns: [
    { name: "BFS for Shortest Path",  description: "Level-by-level exploration guarantees shortest hop count in unweighted graphs." },
    { name: "DFS for Cycle Detection", description: "Track recursion stack state (WHITE/GRAY/BLACK) to detect back edges." },
    { name: "Topological Sort (Kahn's)", description: "Repeatedly remove nodes with in-degree 0; remaining nodes form the cycle." },
    { name: "Union-Find",              description: "Efficiently merge sets and query connectivity — ideal for Kruskal's MST and number-of-islands variants." },
  ],
  codeExample: {
    language: "python",
    label: "Number of islands — DFS flood fill",
    code: `def num_islands(grid: list[list[str]]) -> int:
    if not grid:
        return 0
    rows, cols = len(grid), len(grid[0])
    count = 0

    def dfs(r: int, c: int) -> None:
        if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != '1':
            return
        grid[r][c] = '0'   # mark visited
        dfs(r+1, c); dfs(r-1, c)
        dfs(r, c+1); dfs(r, c-1)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1':
                dfs(r, c)
                count += 1
    return count`,
  },
  tips: "Convert a 2D grid problem to a graph problem: each cell is a node, each valid neighbour is an edge.",
  relatedSlugs: ["tree", "queue", "backtracking"],
}
