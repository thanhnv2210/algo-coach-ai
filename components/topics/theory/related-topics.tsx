import Link from "next/link"
import { getAllTopics } from "@/lib/content"

export function RelatedTopics({ slugs }: { slugs: string[] }) {
  const all = getAllTopics()
  const related = slugs
    .map((slug) => all.find((t) => t.slug === slug))
    .filter(Boolean)

  if (related.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {related.map((topic) => (
        <Link
          key={topic!.slug}
          href={`/topics/${topic!.slug}`}
          className="text-sm px-3 py-1 rounded-full border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          {topic!.name}
        </Link>
      ))}
    </div>
  )
}
