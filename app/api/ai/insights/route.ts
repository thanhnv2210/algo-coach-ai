import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"
import { defaultModel } from "@/lib/ai"
import { getDashboardStats } from "@/services/dashboard.service"
import { getAllProgress } from "@/services/progress.service"

const InsightsSchema = z.object({
  weakestTopics: z.array(
    z.object({
      topic: z.string(),
      reason: z.string(),
      priority: z.enum(["high", "medium", "low"]),
    })
  ),
  strongestTopics: z.array(z.string()),
  studyGaps: z.array(z.string()),
  actionItems: z.array(
    z.object({
      action: z.string(),
      impact: z.string(),
    })
  ),
  overallAssessment: z.string(),
})

export async function POST() {
  const [stats, progressRows] = await Promise.all([
    getDashboardStats(),
    getAllProgress(),
  ])

  const progressDetail = stats.topicProgress
    .map((t) => {
      const p = progressRows.find((r) => r.topicSlug === t.slug)
      const confidence = p?.confidenceLevel ?? 0
      return `${t.name}: ${t.solved}/${t.total} solved (${t.percentage}%), confidence: ${confidence}/5`
    })
    .join("\n")

  const { object } = await generateObject({
    model: defaultModel,
    schema: InsightsSchema,
    prompt: `You are an expert algorithm interview coach. Analyse this learner's progress in depth and identify specific weaknesses, strengths, and gaps.

Overall: ${stats.solved}/${stats.total} questions solved, ${stats.mastered} mastered, ${stats.topicsCovered}/${stats.totalTopics} topics active.

Per-topic breakdown (solved/total, confidence 0=unrated, 1–5):
${progressDetail}

Provide:
1. weakestTopics — topics that need the most attention (0% solved OR low confidence despite solving). Include a clear reason and priority.
2. strongestTopics — topics where performance is strong (≥60% solved or high confidence)
3. studyGaps — patterns in what's missing (e.g. "no graph algorithms attempted", "advanced topics untouched")
4. actionItems — 3–5 specific, actionable steps ranked by impact
5. overallAssessment — 2–3 sentence honest assessment of current readiness`,
  })

  return NextResponse.json(object)
}
