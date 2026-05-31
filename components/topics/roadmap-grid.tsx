import type { TopicContent } from "@/lib/content/types"
import { TopicCard } from "@/components/topics/topic-card"

const CATEGORIES: { key: TopicContent["category"]; label: string }[] = [
  { key: "fundamentals",  label: "Fundamentals" },
  { key: "graphs_trees",  label: "Graphs & Trees" },
  { key: "advanced",      label: "Advanced" },
]

export function RoadmapGrid({ topics }: { topics: TopicContent[] }) {
  return (
    <div className="space-y-8">
      {CATEGORIES.map(({ key, label }) => {
        const group = topics.filter((t) => t.category === key)
        if (group.length === 0) return null
        return (
          <section key={key}>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {group.map((topic) => (
                <TopicCard key={topic.slug} topic={topic} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
