import type { TopicContent } from "@/lib/content/types"

export const topic: TopicContent = {
  slug: "linked-list",
  name: "Linked List",
  category: "fundamentals",
  order: 7,
  description:
    "A linked list is a sequence of nodes where each node holds a value and a pointer to the next node. Unlike arrays, nodes are scattered in memory, so random access is O(n). However, insertion and deletion at a known position are O(1) — no shifting needed. Two-pointer (fast/slow) techniques solve many linked-list problems elegantly.",
  keyIdeas: [
    "No random access — traversal from head is always O(n)",
    "Insertion/deletion at a known node is O(1) — just rewire pointers",
    "Sentinel (dummy) head node simplifies edge cases at the list head",
    "Fast/slow pointers (Floyd's cycle detection): fast moves 2 steps, slow moves 1",
    "Reversing a list in-place uses three pointers: prev, curr, next",
    "Doubly linked list allows O(1) deletion given a node reference (used in LRU cache)",
  ],
  complexity: [
    { operation: "Access by index",        time: "O(n)", space: "O(1)" },
    { operation: "Search",                 time: "O(n)", space: "O(1)" },
    { operation: "Insert at head",         time: "O(1)", space: "O(1)" },
    { operation: "Insert at known node",   time: "O(1)", space: "O(1)" },
    { operation: "Delete at known node",   time: "O(1)", space: "O(1)" },
  ],
  patterns: [
    { name: "Fast / Slow Pointers", description: "Detect cycles (Floyd's), find middle node, or find the n-th node from end." },
    { name: "Dummy Head Node",      description: "Prepend a sentinel node to avoid special-casing insertions/deletions at the head." },
    { name: "In-place Reversal",    description: "Reverse a sublist by re-linking nodes with three pointers (prev, curr, next)." },
    { name: "Merge Two Lists",      description: "Compare heads and advance the pointer to the smaller node — used in merge sort." },
  ],
  codeExample: {
    language: "python",
    label: "Detect cycle — Floyd's algorithm",
    code: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def has_cycle(head: ListNode | None) -> bool:
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False`,
  },
  tips: "When you see 'cycle', 'middle', or 'nth from end', draw the fast/slow pointer pattern first.",
  relatedSlugs: ["stack", "tree"],
}
