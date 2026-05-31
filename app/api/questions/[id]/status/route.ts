import { NextRequest, NextResponse } from "next/server"
import { updateQuestionStatus } from "@/services/question.service"
import type { QuestionStatus } from "@/lib/db/schema"

const VALID_STATUSES: QuestionStatus[] = [
  "not_started",
  "learning",
  "solved",
  "review_needed",
  "mastered",
]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const status = body.status as QuestionStatus

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const updated = await updateQuestionStatus(id, status)
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(updated)
}
