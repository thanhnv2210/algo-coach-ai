import { NextRequest, NextResponse } from "next/server"
import { setConfidence } from "@/services/progress.service"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { level } = await req.json()

  if (typeof level !== "number" || level < 1 || level > 5) {
    return NextResponse.json({ error: "level must be 1–5" }, { status: 400 })
  }

  await setConfidence(slug, level)
  return NextResponse.json({ slug, confidenceLevel: level })
}
