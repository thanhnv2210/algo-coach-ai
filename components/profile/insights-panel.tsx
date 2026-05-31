"use client"

import { useState } from "react"
import { Loader2, Zap } from "lucide-react"
import { cn } from "@/lib/utils/cn"

type WeakTopic = { topic: string; reason: string; priority: "high" | "medium" | "low" }
type ActionItem = { action: string; impact: string }

type Insights = {
  weakestTopics: WeakTopic[]
  strongestTopics: string[]
  studyGaps: string[]
  actionItems: ActionItem[]
  overallAssessment: string
}

const priorityColor: Record<string, string> = {
  high:   "bg-red-500/10 text-red-400",
  medium: "bg-yellow-500/10 text-yellow-400",
  low:    "bg-muted text-muted-foreground",
}

export function InsightsPanel() {
  const [insights, setInsights] = useState<Insights | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/ai/insights", { method: "POST" })
      if (!res.ok) throw new Error()
      setInsights(await res.json())
    } catch {
      setError("Could not generate insights. Check your API key.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Zap className="size-4 text-primary" />
          AI Insights
        </h2>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
        >
          {loading && <Loader2 className="size-3 animate-spin" />}
          {loading ? "Analysing..." : "Analyse Progress"}
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {!insights && !loading && !error && (
        <p className="text-sm text-muted-foreground">
          Click Analyse Progress for an honest assessment of your strengths, weaknesses, and next steps.
        </p>
      )}

      {insights && (
        <div className="space-y-5 text-sm">
          <p className="text-muted-foreground leading-relaxed">{insights.overallAssessment}</p>

          {insights.weakestTopics.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Needs Work</p>
              <div className="space-y-2">
                {insights.weakestTopics.map((t) => (
                  <div key={t.topic} className="flex items-start gap-2">
                    <span className={cn("shrink-0 text-xs px-1.5 py-0.5 rounded font-medium", priorityColor[t.priority])}>
                      {t.priority}
                    </span>
                    <div>
                      <span className="font-medium text-foreground">{t.topic}</span>
                      <span className="text-muted-foreground"> — {t.reason}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insights.strongestTopics.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Strengths</p>
              <div className="flex flex-wrap gap-1.5">
                {insights.strongestTopics.map((t) => (
                  <span key={t} className="bg-green-500/10 text-green-400 text-xs px-2 py-0.5 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}

          {insights.studyGaps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Study Gaps</p>
              <ul className="space-y-1">
                {insights.studyGaps.map((g) => (
                  <li key={g} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="mt-1 size-1 rounded-full bg-faint shrink-0" />{g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.actionItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Action Items</p>
              <div className="space-y-2">
                {insights.actionItems.map((item, i) => (
                  <div key={i} className="border border-border/60 rounded-md p-3">
                    <p className="text-xs font-medium text-foreground">{item.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
