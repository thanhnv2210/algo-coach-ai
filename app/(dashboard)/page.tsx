import { getDashboardStats } from "@/services/dashboard.service"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ProgressChart } from "@/components/dashboard/progress-chart"
import { AIPanel } from "@/components/dashboard/ai-panel"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {stats.solved} of {stats.total} questions solved across {stats.topicsCovered} topics.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Solved" value={stats.solved} sub={`of ${stats.total} total`} accent />
        <StatsCard label="Mastered" value={stats.mastered} />
        <StatsCard label="In Progress" value={stats.inProgress} />
        <StatsCard label="Topics Active" value={`${stats.topicsCovered}/${stats.totalTopics}`} />
      </div>

      {/* Chart + AI panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressChart data={stats.topicProgress} />
        <AIPanel />
      </div>
    </div>
  )
}
