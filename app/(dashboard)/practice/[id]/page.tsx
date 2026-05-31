import { notFound } from "next/navigation"
import { getQuestionById } from "@/services/question.service"
import { PracticeShell } from "@/components/practice/practice-shell"

export const dynamic = "force-dynamic"

export default async function PracticePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const question = await getQuestionById(id)
  if (!question) notFound()

  return <PracticeShell question={question} />
}
