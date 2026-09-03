import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { Badge, Card, PageHeader } from "@/components/admin/ui";
import { moderateTopic, sendAnnouncementNotifications } from "./actions";

export default async function CommunicationsPage() {
  await requireUser();
  const [announcements, topics, messages, unread] = await Promise.all([
    prisma.announcement.findMany({ orderBy: { publishAt: "desc" }, take: 20 }),
    prisma.forumTopic.findMany({ orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }], include: { _count: { select: { replies: true } } }, take: 20 }),
    prisma.courseMessage.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.notification.count({ where: { readAt: null } }),
  ]);
  return <div><PageHeader title="التواصل الطلابي" desc={`الإعلانات والمنتديات ورسائل المقررات والتنبيهات. تنبيهات غير مقروءة: ${unread}`} action={{ href: "/admin/announcements/new", label: "إعلان جديد" }} />
    <div className="grid gap-6 xl:grid-cols-2"><Card className="overflow-hidden"><div className="flex items-center justify-between p-5"><h2 className="font-extrabold">الإعلانات</h2><Link href="/admin/announcements" className="text-sm font-bold text-gold-3">إدارة كاملة</Link></div>{announcements.map((x) => <div key={x.id} className="border-t p-4"><b>{x.titleAr}</b><div className="mt-2 flex items-center gap-2"><Badge tone={x.visible ? "green" : "gray"}>{x.visible ? "ظاهر" : "مخفي"}</Badge><form action={sendAnnouncementNotifications.bind(null, x.id)}><button className="text-xs font-bold text-navy-800 underline">إرسال تنبيه للطلاب</button></form></div></div>)}</Card>
    <Card className="overflow-hidden"><h2 className="p-5 font-extrabold">نقاشات الطلاب</h2>{topics.map((x) => <div key={x.id} className="border-t p-4"><div className="flex justify-between"><b>{x.title}</b><span className="text-xs">{x._count.replies} ردود</span></div><div className="mt-2 flex gap-3"><form action={moderateTopic.bind(null, x.id, "pin")}><button className="text-xs underline">{x.pinned ? "إلغاء التثبيت" : "تثبيت"}</button></form><form action={moderateTopic.bind(null, x.id, "lock")}><button className="text-xs underline">{x.locked ? "فتح النقاش" : "قفل النقاش"}</button></form></div></div>)}</Card>
    <Card className="overflow-hidden xl:col-span-2"><h2 className="p-5 font-extrabold">رسائل المقررات الأخيرة</h2>{messages.length ? messages.map((x) => <div key={x.id} className="border-t p-4"><b>{x.subject || "رسالة"}</b><p className="mt-1 text-sm text-ink-soft">{x.body}</p></div>) : <p className="border-t p-5 text-sm text-ink-soft">لا توجد رسائل بعد.</p>}</Card></div>
  </div>;
}
