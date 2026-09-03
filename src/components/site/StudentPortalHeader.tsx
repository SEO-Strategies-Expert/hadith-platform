import Link from "next/link";
import { BookOpen, LayoutDashboard, LogOut } from "lucide-react";
import { currentUser } from "@/lib/guard";
import type { Lang } from "@/lib/site-data";
import { studentLogout } from "@/app/(site)/student-actions";
import { studentHref } from "@/components/site/StudentPortalKit";

const T = {
  ar: { portal: "بوابة الطالب", dashboard: "لوحة الطالب", courses: "مقرراتي", admin: "إدارة المقررات", logout: "خروج" },
  en: { portal: "Student portal", dashboard: "Dashboard", courses: "My courses", admin: "Manage courses", logout: "Sign out" },
} as const;

export async function StudentPortalHeader({ lang }: { lang: Lang }) {
  const user = await currentUser();
  if (!user) return null;
  const t = T[lang];
  const staff = user.role === "ADMIN" || user.role === "EDITOR";

  return (
    <header className="student-portal-header">
      <div className="container student-portal-header-inner">
        <Link className="student-portal-brand" href={staff ? "/admin/courses" : studentHref(lang)}>
          <img src="/assets/img/logo-official.png" alt="" width={42} height={42} />
          <span><small>{t.portal}</small><b>{user.name}</b></span>
        </Link>
        <nav aria-label={t.portal}>
          <Link href={studentHref(lang)}><LayoutDashboard size={17} /> {t.dashboard}</Link>
          <Link href={`${studentHref(lang)}#my-courses`}><BookOpen size={17} /> {t.courses}</Link>
          {staff && <Link href="/admin/courses">{t.admin}</Link>}
        </nav>
        <form action={studentLogout.bind(null, lang)}>
          <button type="submit"><LogOut size={16} /><span>{t.logout}</span></button>
        </form>
      </div>
    </header>
  );
}
