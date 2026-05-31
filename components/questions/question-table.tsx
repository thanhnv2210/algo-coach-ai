"use client"

import { useState } from "react"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { StatusSelect } from "./status-select"
import type { Question, QuestionStatus } from "@/lib/db/schema"

const DIFFICULTY_COLORS: Record<string, string> = {
  easy:   "text-green-400",
  medium: "text-yellow-400",
  hard:   "text-red-400",
}

export function QuestionTable({ initialQuestions }: { initialQuestions: Question[] }) {
  const [questions, setQuestions] = useState(initialQuestions)

  async function handleStatusChange(id: string, status: QuestionStatus) {
    // Optimistic update
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)))

    await fetch(`/api/questions/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No questions match the current filters.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Title</th>
            <th className="text-left py-3 pr-4 font-medium text-muted-foreground w-24">Difficulty</th>
            <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Notes</th>
            <th className="text-left py-3 font-medium text-muted-foreground w-36">Status</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id} className="border-b border-border/50 last:border-0 hover:bg-subtle/30 transition-colors">
              <td className="py-3 pr-4">
                <a
                  href={q.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-foreground hover:text-primary transition-colors"
                >
                  {q.title}
                  <ExternalLink className="size-3 text-faint shrink-0" />
                </a>
              </td>
              <td className="py-3 pr-4">
                <span className={cn("font-medium capitalize", DIFFICULTY_COLORS[q.difficulty])}>
                  {q.difficulty}
                </span>
              </td>
              <td className="py-3 pr-4 text-muted-foreground text-xs">{q.notes ?? "—"}</td>
              <td className="py-3">
                <StatusSelect
                  id={q.id}
                  current={q.status as QuestionStatus}
                  onChange={handleStatusChange}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
