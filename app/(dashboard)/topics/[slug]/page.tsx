import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getTopicBySlug } from "@/lib/content"
import { KeyIdeasList }  from "@/components/topics/theory/key-ideas-list"
import { ComplexityTable } from "@/components/topics/theory/complexity-table"
import { PatternChips }  from "@/components/topics/theory/pattern-chips"
import { CodeBlock }     from "@/components/topics/theory/code-block"
import { RelatedTopics } from "@/components/topics/theory/related-topics"
import { RelatedQuestions } from "@/components/topics/related-questions"
import { getQuestions } from "@/services/question.service"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const topic = getTopicBySlug(slug)
  if (!topic) return {}
  return { title: `${topic.name} — AlgoCoach AI` }
}

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const topic = getTopicBySlug(slug)
  if (!topic) notFound()

  const topicQuestions = await getQuestions({ topicSlug: slug })

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/topics"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="size-4" />
        Back to Topics
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{topic.name}</h1>
        <p className="mt-3 text-base text-muted-foreground leading-relaxed">
          {topic.description}
        </p>
      </div>

      <div className="space-y-10">
        {/* Key Ideas */}
        <section>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Key Ideas
          </h2>
          <KeyIdeasList ideas={topic.keyIdeas} />
        </section>

        {/* Complexity */}
        <section>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Complexity
          </h2>
          <ComplexityTable rows={topic.complexity} />
        </section>

        {/* Patterns */}
        <section>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Common Patterns
          </h2>
          <PatternChips patterns={topic.patterns} />
        </section>

        {/* Code Example */}
        <section>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
            Code Example
          </h2>
          <CodeBlock example={topic.codeExample} />
        </section>

        {/* Tips */}
        {topic.tips && (
          <section>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <span className="text-primary font-bold text-lg leading-none mt-0.5">💡</span>
              <p className="text-sm text-foreground leading-relaxed">{topic.tips}</p>
            </div>
          </section>
        )}

        {/* Practice Questions */}
        {topicQuestions.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Practice Questions
            </h2>
            <RelatedQuestions questions={topicQuestions} />
          </section>
        )}

        {/* Related */}
        {topic.relatedSlugs.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Related Topics
            </h2>
            <RelatedTopics slugs={topic.relatedSlugs} />
          </section>
        )}
      </div>
    </div>
  )
}
