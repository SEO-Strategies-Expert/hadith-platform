"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ExternalLink, LogOut, ChevronDown } from "lucide-react";
import { instructorNav } from "./nav";

/**
 * قشرة لوحة الأكاديميين — نظيرة `AdminShell` مصغَّرة.
 * تستعمل أصناف اللوحة نفسها (الكحلي/الذهبي) لأنّ المحاضر يرى الواجهتين أحيانًا،
 * فاختلاف الهوية بينهما يُربك لا يُميّز.
 */
export function InstructorShell({
  user,
  signOutAction,
  children,
}: {
  user: { name: string; email: string; role: "INSTRUCTOR" | "ADMIN"; scholarName: string | null };
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-72 overflow-y-auto bg-navy-950 text-cream-50 transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-gold-1 to-gold-3 font-black text-navy-950">
            ح
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-extrabold text-gold-1">لوحة الأكاديميين</div>
            <div className="text-[11px] text-white/60">الكلّية العليا للحديث النبوي</div>
          </div>
        </div>

        <nav className="px-3 py-4">
          <ul className="space-y-1">
            {instructorNav.map((item) => {
              const active =
                item.href === "/instructor"
                  ? pathname === "/instructor"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition ${
                      active
                        ? "bg-gradient-to-l from-gold-1 to-gold-3 text-navy-950 shadow-lg shadow-black/20"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={19} className="shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {user.scholarName && (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-[11.5px] leading-6 text-white/70">
              ملفّك في الهيئة العلميّة:
              <b className="mt-0.5 block text-[12.5px] text-gold-1">{user.scholarName}</b>
            </div>
          )}
        </nav>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="lg:mr-72">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-black/5 bg-white px-4 shadow-sm">
          <button
            className="grid h-10 w-10 place-items-center rounded-lg text-ink-soft hover:bg-black/5 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="القائمة"
          >
            <Menu size={22} />
          </button>

          <div className="mr-auto flex items-center gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-[13px] font-bold text-white hover:bg-emerald-700 sm:flex"
            >
              <ExternalLink size={16} /> عرض الموقع
            </a>

            <div className="relative">
              <button
                onClick={() => setMenu((v) => !v)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-black/5"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-navy-800 text-[13px] font-bold text-gold-1">
                  {(user.name || "؟").charAt(0)}
                </span>
                <span className="hidden text-[13.5px] font-bold text-ink sm:block">{user.name}</span>
                <ChevronDown size={15} className="text-ink-soft" />
              </button>

              {menu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                  <div className="absolute left-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-black/5 bg-white shadow-xl">
                    <div className="border-b border-black/5 px-4 py-3">
                      <div className="text-[13.5px] font-bold text-ink">{user.name}</div>
                      <div className="text-[12px] text-ink-soft" dir="ltr">{user.email}</div>
                      <span className="mt-1 inline-block rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-bold text-gold-3">
                        {user.role === "ADMIN" ? "مدير (اطّلاع على لوحة المحاضر)" : "عضو هيئة تدريس"}
                      </span>
                    </div>
                    {/* المدير يعود إلى لوحته من هنا بدل تخمين الرابط. */}
                    {user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        className="block border-b border-black/5 px-4 py-3 text-[13.5px] font-semibold text-navy-800 hover:bg-black/5"
                      >
                        ← لوحة التحكم
                      </Link>
                    )}
                    <form action={signOutAction}>
                      <button
                        type="submit"
                        className="flex w-full items-center gap-2 px-4 py-3 text-[13.5px] font-semibold text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={16} /> تسجيل الخروج
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
