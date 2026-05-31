import type { TopicContent } from "@/lib/content/types"

export const topic: TopicContent = {
  slug: "queue",
  name: "Queue",
  category: "fundamentals",
  order: 6,
  description:
    "A queue is a First-In-First-Out (FIFO) data structure. Elements are enqueued at the rear and dequeued from the front. Queues are indispensable for Breadth-First Search (BFS), level-order tree traversal, and any problem where processing order must follow arrival order.",
  keyIdeas: [
    "FIFO: the first element enqueued is the first dequeued",
    "Use collections.deque in Python — O(1) enqueue and dequeue (unlike list.pop(0) which is O(n))",
    "BFS uses a queue to explore nodes level by level, guaranteeing shortest path in unweighted graphs",
    "Monotonic deque enables sliding window maximum/minimum in O(n)",
    "Priority queue (min-heap) is not FIFO — it dequeues by priority",
  ],
  complexity: [
    { operation: "Enqueue (rear)", time: "O(1)", space: "O(1)" },
    { operation: "Dequeue (front)", time: "O(1)", space: "O(1)" },
    { operation: "Peek front",     time: "O(1)", space: "O(1)" },
    { operation: "Search",         time: "O(n)", space: "O(1)" },
  ],
  patterns: [
    { name: "BFS / Level-order Traversal", description: "Initialise queue with source nodes; dequeue, process, and enqueue unvisited neighbours." },
    { name: "Multi-source BFS",            description: "Start BFS from multiple source nodes simultaneously to find distances from any source." },
    { name: "Monotonic Deque",             description: "Maintain a deque of indices in decreasing order to answer sliding-window max/min in O(1) per element." },
  ],
  codeExample: {
    language: "python",
    label: "BFS — shortest path in an unweighted grid",
    code: `from collections import deque

def bfs_shortest_path(grid: list[list[int]], start: tuple, end: tuple) -> int:
    rows, cols = len(grid), len(grid[0])
    queue: deque = deque([(start, 0)])   # (position, distance)
    visited = {start}

    while queue:
        (r, c), dist = queue.popleft()
        if (r, c) == end:
            return dist
        for dr, dc in [(0,1),(0,-1),(1,0),(-1,0)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in visited and grid[nr][nc] == 0:
                visited.add((nr, nc))
                queue.append(((nr, nc), dist + 1))

    return -1   # unreachable`,
  },
  tips: "BFS guarantees the shortest path in unweighted graphs. DFS does not.",
  relatedSlugs: ["stack", "tree", "graph"],
}
