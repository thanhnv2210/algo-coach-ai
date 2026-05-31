import { NextRequest, NextResponse } from "next/server"

const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com"

export async function POST(req: NextRequest) {
  const apiKey = process.env.JUDGE0_RAPIDAPI_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Code execution is not configured. Add JUDGE0_RAPIDAPI_KEY to your .env file. Get a free key at rapidapi.com/judge0-official/api/judge0-ce." },
      { status: 503 }
    )
  }

  const { code, languageId } = await req.json()
  if (!code || !languageId) {
    return NextResponse.json({ error: "Missing code or languageId" }, { status: 400 })
  }

  // Submit to Judge0 (async — returns token)
  const submitRes = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=false`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
    },
    body: JSON.stringify({ source_code: code, language_id: languageId, stdin: "" }),
  })

  if (!submitRes.ok) {
    return NextResponse.json({ error: "Judge0 submission failed" }, { status: 502 })
  }

  const { token } = await submitRes.json()

  // Poll for result (max 10 attempts, 600ms apart)
  for (let i = 0; i < 10; i++) {
    await new Promise((r) => setTimeout(r, 600))

    const resultRes = await fetch(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
      {
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
        },
      }
    )

    if (!resultRes.ok) continue

    const result = await resultRes.json()

    // Status 1 = In Queue, 2 = Processing — keep polling
    if (result.status?.id <= 2) continue

    return NextResponse.json({
      stdout: result.stdout ?? null,
      stderr: result.stderr ?? null,
      compileOutput: result.compile_output ?? null,
      status: result.status?.description ?? "Unknown",
      statusId: result.status?.id ?? 0,
      time: result.time ?? null,
      memory: result.memory ?? null,
    })
  }

  return NextResponse.json({ error: "Execution timed out" }, { status: 408 })
}
