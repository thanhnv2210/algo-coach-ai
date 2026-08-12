import { getAllProgress, upsertLessonProgress, getCategoryStats } from "@/services/java-lab.service"
import type { JavaLessonStatus } from "@/lib/db/schema"

export async function GET() {
  const [all, categoryStats] = await Promise.all([getAllProgress(), getCategoryStats()])
  return Response.json({ progress: all, categoryStats })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { categorySlug, lessonSlug, status, notes } = body

  if (!categorySlug || !lessonSlug || !status) {
    return Response.json({ error: "Missing categorySlug, lessonSlug, or status" }, { status: 400 })
  }

  const validStatuses: JavaLessonStatus[] = ["not_started", "in_progress", "done"]
  if (!validStatuses.includes(status)) {
    return Response.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 })
  }

  await upsertLessonProgress(categorySlug, lessonSlug, status, notes)
  return Response.json({ ok: true })
}
