"use client";

import { useState } from "react";
import { Menu, ExternalLink, LogOut, ChevronDown } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function AdminShell({
  user,
  signOutAction,
  children,
}: {
  user: { name?: string | null; email?: string | null; role: "ADMIN" | "EDITOR" };
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar role={user.role} open={open} onNavigate={() => setOpen(false)} />

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="lg:mr-72">
        {/* الشريط العلوي */}
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
              href="https://hadith-faculty.vercel.app/"
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
                <span className="hidden text-[13.5px] font-bold text-ink sm:block">
                  {user.name}
                </span>
                <ChevronDown size={15} className="text-ink-soft" />
              </button>

              {menu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenu(false)}
                  />
                  <div className="absolute left-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-black/5 bg-white shadow-xl">
                    <div className="border-b border-black/5 px-4 py-3">
                      <div className="text-[13.5px] font-bold text-ink">{user.name}</div>
                      <div className="text-[12px] text-ink-soft">{user.email}</div>
                      <span className="mt-1 inline-block rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-bold text-gold-3">
                        {user.role === "ADMIN" ? "مدير" : "محرّر"}
                      </span>
                    </div>
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
