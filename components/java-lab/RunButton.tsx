"use client"

import { Play, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface RunButtonProps {
  onClick: () => void
  isRunning: boolean
  disabled?: boolean
}

export function RunButton({ onClick, isRunning, disabled }: RunButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isRunning}
      className={cn(
        "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
    >
      {isRunning ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Running…
        </>
      ) : (
        <>
          <Play className="size-4 fill-current" />
          Run
        </>
      )}
    </button>
  )
}
