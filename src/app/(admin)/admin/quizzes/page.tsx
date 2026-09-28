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
export default async function QuizzesPage({ searchParams }: { searchParams?: Promise<{ page?: string; courseId?: string; questions?: string; pass?: string; time?: string; status?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const pageSize = 10;
  const rawPage = Number.parseInt(sp?.page ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const courseId = sp?.courseId ?? "";
  const questions = sp?.questions ?? "";
  const pass = sp?.pass ?? "";
  const time = sp?.time ?? "";
  const status = sp?.status ?? "";
  const where = {
    ...(courseId ? { courseId } : {}),
    ...(questions === "none" ? { questions: { none: {} } } : questions === "has" ? { questions: { some: {} } } : {}),
    ...(pass === "low" ? { passScore: { lt: 60 } } : pass === "mid" ? { passScore: { gte: 60, lt: 80 } } : pass === "high" ? { passScore: { gte: 80 } } : {}),
    ...(time === "untimed" ? { timeLimitMin: null } : time === "timed" ? { timeLimitMin: { not: null } } : {}),
    ...(status === "visible" ? { visible: true } : status === "hidden" ? { visible: false } : {}),
  };
  const courses = await prisma.course.findMany({ select: { id: true, titleAr: true }, orderBy: { titleAr: "asc" } });

  const [total, quizzes] = await Promise.all([
    prisma.quiz.count({ where }),
    prisma.quiz.findMany({
    where,
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

      <Card className="mb-4">
        <form method="get" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-[12px] font-bold text-navy-800">المقرّر<select name="courseId" defaultValue={courseId} className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] font-normal"><option value="">كل المقرّرات</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.titleAr}</option>)}</select></label>
          <label className="text-[12px] font-bold text-navy-800">الأسئلة<select name="questions" defaultValue={questions} className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] font-normal"><option value="">الكل</option><option value="has">يحتوي أسئلة</option><option value="none">بلا أسئلة</option></select></label>
          <label className="text-[12px] font-bold text-navy-800">النجاح<select name="pass" defaultValue={pass} className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] font-normal"><option value="">كل النسب</option><option value="low">أقل من 60٪</option><option value="mid">60٪ – 79٪</option><option value="high">80٪ فأعلى</option></select></label>
          <label className="text-[12px] font-bold text-navy-800">الزمن<select name="time" defaultValue={time} className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] font-normal"><option value="">الكل</option><option value="timed">محدّد بزمن</option><option value="untimed">بلا توقيت</option></select></label>
          <label className="text-[12px] font-bold text-navy-800">الحالة<select name="status" defaultValue={status} className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] font-normal"><option value="">كل الحالات</option><option value="visible">ظاهر</option><option value="hidden">مخفي</option></select></label>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5"><button type="submit" className="rounded-lg bg-navy-800 px-4 py-2 text-[13px] font-bold text-white hover:bg-navy-700">تطبيق الفلاتر</button><Link href="/admin/quizzes" className="rounded-lg border border-black/10 bg-white px-4 py-2 text-[13px] font-bold text-navy-700 hover:bg-black/5">مسح</Link></div>
        </form>
      </Card>

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
        {totalPages > 1 && <div className="flex items-center justify-between border-t border-black/5 px-4 py-3 text-[13px]"><span className="text-ink-soft">صفحة {page} من {totalPages}</span><div className="flex gap-2"><Link href={page > 1 ? `/admin/quizzes?page=${page - 1}&courseId=${courseId}&questions=${questions}&pass=${pass}&time=${time}&status=${status}` : "#"} className={`rounded-lg border px-3 py-1.5 font-bold ${page <= 1 ? "pointer-events-none opacity-40" : "border-black/10 bg-white text-navy-700"}`}>السابق</Link><Link href={page < totalPages ? `/admin/quizzes?page=${page + 1}&courseId=${courseId}&questions=${questions}&pass=${pass}&time=${time}&status=${status}` : "#"} className={`rounded-lg border px-3 py-1.5 font-bold ${page >= totalPages ? "pointer-events-none opacity-40" : "border-black/10 bg-white text-navy-700"}`}>التالي</Link></div></div>}
      </Card>
    </div>
  );
}
