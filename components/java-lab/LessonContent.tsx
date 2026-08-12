"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils/cn"

interface LessonContentProps {
  content: string
}

export function LessonContent({ content }: LessonContentProps) {
  return (
    <div className="prose prose-sm prose-invert max-w-none px-6 py-5 overflow-y-auto flex-1 text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-foreground mb-4 pb-2 border-b border-border">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold text-foreground mt-6 mb-3">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-foreground mt-4 mb-2">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-3 text-sm text-muted-foreground">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-3 text-sm text-muted-foreground">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-")
            if (isBlock) {
              return (
                <code className="block bg-muted/50 rounded-md px-4 py-3 text-xs font-mono text-foreground overflow-x-auto whitespace-pre">
                  {children}
                </code>
              )
            }
            return (
              <code className="bg-muted/50 rounded px-1.5 py-0.5 text-xs font-mono text-yellow-400">
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="bg-muted/50 rounded-lg border border-border mb-4 overflow-x-auto">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary pl-4 italic text-sm text-muted-foreground my-3">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border px-3 py-1.5 text-left font-semibold text-foreground bg-muted/30">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-1.5 text-muted-foreground">{children}</td>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="border-border my-4" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
