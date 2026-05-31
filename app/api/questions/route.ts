import { NextRequest, NextResponse } from "next/server"
import { getQuestions } from "@/services/question.service"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const topicSlug = searchParams.get("topic") ?? undefined
  const difficulty = searchParams.get("difficulty") ?? undefined
  const status = searchParams.get("status") ?? undefined

  const data = await getQuestions({ topicSlug, difficulty, status })
  return NextResponse.json(data)
}
