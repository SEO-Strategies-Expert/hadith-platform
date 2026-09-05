import Link from "next/link";
import { headers } from "next/headers";
import { BookOpen, CalendarDays, CreditCard, LogOut, ScrollText, Sparkles, UserRound } from "lucide-react";
import { currentUser } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import type { Lang } from "@/lib/site-data";
import { studentLogout } from "@/app/(site)/student-actions";
import { studentHref } from "@/components/site/StudentPortalKit";
import { CollapsiblePanel } from "@/components/site/CollapsibleSidebar";

const T = {
  ar: { navigate: "تنقّل سريع", subtitle: "كل ما تحتاجه للدراسة في مكان واحد", overview: "نظرة عامة", courses: "مقرّراتي", sessions: "مجالسي القادمة", certificates: "شهاداتي وإجازاتي", payments: "المدفوعات", logout: "خروج" },
  en: { navigate: "Quick navigation", subtitle: "Everything you need in one place", overview: "Overview", courses: "My courses", sessions: "Upcoming sessions", certificates: "Certificates & licences", payments: "Payments", logout: "Sign out" },
} as const;

export async function StudentSidebar({ lang }: { lang: Lang }) {
  const user = await currentUser();
  if (!user?.id) return null;
  const t = T[lang];
  const pathname = (await headers()).get("x-pathname") || (lang === "en" ? "/en/student" : "/student");
  const dashboardPath = studentHref(lang);
  const [courses, sessions, certificates, payments] = await Promise.all([
    prisma.enrollment.count({ where: { userId: user.id, status: { in: ["ACTIVE", "COMPLETED"] } } }),
    prisma.liveSession.count({ where: { visible: true, startsAt: { gte: new Date() }, OR: [{ course: { enrollments: { some: { userId: user.id } } } }, { stage: { stageEnrollments: { some: { userId: user.id } } } }, { isPublic: true }] } }),
    prisma.certificate.count({ where: { userId: user.id, revoked: false } }),
    prisma.payment.count({ where: { userId: user.id } }),
  ]);
  const items = [
    { href: `${studentHref(lang)}/courses`, label: t.courses, count: courses, Icon: BookOpen },
    { href: `${studentHref(lang)}/sessions`, label: t.sessions, count: sessions, Icon: CalendarDays },
    { href: `${studentHref(lang)}/certificates`, label: t.certificates, count: certificates, Icon: ScrollText },
    { href: `${studentHref(lang)}/payments`, label: t.payments, count: payments, Icon: CreditCard },
  ];
  const collapsedIcons = <>
    <Link href={dashboardPath} className={pathname === dashboardPath ? "is-active" : undefined} title={t.overview}><UserRound size={18} /></Link>
    {items.map(({ href, label, Icon }) => <Link href={href} key={href} className={pathname === href || pathname.startsWith(`${href}/`) ? "is-active" : undefined} title={label}><Icon size={18} /></Link>)}
  </>;
  return (
    <aside className="student-dashboard-sidebar" aria-label={t.navigate}>
      <CollapsiblePanel horizontal title={t.navigate} subtitle={t.subtitle} icon={<Sparkles size={15} />} collapsedContent={collapsedIcons}>
        <nav className="student-sidebar-nav">
          <Link href={dashboardPath} className={pathname === dashboardPath ? "is-active" : undefined}><UserRound size={18} /><span>{t.overview}</span></Link>
          {items.map(({ href, label, count, Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return <Link href={href} key={href} className={active ? "is-active" : undefined}><Icon size={18} /><span>{label}</span><b>{count}</b></Link>;
          })}
        </nav>
        <div className="student-sidebar-foot"><span>{user.email}</span><form action={studentLogout.bind(null, lang)}><button type="submit"><LogOut size={15} />{t.logout}</button></form></div>
      </CollapsiblePanel>
    </aside>
  );
}
