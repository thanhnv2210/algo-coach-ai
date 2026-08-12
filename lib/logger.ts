import { appendFileSync } from "fs"
import { join } from "path"

const LOG_FILE = join(process.cwd(), "logs", "app.log")

type Level = "info" | "warn" | "error"

function write(level: Level, message: string, data?: unknown) {
  const line =
    JSON.stringify({
      ts: new Date().toISOString(),
      level,
      message,
      ...(data !== undefined ? { data } : {}),
    }) + "\n"

  // Also mirror to stdout so it shows in the terminal
  const prefix = level === "error" ? "✖" : level === "warn" ? "⚠" : "ℹ"
  console.log(`${prefix} [${level.toUpperCase()}] ${message}`, data ?? "")

  try {
    appendFileSync(LOG_FILE, line, "utf8")
  } catch {
    // If log dir doesn't exist yet, fail silently — don't crash the app
  }
}

export const logger = {
  info: (message: string, data?: unknown) => write("info", message, data),
  warn: (message: string, data?: unknown) => write("warn", message, data),
  error: (message: string, data?: unknown) => write("error", message, data),
}
