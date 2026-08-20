"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, Clock, Sparkles, ChevronLeft, Code2, EyeOff, Star } from "lucide-react"
import { LessonContent } from "./LessonContent"
import { LessonNav } from "./LessonNav"
import { CodeEditor } from "./CodeEditor"
import { RunButton } from "./RunButton"
import { OutputPanel, type RunResult } from "./OutputPanel"
import { ExplainPanel } from "./ExplainPanel"
import { type JavaCategory, type JavaLesson } from "@/lib/content/java-lab"
import { cn } from "@/lib/utils/cn"
import { useTheme } from "@/components/theme-provider"

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
  initialStarred?: boolean
}

export function LessonLayout({ category, lesson, markdownContent, initialStatus = "not_started", initialStarred = false }: LessonLayoutProps) {
  const [code, setCode] = useState(lesson.defaultCode)
  const [result, setResult] = useState<RunResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState<LessonStatus>(initialStatus)
  const [isSaving, setIsSaving] = useState(false)
  const [starred, setStarred] = useState(initialStarred)
  const [isStarring, setIsStarring] = useState(false)
  const [showExplain, setShowExplain] = useState(false)
  const [explanation, setExplanation] = useState("")
  const [isExplaining, setIsExplaining] = useState(false)
  const { showEditor, setShowEditor } = useTheme()

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

  async function toggleStar() {
    setIsStarring(true)
    try {
      const res = await fetch("/api/java/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categorySlug: category.slug, lessonSlug: lesson.slug }),
      })
      const data = await res.json()
      setStarred(data.starred)
    } finally {
      setIsStarring(false)
    }
  }

  async function handleExplain() {
    setShowExplain(true)
    setExplanation("")
    setIsExplaining(true)
    try {
      const res = await fetch("/api/java/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, lessonTitle: lesson.title }),
      })
      if (!res.ok || !res.body) throw new Error("Stream failed")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setExplanation((prev) => prev + chunk)
      }
    } catch (err) {
      setExplanation("Failed to get explanation. Please try again.")
    } finally {
      setIsExplaining(false)
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
    <div className="flex h-full">
      {/* Lesson nav sidebar — desktop only */}
      <LessonNav category={category} currentLesson={lesson} currentStatus={status} />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile breadcrumb — hidden on lg+ (sidebar handles navigation there) */}
        <div className="flex lg:hidden items-center gap-2 px-4 py-2 border-b border-border bg-card shrink-0 text-xs">
          <Link
            href="/java-lab"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-3" />
            Java Lab
          </Link>
          <span className="text-faint">/</span>
          <span className="text-muted-foreground truncate">{category.title}</span>
          <span className="text-faint">/</span>
          <span className="text-foreground font-medium truncate">{lesson.title}</span>
        </div>

        {/* Two-pane content — stacked on mobile, side-by-side on lg+ */}
        <div className="flex flex-col lg:flex-row flex-1">
        {/* Lesson doc — left pane */}
        <div className={cn(
          "flex flex-col border-b lg:border-b-0 lg:border-r border-border overflow-y-auto",
          showEditor ? "w-full lg:w-1/2" : "w-full"
        )}>
          <div className="px-4 md:px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{category.title}</span>
                <span className="text-faint text-xs">/</span>
                <span className="text-xs text-muted-foreground">Lesson {lesson.order}</span>
              </div>
              {/* Status + editor toggle */}
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
                <button
                  onClick={toggleStar}
                  disabled={isStarring}
                  title={starred ? "Remove from Critical" : "Mark as Critical"}
                  className={cn(
                    "ml-2 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors",
                    starred
                      ? "border-yellow-500/60 text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/20"
                      : "border-border text-muted-foreground hover:text-yellow-500 hover:border-yellow-500/40 hover:bg-yellow-500/5"
                  )}
                >
                  <Star className={cn("size-3", starred && "fill-yellow-500")} />
                  {starred ? "Critical" : "Mark critical"}
                </button>
                <button
                  onClick={() => setShowEditor(!showEditor)}
                  title={showEditor ? "Hide editor" : "Show editor"}
                  className={cn(
                    "ml-2 flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-colors",
                    showEditor
                      ? "border-border text-muted-foreground hover:text-foreground hover:bg-subtle"
                      : "border-primary/40 text-primary bg-primary/10 hover:bg-primary/20"
                  )}
                >
                  {showEditor ? <EyeOff className="size-3" /> : <Code2 className="size-3" />}
                  {showEditor ? "Hide code" : "Show code"}
                </button>
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
        <div className={cn("flex flex-col w-full lg:w-1/2", !showEditor && "hidden")}>
          <div className="flex-1 flex flex-col gap-3 p-4 overflow-y-auto">
            <CodeEditor value={code} onChange={setCode} height="300px" />

            <div className="flex items-center justify-between">
              <span className="text-xs text-faint">All classes must be named JavaLabRunner</span>
              <RunButton onClick={handleRun} isRunning={isRunning} />
            </div>

            <OutputPanel result={result} isRunning={isRunning} />

            {/* AI Explain */}
            {showExplain ? (
              <ExplainPanel
                content={explanation}
                isStreaming={isExplaining}
                onClose={() => { setShowExplain(false); setExplanation("") }}
              />
            ) : (
              <button
                onClick={handleExplain}
                disabled={isExplaining}
                className={cn(
                  "flex items-center gap-2 self-end px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  "border border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <Sparkles className="size-3.5" />
                Explain with AI
              </button>
            )}
          </div>
        </div>
        </div>{/* end two-pane flex row */}
      </div>{/* end main content area */}
    </div>
  )
}
