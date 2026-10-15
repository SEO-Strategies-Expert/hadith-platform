import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { ensureUniversityNumber } from "@/lib/student-card";
import { StudentIdCardDownloads } from "@/components/site/StudentIdCardDownloads";
import styles from "@/components/site/StudentIdCard.module.css";

export const metadata = { title: "البطاقة الجامعية" };

export default async function StudentIdCardPage() {
  const me = await currentUser();
  if (!me?.id || me.role !== "STUDENT") redirect("/student-login.html");
  const profile = await prisma.user.findUnique({ where: { id: me.id }, select: { name: true, avatarUrl: true, program: true, country: true, status: true } });
  if (!profile) redirect("/student-login.html");
  const number = await ensureUniversityNumber(me.id);
  if (!number) redirect("/student-login.html");

  return <section className={styles.page} dir="rtl">
    <Link href="/student" className={styles.back}>← العودة إلى بوابة الطالب</Link>
    <div className={styles.heading}><span>بطاقتك التعريفية</span><h1>البطاقة الجامعية</h1><p>يمكنك تنزيل بطاقتك بصيغة PDF أو صورة والاحتفاظ بها على هاتفك.</p></div>
    <StudentIdCardDownloads name={profile.name} number={number} program={profile.program ?? ""} country={profile.country ?? ""} photo={profile.avatarUrl} status={profile.status === "ACTIVE" ? "طالب فعّال" : "غير مفعّل"} labels={{ image: "تنزيل صورة", pdf: "تنزيل PDF", loading: "جارٍ تجهيز البطاقة…", error: "تعذّر تجهيز الملف. أعد المحاولة." }} />
  </section>;
}
