import { and, eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { javaLessonProgress, type JavaLessonStatus } from "@/lib/db/schema"
import { JAVA_CURRICULUM } from "@/lib/content/java-lab"

export async function getLessonProgress(categorySlug: string, lessonSlug: string) {
  const rows = await db
    .select()
    .from(javaLessonProgress)
    .where(
      and(
        eq(javaLessonProgress.categorySlug, categorySlug),
        eq(javaLessonProgress.lessonSlug, lessonSlug)
      )
    )
    .limit(1)
  return rows[0] ?? null
}

export async function upsertLessonProgress(
  categorySlug: string,
  lessonSlug: string,
  status: JavaLessonStatus,
  notes?: string
) {
  const now = new Date()
  const existing = await getLessonProgress(categorySlug, lessonSlug)

  if (existing) {
    await db
      .update(javaLessonProgress)
      .set({
        status,
        lastOpenedAt: now,
        completedAt: status === "done" ? now : existing.completedAt,
        ...(notes !== undefined ? { notes } : {}),
      })
      .where(eq(javaLessonProgress.id, existing.id))
  } else {
    await db.insert(javaLessonProgress).values({
      categorySlug,
      lessonSlug,
      status,
      lastOpenedAt: now,
      completedAt: status === "done" ? now : null,
      notes: notes ?? null,
    })
  }
}

export async function getAllProgress() {
  return db.select().from(javaLessonProgress)
}

// Returns per-category completion stats: { slug, total, done }
export async function getCategoryStats() {
  const allProgress = await getAllProgress()

  return JAVA_CURRICULUM.map((category) => {
    const total = category.lessons.length
    const doneCount = allProgress.filter(
      (p) => p.categorySlug === category.slug && p.status === "done"
    ).length
    return {
      slug: category.slug,
      total,
      done: doneCount,
      pct: total > 0 ? Math.round((doneCount / total) * 100) : 0,
    }
  })
}
