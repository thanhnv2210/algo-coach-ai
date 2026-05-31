import type { Pattern } from "@/lib/content/types"

export function PatternChips({ patterns }: { patterns: Pattern[] }) {
  return (
    <div className="space-y-2">
      {patterns.map((p) => (
        <div key={p.name} className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
            {p.name}
          </span>
          <span className="text-sm text-muted-foreground leading-relaxed">{p.description}</span>
        </div>
      ))}
    </div>
  )
}
