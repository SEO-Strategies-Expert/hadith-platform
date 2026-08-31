import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { QuestionEditor } from "../../../QuestionEditor";
import { createQuestion } from "../../../actions";

export default async function NewQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const quiz = await prisma.quiz.findUnique({ where: { id }, select: { titleAr: true } });
  if (!quiz) notFound();

  return (
    <div>
      <PageHeader title="إضافة سؤال" desc={quiz.titleAr} />
      <Card className="max-w-4xl p-6">
        <ActionForm
          action={createQuestion.bind(null, id)}
          cancelHref={`/admin/quizzes/${id}/questions`}
        >
          <QuestionEditor />
        </ActionForm>
      </Card>
    </div>
  );
}
