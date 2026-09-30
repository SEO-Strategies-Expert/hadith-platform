import Link from "next/link";
import { GraduationCap, Mail } from "lucide-react";
import { requireUser } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { adminNoticeFeed, adminNoticeWhere } from "@/lib/admin-notifications";
import { PageHeader, Card, Badge, EmptyState } from "@/components/admin/ui";
import { formatDateTime } from "@/components/admin/datetime";
import { markAllNoticesRead, markNoticeRead } from "./actions";

const filters = [
  { key: "all", label: "الكل" },
  { key: "enrollment", label: "تسجيل المقررات" },
  { key: "contact", label: "رسائل التواصل" },
  { key: "unread", label: "غير المقروء" },
] as const;

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const me = await requireUser();
  const { filter: raw = "all" } = await searchParams;
  const filter = (filters.some((item) => item.key === raw) ? raw : "all") as (typeof filters)[number]["key"];
  await adminNoticeFeed(me.id, 1);
  const where = adminNoticeWhere(me.id, filter);
  const items = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const unread = items.filter((item) => !item.readAt).length;

  return (
    <div>
      <PageHeader
        title="الإشعارات"
        desc="تسجيل الطلاب في المقررات، والرسائل الواردة من صفحة التواصل."
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {filters.map((item) => (
          <Link
            key={item.key}
            href={item.key === "all" ? "/admin/notifications" : `/admin/notifications?filter=${item.key}`}
            className={`rounded-lg px-3 py-1.5 text-[12.5px] font-bold ${filter === item.key ? "bg-navy-800 text-white" : "border border-black/10 bg-white text-navy-800"}`}
          >
            {item.label}
          </Link>
        ))}
        {unread > 0 && (
          <form action={markAllNoticesRead} className="mr-auto">
            <button type="submit" className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[12.5px] font-bold text-navy-800">
              تعليم الكل كمقروء
            </button>
          </form>
        )}
      </div>
      <Card>
        {items.length === 0 ? (
          <EmptyState label="لا إشعارات في هذا التصنيف." />
        ) : (
          <ul className="divide-y divide-black/5">
            {items.map((item) => {
              const contact = item.kind === "contact";
              const Icon = contact ? Mail : GraduationCap;
              return (
                <li key={item.id} className={`flex flex-wrap items-start gap-3 px-4 py-4 ${item.readAt ? "" : "bg-gold/5"}`}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${contact ? "bg-sky-50 text-sky-700" : "bg-emerald-50 text-emerald-700"}`}>
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-[14.5px] text-navy-900">{item.titleAr}</b>
                      <Badge tone={contact ? "blue" : "green"}>{contact ? "تواصل" : "تسجيل"}</Badge>
                      {!item.readAt && <Badge tone="gold">جديد</Badge>}
                    </div>
                    <p className="mt-1 text-[13px] leading-6 text-ink-soft">{item.bodyAr}</p>
                    <p className="mt-1 text-[12px] text-ink-soft">{formatDateTime(item.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.href && (
                      <Link href={item.href} className="rounded-lg bg-navy-800 px-3 py-1.5 text-[12.5px] font-bold text-white">
                        فتح
                      </Link>
                    )}
                    {!item.readAt && (
                      <form action={markNoticeRead.bind(null, item.id)}>
                        <button type="submit" className="rounded-lg border border-black/10 px-3 py-1.5 text-[12.5px] font-bold text-navy-800">
                          مقروء
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
