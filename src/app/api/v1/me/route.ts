/**
 * الملفّ الشخصي لصاحب الرمز.
 *
 * نقرأ من القاعدة ولا نكتفي بحمولة الـJWT: الرمز يعيش ٣٠ دقيقة، فقد يكون
 * الاسم تغيّر أو الحساب عُطِّل بعد إصداره. وحسابٌ غير `ACTIVE` يُردّ ٤٠١ ليمسح
 * التطبيق رموزه بدل أن يظلّ يعمل بجلسةٍ سُحبت.
 */
import { prisma } from "@/lib/prisma";
import { requireApiStudent, ApiError } from "@/lib/api-auth";
import { ok, fail } from "../_lib";
import { cors, preflight } from "../_http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

export async function GET(req: Request) {
  try {
    const id = await requireApiStudent(req);

    const user = await prisma.user.findUnique({
      where: { id: id.userId },
      // انتقاءٌ صريح: **لا `passwordHash`** ولا علاقات (`refreshTokens`، `devices`).
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
        studentNo: true,
        phone: true,
        country: true,
        program: true,
        createdAt: true,
      },
    });
    if (!user || user.status !== "ACTIVE") throw new ApiError(401, "غير مصرَّح");

    const [courses, unreadNotifications, certificates] = await Promise.all([
      prisma.enrollment.count({ where: { userId: user.id } }),
      prisma.notification.count({ where: { userId: user.id, readAt: null } }),
      prisma.certificate.count({ where: { userId: user.id, revoked: false } }),
    ]);

    return cors(
      req,
      ok({ ...user, counts: { courses, unreadNotifications, certificates } }),
      "app",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
