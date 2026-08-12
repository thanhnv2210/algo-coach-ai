"use client"

import Editor from "@monaco-editor/react"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  height?: string
}

export function CodeEditor({ value, onChange, height = "260px" }: CodeEditorProps) {
  return (
    <div className="rounded-lg border border-border overflow-hidden bg-[#1e1e1e]">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-[#252526]">
        <div className="flex gap-1.5">
          <div className="size-3 rounded-full bg-red-500/70" />
          <div className="size-3 rounded-full bg-yellow-500/70" />
          <div className="size-3 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs text-muted-foreground font-mono ml-1">JavaLabRunner.java</span>
      </div>
      <Editor
        height={height}
        language="java"
        theme="vs-dark"
        value={value}
        onChange={(v) => onChange(v ?? "")}
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: "on",
          renderLineHighlight: "line",
          wordWrap: "on",
          tabSize: 4,
          padding: { top: 12, bottom: 12 },
          overviewRulerBorder: false,
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
        }}
      />
    </div>
  )
}
