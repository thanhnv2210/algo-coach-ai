"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

type TopicProgress = {
  name: string
  solved: number
  total: number
  percentage: number
}

export function ProgressChart({ data }: { data: TopicProgress[] }) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
        Progress by Topic
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 32 }}>
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value) => [`${value}%`, "Solved"]}
            contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 6, fontSize: 12 }}
            labelStyle={{ color: "#f3f4f6" }}
          />
          <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={entry.percentage === 100 ? "#eab308" : entry.percentage > 0 ? "#ca8a04" : "#374151"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
