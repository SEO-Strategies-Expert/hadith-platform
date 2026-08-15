import Link from "next/link";
import { Layers, GraduationCap, ClipboardCheck, Radio, ArrowLeft } from "lucide-react";
import { requireInstructor, getInstructorOverview } from "@/lib/instructor";
import { Card } from "@/components/admin/ui";
import { formatDateTime } from "@/components/admin/datetime";
import { NoScholarNotice } from "@/components/instructor/NoScholarNotice";

export default async function InstructorHomePage() {
  const me = await requireInstructor();

  if (!me.scholarId) {
    return (
      <div className="space-y-6">
        <Header name={me.name} />
        <NoScholarNotice />
      </div>
    );
  }

  const { coursesCount, studentsCount, pendingGrading, nextSession } =
    await getInstructorOverview(me.scholarId);

  const cards = [
    { label: "مقرّراتي", value: coursesCount, icon: Layers, color: "from-emerald-500 to-emerald-600", href: "/instructor/courses" },
    { label: "طلابي", value: studentsCount, icon: GraduationCap, color: "from-sky-500 to-sky-600", href: "/instructor/students" },
    { label: "واجبات تنتظر التصحيح", value: pendingGrading, icon: ClipboardCheck, color: "from-amber-400 to-amber-500", href: "/instructor/courses" },
  ];

  return (
    <div className="space-y-6">
      <Header name={me.name} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.color} p-5 text-white shadow-lg transition hover:brightness-105`}
            >
              <div className="text-4xl font-black">{c.value}</div>
              <div className="mt-1 text-[14px] font-semibold text-white/90">{c.label}</div>
              <Icon size={64} className="absolute -bottom-3 left-3 opacity-15" />
            </Link>
          );
        })}
      </div>

      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold text-navy-900">
          <Radio size={17} className="text-gold-3" /> مجلسي القادم
        </h2>
        {nextSession ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/5 bg-cream-50 px-4 py-3.5">
            <div>
              <b className="text-[15px] font-extrabold text-navy-900">{nextSession.titleAr}</b>
              <div className="mt-0.5 text-[12.5px] text-ink-soft">
                {formatDateTime(nextSession.startsAt)}
                {nextSession.course ? ` — ${nextSession.course.titleAr}` : ""}
              </div>
            </div>
            <Link
              href={`/instructor/sessions/${nextSession.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-800 hover:border-gold/50"
            >
              تفاصيل المجلس <ArrowLeft size={15} />
            </Link>
          </div>
        ) : (
          <p className="text-[13.5px] text-ink-soft">لا مجالس قادمة مسنَدة إليك حاليًّا.</p>
        )}
      </Card>
    </div>
  );
}

function Header({ name }: { name: string }) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-navy-900">لوحتي</h1>
      <p className="mt-1 text-[14px] text-ink-soft">
        أهلًا {name} — هذه لوحتك التعليميّة: مقرّراتك ومجالسك وطلابك.
      </p>
    </div>
  );
}
