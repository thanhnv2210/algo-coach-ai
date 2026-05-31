import { eq, and } from "drizzle-orm"
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
