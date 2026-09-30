"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, GraduationCap, Mail } from "lucide-react";
import { markNoticeRead } from "@/app/(admin)/admin/notifications/actions";

export type AdminNoticeItem = {
  id: string;
  kind: "enrollment" | "contact";
  title: string;
  body: string;
  href: string;
  unread: boolean;
  when: string;
};

export function AdminNoticeBell({ unread, items }: { unread: number; items: AdminNoticeItem[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const badge = unread > 99 ? "99+" : String(unread);

  async function openItem(item: AdminNoticeItem) {
    setOpen(false);
    if (item.unread) await markNoticeRead(item.id);
    router.push(item.href);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-10 w-10 place-items-center rounded-lg text-navy-800 hover:bg-black/5"
        aria-label={unread ? `الإشعارات، ${unread} غير مقروء` : "الإشعارات"}
        aria-expanded={open}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -left-0.5 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold leading-5 text-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-black/5 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
              <b className="text-[14px] text-navy-900">الإشعارات</b>
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
                {unread} جديد
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-ink-soft">لا إشعارات حتى الآن.</p>
              ) : (
                items.map((item) => {
                  const Icon = item.kind === "contact" ? Mail : GraduationCap;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openItem(item)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-right hover:bg-cream-50 ${item.unread ? "bg-gold/5" : ""}`}
                    >
                      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${item.kind === "contact" ? "bg-sky-50 text-sky-700" : "bg-emerald-50 text-emerald-700"}`}>
                        <Icon size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <b className="text-[13px] text-navy-900">{item.title}</b>
                          {item.unread && <span className="h-2 w-2 rounded-full bg-red-600" />}
                        </span>
                        <span className="mt-0.5 block text-[12px] leading-5 text-ink-soft">{item.body}</span>
                        <span className="mt-1 block text-[11px] text-ink-soft">{item.when}</span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            <Link
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-black/5 px-4 py-3 text-center text-[13px] font-bold text-navy-800 hover:bg-cream-50"
            >
              عرض كل الإشعارات
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
