/**
 * تعليم إشعارٍ مقروءًا.
 *
 * `updateMany` بشرطٍ مركّب (`id` + `userId`) لا `update` بالمعرّف وحده: الأولى
 * لا تلمس صفًّا ليس لصاحب الرمز أصلًا، فيستحيل تعليم إشعار غيره ولو خُمّن معرّفه.
 * والعمليّة **آمنة للتكرار**: إشعارٌ مقروءٌ سلفًا يُردّ بحاله ولا يُعاد ختمه.
 */
import { prisma } from "@/lib/prisma";
import { requireApiUser, ApiError } from "@/lib/api-auth";
import { ok, fail } from "../../../../_lib";
import { cors, preflight, requireId } from "../../../../_http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "POST, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const identity = await requireApiUser(req);
    const id = requireId((await ctx.params).id, "معرّف الإشعار");

    await prisma.notification.updateMany({
      where: { id, userId: identity.userId, readAt: null },
      data: { readAt: new Date() },
    });

    const row = await prisma.notification.findFirst({
      where: { id, userId: identity.userId },
      select: { id: true, readAt: true },
    });
    if (!row) throw new ApiError(404, "الإشعار غير موجود");

    const unreadCount = await prisma.notification.count({
      where: { userId: identity.userId, readAt: null },
    });

    return cors(req, ok({ ...row, unreadCount }), "app", METHODS);
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
