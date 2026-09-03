"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";

export async function sendAnnouncementNotifications(announcementId: string) {
  const actor = await requireUser();
  const item = await prisma.announcement.findUnique({ where: { id: announcementId } });
  if (!item) return;
  const recipients = item.courseId
    ? await prisma.enrollment.findMany({ where: { courseId: item.courseId, status: { in: ["ACTIVE", "COMPLETED"] } }, select: { userId: true } })
    : await prisma.user.findMany({ where: { role: "STUDENT", status: "ACTIVE" }, select: { id: true } }).then((rows) => rows.map((x) => ({ userId: x.id })));
  await prisma.$transaction([
    ...recipients.map(({ userId }) => prisma.notification.create({ data: { userId, kind: "announcement", titleAr: item.titleAr, titleEn: item.titleEn, bodyAr: item.bodyAr, bodyEn: item.bodyEn, href: item.courseId ? `/student/course/${item.courseId}` : "/student" } })),
    prisma.auditLog.create({ data: { actorId: actor.id, action: "broadcast", entity: "announcement", entityId: item.id, metadata: { recipients: recipients.length } } }),
  ]);
  revalidatePath("/admin/communications");
}

export async function moderateTopic(topicId: string, operation: "pin" | "lock") {
  const actor = await requireUser();
  const topic = await prisma.forumTopic.findUnique({ where: { id: topicId }, select: { pinned: true, locked: true } });
  if (!topic) return;
  await prisma.forumTopic.update({ where: { id: topicId }, data: operation === "pin" ? { pinned: !topic.pinned } : { locked: !topic.locked } });
  await prisma.auditLog.create({ data: { actorId: actor.id, action: `forum.${operation}`, entity: "forumTopic", entityId: topicId } });
  revalidatePath("/admin/communications");
}
