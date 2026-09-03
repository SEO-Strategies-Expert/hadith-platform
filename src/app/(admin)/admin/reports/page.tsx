import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { Card, PageHeader, Badge } from "@/components/admin/ui";

export default async function ReportsPage() {
  await requireUser();
  const [students, enrollments, completed, attempts, passed, attendance, courses] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.enrollment.count(),
    prisma.enrollment.count({ where: { completedAt: { not: null } } }),
    prisma.quizAttempt.count({ where: { submittedAt: { not: null } } }),
    prisma.quizAttempt.count({ where: { passed: true } }),
    prisma.attendance.count({ where: { present: true } }),
    prisma.course.findMany({
      orderBy: { titleAr: "asc" },
      select: {
        id: true,
        titleAr: true,
        _count: { select: { enrollments: true } },
        enrollments: { select: { progressPct: true, completedAt: true } },
      },
    }),
  ]);

  const pct = (part: number, total: number) => total ? `${Math.round(part * 100 / total)}%` : "—";
  const cards = [
    ["الطلاب", students], ["التسجيلات", enrollments], ["إكمال المقررات", pct(completed, enrollments)],
    ["نجاح الاختبارات", pct(passed, attempts)], ["سجلات الحضور", attendance],
  ];

  return (
    <div>
      <PageHeader title="التقارير والتحليلات" desc="مؤشرات الدراسة والتقييم والحضور قابلة للتصدير والمتابعة." />
      <div className="mb-5 flex flex-wrap gap-2">
        {["enrollments", "quiz-attempts", "attendance"].map((type) => (
          <Link key={type} href={`/api/admin/reports/export?type=${type}`} className="rounded-xl border border-gold/40 bg-white px-4 py-2 text-sm font-bold text-navy-900 hover:bg-gold/10">
            تصدير {type === "enrollments" ? "التسجيلات" : type === "quiz-attempts" ? "نتائج الاختبارات" : "الحضور"} CSV
          </Link>
        ))}
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value]) => <Card key={String(label)} className="p-5"><div className="text-3xl font-black text-navy-900">{value}</div><div className="mt-1 text-sm text-ink-soft">{label}</div></Card>)}
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-black/5 p-5"><h2 className="font-extrabold text-navy-900">أداء المقررات</h2></div>
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-black/[.025] text-ink-soft"><tr><th className="p-3 text-right">المقرر</th><th className="p-3">المسجلون</th><th className="p-3">متوسط التقدم</th><th className="p-3">الإكمال</th></tr></thead><tbody>
          {courses.map((course) => {
            const average = course.enrollments.length ? Math.round(course.enrollments.reduce((sum, row) => sum + row.progressPct, 0) / course.enrollments.length) : 0;
            const done = course.enrollments.filter((row) => row.completedAt).length;
            return <tr key={course.id} className="border-t border-black/5"><td className="p-3 font-bold text-navy-900">{course.titleAr}</td><td className="p-3 text-center">{course._count.enrollments}</td><td className="p-3 text-center"><Badge tone="blue">{average}%</Badge></td><td className="p-3 text-center">{pct(done, course.enrollments.length)}</td></tr>;
          })}
        </tbody></table></div>
      </Card>
    </div>
  );
}
