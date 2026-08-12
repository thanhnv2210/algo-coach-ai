"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Code2,
  Database,
  Zap,
  GitBranch,
  Cpu,
  Layers,
  Server,
  Trophy,
} from "lucide-react"
import { JAVA_CURRICULUM, type JavaCategory } from "@/lib/content/java-lab"
import { cn } from "@/lib/utils/cn"

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Code2,
  Database,
  Zap,
  GitBranch,
  Cpu,
  Layers,
  Server,
  Trophy,
}

type CategoryStats = { slug: string; total: number; done: number; pct: number }

function CategoryCard({
  category,
  stats,
}: {
  category: JavaCategory
  stats: CategoryStats | undefined
}) {
  const Icon = ICON_MAP[category.icon] ?? Code2
  const firstLesson = category.lessons[0]
  const pct = stats?.pct ?? 0
  const done = stats?.done ?? 0
  const total = stats?.total ?? category.lessons.length

  return (
    <Link
      href={firstLesson ? `/java-lab/${category.slug}/${firstLesson.slug}` : `/java-lab/${category.slug}`}
      className={cn(
        "group flex flex-col gap-3 rounded-xl border border-border bg-card p-5",
        "hover:border-primary/40 hover:bg-primary/5 transition-colors"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary group-hover:bg-primary/20 transition-colors">
            <Icon className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{category.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{total} lessons</p>
          </div>
        </div>
        {pct === 100 ? (
          <span className="text-xs font-medium text-green-500">Complete</span>
        ) : pct > 0 ? (
          <span className="text-xs text-muted-foreground">{done}/{total}</span>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{category.description}</p>

      {/* Progress bar */}
      <div className="w-full h-1 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            pct === 100 ? "bg-green-500" : "bg-primary"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </Link>
  )
}

export function CategoryGrid() {
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])

  useEffect(() => {
    fetch("/api/java/progress")
      .then((r) => r.json())
      .then((d) => setCategoryStats(d.categoryStats ?? []))
      .catch(() => {})
  }, [])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {JAVA_CURRICULUM.map((category) => (
        <CategoryCard
          key={category.slug}
          category={category}
          stats={categoryStats.find((s) => s.slug === category.slug)}
        />
      ))}
    </div>
  )
}
