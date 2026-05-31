import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"
import { defaultModel } from "@/lib/ai"
import { getDashboardStats } from "@/services/dashboard.service"
import { saveLatestPlan, getLatestPlan } from "@/services/learning-plan.service"

const RecommendationSchema = z.object({
  weeklyPlan: z.array(
    z.object({
      day: z.string(),
      focus: z.string(),
      topics: z.array(z.string()),
      suggestedQuestions: z.array(z.string()),
    })
  ),
  weakAreas: z.array(z.string()),
  nextMilestone: z.string(),
  encouragement: z.string(),
})

export async function GET() {
  const plan = await getLatestPlan()
  if (!plan) return NextResponse.json(null)
  return NextResponse.json(plan.plan)
}

export async function POST() {
  const stats = await getDashboardStats()

  const progressSummary = stats.topicProgress
    .map((t) => `${t.name}: ${t.solved}/${t.total} solved (${t.percentage}%)`)
    .join("\n")

  const { object } = await generateObject({
    model: defaultModel,
    schema: RecommendationSchema,
    prompt: `You are an algorithm interview coach. Analyse this learner's progress and create a personalised weekly study plan.

Progress snapshot:
- Total solved: ${stats.solved}/${stats.total} questions
- Mastered: ${stats.mastered}
- In progress: ${stats.inProgress}
- Topics covered: ${stats.topicsCovered}/${stats.totalTopics}

Per-topic breakdown:
${progressSummary}

Generate a focused 5-day weekly plan targeting weak areas. Keep each day realistic (1-2 topics, 2-3 questions). Be specific and encouraging.`,
  })

  await saveLatestPlan(object)

  return NextResponse.json(object)
}
