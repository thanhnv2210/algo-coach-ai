import { getStarredLessons } from "@/services/java-lab.service"
import { CriticalClient } from "./critical-client"

export const dynamic = "force-dynamic"
export const metadata = { title: "Critical Topics — AlgoCoach AI" }

export default async function CriticalPage() {
  const starred = await getStarredLessons()
  return <CriticalClient starred={starred} />
}
