import type { ComplexityRow } from "@/lib/content/types"

export function ComplexityTable({ rows }: { rows: ComplexityRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-6 font-medium text-muted-foreground">Operation</th>
            <th className="text-left py-2 pr-6 font-medium text-muted-foreground">Time</th>
            <th className="text-left py-2 font-medium text-muted-foreground">Space</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.operation} className="border-b border-border/50 last:border-0">
              <td className="py-2 pr-6 text-foreground">{row.operation}</td>
              <td className="py-2 pr-6">
                <span className="font-mono text-sm bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                  {row.time}
                </span>
              </td>
              <td className="py-2">
                <span className="font-mono text-sm bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                  {row.space}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
