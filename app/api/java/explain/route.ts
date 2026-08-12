import { streamText } from "ai"
import { defaultModel } from "@/lib/ai"
import { logger } from "@/lib/logger"

export async function POST(req: Request) {
  const { code, selection, lessonTitle } = await req.json()

  if (!code || !lessonTitle) {
    return Response.json({ error: "Missing code or lessonTitle" }, { status: 400 })
  }

  const snippet = selection?.trim() ? selection.trim() : code.trim()
  const context = selection?.trim()
    ? `The engineer selected this specific snippet:\n\`\`\`java\n${snippet}\n\`\`\`\n\nFull code for reference:\n\`\`\`java\n${code}\n\`\`\``
    : `\`\`\`java\n${snippet}\n\`\`\``

  logger.info("java/explain stream started", { lessonTitle, hasSelection: !!selection?.trim() })

  const result = streamText({
    model: defaultModel,
    system: `You are a Java expert helping a Senior Software Engineer prepare for technical interviews.
Be concise, precise, and focused on what matters in an interview context.
Use markdown formatting. Keep explanations under 300 words unless the code is complex.`,
    prompt: `The engineer is studying: "${lessonTitle}".

Explain the following Java code clearly and concisely.
Cover:
1. **What it does** — in plain English
2. **Why it's written this way** — design decisions, trade-offs
3. **Interview follow-ups** — 2-3 questions this code might trigger in an interview

${context}`,
    onFinish: ({ usage }) => {
      logger.info("java/explain stream finished", { tokens: usage.totalTokens })
    },
  })

  return result.toTextStreamResponse()
}
