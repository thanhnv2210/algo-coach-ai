import type { CodeExample } from "@/lib/content/types"

export function CodeBlock({ example }: { example: CodeExample }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-subtle border-b border-border">
        <span className="text-xs text-muted-foreground font-medium">{example.label}</span>
        <span className="text-xs text-faint font-mono">{example.language}</span>
      </div>
      <pre className="overflow-x-auto p-4 bg-[#0d1117] text-sm leading-relaxed">
        <code className="font-mono text-[#e6edf3]">{example.code}</code>
      </pre>
    </div>
  )
}
