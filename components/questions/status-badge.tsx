import { cn } from "@/lib/utils/cn"
import type { QuestionStatus } from "@/lib/db/schema"

const STATUS_CONFIG: Record<QuestionStatus, { label: string; className: string }> = {
  not_started:   { label: "Not Started",    className: "bg-muted text-muted-foreground" },
  learning:      { label: "Learning",       className: "bg-blue-500/10 text-blue-400" },
  solved:        { label: "Solved",         className: "bg-green-500/10 text-green-400" },
  review_needed: { label: "Review Needed",  className: "bg-yellow-500/10 text-yellow-400" },
  mastered:      { label: "Mastered",       className: "bg-primary/10 text-primary" },
}

export function StatusBadge({ status }: { status: QuestionStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", config.className)}>
      {config.label}
    </span>
  )
}

export { STATUS_CONFIG }
