"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { Star, CheckCircle2, Clock, Circle, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { LessonDrawer } from "@/components/java-lab/LessonDrawer"

type StarredItem = {
  category: { slug: string; title: string }
  lesson: { slug: string; title: string; difficulty: string }
  progress: { status?: string | null; starred: number }
}

const STATUS_CONFIG = {
  done:        { label: "Done",        icon: CheckCircle2, className: "text-green-500" },
  in_progress: { label: "In progress", icon: Clock,        className: "text-yellow-500" },
  not_started: { label: "Not started", icon: Circle,       className: "text-muted-foreground" },
} as const

type DrawerLesson = {
  categorySlug: string
  categoryTitle: string
  lessonSlug: string
  lessonTitle: string
  difficulty: string
}

export function CriticalClient({ starred }: { starred: StarredItem[] }) {
  const [drawerLesson, setDrawerLesson] = useState<DrawerLesson | null>(null)
  const closeDrawer = useCallback(() => setDrawerLesson(null), [])

  // Group by category
  const grouped = starred.reduce<Record<string, StarredItem[]>>((acc, item) => {
    const key = item.category.slug
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <>
      <div className="px-4 sm:px-6 md:px-8 py-6 md:py-8 max-w-3xl mx-auto">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Star className="size-5 text-yellow-500 fill-yellow-500" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Critical Topics</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {starred.length === 0
              ? "No lessons marked as critical yet. Open any Java Lab lesson and click \"Mark critical\"."
              : `${starred.length} lesson${starred.length === 1 ? "" : "s"} marked for focused review. Click to read inline or open full page.`}
          </p>
        </div>

        {starred.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Star className="size-10 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Star lessons you want to revisit before your interview.
            </p>
            <Link
              href="/java-lab"
              className="flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              Go to Java Lab <ArrowRight className="size-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([, items]) => {
              const category = items[0].category
              return (
                <div key={category.slug} className="bg-card border border-border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-muted/20">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {category.title}
                    </span>
                  </div>
                  <div className="divide-y divide-border/50">
                    {items.map(({ lesson, progress }) => {
                      const statusKey = (progress.status ?? "not_started") as keyof typeof STATUS_CONFIG
                      const { label, icon: StatusIcon, className: statusClass } = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.not_started
                      const isActive = drawerLesson?.lessonSlug === lesson.slug && drawerLesson?.categorySlug === category.slug

                      return (
                        <button
                          key={lesson.slug}
                          type="button"
                          style={{ touchAction: "manipulation" }}
                          onClick={() => setDrawerLesson({
                            categorySlug: category.slug,
                            categoryTitle: category.title,
                            lessonSlug: lesson.slug,
                            lessonTitle: lesson.title,
                            difficulty: lesson.difficulty,
                          })}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 transition-colors text-left group",
                            isActive ? "bg-primary/5" : "hover:bg-subtle"
                          )}
                        >
                          <Star className="size-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{lesson.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <StatusIcon className={cn("size-3", statusClass)} />
                              <span className={cn("text-xs", statusClass)}>{label}</span>
                              <span className="text-xs text-faint capitalize">{lesson.difficulty}</span>
                            </div>
                          </div>
                          <ArrowRight className={cn(
                            "size-4 shrink-0 transition-colors",
                            isActive ? "text-primary" : "text-faint group-hover:text-primary"
                          )} />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <LessonDrawer lesson={drawerLesson} onClose={closeDrawer} />
    </>
  )
}
