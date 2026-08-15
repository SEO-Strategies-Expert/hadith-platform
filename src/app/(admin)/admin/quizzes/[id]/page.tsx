import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { withRelationOptions } from "@/lib/resource-options";
import { quizFields } from "../fields";
import { updateQuiz } from "../actions";

// في Next 16 يصل `params` وعدًا يجب انتظاره.
export default async function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { _count: { select: { questions: true, attempts: true } } },
  });
  if (!quiz) notFound();

  const fields = await withRelationOptions(quizFields);

  return (
    <div>
      <PageHeader title="تعديل الاختبار" desc={quiz.titleAr} />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/quizzes"
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          كل الاختبارات ←
        </Link>
        <Link
          href={`/admin/quizzes/${id}/questions`}
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          الأسئلة ({quiz._count.questions}) ←
        </Link>
      </div>

      {quiz._count.attempts > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] font-semibold leading-6 text-amber-800">
          أدّى هذا الاختبار {quiz._count.attempts} طالبًا. تغيير نسبة النجاح أو الأسئلة الآن لا يُعيد
          حساب المحاولات السابقة — درجاتها محفوظة كما صُحّحت وقتَها.
        </div>
      )}

      <Card className="max-w-3xl p-6">
        <ActionForm action={updateQuiz.bind(null, id)} cancelHref="/admin/quizzes">
          <ResourceFields fields={fields} record={quiz} />
        </ActionForm>
      </Card>
    </div>
  );
}
