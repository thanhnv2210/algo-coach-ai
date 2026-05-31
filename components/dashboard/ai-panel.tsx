"use client"

import { useState, useEffect } from "react"
import { BrainCircuit, Loader2 } from "lucide-react"

type WeeklyDay = {
  day: string
  focus: string
  topics: string[]
  suggestedQuestions: string[]
}

type Recommendation = {
  weeklyPlan: WeeklyDay[]
  weakAreas: string[]
  nextMilestone: string
  encouragement: string
}

export function AIPanel() {
  const [rec, setRec] = useState<Recommendation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/ai/recommendations")
      .then((r) => r.json())
      .then((data) => { if (data) setRec(data) })
      .catch(() => {})
  }, [])

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/ai/recommendations", { method: "POST" })
      if (!res.ok) throw new Error("Failed to generate plan")
      setRec(await res.json())
    } catch {
      setError("Could not generate plan. Check your API key.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
          <BrainCircuit className="size-4 text-primary" />
          AI Coach
        </h2>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-3 animate-spin" /> : null}
          {loading ? "Generating..." : "Generate Plan"}
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {!rec && !loading && !error && (
        <p className="text-sm text-muted-foreground">
          Click Generate Plan to get a personalised weekly study plan based on your current progress.
        </p>
      )}

      {rec && (
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground italic">{rec.encouragement}</p>

          {rec.weakAreas.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">Focus Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {rec.weakAreas.map((a) => (
                  <span key={a} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{a}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Weekly Plan</p>
            <div className="space-y-2">
              {rec.weeklyPlan.map((day) => (
                <div key={day.day} className="border border-border/60 rounded-md p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-primary">{day.day}</span>
                    <span className="text-xs text-muted-foreground">— {day.focus}</span>
                  </div>
                  {day.suggestedQuestions.length > 0 && (
                    <ul className="space-y-0.5">
                      {day.suggestedQuestions.map((q) => (
                        <li key={q} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="mt-1 size-1 rounded-full bg-primary/50 shrink-0" />
                          {q}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">Next Milestone</p>
            <p className="text-xs text-muted-foreground">{rec.nextMilestone}</p>
          </div>
        </div>
      )}
    </div>
  )
}
