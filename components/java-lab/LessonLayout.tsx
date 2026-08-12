"use client"

import { useState } from "react"
import { LessonContent } from "./LessonContent"
import { LessonNav } from "./LessonNav"
import { CodeEditor } from "./CodeEditor"
import { RunButton } from "./RunButton"
import { OutputPanel, type RunResult } from "./OutputPanel"
import { type JavaCategory, type JavaLesson } from "@/lib/content/java-lab"

interface LessonLayoutProps {
  category: JavaCategory
  lesson: JavaLesson
  markdownContent: string
}

export function LessonLayout({ category, lesson, markdownContent }: LessonLayoutProps) {
  const [code, setCode] = useState(lesson.defaultCode)
  const [result, setResult] = useState<RunResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)

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

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: lesson nav sidebar */}
      <LessonNav category={category} currentLesson={lesson} />

      {/* Right: two-pane content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Lesson doc — left pane */}
        <div className="flex flex-col w-1/2 border-r border-border overflow-y-auto">
          <div className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">{category.title}</span>
              <span className="text-faint text-xs">/</span>
              <span className="text-xs text-muted-foreground">Lesson {lesson.order}</span>
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
