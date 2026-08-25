// إشعارات الطالب. `?unread=1` للتصفية، و`unreadCount` لشارة التطبيق.
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api-auth";
import { ok, fail } from "../../_lib";
import { cors, preflight, paging, cursorArgs, page, queryFlag } from "../../_http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

export async function GET(req: Request) {
  try {
    const id = await requireApiUser(req);
    const { limit, cursor } = paging(req);
    const unreadOnly = queryFlag(req, "unread");

    const [rows, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        // القيد بـ`userId` في الاستعلام لا بعده — إشعارات المستخدمين في جدولٍ واحد.
        where: { userId: id.userId, ...(unreadOnly ? { readAt: null } : {}) },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: limit + 1,
        ...cursorArgs(cursor),
        select: {
          id: true,
          kind: true,
          titleAr: true,
          titleEn: true,
          bodyAr: true,
          bodyEn: true,
          href: true,
          readAt: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where: { userId: id.userId, readAt: null } }),
    ]);

    return cors(req, ok({ ...page(rows, limit), unreadCount }), "app", METHODS);
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
