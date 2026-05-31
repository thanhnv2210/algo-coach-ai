"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Play, Loader2, BrainCircuit } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { CodeEditor } from "./code-editor"
import type { Question } from "@/lib/db/schema"

// ─── Language config ──────────────────────────────────────────────────────────

type Language = "python" | "javascript" | "typescript"

const LANGUAGES: { value: Language; label: string; judgeId: number; monacoLang: string }[] = [
  { value: "python",     label: "Python 3",   judgeId: 71, monacoLang: "python" },
  { value: "javascript", label: "JavaScript", judgeId: 63, monacoLang: "javascript" },
  { value: "typescript", label: "TypeScript", judgeId: 74, monacoLang: "typescript" },
]

const STARTER: Record<Language, string> = {
  python: `def solution():
    # Write your solution here
    pass


# Test your solution below
print(solution())
`,
  javascript: `function solution() {
    // Write your solution here
}

// Test your solution below
console.log(solution());
`,
  typescript: `function solution(): void {
    // Write your solution here
}

// Test your solution below
console.log(solution());
`,
}

// ─── Types ────────────────────────────────────────────────────────────────────

type RunResult = {
  stdout: string | null
  stderr: string | null
  compileOutput: string | null
  status: string
  statusId: number
  time: string | null
  memory: number | null
}

type ReviewResult = {
  verdict: string
  timeComplexity: string
  spaceComplexity: string
  correctness: string
  issues: string[]
  improvements: string[]
  summary: string
}

const VERDICT_STYLE: Record<string, string> = {
  looks_correct:  "text-green-400",
  has_issues:     "text-yellow-400",
  needs_testing:  "text-muted-foreground",
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PracticeShell({ question }: { question: Question }) {
  const [lang, setLang] = useState<Language>("python")
  const [code, setCode] = useState(STARTER["python"])
  const [runResult, setRunResult] = useState<RunResult | null>(null)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [review, setReview] = useState<ReviewResult | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [tab, setTab] = useState<"output" | "review">("output")

  function handleLangChange(l: Language) {
    setLang(l)
    setCode(STARTER[l])
    setRunResult(null)
    setReview(null)
  }

  async function handleRun() {
    setRunning(true)
    setRunError(null)
    setTab("output")
    try {
      const langConfig = LANGUAGES.find((l) => l.value === lang)!
      const res = await fetch("/api/code/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, languageId: langConfig.judgeId }),
      })
      const data = await res.json()
      if (!res.ok) { setRunError(data.error ?? "Execution failed"); return }
      setRunResult(data)
    } catch {
      setRunError("Could not reach execution service.")
    } finally {
      setRunning(false)
    }
  }

  async function handleReview() {
    setReviewing(true)
    setReviewError(null)
    setTab("review")
    try {
      const langConfig = LANGUAGES.find((l) => l.value === lang)!
      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: langConfig.label,
          questionTitle: question.title,
          questionNotes: question.notes ?? "",
        }),
      })
      const data = await res.json()
      if (!res.ok) { setReviewError(data.error ?? "Review failed"); return }
      setReview(data)
    } catch {
      setReviewError("Could not generate review.")
    } finally {
      setReviewing(false)
    }
  }

  const statusColor =
    runResult?.statusId === 3
      ? "text-green-400"
      : runResult?.statusId === 6
      ? "text-yellow-400"
      : "text-red-400"

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-card shrink-0">
        <Link
          href="/questions"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back
        </Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-foreground truncate">{question.title}</h1>
          <span className={cn("text-xs font-medium capitalize shrink-0",
            question.difficulty === "easy"   ? "text-green-400" :
            question.difficulty === "medium" ? "text-yellow-400" : "text-red-400"
          )}>
            {question.difficulty}
          </span>
        </div>
        <a
          href={question.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors shrink-0"
        >
          LeetCode <ExternalLink className="size-3" />
        </a>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Left — editor */}
        <div className="flex flex-col flex-1 min-w-0 border-r border-border">
          {/* Editor toolbar */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card/50 shrink-0">
            <div className="flex gap-1">
              {LANGUAGES.map((l) => (
                <button
                  key={l.value}
                  onClick={() => handleLangChange(l.value)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded font-medium transition-colors",
                    lang === l.value
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-subtle"
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <div className="ml-auto flex gap-2">
              <button
                onClick={handleRun}
                disabled={running}
                className="flex items-center gap-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
              >
                {running ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
                {running ? "Running…" : "Run"}
              </button>
              <button
                onClick={handleReview}
                disabled={reviewing}
                className="flex items-center gap-1.5 text-xs font-medium bg-card border border-border hover:bg-subtle text-foreground px-3 py-1.5 rounded transition-colors disabled:opacity-50"
              >
                {reviewing ? <Loader2 className="size-3 animate-spin" /> : <BrainCircuit className="size-3" />}
                {reviewing ? "Reviewing…" : "AI Review"}
              </button>
            </div>
          </div>

          {/* Monaco */}
          <div className="flex-1 min-h-0">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={LANGUAGES.find((l) => l.value === lang)!.monacoLang}
            />
          </div>
        </div>

        {/* Right — info + output/review */}
        <div className="w-96 shrink-0 flex flex-col min-h-0">
          {/* Problem notes */}
          {question.notes && (
            <div className="px-4 py-3 border-b border-border shrink-0">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Hints</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{question.notes}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-border shrink-0">
            {(["output", "review"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "flex-1 py-2 text-xs font-medium capitalize transition-colors",
                  tab === t
                    ? "text-foreground border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "output" ? "Output" : "AI Review"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4">
            {tab === "output" && (
              <div className="text-xs font-mono">
                {runError && <p className="text-red-400">{runError}</p>}
                {!runResult && !runError && !running && (
                  <p className="text-muted-foreground">Click Run to execute your code.</p>
                )}
                {running && <p className="text-muted-foreground">Running…</p>}
                {runResult && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-semibold", statusColor)}>{runResult.status}</span>
                      {runResult.time && (
                        <span className="text-muted-foreground">{runResult.time}s</span>
                      )}
                      {runResult.memory && (
                        <span className="text-muted-foreground">{Math.round(runResult.memory / 1024)}KB</span>
                      )}
                    </div>
                    {runResult.compileOutput && (
                      <div>
                        <p className="text-yellow-400 mb-1">Compilation Error</p>
                        <pre className="text-muted-foreground whitespace-pre-wrap">{runResult.compileOutput}</pre>
                      </div>
                    )}
                    {runResult.stdout && (
                      <div>
                        <p className="text-muted-foreground mb-1">stdout</p>
                        <pre className="text-foreground whitespace-pre-wrap">{runResult.stdout}</pre>
                      </div>
                    )}
                    {runResult.stderr && (
                      <div>
                        <p className="text-red-400 mb-1">stderr</p>
                        <pre className="text-red-400/80 whitespace-pre-wrap">{runResult.stderr}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === "review" && (
              <div className="text-xs space-y-4">
                {reviewError && <p className="text-red-400">{reviewError}</p>}
                {!review && !reviewError && !reviewing && (
                  <p className="text-muted-foreground">Click AI Review for a Claude analysis of your code.</p>
                )}
                {reviewing && <p className="text-muted-foreground">Analysing your code…</p>}
                {review && (
                  <>
                    <div>
                      <span className={cn("font-semibold capitalize", VERDICT_STYLE[review.verdict] ?? "text-foreground")}>
                        {review.verdict.replace(/_/g, " ")}
                      </span>
                    </div>

                    <p className="text-muted-foreground leading-relaxed">{review.summary}</p>

                    <div className="flex gap-4">
                      <div>
                        <p className="text-muted-foreground mb-0.5">Time</p>
                        <p className="font-mono text-foreground">{review.timeComplexity}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Space</p>
                        <p className="font-mono text-foreground">{review.spaceComplexity}</p>
                      </div>
                    </div>

                    <p className="text-muted-foreground leading-relaxed">{review.correctness}</p>

                    {review.issues.length > 0 && (
                      <div>
                        <p className="font-semibold text-foreground uppercase tracking-wider mb-1.5">Issues</p>
                        <ul className="space-y-1">
                          {review.issues.map((issue, i) => (
                            <li key={i} className="flex gap-1.5 text-muted-foreground">
                              <span className="text-red-400 shrink-0">•</span>{issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {review.improvements.length > 0 && (
                      <div>
                        <p className="font-semibold text-foreground uppercase tracking-wider mb-1.5">Improvements</p>
                        <ul className="space-y-1">
                          {review.improvements.map((imp, i) => (
                            <li key={i} className="flex gap-1.5 text-muted-foreground">
                              <span className="text-primary shrink-0">→</span>{imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
