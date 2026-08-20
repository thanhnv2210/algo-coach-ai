"use client"

import { useEffect, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { X, ExternalLink, Loader2 } from "lucide-react"
import { LessonContent } from "./LessonContent"
import { cn } from "@/lib/utils/cn"

interface DrawerLesson {
  categorySlug: string
  categoryTitle: string
  lessonSlug: string
  lessonTitle: string
  difficulty: string
}

interface LessonDrawerProps {
  lesson: DrawerLesson | null
  onClose: () => void
}

export function LessonDrawer({ lesson, onClose }: LessonDrawerProps) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Close on Escape
  useEffect(() => {
    if (!lesson) return
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lesson, onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = lesson ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [lesson])

  // Fetch content when lesson changes
  useEffect(() => {
    if (!lesson) { setContent(null); return }
    setLoading(true)
    setContent(null)
    fetch(`/api/java/lesson?category=${lesson.categorySlug}&lesson=${lesson.lessonSlug}`)
      .then(r => r.json())
      .then(data => setContent(data.content))
      .catch(() => setContent("Failed to load content."))
      .finally(() => setLoading(false))
  }, [lesson?.categorySlug, lesson?.lessonSlug])

  const open = !!lesson

  if (!mounted) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 transition-opacity duration-200 z-40",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden
      />

      {/* Drawer — slides in from the right */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Lesson content"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex flex-col bg-card border-l border-border",
          "w-full sm:w-[600px] lg:w-[700px] xl:w-[900px] 2xl:w-[1100px]",
          "transition-transform duration-250 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <p className="text-xs text-muted-foreground mb-0.5">{lesson?.categoryTitle}</p>
            <h2 className="text-sm font-semibold text-foreground leading-snug">{lesson?.lessonTitle}</h2>
            {lesson && (
              <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                {lesson.difficulty}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {lesson && (
              <Link
                href={`/java-lab/${lesson.categorySlug}/${lesson.lessonSlug}`}
                title="Open full lesson"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded border border-border hover:border-primary/40"
              >
                <ExternalLink className="size-3" />
                Full page
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{ touchAction: "manipulation" }}
              className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-subtle transition-colors"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}
          {!loading && content && <LessonContent content={content} />}
        </div>
      </div>
    </>,
    document.body
  )
}
