"use client"

import { useState } from "react"
import { cn } from "@/lib/utils/cn"

export function ConfidenceStars({
  slug,
  initial,
}: {
  slug: string
  initial: number
}) {
  const [level, setLevel] = useState(initial)
  const [hover, setHover] = useState(0)

  async function handleClick(e: React.MouseEvent, star: number) {
    e.preventDefault()
    e.stopPropagation()
    const next = level === star ? 0 : star // toggle off if clicking same star
    setLevel(next)
    await fetch(`/api/progress/${slug}/confidence`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level: next === 0 ? 1 : next }),
    })
  }

  return (
    <div className="flex items-center gap-0.5" onClick={(e) => e.preventDefault()}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onMouseEnter={(e) => { e.preventDefault(); setHover(star) }}
          onMouseLeave={(e) => { e.preventDefault(); setHover(0) }}
          onClick={(e) => handleClick(e, star)}
          className="leading-none"
          title={`Confidence: ${star}/5`}
        >
          <svg
            className={cn(
              "size-3 transition-colors",
              (hover || level) >= star ? "text-primary" : "text-faint/40"
            )}
            viewBox="0 0 12 12"
            fill="currentColor"
          >
            <path d="M6 1l1.24 2.51 2.76.4-2 1.95.47 2.75L6 7.27 3.53 8.61 4 5.86 2 3.91l2.76-.4z" />
          </svg>
        </button>
      ))}
    </div>
  )
}
