import { ExternalLink } from "lucide-react"
import { StatusBadge } from "@/components/questions/status-badge"
import type { Question, QuestionStatus } from "@/lib/db/schema"

const DIFFICULTY_COLORS: Record<string, string> = {
  easy:   "text-green-400",
  medium: "text-yellow-400",
  hard:   "text-red-400",
}

export function RelatedQuestions({ questions }: { questions: Question[] }) {
  if (questions.length === 0) return null

  return (
    <div className="space-y-2">
      {questions.map((q) => (
        <div key={q.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
          <a
            href={q.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors"
          >
            {q.title}
            <ExternalLink className="size-3 text-faint shrink-0" />
          </a>
          <span className={`text-xs font-medium capitalize ${DIFFICULTY_COLORS[q.difficulty]}`}>
            {q.difficulty}
          </span>
          <StatusBadge status={q.status as QuestionStatus} />
        </div>
      ))}
    </div>
  )
}
