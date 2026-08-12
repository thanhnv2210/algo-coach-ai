"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Clock } from "lucide-react"
import { JAVA_CURRICULUM, type JavaCategory, type JavaLesson } from "@/lib/content/java-lab"
import { cn } from "@/lib/utils/cn"

type LessonStatus = "not_started" | "in_progress" | "done"

interface LessonNavProps {
  category: JavaCategory
  currentLesson: JavaLesson
  currentStatus?: LessonStatus
}

export function LessonNav({ category, currentLesson, currentStatus = "not_started" }: LessonNavProps) {
  const pathname = usePathname()

  const currentIndex = category.lessons.findIndex((l) => l.slug === currentLesson.slug)
  const prevLesson = currentIndex > 0 ? category.lessons[currentIndex - 1] : null
  const nextLesson = currentIndex < category.lessons.length - 1 ? category.lessons[currentIndex + 1] : null

  function StatusIcon({ slug }: { slug: string }) {
    const isActive = slug === currentLesson.slug
    if (isActive) {
      if (currentStatus === "done") return <CheckCircle2 className="size-3.5 text-green-500 shrink-0" />
      if (currentStatus === "in_progress") return <Clock className="size-3.5 text-yellow-500 shrink-0" />
    }
    return <Circle className="size-3.5 shrink-0" />
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-border h-full overflow-y-auto">
      {/* Category header */}
      <div className="px-4 py-3 border-b border-border">
        <Link
          href="/java-lab"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ChevronLeft className="size-3" />
          Java Lab
        </Link>
        <h2 className="text-sm font-semibold text-foreground">{category.title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{category.lessons.length} lessons</p>
      </div>

      {/* Lesson list */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {category.lessons.map((lesson) => {
          const isActive = lesson.slug === currentLesson.slug
          return (
            <Link
              key={lesson.slug}
              href={`/java-lab/${category.slug}/${lesson.slug}`}
              className={cn(
                "flex items-start gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-subtle hover:text-foreground"
              )}
            >
              <div className="mt-0.5">
                <StatusIcon slug={lesson.slug} />
              </div>
              <span className="leading-snug">{lesson.title}</span>
            </Link>
          )
        })}
      </nav>

      {/* Prev / Next navigation */}
      <div className="border-t border-border px-3 py-3 space-y-1.5">
        {prevLesson ? (
          <Link
            href={`/java-lab/${category.slug}/${prevLesson.slug}`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-3" />
            <span className="truncate">{prevLesson.title}</span>
          </Link>
        ) : (
          <span className="text-xs text-faint">First lesson</span>
        )}

        {nextLesson ? (
          <Link
            href={`/java-lab/${category.slug}/${nextLesson.slug}`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="size-3" />
            <span className="truncate">{nextLesson.title}</span>
          </Link>
        ) : (
          <span className="text-xs text-faint">Last lesson</span>
        )}
      </div>

      {/* Other categories */}
      <div className="border-t border-border px-3 py-3">
        <p className="text-xs text-faint mb-2">Other categories</p>
        <div className="space-y-1">
          {JAVA_CURRICULUM.filter((c) => c.slug !== category.slug).map((c) => (
            <Link
              key={c.slug}
              href={`/java-lab/${c.slug}/${c.lessons[0]?.slug ?? ''}`}
              className="block text-xs text-muted-foreground hover:text-foreground transition-colors truncate py-0.5"
            >
              {c.title}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  )
}
