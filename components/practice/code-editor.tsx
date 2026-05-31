"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#1e1e1e]">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  ),
})

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
}

export function CodeEditor({ value, onChange, language }: CodeEditorProps) {
  return (
    <MonacoEditor
      height="100%"
      language={language}
      value={value}
      theme="vs-dark"
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        lineNumbers: "on",
        folding: false,
        tabSize: 4,
        insertSpaces: true,
        automaticLayout: true,
        padding: { top: 12 },
      }}
      onChange={(v) => onChange(v ?? "")}
    />
  )
}
