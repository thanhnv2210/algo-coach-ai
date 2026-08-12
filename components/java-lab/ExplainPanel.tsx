"use client"

import { useEffect, useRef } from "react"
import { Sparkles, X, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils/cn"

interface ExplainPanelProps {
  content: string
  isStreaming: boolean
  onClose: () => void
}

export function ExplainPanel({ content, isStreaming, onClose }: ExplainPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll as tokens stream in
  useEffect(() => {
    if (isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [content, isStreaming])

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-primary/20 bg-primary/10">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">AI Explanation</span>
          {isStreaming && (
            <Loader2 className="size-3 text-primary animate-spin" />
          )}
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3 max-h-80 overflow-y-auto text-sm">
        {content ? (
          <div className="prose prose-sm prose-invert max-w-none text-foreground">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="text-sm text-muted-foreground leading-relaxed mb-2">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2 text-sm text-muted-foreground">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2 text-sm text-muted-foreground">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                h1: ({ children }) => <h1 className="text-base font-semibold text-foreground mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-semibold text-foreground mt-3 mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold text-foreground mt-2 mb-1">{children}</h3>,
                code: ({ children, className }) => {
                  const isBlock = className?.includes("language-")
                  if (isBlock) {
                    return (
                      <code className="block bg-muted/50 rounded px-3 py-2 text-xs font-mono text-foreground overflow-x-auto whitespace-pre mb-2">
                        {children}
                      </code>
                    )
                  }
                  return (
                    <code className="bg-muted/50 rounded px-1 py-0.5 text-xs font-mono text-yellow-400">
                      {children}
                    </code>
                  )
                },
                pre: ({ children }) => <pre className="bg-transparent p-0 mb-2">{children}</pre>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-primary/40 pl-3 italic text-sm text-muted-foreground my-2">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
            <div ref={bottomRef} />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground animate-pulse">Thinking…</p>
        )}
      </div>
    </div>
  )
}
