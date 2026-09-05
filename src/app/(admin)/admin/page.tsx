import Link from "next/link";
import {
  FileText,
  GraduationCap,
  Newspaper,
  Users,
  BookOpen,
  MessagesSquare,
  Images,
  Settings,
  ArrowLeft,
  ClipboardList,
  Award,
  Radio,
  ClipboardCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

async function safeCount(fn: () => Promise<number>) {
  try {
    return await fn();
  } catch {
    return null;
  }
}

const quickLinks = [
  { label: "الصفحات والأقسام", href: "/admin/pages", icon: FileText },
  { label: "الهيئة العلمية", href: "/admin/faculty", icon: GraduationCap },
  { label: "البرامج", href: "/admin/programs", icon: BookOpen },
  { label: "الأخبار", href: "/admin/news", icon: Newspaper },
  { label: "الديوان", href: "/admin/diwan", icon: MessagesSquare },
  { label: "الوسائط", href: "/admin/media", icon: Images },
  { label: "الإعدادات", href: "/admin/settings", icon: Settings },
  { label: "المستخدمون", href: "/admin/users", icon: Users },
];

export default async function DashboardPage() {
  const [usersCount, pagesCount, newsCount, scholarsCount, studentsCount, coursesCount, enrollmentsCount, activeEnrollments, pendingEnrollments, quizzesCount, assignmentsCount, certificatesCount, sessionsCount] = await Promise.all([
    safeCount(() => prisma.user.count()),
    safeCount(() => prisma.page.count()),
    safeCount(() => prisma.newsItem.count()),
    safeCount(() => prisma.scholar.count()),
    safeCount(() => prisma.user.count({ where: { role: "STUDENT" } })),
    safeCount(() => prisma.course.count()),
    safeCount(() => prisma.enrollment.count()),
    safeCount(() => prisma.enrollment.count({ where: { status: "ACTIVE" } })),
    safeCount(() => prisma.enrollment.count({ where: { status: "PENDING" } })),
    safeCount(() => prisma.quiz.count()),
    safeCount(() => prisma.assignment.count()),
    safeCount(() => prisma.certificate.count()),
    safeCount(() => prisma.liveSession.count()),
  ]);
  const dbReady = usersCount !== null;

  const cards = [
    { label: "الطلاب", value: studentsCount ?? "—", icon: Users, color: "from-amber-400 to-amber-500" },
    { label: "المقرّرات", value: coursesCount ?? "—", icon: BookOpen, color: "from-blue-500 to-blue-600" },
    { label: "التسجيلات", value: enrollmentsCount ?? "—", icon: ClipboardList, color: "from-emerald-500 to-emerald-600" },
    { label: "الشهادات", value: certificatesCount ?? "—", icon: Award, color: "from-violet-500 to-violet-600" },
    { label: "الاختبارات", value: quizzesCount ?? "—", icon: ClipboardCheck, color: "from-sky-500 to-sky-600" },
    { label: "الواجبات", value: assignmentsCount ?? "—", icon: FileText, color: "from-indigo-500 to-indigo-600" },
    { label: "المجالس", value: sessionsCount ?? "—", icon: Radio, color: "from-rose-500 to-rose-600" },
    { label: "الهيئة العلمية", value: scholarsCount ?? "—", icon: GraduationCap, color: "from-teal-500 to-teal-600" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-900">لوحة القيادة</h1>
        <p className="mt-1 text-[14px] text-ink-soft">
          مرحبًا بك في لوحة إدارة محتوى الكلّية العليا للحديث النبوي.
        </p>
      </div>

      {!dbReady && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-[13.5px] text-amber-800">
          <b>قاعدة البيانات غير متّصلة بعد.</b> فعّل Vercel Postgres وأضف متغيّرات البيئة
          ثم شغّل الترحيل (migrations) لتظهر البيانات الحقيقية.
        </div>
      )}

      {/* بطاقات الإحصاء */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`relative min-h-[105px] overflow-hidden rounded-2xl bg-gradient-to-br ${c.color} p-4 text-white shadow-lg`}
            >
              <div className="text-3xl font-black">{c.value}</div>
              <div className="mt-1 text-[12px] font-semibold text-white/90">{c.label}</div>
              <Icon size={48} className="absolute -bottom-2 left-2 opacity-15" />
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-[14px] font-extrabold text-navy-900">حالة التسجيلات</h2><Link href="/admin/enrollments" className="text-[11px] font-bold text-gold-3">التفاصيل ←</Link></div>
          <div className="grid grid-cols-2 gap-3">
            {[{ label: "مُفعّلة", value: activeEnrollments ?? 0, color: "bg-emerald-500" }, { label: "بانتظار الاعتماد", value: pendingEnrollments ?? 0, color: "bg-amber-400" }].map((item) => {
              const max = Math.max(activeEnrollments ?? 0, pendingEnrollments ?? 0, 1);
              return <div key={item.label}><div className="mb-1 flex justify-between text-[11px] font-bold text-ink-soft"><span>{item.label}</span><b className="text-navy-900">{item.value}</b></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.round((Number(item.value) / max) * 100)}%` }} /></div></div>;
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-[14px] font-extrabold text-navy-900">مؤشرات المحتوى</h2><Link href="/admin/courses" className="text-[11px] font-bold text-gold-3">المقرّرات ←</Link></div>
          <div className="flex h-[68px] items-end gap-3">
            {[{ label: "مقرّرات", value: coursesCount ?? 0, color: "bg-blue-500" }, { label: "اختبارات", value: quizzesCount ?? 0, color: "bg-sky-500" }, { label: "واجبات", value: assignmentsCount ?? 0, color: "bg-indigo-500" }, { label: "شهادات", value: certificatesCount ?? 0, color: "bg-violet-500" }, { label: "أخبار", value: newsCount ?? 0, color: "bg-emerald-500" }].map((item) => { const max = Math.max(coursesCount ?? 0, quizzesCount ?? 0, assignmentsCount ?? 0, certificatesCount ?? 0, newsCount ?? 0, 1); return <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-1"><div className={`w-full max-w-10 rounded-t-lg ${item.color}`} style={{ height: `${Math.max(8, Math.round((Number(item.value) / max) * 48))}px` }} title={`${item.label}: ${item.value}`} /><span className="truncate text-[10px] text-ink-soft">{item.label}</span></div>; })}
          </div>
        </div>
      </div>

      {/* روابط سريعة */}
      <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-[14px] font-bold text-navy-900">الوصول السريع</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {quickLinks.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="group flex items-center justify-between rounded-xl border border-black/5 bg-cream-50 px-3 py-2.5 transition hover:border-gold/50 hover:shadow-md"
              >
                <span className="flex items-center gap-3 text-[13.5px] font-semibold text-navy-800">
                  <Icon size={16} className="text-gold-3" />
                  {l.label}
                </span>
                <ArrowLeft size={16} className="text-ink-soft transition group-hover:-translate-x-1" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
