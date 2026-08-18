import { exec } from "child_process"
import { writeFile, unlink } from "fs/promises"
import { mkdir } from "fs/promises"
import { randomUUID } from "crypto"
import path from "path"
import { logger } from "@/lib/logger"

const TIMEOUT_MS = 5000
const TMP_DIR = "/tmp/java-lab"
const PISTON_URL = process.env.PISTON_API_URL ?? "https://emkc.org/api/v2/piston"

function execPromise(
  cmd: string,
  timeoutMs: number,
  stdin?: string
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = exec(cmd, { timeout: timeoutMs }, (err, stdout, stderr) => {
      if (err) {
        const error = err as NodeJS.ErrnoException & { stdout?: string; stderr?: string; code?: number }
        error.stdout = stdout
        error.stderr = stderr
        reject(error)
      } else {
        resolve({ stdout, stderr })
      }
    })

    if (stdin && child.stdin) {
      child.stdin.write(stdin)
      child.stdin.end()
    }
  })
}

async function runWithPiston(
  code: string,
  stdin: string | undefined,
  start: number
): Promise<Response> {
  try {
    const res = await fetch(`${PISTON_URL}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: "java",
        version: "*",
        files: [{ name: "JavaLabRunner.java", content: code }],
        stdin: stdin ?? "",
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      throw new Error(`Piston API error: ${res.status}`)
    }

    const data = await res.json()
    const { stdout, stderr, code: exitCode } = data.run
    const durationMs = Date.now() - start
    logger.info("java/run success (piston)", { durationMs, exitCode })
    return Response.json({ stdout, stderr, exitCode, durationMs })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    logger.error("java/run piston failed", { message })
    return Response.json(
      { stdout: "", stderr: `Remote runner error: ${message}`, exitCode: 1, durationMs: Date.now() - start },
      { status: 500 }
    )
  }
}

async function runWithLocalJdk(
  code: string,
  stdin: string | undefined,
  start: number
): Promise<Response> {
  await mkdir(TMP_DIR, { recursive: true })

  const id = randomUUID().replace(/-/g, "")
  const className = `JavaLabRunner_${id}`
  const srcFile = path.join(TMP_DIR, `${className}.java`)

  // Replace the public class name so javac accepts the file
  const src = code.replace(/public\s+class\s+JavaLabRunner\b/g, `public class ${className}`)
  await writeFile(srcFile, src, "utf8")

  try {
    await execPromise(`javac ${srcFile} -d ${TMP_DIR}`, TIMEOUT_MS)

    const { stdout, stderr } = await execPromise(
      `java -cp ${TMP_DIR} -Xmx64m -Xss512k ${className}`,
      TIMEOUT_MS,
      stdin
    )

    const durationMs = Date.now() - start
    logger.info("java/run success", { durationMs, exitCode: 0 })
    return Response.json({ stdout, stderr, exitCode: 0, durationMs })
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number; message?: string; killed?: boolean }
    const isTimeout = e.killed === true
    const stderr = isTimeout
      ? `Execution timed out after ${TIMEOUT_MS}ms`
      : (e.stderr ?? e.message ?? "Unknown error")
    const durationMs = Date.now() - start

    logger.error("java/run failed", { exitCode: e.code ?? 1, isTimeout, stderr: stderr.slice(0, 300) })
    return Response.json({ stdout: e.stdout ?? "", stderr, exitCode: e.code ?? 1, durationMs })
  } finally {
    unlink(srcFile).catch(() => {})
    unlink(path.join(TMP_DIR, `${className}.class`)).catch(() => {})
  }
}

export async function POST(req: Request) {
  const { code, stdin } = await req.json()

  if (!code || typeof code !== "string") {
    return Response.json({ error: "Missing code" }, { status: 400 })
  }

  const start = Date.now()

  // On Vercel, javac/java are not available — use Piston API instead
  if (process.env.VERCEL) {
    return runWithPiston(code, stdin, start)
  }

  return runWithLocalJdk(code, stdin, start)
}
