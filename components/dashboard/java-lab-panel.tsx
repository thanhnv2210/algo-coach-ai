import Link from "next/link"
import { FlaskConical } from "lucide-react"
import { cn } from "@/lib/utils/cn"

type CategoryStat = {
  slug: string
  title: string
  done: number
  total: number
  pct: number
}

export function JavaLabPanel({ categories }: { categories: CategoryStat[] }) {
  const totalDone = categories.reduce((s, c) => s + c.done, 0)
  const totalLessons = categories.reduce((s, c) => s + c.total, 0)
  const overallPct = totalLessons > 0 ? Math.round((totalDone / totalLessons) * 100) : 0

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Java Lab</h2>
        </div>
        <Link href="/java-lab" className="text-xs text-primary hover:underline underline-offset-2">
          Open →
        </Link>
      </div>

      {/* Overall summary */}
      <div className="flex items-end justify-between mb-3">
        <span className="text-2xl font-bold text-foreground">{totalDone}<span className="text-sm font-normal text-muted-foreground">/{totalLessons}</span></span>
        <span className="text-xs text-muted-foreground">{overallPct}% complete</span>
      </div>
      <div className="h-1.5 rounded-full bg-subtle overflow-hidden mb-5">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${overallPct}%` }} />
      </div>

      {/* Per-category rows */}
      <div className="space-y-2.5">
        {categories.map((cat) => (
          <div key={cat.slug}>
            <div className="flex items-center justify-between mb-1">
              <Link href={`/java-lab/${cat.slug}/${getFirstLesson(cat.slug)}`} className="text-xs text-foreground hover:text-primary transition-colors truncate max-w-[160px]">
                {cat.title}
              </Link>
              <span className="text-xs text-muted-foreground shrink-0 ml-2">{cat.done}/{cat.total}</span>
            </div>
            <div className="h-1 rounded-full bg-subtle overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", cat.pct === 100 ? "bg-primary" : "bg-primary/50")}
                style={{ width: `${cat.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Maps category slug to its first lesson slug for direct linking
const FIRST_LESSONS: Record<string, string> = {
  "core-java":          "01-object-model",
  "collections":        "01-arraylist-vs-linkedlist",
  "streams":            "01-lambda-basics",
  "concurrency":        "01-thread-lifecycle",
  "jvm":                "01-jvm-architecture",
  "design-patterns":    "01-singleton",
  "spring":             "01-dependency-injection",
  "interview-patterns": "01-two-pointers",
}

function getFirstLesson(slug: string) {
  return FIRST_LESSONS[slug] ?? "01"
}
