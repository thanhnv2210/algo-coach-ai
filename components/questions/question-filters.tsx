"use client"

import { cn } from "@/lib/utils/cn"

const DIFFICULTIES = ["all", "easy", "medium", "hard"]
const STATUSES = ["all", "not_started", "learning", "solved", "review_needed", "mastered"]
const STATUS_LABELS: Record<string, string> = {
  all: "All", not_started: "Not Started", learning: "Learning",
  solved: "Solved", review_needed: "Review Needed", mastered: "Mastered",
}

export function QuestionFilters({
  topicFilter, setTopicFilter,
  difficultyFilter, setDifficultyFilter,
  statusFilter, setStatusFilter,
  topics,
}: {
  topicFilter: string
  setTopicFilter: (v: string) => void
  difficultyFilter: string
  setDifficultyFilter: (v: string) => void
  statusFilter: string
  setStatusFilter: (v: string) => void
  topics: { slug: string; name: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {/* Topic */}
      <select
        value={topicFilter}
        onChange={(e) => setTopicFilter(e.target.value)}
        className="text-sm bg-card border border-border rounded-md px-3 py-1.5 text-foreground"
      >
        <option value="all">All Topics</option>
        {topics.map((t) => (
          <option key={t.slug} value={t.slug}>{t.name}</option>
        ))}
      </select>

      {/* Difficulty */}
      <div className="flex gap-1">
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            onClick={() => setDifficultyFilter(d)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
              difficultyFilter === d
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-subtle hover:text-foreground"
            )}
          >
            {d === "all" ? "All" : d}
          </button>
        ))}
      </div>

      {/* Status */}
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="text-sm bg-card border border-border rounded-md px-3 py-1.5 text-foreground"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
        ))}
      </select>
    </div>
  )
}
