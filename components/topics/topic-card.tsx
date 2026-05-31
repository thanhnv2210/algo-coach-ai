import Link from "next/link"
import { ChevronRight } from "lucide-react"
import type { TopicContent } from "@/lib/content/types"
import { cn } from "@/lib/utils/cn"
import { ConfidenceStars } from "./confidence-stars"

const categoryLabel: Record<TopicContent["category"], string> = {
  fundamentals:  "Fundamentals",
  advanced:      "Advanced",
  graphs_trees:  "Graphs & Trees",
}

const categoryColor: Record<TopicContent["category"], string> = {
  fundamentals: "bg-blue-500/10 text-blue-500",
  advanced:     "bg-purple-500/10 text-purple-500",
  graphs_trees: "bg-green-500/10 text-green-500",
}

type TopicProgress = {
  solvedCount: number
  totalCount: number
  confidenceLevel: number
}

export function TopicCard({
  topic,
  progress,
}: {
  topic: TopicContent
  progress?: TopicProgress
}) {
  const pct = progress && progress.totalCount > 0
    ? Math.round((progress.solvedCount / progress.totalCount) * 100)
    : 0

  return (
    <Link
      href={`/topics/${topic.slug}`}
      className="group flex flex-col gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground w-5 text-right">
            {String(topic.order).padStart(2, "0")}
          </span>
          <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
            {topic.name}
          </h3>
        </div>
        <ChevronRight className="size-4 text-faint group-hover:text-primary transition-colors shrink-0 mt-0.5" />
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 ml-7">
        {topic.description}
      </p>

      <div className="ml-7 flex items-center justify-between gap-2">
        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", categoryColor[topic.category])}>
          {categoryLabel[topic.category]}
        </span>

        {progress && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              {progress.solvedCount}/{progress.totalCount}
            </span>
            <ConfidenceStars slug={topic.slug} initial={progress.confidenceLevel} />
          </div>
        )}
      </div>

      {progress && progress.totalCount > 0 && (
        <div className="ml-7 h-1 rounded-full bg-subtle overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </Link>
  )
}
