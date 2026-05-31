import { db } from "@/lib/db"
import { activityLog } from "@/lib/db/schema"
import { sql, desc } from "drizzle-orm"

/** Record or increment today's activity. Call whenever a question status changes. */
export async function touchActivity() {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  await db
    .insert(activityLog)
    .values({ date: today, questionsTouched: 1 })
    .onConflictDoUpdate({
      target: activityLog.date,
      set: {
        questionsTouched: sql`${activityLog.questionsTouched} + 1`,
        updatedAt: sql`now()`,
      },
    })
}

/** Calculate consecutive-day streak ending today (or yesterday if nothing today yet). */
export async function getStreak(): Promise<number> {
  const rows = await db
    .select({ date: activityLog.date })
    .from(activityLog)
    .orderBy(desc(activityLog.date))
    .limit(365)

  if (rows.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Parse most recent date from DB string "YYYY-MM-DD"
  const mostRecent = new Date(rows[0].date + "T00:00:00")

  // Streak is dead if last activity was before yesterday
  if (mostRecent < yesterday) return 0

  let streak = 0
  let check = mostRecent

  for (const row of rows) {
    const d = new Date(row.date + "T00:00:00")
    if (d.getTime() === check.getTime()) {
      streak++
      check = new Date(check)
      check.setDate(check.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}
