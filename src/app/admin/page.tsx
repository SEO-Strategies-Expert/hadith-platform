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
  const [usersCount, pagesCount, newsCount, scholarsCount] = await Promise.all([
    safeCount(() => prisma.user.count()),
    safeCount(() => prisma.page.count()),
    safeCount(() => prisma.newsItem.count()),
    safeCount(() => prisma.scholar.count()),
  ]);
  const dbReady = usersCount !== null;

  const cards = [
    { label: "الصفحات", value: pagesCount ?? "—", icon: FileText, color: "from-emerald-500 to-emerald-600" },
    { label: "الأخبار", value: newsCount ?? "—", icon: Newspaper, color: "from-sky-500 to-sky-600" },
    { label: "أعضاء الهيئة", value: scholarsCount ?? "—", icon: GraduationCap, color: "from-violet-500 to-violet-600" },
  ];

  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.color} p-5 text-white shadow-lg`}
            >
              <div className="text-4xl font-black">{c.value}</div>
              <div className="mt-1 text-[14px] font-semibold text-white/90">{c.label}</div>
              <Icon size={64} className="absolute -bottom-3 left-3 opacity-15" />
            </div>
          );
        })}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 p-5 text-white shadow-lg">
          <div className="text-4xl font-black">{usersCount ?? "—"}</div>
          <div className="mt-1 text-[14px] font-semibold text-white/90">المستخدمون</div>
          <Users size={64} className="absolute -bottom-3 left-3 opacity-15" />
        </div>
      </div>

      {/* روابط سريعة */}
      <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-[15px] font-bold text-navy-900">الوصول السريع</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {quickLinks.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="group flex items-center justify-between rounded-xl border border-black/5 bg-cream-50 px-4 py-3.5 transition hover:border-gold/50 hover:shadow-md"
              >
                <span className="flex items-center gap-3 text-[13.5px] font-semibold text-navy-800">
                  <Icon size={19} className="text-gold-3" />
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
