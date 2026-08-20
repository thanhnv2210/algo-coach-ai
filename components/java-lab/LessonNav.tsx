"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Clock, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { JAVA_CURRICULUM, type JavaCategory, type JavaLesson } from "@/lib/content/java-lab"
import { cn } from "@/lib/utils/cn"
import { useTheme } from "@/components/theme-provider"

type LessonStatus = "not_started" | "in_progress" | "done"

interface LessonNavProps {
  category: JavaCategory
  currentLesson: JavaLesson
  currentStatus?: LessonStatus
}

export function LessonNav({ category, currentLesson, currentStatus = "not_started" }: LessonNavProps) {
  const pathname = usePathname()
  const { sidebarCollapsed, setSidebarCollapsed } = useTheme()

  const currentIndex = category.lessons.findIndex((l) => l.slug === currentLesson.slug)
  const prevLesson = currentIndex > 0 ? category.lessons[currentIndex - 1] : null
  const nextLesson = currentIndex < category.lessons.length - 1 ? category.lessons[currentIndex + 1] : null

  function StatusIcon({ slug }: { slug: string }) {
    const isActive = slug === currentLesson.slug
    if (isActive) {
      if (currentStatus === "done") return <CheckCircle2 className="size-3.5 text-green-500 shrink-0" />
      if (currentStatus === "in_progress") return <Clock className="size-3.5 text-yellow-500 shrink-0" />
    }
    return <Circle className="size-3.5 shrink-0 text-muted-foreground" />
  }

  return (
    <aside className={cn(
      "hidden lg:flex lg:flex-col shrink-0 border-r border-border h-full transition-all duration-200",
      sidebarCollapsed ? "w-10" : "w-56"
    )}>
      {sidebarCollapsed ? (
        /* Collapsed — show only toggle button */
        <div className="flex flex-col items-center py-3 gap-3">
          <button
            onClick={() => setSidebarCollapsed(false)}
            title="Expand sidebar"
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-subtle transition-colors"
          >
            <PanelLeftOpen className="size-4" />
          </button>
          {/* Current lesson indicator dots */}
          <div className="flex flex-col gap-1.5 mt-2">
            {category.lessons.map((lesson) => (
              <Link
                key={lesson.slug}
                href={`/java-lab/${category.slug}/${lesson.slug}`}
                title={lesson.title}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  lesson.slug === currentLesson.slug
                    ? "bg-primary"
                    : "bg-border hover:bg-muted-foreground"
                )}
              />
            ))}
          </div>
        </div>
      ) : (
        /* Expanded — full sidebar */
        <>
          {/* Category header */}
          <div className="px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center justify-between mb-2">
              <Link
                href="/java-lab"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="size-3" />
                Java Lab
              </Link>
              <button
                onClick={() => setSidebarCollapsed(true)}
                title="Collapse sidebar"
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-subtle transition-colors"
              >
                <PanelLeftClose className="size-3.5" />
              </button>
            </div>
            <h2 className="text-sm font-semibold text-foreground">{category.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{category.lessons.length} lessons</p>
          </div>

          {/* Lesson list */}
          <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
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
          <div className="border-t border-border px-3 py-3 space-y-1.5 shrink-0">
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
          <div className="border-t border-border px-3 py-3 shrink-0">
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
        </>
      )}
    </aside>
  )
}
