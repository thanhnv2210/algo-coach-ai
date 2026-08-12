"use client"

import { cn } from "@/lib/utils/cn"

export interface RunResult {
  stdout: string
  stderr: string
  exitCode: number
  durationMs: number
}

interface OutputPanelProps {
  result: RunResult | null
  isRunning: boolean
}

export function OutputPanel({ result, isRunning }: OutputPanelProps) {
  const isEmpty = !result && !isRunning

  return (
    <div className="rounded-lg border border-border bg-[#1e1e1e] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-[#252526]">
        <span className="text-xs font-medium text-muted-foreground">Output</span>
        {result && (
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-xs font-mono px-2 py-0.5 rounded",
                result.exitCode === 0
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-500"
              )}
            >
              exit {result.exitCode}
            </span>
            <span className="text-xs text-faint">{result.durationMs}ms</span>
          </div>
        )}
      </div>

      <div className="px-4 py-3 min-h-[80px] max-h-[180px] overflow-y-auto">
        {isRunning && (
          <p className="text-xs text-muted-foreground animate-pulse">Running…</p>
        )}

        {isEmpty && (
          <p className="text-xs text-faint">Click Run to execute the code.</p>
        )}

        {result && !isRunning && (
          <pre className="text-xs font-mono whitespace-pre-wrap leading-relaxed">
            {result.stdout && (
              <span className="text-foreground">{result.stdout}</span>
            )}
            {result.stderr && (
              <span className="text-red-400">{result.stderr}</span>
            )}
            {!result.stdout && !result.stderr && (
              <span className="text-faint">(no output)</span>
            )}
          </pre>
        )}
      </div>
    </div>
  )
}
