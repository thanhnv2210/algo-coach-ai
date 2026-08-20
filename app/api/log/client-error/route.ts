import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientErrors } from "@/lib/db/schema"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, stack, errorType, url, userAgent, componentStack, extra } = body

    if (!message) return NextResponse.json({ error: "message required" }, { status: 400 })

    await db.insert(clientErrors).values({
      message: String(message).slice(0, 2000),
      stack: stack ? String(stack).slice(0, 5000) : null,
      errorType: errorType ?? "manual",
      url: url ? String(url).slice(0, 1000) : null,
      userAgent: userAgent ? String(userAgent).slice(0, 500) : null,
      componentStack: componentStack ? String(componentStack).slice(0, 5000) : null,
      extra: extra ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    // Never crash on logging failure
    console.error("[client-error log] failed:", err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
