import type { CSSProperties } from "react";
import { currentUser } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PrintButton } from "@/components/site/PrintButton";

/**
 * كشف الدرجات الرسمي للطالب: لكل مادة مسجَّل فيها — الواجبات المصحّحة
 * وأفضل نتيجة في كل اختبار (اختبارات المحاضرات والاختبار النهائي) والمعدّل.
 * زر الطباعة يحفظه PDF من المتصفّح.
 */
type Row = { kind: string; title: string; score: string; pct: number | null; note?: string | null };

const cell: CSSProperties = { border: "1px solid #d9cfb8", padding: "8px 10px", textAlign: "start" };

export default async function Grades() {
  const me = await currentUser();
  if (!me?.id || me.role !== "STUDENT") redirect("/student-login.html");
  const userId = me.id;

  const [user, enrollments] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
    prisma.enrollment.findMany({
      where: { userId, status: { in: ["ACTIVE", "COMPLETED"] } },
      include: { course: { select: { id: true, titleAr: true } } },
    }),
  ]);
  const courseIds = enrollments.map((e) => e.course.id);

  const [assignments, quizzes] = await Promise.all([
    prisma.assignment.findMany({
      where: { courseId: { in: courseIds }, visible: true },
      orderBy: [{ order: "asc" }],
      include: { submissions: { where: { userId }, select: { state: true, score: true, feedback: true } } },
    }),
    prisma.quiz.findMany({
      where: { courseId: { in: courseIds }, visible: true },
      orderBy: [{ isFinal: "asc" }, { titleAr: "asc" }],
      include: { attempts: { where: { userId, submittedAt: { not: null } }, select: { score: true, passed: true } } },
    }),
  ]);

  const courses = enrollments.map((e) => {
    const rows: Row[] = [];
    for (const a of assignments.filter((x) => x.courseId === e.course.id)) {
      const sub = a.submissions[0];
      const graded = sub?.state === "GRADED" && sub.score != null;
      rows.push({
        kind: "واجب",
        title: a.titleAr,
        score: graded ? `${sub!.score} / ${a.maxScore}` : sub?.state === "SUBMITTED" ? "بانتظار التصحيح" : "لم يُسلَّم",
        pct: graded && a.maxScore > 0 ? Math.round((sub!.score! / a.maxScore) * 100) : null,
        note: graded ? sub!.feedback : null,
      });
    }
    for (const q of quizzes.filter((x) => x.courseId === e.course.id)) {
      const scored = q.attempts.filter((t) => t.score != null);
      const best = scored.length ? Math.max(...scored.map((t) => t.score!)) : null;
      rows.push({
        kind: q.isFinal ? "اختبار نهائي" : "اختبار",
        title: q.titleAr,
        score: best != null ? `${best}٪ ${best >= q.passScore ? "(ناجح)" : "(راسب)"}` : q.attempts.length ? "بانتظار التصحيح" : "لم يُؤدَّ",
        pct: best,
      });
    }
    const graded = rows.filter((r) => r.pct != null);
    const avg = graded.length ? Math.round(graded.reduce((s, r) => s + r.pct!, 0) / graded.length) : null;
    return { id: e.course.id, title: e.course.titleAr, rows, avg };
  });

  const allGraded = courses.filter((c) => c.avg != null);
  const overall = allGraded.length ? Math.round(allGraded.reduce((s, c) => s + c.avg!, 0) / allGraded.length) : null;

  return (
    <section className="container transcript" style={{ paddingBlock: 28 }}>
      <style>{`@media print{.no-print,header,footer,nav,aside{display:none!important}.transcript{padding:0!important}}`}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <h1>كشف الدرجات</h1>
        <PrintButton label="طباعة / حفظ PDF" />
      </div>
      <p><b>الطالب:</b> {user?.name ?? "—"} — {user?.email}</p>
      <p><b>تاريخ الإصدار:</b> {new Intl.DateTimeFormat("ar-QA", { dateStyle: "long" }).format(new Date())}</p>
      {overall != null && <p><b>المعدّل العام:</b> {overall}٪</p>}
      {!courses.length && <p>لست مسجَّلًا في أي مادة بعد.</p>}
      {courses.map((c) => (
        <article key={c.id} className="info-card" style={{ marginBlock: 18, padding: 18, background: "white", borderRadius: 12, overflowX: "auto" }}>
          <h2 style={{ marginTop: 0 }}>{c.title}</h2>
          {!c.rows.length ? <p>لا توجد واجبات أو اختبارات في هذه المادة بعد.</p> : (
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
              <thead><tr style={{ background: "#f7f3eb" }}><th style={cell}>النوع</th><th style={cell}>العنوان</th><th style={cell}>الدرجة</th><th style={cell}>ملاحظة المعلّم</th></tr></thead>
              <tbody>{c.rows.map((r, i) => (
                <tr key={i}><td style={cell}>{r.kind}</td><td style={cell}>{r.title}</td><td style={cell}>{r.score}</td><td style={cell}>{r.note ?? ""}</td></tr>
              ))}</tbody>
            </table>
          )}
          <p style={{ marginBottom: 0 }}><b>معدّل المادة:</b> {c.avg != null ? `${c.avg}٪` : "—"}</p>
        </article>
      ))}
    </section>
  );
}
