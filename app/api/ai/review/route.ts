import { NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { z } from "zod"
import { defaultModel } from "@/lib/ai"

const ReviewSchema = z.object({
  verdict: z.enum(["looks_correct", "has_issues", "needs_testing"]),
  timeComplexity: z.string(),
  spaceComplexity: z.string(),
  correctness: z.string(),
  issues: z.array(z.string()),
  improvements: z.array(z.string()),
  summary: z.string(),
})

export async function POST(req: NextRequest) {
  const { code, language, questionTitle, questionNotes } = await req.json()

  if (!code || !language || !questionTitle) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { object } = await generateObject({
    model: defaultModel,
    schema: ReviewSchema,
    prompt: `You are an expert algorithm interview coach reviewing a candidate's solution.

Problem: "${questionTitle}"
${questionNotes ? `Hints/Notes: ${questionNotes}` : ""}

Language: ${language}
Code:
\`\`\`${language.toLowerCase()}
${code}
\`\`\`

Provide a structured review:
- verdict: "looks_correct" if the approach is sound, "has_issues" if there are bugs or logical errors, "needs_testing" if it's incomplete or unclear
- timeComplexity: Big-O time complexity (e.g. "O(n)", "O(n log n)")
- spaceComplexity: Big-O space complexity
- correctness: 1-2 sentences on whether the logic appears correct
- issues: specific bugs, edge cases missed, or logical errors (empty if none)
- improvements: concrete optimization or readability suggestions
- summary: 2-3 sentence honest overall assessment`,
  })

  return NextResponse.json(object)
}
