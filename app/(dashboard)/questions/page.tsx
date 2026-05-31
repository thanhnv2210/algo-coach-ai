"use client"

import { useEffect, useState } from "react"
import { QuestionFilters } from "@/components/questions/question-filters"
import { QuestionTable } from "@/components/questions/question-table"
import { getAllTopics } from "@/lib/content"
import type { Question } from "@/lib/db/schema"

const topics = getAllTopics().map((t) => ({ slug: t.slug, name: t.name }))

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [topicFilter, setTopicFilter] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    const params = new URLSearchParams()
    if (topicFilter !== "all") params.set("topic", topicFilter)
    if (difficultyFilter !== "all") params.set("difficulty", difficultyFilter)
    if (statusFilter !== "all") params.set("status", statusFilter)

    setLoading(true)
    fetch(`/api/questions?${params}`)
      .then((r) => r.json())
      .then((data) => { setQuestions(data); setLoading(false) })
  }, [topicFilter, difficultyFilter, statusFilter])

  return (
    <div className="px-8 py-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Question Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">30 curated questions across 13 topics. Track your progress as you solve them.</p>
      </div>

      <div className="mb-6">
        <QuestionFilters
          topicFilter={topicFilter} setTopicFilter={setTopicFilter}
          difficultyFilter={difficultyFilter} setDifficultyFilter={setDifficultyFilter}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          topics={topics}
        />
      </div>

      <div className="bg-card rounded-lg border border-border px-6 py-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
        ) : (
          <QuestionTable initialQuestions={questions} />
        )}
      </div>
    </div>
  )
}
