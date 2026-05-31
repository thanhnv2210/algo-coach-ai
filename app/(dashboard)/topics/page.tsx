import { getAllTopics } from "@/lib/content"
import { getAllProgress } from "@/services/progress.service"
import { RoadmapGrid } from "@/components/topics/roadmap-grid"
import type { Progress } from "@/lib/db/schema"

export const dynamic = "force-dynamic"
export const metadata = { title: "Topics — AlgoCoach AI" }

export default async function TopicsPage() {
  const topics = getAllTopics()
  const progressRows = await getAllProgress()
  const progressMap = Object.fromEntries(
    progressRows.map((p) => [p.topicSlug, p])
  ) as Record<string, Progress>

  const solved = progressRows.reduce((s, p) => s + p.solvedCount, 0)
  const total = progressRows.reduce((s, p) => s + p.totalCount, 0)

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Learning Roadmap</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {topics.length} topics · {solved}/{total} questions solved · click any card to study
        </p>
      </div>
      <RoadmapGrid topics={topics} progressMap={progressMap} />
    </div>
  )
}
