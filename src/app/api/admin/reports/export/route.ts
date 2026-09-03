import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const csv = (rows: unknown[][]) => "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\n");

export async function GET(request: NextRequest) {
  await requireUser();
  const type = request.nextUrl.searchParams.get("type");
  let rows: unknown[][];
  if (type === "quiz-attempts") {
    const data = await prisma.quizAttempt.findMany({ include: { user: true, quiz: true }, orderBy: { startedAt: "desc" } });
    rows = [["الطالب", "البريد", "الاختبار", "الدرجة", "النجاح", "بدأ", "سلّم"], ...data.map((x) => [x.user.name, x.user.email, x.quiz.titleAr, x.score, x.passed ? "نعم" : "لا", x.startedAt.toISOString(), x.submittedAt?.toISOString()])];
  } else if (type === "attendance") {
    const data = await prisma.attendance.findMany({ include: { user: true, session: true }, orderBy: { joinedAt: "desc" } });
    rows = [["الطالب", "البريد", "الجلسة", "حضر", "دقائق"], ...data.map((x) => [x.user.name, x.user.email, x.session.titleAr, x.present ? "نعم" : "لا", x.minutes])];
  } else {
    const data = await prisma.enrollment.findMany({ include: { user: true, course: true }, orderBy: { enrolledAt: "desc" } });
    rows = [["الطالب", "البريد", "المقرر", "الحالة", "التقدم", "تاريخ التسجيل", "تاريخ الإكمال"], ...data.map((x) => [x.user.name, x.user.email, x.course.titleAr, x.status, `${x.progressPct}%`, x.enrolledAt.toISOString(), x.completedAt?.toISOString()])];
  }
  return new Response(csv(rows), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${type || "enrollments"}.csv"` } });
}
