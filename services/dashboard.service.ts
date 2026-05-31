import { db } from "@/lib/db"
import { questions, topics } from "@/lib/db/schema"
import { sql } from "drizzle-orm"

export async function getDashboardStats() {
  const allQuestions = await db.select().from(questions)
  const allTopics = await db.select().from(topics).orderBy(topics.order)

  const total = allQuestions.length
  const solved = allQuestions.filter((q) => q.status === "solved" || q.status === "mastered").length
  const mastered = allQuestions.filter((q) => q.status === "mastered").length
  const inProgress = allQuestions.filter((q) => q.status === "learning").length
  const notStarted = allQuestions.filter((q) => q.status === "not_started").length

  // Per-topic breakdown
  const topicProgress = allTopics.map((topic) => {
    const topicQs = allQuestions.filter((q) => q.topicSlug === topic.slug)
    const topicSolved = topicQs.filter(
      (q) => q.status === "solved" || q.status === "mastered"
    ).length
    return {
      slug: topic.slug,
      name: topic.name,
      total: topicQs.length,
      solved: topicSolved,
      percentage: topicQs.length > 0 ? Math.round((topicSolved / topicQs.length) * 100) : 0,
    }
  })

  const topicsCovered = topicProgress.filter((t) => t.solved > 0).length

  return {
    total,
    solved,
    mastered,
    inProgress,
    notStarted,
    topicsCovered,
    totalTopics: allTopics.length,
    topicProgress,
  }
}
