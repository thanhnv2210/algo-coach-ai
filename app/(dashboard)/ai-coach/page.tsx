import { AIPanel } from "@/components/dashboard/ai-panel"

export default function AICoachPage() {
  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">AI Coach</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Claude analyses your current progress and builds a personalised weekly study plan targeting your weak areas.
        </p>
      </div>
      <AIPanel />
    </div>
  )
}
