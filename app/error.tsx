"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    const payload = {
      message: error.message,
      stack: error.stack,
      errorType: "react-boundary",
      extra: { digest: error.digest },
    }
    console.error("[App Error]", payload)
    fetch("/api/log/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        ...payload,
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {})
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-4">
        <AlertTriangle className="size-6 text-red-400" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-1">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      {error.digest && (
        <p className="text-xs text-faint font-mono mb-4">Error ID: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
      >
        <RefreshCw className="size-3.5" />
        Try again
      </button>
    </div>
  )
}
