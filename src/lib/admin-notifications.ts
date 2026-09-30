import { prisma } from "@/lib/prisma";

/** إشعارات لوحة الإدارة: تسجيل طالب في مقرر، أو رسالة من صفحة التواصل. */

const NOTICE_KINDS = ["enrollment", "contact"] as const;
export type AdminNoticeKind = (typeof NOTICE_KINDS)[number];

export async function notifyStaff(input: {
  kind: AdminNoticeKind;
  titleAr: string;
  titleEn: string;
  bodyAr?: string | null;
  bodyEn?: string | null;
  href: string;
}) {
  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "EDITOR"] }, status: "ACTIVE" },
    select: { id: true },
  });
  if (!staff.length) return;

  const existing = await prisma.notification.findMany({
    where: { kind: input.kind, href: input.href, userId: { in: staff.map((s) => s.id) } },
    select: { id: true, userId: true },
  });
  const byUser = new Map(existing.map((row) => [row.userId, row.id]));
  const fresh = staff.filter((s) => !byUser.has(s.id));
  if (fresh.length) {
    await prisma.notification.createMany({
      data: fresh.map((s) => ({
        userId: s.id,
        kind: input.kind,
        titleAr: input.titleAr,
        titleEn: input.titleEn,
        bodyAr: input.bodyAr ?? null,
        bodyEn: input.bodyEn ?? null,
        href: input.href,
      })),
    });
  }
  if (existing.length) {
    await prisma.notification.updateMany({
      where: { id: { in: existing.map((row) => row.id) } },
      data: {
        titleAr: input.titleAr,
        titleEn: input.titleEn,
        bodyAr: input.bodyAr ?? null,
        bodyEn: input.bodyEn ?? null,
        readAt: null,
        createdAt: new Date(),
      },
    });
  }
}

/** يملأ إشعارات هذا الحساب من التسجيلات ورسائل التواصل التي لم تُسجَّل له بعد. */
export async function syncAdminNotices(userId: string) {
  const [enrollments, contacts, existing] = await Promise.all([
    prisma.enrollment.findMany({
      where: { status: { not: "CANCELLED" } },
      orderBy: { enrolledAt: "desc" },
      take: 60,
      include: {
        user: { select: { name: true } },
        course: { select: { titleAr: true, titleEn: true } },
      },
    }),
    prisma.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.notification.findMany({
      where: { userId, kind: { in: [...NOTICE_KINDS] }, href: { not: null } },
      select: { kind: true, href: true },
    }),
  ]);

  const seen = new Set(existing.map((row) => `${row.kind}:${row.href}`));
  const data: {
    userId: string;
    kind: AdminNoticeKind;
    titleAr: string;
    titleEn: string;
    bodyAr: string;
    bodyEn: string;
    href: string;
    createdAt: Date;
  }[] = [];

  for (const row of enrollments) {
    const href = `/admin/enrollments/${row.id}`;
    if (seen.has(`enrollment:${href}`)) continue;
    const course = row.course.titleAr;
    data.push({
      userId,
      kind: "enrollment",
      titleAr: "تسجيل طالب في مقرر",
      titleEn: "Student enrolled in a course",
      bodyAr: `${row.user.name} سجّل في «${course}».`,
      bodyEn: `${row.user.name} enrolled in “${row.course.titleEn || course}”.`,
      href,
      createdAt: row.enrolledAt,
    });
  }

  for (const row of contacts) {
    const href = `/admin/inbox/contact/${row.id}`;
    if (seen.has(`contact:${href}`)) continue;
    const preview = row.message.replace(/\s+/g, " ").slice(0, 140);
    data.push({
      userId,
      kind: "contact",
      titleAr: "رسالة إلى الكلية",
      titleEn: "Message to the college",
      bodyAr: `${row.name} أرسل رسالة من صفحة التواصل${row.department ? ` — ${row.department}` : ""}: ${preview}`,
      bodyEn: `${row.name} sent a message from the contact page.`,
      href,
      createdAt: row.createdAt,
    });
  }

  if (data.length) await prisma.notification.createMany({ data });
}

export function adminNoticeWhere(
  userId: string,
  filter: "all" | "enrollment" | "contact" | "unread" = "all"
) {
  const enrollment = { kind: "enrollment", href: { startsWith: "/admin/enrollments/" } };
  const contact = { kind: "contact", href: { startsWith: "/admin/inbox/contact/" } };
  return {
    userId,
    OR: filter === "enrollment" ? [enrollment] : filter === "contact" ? [contact] : [enrollment, contact],
    ...(filter === "unread" ? { readAt: null } : {}),
  };
}

export async function adminNoticeFeed(userId: string, take = 12) {
  await syncAdminNotices(userId);
  const where = adminNoticeWhere(userId);
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take }),
    prisma.notification.count({ where: adminNoticeWhere(userId, "unread") }),
  ]);
  return { items, unread };
}
