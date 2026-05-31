import type { TopicContent } from "@/lib/content/types"

export const topic: TopicContent = {
  slug: "stack",
  name: "Stack",
  category: "fundamentals",
  order: 5,
  description:
    "A stack is a Last-In-First-Out (LIFO) data structure. Elements are pushed onto the top and popped from the top. Stacks are essential for problems involving nested structures, backtracking, and maintaining a running context — such as matching brackets, evaluating expressions, and tracking the next greater element.",
  keyIdeas: [
    "LIFO: the last element pushed is the first popped",
    "Push and pop are O(1) — no shifting needed",
    "Use a stack when you need to 'remember' previous state to process the current element",
    "Monotonic stack maintains elements in sorted order to efficiently find next/previous greater/smaller",
    "Call stack in recursion is itself a stack — iterative DFS uses an explicit stack",
    "Bracket matching: push opening brackets, pop and compare on closing bracket",
  ],
  complexity: [
    { operation: "Push",   time: "O(1)", space: "O(1)" },
    { operation: "Pop",    time: "O(1)", space: "O(1)" },
    { operation: "Peek",   time: "O(1)", space: "O(1)" },
    { operation: "Search", time: "O(n)", space: "O(1)" },
  ],
  patterns: [
    { name: "Bracket / Delimiter Matching", description: "Push opening chars; on closing char, pop and verify the pair matches." },
    { name: "Monotonic Stack",              description: "Maintain a strictly increasing/decreasing stack to find the next greater/smaller element in O(n)." },
    { name: "Iterative DFS",                description: "Replace recursion with an explicit stack to avoid call-stack overflow on deep graphs/trees." },
    { name: "Expression Evaluation",        description: "Two stacks (values and operators) or postfix conversion to evaluate arithmetic expressions." },
  ],
  codeExample: {
    language: "python",
    label: "Valid parentheses — bracket matching",
    code: `def is_valid(s: str) -> bool:
    stack: list[str] = []
    pairs = {')': '(', ']': '[', '}': '{'}

    for ch in s:
        if ch in '([{':
            stack.append(ch)
        elif ch in ')]}':
            if not stack or stack[-1] != pairs[ch]:
                return False
            stack.pop()

    return len(stack) == 0`,
  },
  tips: "Whenever you see 'previous', 'next greater/smaller', or nested structure, think monotonic stack.",
  relatedSlugs: ["queue", "tree", "graph"],
}
