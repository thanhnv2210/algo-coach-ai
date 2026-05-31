export function KeyIdeasList({ ideas }: { ideas: string[] }) {
  return (
    <ul className="space-y-2">
      {ideas.map((idea, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
          <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
          <span className="leading-relaxed">{idea}</span>
        </li>
      ))}
    </ul>
  )
}
