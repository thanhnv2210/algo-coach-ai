"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Global Error]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white px-4 text-center">
        <h2 className="text-xl font-semibold mb-2">Application error</h2>
        <p className="text-sm text-neutral-400 mb-4 max-w-sm">
          {error.message || "A critical error occurred. Please reload the page."}
        </p>
        {error.digest && (
          <p className="text-xs text-neutral-600 font-mono mb-4">ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 rounded-md text-sm font-medium bg-yellow-500 text-black hover:bg-yellow-400 transition-colors"
        >
          Reload
        </button>
      </body>
    </html>
  )
}
