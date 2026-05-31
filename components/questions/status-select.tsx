"use client"

import { useState } from "react"
import { cn } from "@/lib/utils/cn"
import { STATUS_CONFIG } from "./status-badge"
import type { QuestionStatus } from "@/lib/db/schema"

const STATUSES = Object.keys(STATUS_CONFIG) as QuestionStatus[]

export function StatusSelect({
  id,
  current,
  onChange,
}: {
  id: string
  current: QuestionStatus
  onChange: (id: string, status: QuestionStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const config = STATUS_CONFIG[current]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-opacity hover:opacity-80",
          config.className
        )}
      >
        {config.label}
        <svg className="size-3" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-card border border-border rounded-md shadow-lg py-1 min-w-[140px]">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => { onChange(id, s); setOpen(false) }}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs hover:bg-subtle transition-colors flex items-center gap-2",
                  s === current && "text-primary"
                )}
              >
                <span className={cn("inline-flex px-1.5 py-0.5 rounded text-xs font-medium", STATUS_CONFIG[s].className)}>
                  {STATUS_CONFIG[s].label}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
