import { getDashboardStats } from "@/services/dashboard.service"
import { getAllProgress } from "@/services/progress.service"
import { InsightsPanel } from "@/components/profile/insights-panel"
import { cn } from "@/lib/utils/cn"

export const dynamic = "force-dynamic"
export const metadata = { title: "Profile — AlgoCoach AI" }

export default async function ProfilePage() {
  const [stats, progressRows] = await Promise.all([
    getDashboardStats(),
    getAllProgress(),
  ])

  const overallPct = stats.total > 0
    ? Math.round((stats.solved / stats.total) * 100)
    : 0

  const progressMap = Object.fromEntries(progressRows.map((p) => [p.topicSlug, p]))

  return (
    <div className="px-8 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your learning summary and progress overview.</p>
      </div>

      {/* Overall progress */}
      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Overall Completion</p>
            <p className="text-4xl font-bold text-primary mt-1">{overallPct}%</p>
          </div>
          <div className="text-right text-sm text-muted-foreground space-y-0.5">
            <p><span className="text-foreground font-medium">{stats.solved}</span> solved</p>
            <p><span className="text-foreground font-medium">{stats.mastered}</span> mastered</p>
            <p><span className="text-foreground font-medium">{stats.inProgress}</span> in progress</p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-subtle overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${overallPct}%` }} />
        </div>
      </div>

      {/* Per-topic breakdown */}
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Topic Progress</h2>
        <div className="space-y-3">
          {stats.topicProgress.map((t) => {
            const p = progressMap[t.slug]
            const conf = p?.confidenceLevel ?? 0
            return (
              <div key={t.slug}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">{t.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{t.solved}/{t.total}</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <svg key={s} className={cn("size-3", s <= conf ? "text-primary" : "text-faint/30")} viewBox="0 0 12 12" fill="currentColor">
                          <path d="M6 1l1.24 2.51 2.76.4-2 1.95.47 2.75L6 7.27 3.53 8.61 4 5.86 2 3.91l2.76-.4z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{t.percentage}%</span>
                  </div>
                </div>
                <div className="h-1 rounded-full bg-subtle overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", t.percentage === 100 ? "bg-primary" : "bg-primary/60")}
                    style={{ width: `${t.percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* AI Insights */}
      <InsightsPanel />
    </div>
  )
}
