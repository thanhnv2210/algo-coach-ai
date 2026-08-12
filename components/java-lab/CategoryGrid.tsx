"use client"

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

const DIFFICULTY_COLORS: Record<string, string> = {
  foundational: "text-green-500",
  intermediate: "text-yellow-500",
  advanced: "text-red-500",
}

function CategoryCard({ category }: { category: JavaCategory }) {
  const Icon = ICON_MAP[category.icon] ?? Code2
  const firstLesson = category.lessons[0]

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
            <p className="text-xs text-muted-foreground mt-0.5">{category.lessons.length} lessons</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{category.description}</p>

      {firstLesson && (
        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-border">
          <span className={cn("text-xs font-medium capitalize", DIFFICULTY_COLORS[firstLesson.difficulty])}>
            {firstLesson.difficulty}
          </span>
          <span className="text-faint text-xs">· Start with {firstLesson.title}</span>
        </div>
      )}
    </Link>
  )
}

export function CategoryGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {JAVA_CURRICULUM.map((category) => (
        <CategoryCard key={category.slug} category={category} />
      ))}
    </div>
  )
}
