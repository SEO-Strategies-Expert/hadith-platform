"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, ExternalLink, LogOut, ChevronDown, Search, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { adminNav } from "@/lib/admin-nav";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchItems = useMemo(() => adminNav.flatMap(section => section.items.map(item => ({ ...item, section: section.title ?? "الرئيسية" }))).filter(item => !item.adminOnly || user.role === "ADMIN"), [user.role]);
  const results = query.trim() ? searchItems.filter(item => `${item.label} ${item.section}`.includes(query.trim())).slice(0, 10) : searchItems.slice(0, 8);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); }
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { if (searchOpen) requestAnimationFrame(() => searchInput.current?.focus()); else setQuery(""); }, [searchOpen]);
  const go = (href: string) => { setSearchOpen(false); router.push(href); };

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
            <button onClick={() => setSearchOpen(true)} className="flex min-w-0 items-center gap-2 rounded-xl border border-black/10 bg-slate-50 px-3 py-2 text-[13px] text-ink-soft transition hover:border-gold/50 hover:bg-white sm:w-64" aria-label="البحث في لوحة الإدارة">
              <Search size={16} className="shrink-0"/><span className="hidden flex-1 text-right sm:block">ابحث في لوحة الإدارة…</span><kbd className="hidden rounded border border-black/10 bg-white px-1.5 py-0.5 text-[10px] font-bold sm:inline">Ctrl K</kbd>
            </button>
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

        {searchOpen && <div className="fixed inset-0 z-[80] flex items-start justify-center bg-navy-950/55 px-4 pt-[10vh] backdrop-blur-sm" onMouseDown={() => setSearchOpen(false)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl" onMouseDown={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-black/10 px-4"><Search size={20} className="text-gold-3"/><input ref={searchInput} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && results[0]) go(results[0].href); }} placeholder="ابحث عن صفحة، مقرر، طلاب، شهادات…" className="h-16 min-w-0 flex-1 bg-transparent text-[15px] font-semibold outline-none"/><button onClick={() => setSearchOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-ink-soft hover:bg-black/5" aria-label="إغلاق"><X size={19}/></button></div>
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {results.length ? results.map(item => { const Icon = item.icon; return <button key={item.href} onClick={() => go(item.href)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right hover:bg-cream-50 focus:bg-cream-50 focus:outline-none"><span className="grid h-9 w-9 place-items-center rounded-lg bg-navy-900 text-gold-1"><Icon size={17}/></span><span className="min-w-0 flex-1"><b className="block text-[13.5px] text-navy-900">{item.label}</b><small className="text-[11px] text-ink-soft">{item.section}</small></span><span className="text-ink-soft">←</span></button>; }) : <div className="px-5 py-12 text-center text-[13px] text-ink-soft">لا توجد صفحة مطابقة للبحث.</div>}
            </div>
            <div className="border-t border-black/5 bg-slate-50 px-4 py-2 text-[11px] text-ink-soft">Enter للانتقال إلى أول نتيجة · Esc للإغلاق</div>
          </div>
        </div>}

        <main className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
