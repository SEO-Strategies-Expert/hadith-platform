import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { Pagination } from "@/components/admin/Pagination";
import { formatDateTime } from "@/components/admin/datetime";

const PAGE_SIZE = 25;
function pageNumber(value: string | undefined, total: number) {
  const number = Number(value);
  return Math.min(Math.max(1, Math.ceil(total / PAGE_SIZE)), Number.isSafeInteger(number) && number > 0 ? number : 1);
}
const cell = "px-4 py-3";

export default async function GradesPage({ searchParams }: {
  searchParams: Promise<{ q?: string; courseId?: string; workPage?: string; quizPage?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const courseId = params.courseId?.trim() || "";
  const user: Prisma.UserWhereInput = { role: "STUDENT", ...(q ? { OR: [{ name: { contains: q } }, { studentNo: { contains: q } }, { email: { contains: q } }] } : {}) };
  const workWhere: Prisma.AssignmentSubmissionWhereInput = { user, state: { not: "DRAFT" }, ...(courseId ? { assignment: { courseId } } : {}) };
  const quizWhere: Prisma.QuizAttemptWhereInput = { user, submittedAt: { not: null }, ...(courseId ? { quiz: { courseId } } : {}) };
  const [courses, workTotal, quizTotal] = await Promise.all([
    prisma.course.findMany({ select: { id: true, titleAr: true }, orderBy: { titleAr: "asc" } }),
    prisma.assignmentSubmission.count({ where: workWhere }),
    prisma.quizAttempt.count({ where: quizWhere }),
  ]);
  const workPage = pageNumber(params.workPage, workTotal);
  const quizPage = pageNumber(params.quizPage, quizTotal);
  const [works, quizzes] = await Promise.all([
    prisma.assignmentSubmission.findMany({ where: workWhere, skip: (workPage - 1) * PAGE_SIZE, take: PAGE_SIZE,
      orderBy: [{ gradedAt: "desc" }, { id: "desc" }],
      include: { user: { select: { name: true, studentNo: true } }, assignment: { select: { titleAr: true, maxScore: true, course: { select: { titleAr: true } } } } },
    }),
    prisma.quizAttempt.findMany({ where: quizWhere, skip: (quizPage - 1) * PAGE_SIZE, take: PAGE_SIZE,
      orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
      include: { user: { select: { name: true, studentNo: true } }, quiz: { select: { titleAr: true, course: { select: { titleAr: true } } } } },
    }),
  ]);
  const filters = { ...(q ? { q } : {}), ...(courseId ? { courseId } : {}) };
  const field = "w-full rounded-xl border border-black/10 bg-white px-3 py-2.5 text-[13px] outline-none focus:border-gold";

  return <div className="min-w-0 space-y-6">
    <PageHeader title="سجل درجات الطلاب" desc="درجات الواجبات والتقييمات ونتائج الاختبارات لجميع المقررات، ٢٥ سجلًا في كل صفحة." />
    <form method="get" className="grid items-end gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto_auto]">
      <label className="text-[12px] font-bold text-navy-900">الطالب / الرقم الجامعي<input name="q" defaultValue={q} placeholder="الاسم أو الرقم الجامعي أو البريد" className={`mt-1.5 ${field}`} /></label>
      <label className="text-[12px] font-bold text-navy-900">المقرر<select name="courseId" defaultValue={courseId} className={`mt-1.5 ${field}`}><option value="">كل المقررات</option>{courses.map(course => <option key={course.id} value={course.id}>{course.titleAr}</option>)}</select></label>
      <button className="rounded-xl bg-navy-800 px-5 py-2.5 text-[13px] font-bold text-white">بحث</button>
      <Link href="/admin/grades" className="rounded-xl border border-black/10 px-4 py-2.5 text-center text-[13px] font-bold text-ink-soft">مسح</Link>
    </form>

    <section className="space-y-3"><h2 className="text-lg font-extrabold text-navy-900">الواجبات والتقييمات <Badge tone="blue">{workTotal}</Badge></h2><Card>
      {!works.length ? <EmptyState label="لا توجد درجات أو واجبات مطابقة للبحث." /> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-right text-[13px]">
        <thead className="bg-slate-50 text-[12px] text-ink-soft"><tr>{["الطالب", "المقرر", "التقييم", "الدرجة", "النسبة", "الحالة", "تاريخ التصحيح"].map(title => <th key={title} className={cell} scope="col">{title}</th>)}</tr></thead>
        <tbody>{works.map(work => <tr key={work.id} className="border-t border-black/5 hover:bg-slate-50/70">
          <td className={cell}><div className="font-bold text-navy-900">{work.user.name}</div><div className="text-[11px] text-ink-soft">{work.user.studentNo || "—"}</div></td>
          <td className={cell}>{work.assignment.course.titleAr}</td><td className={cell}>{work.assignment.titleAr}</td>
          <td className={`${cell} whitespace-nowrap font-bold`}><span dir="ltr">{work.score === null ? "—" : `${work.score} / ${work.assignment.maxScore}`}</span></td>
          <td className={cell}><span dir="ltr">{work.score !== null && work.assignment.maxScore > 0 ? `${Math.round(work.score / work.assignment.maxScore * 100)}%` : "—"}</span></td>
          <td className={cell}><Badge tone={work.state === "GRADED" ? "green" : "gold"}>{work.state === "GRADED" ? "تم التصحيح" : work.state === "RETURNED" ? "أعيد للتعديل" : "بانتظار التصحيح"}</Badge></td>
          <td className={`${cell} text-[12px] text-ink-soft`}>{formatDateTime(work.gradedAt)}</td>
        </tr>)}</tbody>
      </table></div>}
      <Pagination basePath="/admin/grades" page={workPage} total={workTotal} pageParam="workPage" filters={{ ...filters, quizPage: String(quizPage) }} />
    </Card></section>

    <section className="space-y-3"><h2 className="text-lg font-extrabold text-navy-900">نتائج الاختبارات <Badge tone="blue">{quizTotal}</Badge></h2><Card>
      {!quizzes.length ? <EmptyState label="لا توجد نتائج اختبارات مطابقة للبحث." /> : <div className="overflow-x-auto"><table className="w-full min-w-[750px] text-right text-[13px]">
        <thead className="bg-slate-50 text-[12px] text-ink-soft"><tr>{["الطالب", "المقرر", "الاختبار", "النسبة", "النتيجة", "تاريخ التسليم"].map(title => <th key={title} className={cell} scope="col">{title}</th>)}</tr></thead>
        <tbody>{quizzes.map(quiz => <tr key={quiz.id} className="border-t border-black/5 hover:bg-slate-50/70">
          <td className={cell}><div className="font-bold text-navy-900">{quiz.user.name}</div><div className="text-[11px] text-ink-soft">{quiz.user.studentNo || "—"}</div></td>
          <td className={cell}>{quiz.quiz.course?.titleAr || "اختبار عام"}</td><td className={cell}>{quiz.quiz.titleAr}</td>
          <td className={`${cell} font-bold`}><span dir="ltr">{quiz.score === null ? "—" : `${quiz.score}%`}</span></td>
          <td className={cell}><Badge tone={quiz.passed === null ? "gray" : quiz.passed ? "green" : "red"}>{quiz.passed === null ? "بانتظار التصحيح" : quiz.passed ? "ناجح" : "غير ناجح"}</Badge></td>
          <td className={`${cell} text-[12px] text-ink-soft`}>{formatDateTime(quiz.submittedAt)}</td>
        </tr>)}</tbody>
      </table></div>}
      <Pagination basePath="/admin/grades" page={quizPage} total={quizTotal} pageParam="quizPage" filters={{ ...filters, workPage: String(workPage) }} />
    </Card></section>
  </div>;
}
