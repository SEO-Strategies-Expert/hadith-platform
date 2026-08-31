import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { QuestionEditor } from "../../../QuestionEditor";
import { updateQuestion } from "../../../actions";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string; questionId: string }>;
}) {
  await requireUser();
  const { id, questionId } = await params;

  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { choices: { orderBy: { order: "asc" } }, quiz: { select: { id: true, titleAr: true } } },
  });
  // انتماء السؤال للاختبار: لئلّا يفتح رابطٌ ملفَّق سؤالًا من اختبار آخر.
  if (!question || question.quiz.id !== id) notFound();

  return (
    <div>
      <PageHeader title="تعديل السؤال" desc={`${question.quiz.titleAr} — ${question.textAr}`} />
      <Card className="max-w-4xl p-6">
        <ActionForm
          action={updateQuestion.bind(null, id, questionId)}
          cancelHref={`/admin/quizzes/${id}/questions`}
        >
          <QuestionEditor record={question} choices={question.choices} />
        </ActionForm>
      </Card>
    </div>
  );
}
