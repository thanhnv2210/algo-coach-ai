import { NextRequest, NextResponse } from "next/server"
import { readFileSync } from "fs"
import { join } from "path"
import { getCategoryBySlug, getLessonBySlug } from "@/lib/content/java-lab"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categorySlug = searchParams.get("category")
  const lessonSlug = searchParams.get("lesson")

  if (!categorySlug || !lessonSlug) {
    return NextResponse.json({ error: "Missing category or lesson" }, { status: 400 })
  }

  const category = getCategoryBySlug(categorySlug)
  const lesson = getLessonBySlug(categorySlug, lessonSlug)
  if (!category || !lesson) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  let content: string
  try {
    const filePath = join(process.cwd(), "lib/content/java-lab", categorySlug, `${lessonSlug}.md`)
    content = readFileSync(filePath, "utf8")
  } catch {
    content = `# ${lesson.title}\n\nLesson content coming soon.`
  }

  return NextResponse.json({ content, lesson, category })
}
