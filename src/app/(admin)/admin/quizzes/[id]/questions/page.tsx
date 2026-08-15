import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronUp, ChevronDown, Pencil, Plus, CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { validateQuestionChoices, type QuizQuestionKind } from "@/lib/quiz";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { questionKindLabel } from "../../fields";
import { deleteQuestion, moveQuestion } from "../../actions";

/**
 * شاشة أسئلة الاختبار — على نمط شجرة محتوى المقرّر.
 *
 * كل سؤال بطاقةٌ تحته خياراته بعلامة الصحيح، ليرى المحرّر الاختبار كاملًا في
 * شاشة واحدة. ونعيد تشغيل التحقّق نفسه هنا عرضًا (لا حفظًا) لأنّ سؤالًا قد
 * يفسد لاحقًا بتغيير نوعه من نوعٍ يقبل خيارًا واحدًا صحيحًا إلى نوعٍ لا يقبله.
 */

function MoveButton({ action, dir }: { action: () => Promise<void>; dir: "up" | "down" }) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="grid h-8 w-8 place-items-center rounded-lg text-navy-700 transition hover:bg-black/5"
        title={dir === "up" ? "تقديم" : "تأخير"}
        aria-label={dir === "up" ? "تقديم" : "تأخير"}
      >
        {dir === "up" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    </form>
  );
}

export default async function QuizQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      course: { select: { titleAr: true } },
      questions: {
        orderBy: [{ order: "asc" }, { textAr: "asc" }],
        include: { choices: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!quiz) notFound();

  const base = `/admin/quizzes/${id}/questions`;
  const totalPoints = quiz.questions.reduce((s, q) => s + q.points, 0);
  const autoPoints = quiz.questions
    .filter((q) => q.kind !== "SHORT")
    .reduce((s, q) => s + q.points, 0);

  return (
    <div>
      <PageHeader
        title="أسئلة الاختبار"
        desc={`${quiz.titleAr}${quiz.course ? ` — ${quiz.course.titleAr}` : ""}`}
        action={{ href: `${base}/new`, label: "إضافة سؤال" }}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/quizzes"
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          كل الاختبارات ←
        </Link>
        <Link
          href={`/admin/quizzes/${id}`}
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          بيانات الاختبار ←
        </Link>
      </div>

      <div className="mb-5 rounded-xl border border-black/5 bg-white px-4 py-3 text-[12.5px] leading-6 text-navy-800 shadow-sm">
        مجموع الدرجات: <b>{totalPoints}</b> — منها <b>{autoPoints}</b> تُصحَّح آليًّا و
        <b> {totalPoints - autoPoints}</b> أسئلة إجابةٍ قصيرة تنتظر تصحيح المعلّم.
        {autoPoints === 0 && quiz.questions.length > 0 && (
          <span className="mt-1 block font-bold text-amber-700">
            كل الأسئلة يدويّة — لن تُحسب نسبةٌ ولا نجاحٌ آليّ لهذا الاختبار.
          </span>
        )}
      </div>

      {quiz.questions.length === 0 ? (
        <Card>
          <EmptyState label="لا أسئلة بعد. اضغط «إضافة سؤال»." />
        </Card>
      ) : (
        <div className="space-y-4">
          {quiz.questions.map((q, i) => {
            const problem = validateQuestionChoices(q.kind as QuizQuestionKind, q.choices);
            return (
              <Card key={q.id}>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/5 px-4 py-3.5">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cream-50 text-[12px] font-extrabold text-navy-800">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-bold text-navy-900">{q.textAr}</div>
                      <div className="text-[12px] text-ink-soft" dir="ltr">
                        {q.textEn}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        <Badge tone="gold">{questionKindLabel(q.kind)}</Badge>
                        <Badge tone="blue">{q.points} درجة</Badge>
                        {(q.explainAr || q.explainEn) && <Badge tone="gray">فيه شرح</Badge>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <MoveButton action={moveQuestion.bind(null, id, q.id, "up")} dir="up" />
                    <MoveButton action={moveQuestion.bind(null, id, q.id, "down")} dir="down" />
                    <Link
                      href={`${base}/${q.id}`}
                      className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5"
                      title="تعديل السؤال"
                    >
                      <Pencil size={16} />
                    </Link>
                    <DeleteButton
                      action={deleteQuestion.bind(null, id, q.id)}
                      confirm="سيُحذف السؤال بخياراته. هل أنت متأكد؟"
                    />
                  </div>
                </div>

                {problem && (
                  <div className="flex items-start gap-2 border-b border-black/5 bg-red-50 px-4 py-2.5 text-[12px] font-bold leading-6 text-red-700">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    {problem}
                  </div>
                )}

                {q.kind === "SHORT" ? (
                  <div className="px-4 py-4 text-[12.5px] text-ink-soft">
                    سؤال إجابةٍ قصيرة: يكتب الطالب نصًّا، ويُعلَّم في نتيجته أنّه ينتظر تصحيح المعلّم
                    — ولا يُحتسب صفرًا.
                  </div>
                ) : q.choices.length === 0 ? (
                  <div className="px-4 py-4 text-center text-[13px] text-ink-soft">
                    لا خيارات لهذا السؤال بعد.
                  </div>
                ) : (
                  <ul className="divide-y divide-black/5">
                    {q.choices.map((c) => (
                      <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                        {c.correct ? (
                          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                        ) : (
                          <Circle size={16} className="shrink-0 text-ink-soft/50" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-[13.5px] ${c.correct ? "font-extrabold text-emerald-800" : "text-navy-800"}`}
                          >
                            {c.textAr}
                          </div>
                          <div className="text-[11.5px] text-ink-soft" dir="ltr">
                            {c.textEn}
                          </div>
                        </div>
                        {c.correct && <Badge tone="green">الإجابة الصحيحة</Badge>}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-5">
        <Link
          href={`${base}/new`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-800 hover:border-gold/50"
        >
          <Plus size={15} /> إضافة سؤال
        </Link>
      </div>
    </div>
  );
}
