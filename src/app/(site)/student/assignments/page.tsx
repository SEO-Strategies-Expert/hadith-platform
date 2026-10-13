import Link from "next/link";
import { currentUser } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDateTime } from "@/components/admin/datetime";
export default async function Assignments() {
  const me=await currentUser();
  if(!me?.id || me.role!=="STUDENT") redirect("/student-login.html");
  const rows=await prisma.assignment.findMany({ where: { visible: true, course: { enrollments: { some: { userId: me.id, status: { in: ["ACTIVE", "COMPLETED"] } } } } }, include: { course: { select: { titleAr: true } }, submissions: { where: { userId: me.id } } }, orderBy: [{ dueAt: "asc" }, { order: "asc" }] });
  return <section className="container"><h1>واجباتي</h1><p>تظهر واجبات مقرراتك تلقائيًا بعد اعتماد التسجيل.</p>{!rows.length && <p>لا توجد واجبات متاحة حاليًا.</p>}{rows.map(a=><article className="info-card" key={a.id} style={{ marginBlock: 20 }}><h2>{a.titleAr}</h2><p>{a.course.titleAr}</p><p>موعد التسليم: {a.dueAt ? formatDateTime(a.dueAt) : "غير محدد"}</p><p>{a.submissions[0]?.state === "GRADED" ? `الدرجة: ${a.submissions[0].score}/${a.maxScore}` : a.submissions[0]?.state === "SUBMITTED" ? "تم التسليم — بانتظار التصحيح" : "بانتظار التسليم"}</p><Link className="btn btn-gold" href={`/student/assignment/${a.id}`}>فتح الواجب وتسليمه</Link></article>)}</section>;
}
