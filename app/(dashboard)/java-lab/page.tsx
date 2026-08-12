import { BookOpen } from "lucide-react"
import { CategoryGrid } from "@/components/java-lab/CategoryGrid"

export const metadata = {
  title: "Java Lab — AlgoCoach AI",
}

export default function JavaLabPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-primary/10 p-3 text-primary">
          <BookOpen className="size-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Java Lab</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Senior-level Java lessons with a live code editor. Built for interview preparation, not beginner tutorials.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>8 categories</span>
        <span>·</span>
        <span>58 lessons</span>
        <span>·</span>
        <span>Run Java code in the browser</span>
      </div>

      <CategoryGrid />
    </div>
  )
}
