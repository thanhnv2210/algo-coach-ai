import { getAllTopics } from "@/lib/content"
import { RoadmapGrid } from "@/components/topics/roadmap-grid"

export const metadata = { title: "Topics — AlgoCoach AI" }

export default function TopicsPage() {
  const topics = getAllTopics()

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Learning Roadmap</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {topics.length} topics · click any card to read the theory
        </p>
      </div>
      <RoadmapGrid topics={topics} />
    </div>
  )
}
