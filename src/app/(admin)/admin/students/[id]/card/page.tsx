import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { ensureUniversityNumber } from "@/lib/student-card";
import { PageHeader } from "@/components/admin/ui";
import { StudentIdCardDownloads } from "@/components/site/StudentIdCardDownloads";

export const metadata = { title: "إصدار البطاقة الجامعية" };

export default async function AdminStudentCardPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const student = await prisma.user.findFirst({ where: { id, role: "STUDENT" }, select: {
    name: true, avatarUrl: true, program: true, country: true, status: true,
  } });
  if (!student) notFound();
  const number = await ensureUniversityNumber(id);
  if (!number) notFound();

  return <div className="min-w-0 space-y-5">
    <PageHeader title={`البطاقة الجامعية: ${student.name}`} desc="إصدار البطاقة وتنزيلها مباشرة من لوحة الإدارة. يُنشأ الرقم الجامعي تلقائيًا إذا لم يكن للطالب رقم سابق." action={{ href: `/admin/students/${id}`, label: "تعديل بيانات الطالب وصورته" }} />
    <Link href="/admin/students" className="inline-block text-[13px] font-bold text-navy-700 underline underline-offset-4">العودة إلى حسابات الطلاب</Link>
    {!student.avatarUrl && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-6 text-amber-900">لم تُرفع صورة الطالب بعد. <Link href={`/admin/students/${id}`} className="font-bold underline">أضف الصورة من بيانات الطالب</Link> لتظهر في البطاقة والملف المنزّل.</div>}
    <div className="mx-auto max-w-3xl">
      <StudentIdCardDownloads name={student.name} number={number} program={student.program ?? ""} country={student.country ?? ""} photo={student.avatarUrl} status={student.status === "ACTIVE" ? "طالب فعّال" : "غير مفعّل"} labels={{ image: "تنزيل صورة PNG", pdf: "تنزيل PDF", loading: "جارٍ تجهيز البطاقة…", error: "تعذّر تجهيز الملف. تحقق من صورة الطالب وأعد المحاولة." }} />
    </div>
  </div>;
}
