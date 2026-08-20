import { notFound } from "next/navigation"
import { readFileSync } from "fs"
import { join } from "path"
import { getCategoryBySlug, getLessonBySlug } from "@/lib/content/java-lab"
import { getLessonProgress } from "@/services/java-lab.service"
import { LessonLayout } from "@/components/java-lab/LessonLayout"

interface Props {
  params: Promise<{ category: string; lesson: string }>
}

export async function generateMetadata({ params }: Props) {
  const { category: categorySlug, lesson: lessonSlug } = await params
  const lesson = getLessonBySlug(categorySlug, lessonSlug)
  return { title: lesson ? `${lesson.title} — Java Lab` : "Java Lab" }
}

function readLessonMarkdown(categorySlug: string, lessonSlug: string): string | null {
  try {
    const filePath = join(process.cwd(), "lib/content/java-lab", categorySlug, `${lessonSlug}.md`)
    return readFileSync(filePath, "utf8")
  } catch {
    return null
  }
}

export default async function LessonPage({ params }: Props) {
  const { category: categorySlug, lesson: lessonSlug } = await params

  const category = getCategoryBySlug(categorySlug)
  if (!category) notFound()

  const lesson = getLessonBySlug(categorySlug, lessonSlug)
  if (!lesson) notFound()

  const [markdownContent, progressRow] = await Promise.all([
    Promise.resolve(
      readLessonMarkdown(categorySlug, lessonSlug) ??
        `# ${lesson.title}\n\nLesson content coming soon.`
    ),
    getLessonProgress(categorySlug, lessonSlug),
  ])

  const initialStatus = (progressRow?.status ?? "not_started") as "not_started" | "in_progress" | "done"
  const initialStarred = progressRow?.starred === 1

  return (
    <div className="flex flex-col h-full">
      <LessonLayout
        category={category}
        lesson={lesson}
        markdownContent={markdownContent}
        initialStatus={initialStatus}
        initialStarred={initialStarred}
      />
    </div>
  )
}
