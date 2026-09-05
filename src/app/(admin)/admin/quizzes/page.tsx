import Link from "next/link";
import { Pencil, ListChecks, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteQuiz } from "./actions";

/**
 * قائمة الاختبارات.
 *
 * العمود الأهمّ هنا ليس العنوان بل **التحذيرات**: اختبارٌ بلا أسئلة، أو ظاهرٌ
 * بلا مقرّر (فلا يصله طالب لأنّ الوصول مشروطٌ بالتسجيل في المقرّر). إظهارهما
 * في القائمة أنفع من اكتشافهما بعد فتح الاختبار للطلاب.
 */
export default async function QuizzesPage({ searchParams }: { searchParams?: Promise<{ page?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const pageSize = 10;
  const rawPage = Number.parseInt(sp?.page ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  const [total, quizzes] = await Promise.all([
    prisma.quiz.count(),
    prisma.quiz.findMany({
    orderBy: [{ titleAr: "asc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      course: { select: { titleAr: true } },
      _count: { select: { questions: true, attempts: true } },
    },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <PageHeader
        title="الاختبارات"
        desc="اختبارات المقرّرات وأسئلتها. يؤدّيها الطالب من بوابته، وتُصحَّح آليًّا."
        action={{ href: "/admin/quizzes/new", label: "إضافة اختبار" }}
      />

      <Card>
        {quizzes.length === 0 ? (
          <EmptyState label="لا اختبارات بعد. اضغط «إضافة اختبار»، ثم أضِف أسئلته." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13.5px]">
              <thead>
                <tr className="border-b border-black/5 text-[12px] text-ink-soft">
                  <th className="px-4 py-3 font-bold">الاختبار</th>
                  <th className="px-4 py-3 font-bold">المقرّر</th>
                  <th className="px-4 py-3 font-bold">الأسئلة</th>
                  <th className="px-4 py-3 font-bold">النجاح</th>
                  <th className="px-4 py-3 font-bold">المحاولات</th>
                  <th className="px-4 py-3 font-bold">الزمن</th>
                  <th className="px-4 py-3 font-bold">الحالة</th>
                  <th className="px-4 py-3 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((q) => {
                  const noQuestions = q._count.questions === 0;
                  const orphan = !q.courseId;
                  return (
                    <tr key={q.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
                      <td className="px-4 py-3">
                        <div className="font-bold text-navy-900">{q.titleAr}</div>
                        <div className="text-[12px] text-ink-soft" dir="ltr">
                          {q.titleEn}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-navy-800">
                        {q.course?.titleAr ?? (
                          <span className="inline-flex items-center gap-1 text-amber-700">
                            <AlertTriangle size={13} /> بلا مقرّر
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {noQuestions ? (
                          <Badge tone="red">لا أسئلة</Badge>
                        ) : (
                          <span className="font-bold text-navy-800">{q._count.questions}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-navy-800">{q.passScore}٪</td>
                      <td className="px-4 py-3 text-navy-800">
                        {q.attemptsAllowed === 0 ? "بلا حدّ" : q.attemptsAllowed}
                        <span className="block text-[11.5px] text-ink-soft">
                          أُدّيت {q._count.attempts}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-navy-800">
                        {q.timeLimitMin ? `${q.timeLimitMin} د` : "بلا توقيت"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {q.visible ? <Badge tone="green">ظاهر</Badge> : <Badge tone="gray">مخفي</Badge>}
                          {q.shuffle && <Badge tone="blue">مخلوط</Badge>}
                          {q.visible && (noQuestions || orphan) && (
                            <Badge tone="red">لن يصل للطلاب</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/quizzes/${q.id}/questions`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5"
                            title="الأسئلة"
                          >
                            <ListChecks size={16} />
                          </Link>
                          <Link
                            href={`/admin/quizzes/${q.id}`}
                            className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5"
                            title="تعديل"
                          >
                            <Pencil size={16} />
                          </Link>
                          <DeleteButton
                            action={deleteQuiz.bind(null, q.id)}
                            confirm="سيُحذف الاختبار بأسئلته ومحاولات الطلاب فيه. هل أنت متأكد؟"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && <div className="flex items-center justify-between border-t border-black/5 px-4 py-3 text-[13px]"><span className="text-ink-soft">صفحة {page} من {totalPages}</span><div className="flex gap-2"><Link href={page > 1 ? `/admin/quizzes?page=${page - 1}` : "#"} className={`rounded-lg border px-3 py-1.5 font-bold ${page <= 1 ? "pointer-events-none opacity-40" : "border-black/10 bg-white text-navy-700"}`}>السابق</Link><Link href={page < totalPages ? `/admin/quizzes?page=${page + 1}` : "#"} className={`rounded-lg border px-3 py-1.5 font-bold ${page >= totalPages ? "pointer-events-none opacity-40" : "border-black/10 bg-white text-navy-700"}`}>التالي</Link></div></div>}
      </Card>
    </div>
  );
}
