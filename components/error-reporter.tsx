"use client"

import { useEffect } from "react"

async function logError(payload: Record<string, unknown>) {
  try {
    await fetch("/api/log/client-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // keepalive: true ensures the request completes even if the page unloads
      keepalive: true,
      body: JSON.stringify({
        ...payload,
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    })
  } catch {
    // Silently swallow — logging must never break the app
  }
}

export function ErrorReporter() {
  useEffect(() => {
    // Catch synchronous JS errors
    function onError(event: ErrorEvent) {
      logError({
        message: event.message,
        stack: event.error?.stack,
        errorType: "onerror",
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      })
    }

    // Catch unhandled Promise rejections
    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = event.reason
      logError({
        message: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        errorType: "unhandledrejection",
      })
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onUnhandledRejection)

    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onUnhandledRejection)
    }
  }, [])

  return null
}
