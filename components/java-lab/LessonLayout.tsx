"use client"

import { useState, useEffect, useCallback } from "react"
import { CheckCircle2, Circle, Clock } from "lucide-react"
import { LessonContent } from "./LessonContent"
import { LessonNav } from "./LessonNav"
import { CodeEditor } from "./CodeEditor"
import { RunButton } from "./RunButton"
import { OutputPanel, type RunResult } from "./OutputPanel"
import { type JavaCategory, type JavaLesson } from "@/lib/content/java-lab"
import { cn } from "@/lib/utils/cn"

type LessonStatus = "not_started" | "in_progress" | "done"

const STATUS_CONFIG: Record<LessonStatus, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  not_started: { label: "Not started", icon: Circle,        className: "text-muted-foreground" },
  in_progress:  { label: "In progress", icon: Clock,         className: "text-yellow-500" },
  done:         { label: "Done",        icon: CheckCircle2,  className: "text-green-500" },
}

interface LessonLayoutProps {
  category: JavaCategory
  lesson: JavaLesson
  markdownContent: string
  initialStatus?: LessonStatus
}

export function LessonLayout({ category, lesson, markdownContent, initialStatus = "not_started" }: LessonLayoutProps) {
  const [code, setCode] = useState(lesson.defaultCode)
  const [result, setResult] = useState<RunResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<LessonStatus>(initialStatus)
  const [isSaving, setIsSaving] = useState(false)

  // Mark as in_progress on first open (if not already done)
  useEffect(() => {
    if (initialStatus === "not_started") {
      saveStatus("in_progress")
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function saveStatus(next: LessonStatus) {
    setStatus(next)
    setIsSaving(true)
    try {
      await fetch("/api/java/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categorySlug: category.slug,
          lessonSlug: lesson.slug,
          status: next,
        }),
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRun() {
    setIsRunning(true)
    setResult(null)
    try {
      const res = await fetch("/api/java/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setResult({ stdout: "", stderr: String(err), exitCode: 1, durationMs: 0 })
    } finally {
      setIsRunning(false)
    }
  }

  const { label, icon: StatusIcon, className: statusClass } = STATUS_CONFIG[status]

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: lesson nav sidebar */}
      <LessonNav category={category} currentLesson={lesson} currentStatus={status} />

      {/* Right: two-pane content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Lesson doc — left pane */}
        <div className="flex flex-col w-1/2 border-r border-border overflow-y-auto">
          <div className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{category.title}</span>
                <span className="text-faint text-xs">/</span>
                <span className="text-xs text-muted-foreground">Lesson {lesson.order}</span>
              </div>
              {/* Status selector */}
              <div className="flex items-center gap-2">
                <StatusIcon className={cn("size-3.5", statusClass)} />
                <span className={cn("text-xs font-medium", statusClass)}>{label}</span>
                {status !== "done" && (
                  <button
                    onClick={() => saveStatus("done")}
                    disabled={isSaving}
                    className="text-xs text-green-500 hover:text-green-400 underline underline-offset-2 disabled:opacity-50 ml-1"
                  >
                    Mark done
                  </button>
                )}
                {status === "done" && (
                  <button
                    onClick={() => saveStatus("in_progress")}
                    disabled={isSaving}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 disabled:opacity-50 ml-1"
                  >
                    Undo
                  </button>
                )}
              </div>
            </div>
            <h1 className="text-lg font-semibold text-foreground">{lesson.title}</h1>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full capitalize">
                {lesson.difficulty}
              </span>
              {lesson.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs bg-muted/50 text-muted-foreground px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <LessonContent content={markdownContent} />
        </div>

        {/* Editor + output — right pane */}
        <div className="flex flex-col w-1/2 overflow-hidden">
          <div className="flex-1 flex flex-col gap-3 p-4 overflow-y-auto">
            <CodeEditor value={code} onChange={setCode} height="300px" />

            <div className="flex items-center justify-between">
              <span className="text-xs text-faint">All classes must be named JavaLabRunner</span>
              <RunButton onClick={handleRun} isRunning={isRunning} />
            </div>

            <OutputPanel result={result} isRunning={isRunning} />
          </div>
        </div>
      </div>
    </div>
  )
}
