import type { TopicContent } from "@/lib/content/types"

export const topic: TopicContent = {
  slug: "strings",
  name: "Strings",
  category: "fundamentals",
  order: 2,
  description:
    "Strings are sequences of characters — effectively arrays of chars. Most languages treat them as immutable, which means every concatenation creates a new allocation. Mastering string manipulation requires understanding character encoding, frequency counting, and pattern matching.",
  keyIdeas: [
    "Strings are immutable in Python and Java — use a list/StringBuilder to build in O(n)",
    "Character frequency maps (hash maps) reduce many O(n²) problems to O(n)",
    "Sliding window handles longest/shortest substring problems with constraints",
    "Two-pointer palindrome checks run in O(n) without extra space",
    "ASCII has 128 characters; a fixed-size frequency array of size 128 is O(1) space",
    "Lexicographic comparison compares character by character left-to-right",
  ],
  complexity: [
    { operation: "Access by index",  time: "O(1)",  space: "O(1)" },
    { operation: "Search (contains)", time: "O(n·m)", space: "O(1)" },
    { operation: "Concatenation",    time: "O(n)",  space: "O(n)" },
    { operation: "Substring",        time: "O(k)",  space: "O(k)" },
    { operation: "Reverse",          time: "O(n)",  space: "O(n)" },
  ],
  patterns: [
    { name: "Frequency Map",    description: "Count character occurrences in O(n) using a hash map or array of size 26/128." },
    { name: "Sliding Window",   description: "Track a variable-length window to find substrings satisfying a constraint." },
    { name: "Two Pointers",     description: "Expand from centre or converge from ends to check palindromes." },
    { name: "Trie",             description: "Prefix tree for efficient prefix search, autocomplete, and word grouping." },
  ],
  codeExample: {
    language: "python",
    label: "Check if two strings are anagrams",
    code: `from collections import Counter

def is_anagram(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    return Counter(s) == Counter(t)

# Alternative — O(1) space with array of 26
def is_anagram_v2(s: str, t: str) -> bool:
    if len(s) != len(t):
        return False
    count = [0] * 26
    for a, b in zip(s, t):
        count[ord(a) - ord('a')] += 1
        count[ord(b) - ord('a')] -= 1
    return all(c == 0 for c in count)`,
  },
  tips: "Before building a complex solution, ask: can a frequency map reduce this to O(n)?",
  relatedSlugs: ["arrays", "hash-map", "sliding-window"],
}
