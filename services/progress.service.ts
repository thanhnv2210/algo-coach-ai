import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { questions, progress } from "@/lib/db/schema"

export async function upsertProgress(topicSlug: string) {
  const topicQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.topicSlug, topicSlug))

  const total = topicQuestions.length
  const solved = topicQuestions.filter(
    (q) => q.status === "solved" || q.status === "mastered"
  ).length
  const completionPct = total > 0 ? ((solved / total) * 100).toFixed(1) : "0"

  await db
    .insert(progress)
    .values({
      topicSlug,
      solvedCount: solved,
      totalCount: total,
      completionPercentage: completionPct,
      lastReviewed: new Date(),
    })
    .onConflictDoUpdate({
      target: progress.topicSlug,
      set: {
        solvedCount: solved,
        totalCount: total,
        completionPercentage: completionPct,
        lastReviewed: new Date(),
        updatedAt: new Date(),
      },
    })
}

export async function setConfidence(topicSlug: string, level: number) {
  await db
    .insert(progress)
    .values({ topicSlug, confidenceLevel: level })
    .onConflictDoUpdate({
      target: progress.topicSlug,
      set: { confidenceLevel: level, updatedAt: new Date() },
    })
}

export async function getAllProgress() {
  return db.select().from(progress)
}
