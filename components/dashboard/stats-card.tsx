import { cn } from "@/lib/utils/cn"

export function StatsCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: number | string
  sub?: string
  accent?: boolean
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold", accent ? "text-primary" : "text-foreground")}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
