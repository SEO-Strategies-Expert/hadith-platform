"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNav } from "@/lib/admin-nav";

export function Sidebar({
  role,
  open,
  onNavigate,
}: {
  role: "ADMIN" | "EDITOR";
  open: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-40 w-72 shrink-0 overflow-y-auto bg-navy-950 text-cream-50 transition-transform duration-300 lg:static lg:translate-x-0 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-gold-1 to-gold-3 font-black text-navy-950">
          ح
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-extrabold text-gold-1">لوحة التحكم</div>
          <div className="text-[11px] text-white/60">الكلّية العليا للحديث النبوي</div>
        </div>
      </div>

      <nav className="px-3 py-4">
        {adminNav.map((section, i) => (
          <div key={i} className="mb-4">
            {section.title && (
              <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-white/40">
                {section.title}
              </div>
            )}
            <ul className="space-y-1">
              {section.items
                .filter((item) => !item.adminOnly || role === "ADMIN")
                .map((item) => {
                  const active =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
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
          </div>
        ))}
      </nav>
    </aside>
  );
}
