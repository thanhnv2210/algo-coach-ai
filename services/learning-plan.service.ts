import { db } from "@/lib/db"
import { learningPlans } from "@/lib/db/schema"
import { desc } from "drizzle-orm"

export async function saveLatestPlan(plan: unknown) {
  await db.insert(learningPlans).values({ plan })
}

export async function getLatestPlan() {
  const [row] = await db
    .select()
    .from(learningPlans)
    .orderBy(desc(learningPlans.createdAt))
    .limit(1)
  return row ?? null
}
