export type TopicCategory = "fundamentals" | "advanced" | "graphs_trees"

export interface ComplexityRow {
  operation: string
  time: string
  space: string
}

export interface Pattern {
  name: string
  description: string
}

export interface CodeExample {
  language: string
  label: string
  code: string
}

export interface TopicContent {
  slug: string
  name: string
  category: TopicCategory
  order: number
  description: string
  keyIdeas: string[]
  complexity: ComplexityRow[]
  patterns: Pattern[]
  codeExample: CodeExample
  tips?: string
  relatedSlugs: string[]
}
