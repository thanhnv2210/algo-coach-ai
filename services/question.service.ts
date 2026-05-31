import { eq, and, inArray, lt, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { questions } from "@/lib/db/schema"
import type { QuestionStatus } from "@/lib/db/schema"

export type QuestionFilters = {
  topicSlug?: string
  difficulty?: string
  status?: string
}

export async function getQuestions(filters: QuestionFilters = {}) {
  const conditions = []
  if (filters.topicSlug) conditions.push(eq(questions.topicSlug, filters.topicSlug))
  if (filters.difficulty) conditions.push(eq(questions.difficulty, filters.difficulty))
  if (filters.status) conditions.push(eq(questions.status, filters.status))

  return db
    .select()
    .from(questions)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(questions.topicSlug)
}

export async function updateQuestionStatus(id: string, status: QuestionStatus) {
  const [updated] = await db
    .update(questions)
    .set({ status, updatedAt: new Date() })
    .where(eq(questions.id, id))
    .returning()
  return updated
}

/**
 * Flag questions that have been "solved" or "mastered" for more than `days` days
 * back to "review_needed". Returns the number of questions flagged.
 */
export async function flagStaleQuestions(days = 7): Promise<number> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const stale = await db
    .select({ id: questions.id })
    .from(questions)
    .where(
      and(
        inArray(questions.status, ["solved", "mastered"]),
        lt(questions.updatedAt, cutoff)
      )
    )

  if (stale.length === 0) return 0

  await db
    .update(questions)
    .set({ status: "review_needed", updatedAt: sql`now()` })
    .where(inArray(questions.id, stale.map((q) => q.id)))

  return stale.length
}
