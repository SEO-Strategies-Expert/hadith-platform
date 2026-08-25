/**
 * تسجيل جهاز الطالب لاستقبال إشعارات Expo، وإلغاؤه عند الخروج.
 *
 * **الـupsert على `token` لا على الجهاز**: رمز Expo يتبدّل من تلقائه (تحديث
 * التطبيق، إعادة تثبيته، تدوير المزوّد). لو أنشأنا صفًّا في كل تشغيل لتراكمت
 * رموزٌ ميّتة يُرسل إليها إلى الأبد. و`token` وحده `@unique` في المخطّط، فهو
 * المفتاح الطبيعيّ للعمليّة.
 *
 * ونُحدِّث `userId` في `update` عمدًا: الجهاز الواحد قد يُسلَّم لطالبٍ آخر أو
 * يُبدَّل عليه الحساب، فلا يجوز أن تظلّ إشعارات الأوّل تصل إلى الثاني.
 *
 * وعند الحذف نشترط `userId` مع `token`: لا يلغي أحدٌ تسجيل جهاز غيره ولو عرف رمزه.
 */
import { prisma } from "@/lib/prisma";
import { requireApiUser, ApiError } from "@/lib/api-auth";
import { ok, fail, body } from "../../_lib";
import { cors, preflight, text, query } from "../../_http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "POST, DELETE, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

const PLATFORMS = ["ios", "android"] as const;

/** حدٌّ أعلى للرمز: حارسٌ ضدّ حشو حقلٍ نصّيّ بلا سقف، لا تحقّقٌ من صيغته. */
const MAX_TOKEN = 512;

function readToken(v: unknown): string {
  const t = text(v);
  if (!t) throw new ApiError(400, "رمز الإشعارات مطلوب");
  if (t.length > MAX_TOKEN) throw new ApiError(400, "رمز الإشعارات أطول من المسموح");
  return t;
}

export async function POST(req: Request) {
  try {
    const id = await requireApiUser(req);
    const b = await body<{ token?: unknown; platform?: unknown; deviceId?: unknown; appVersion?: unknown }>(req);

    const token = readToken(b.token);
    const platform = (text(b.platform) ?? "").toLowerCase();
    if (!(PLATFORMS as readonly string[]).includes(platform)) {
      throw new ApiError(400, "المنصّة يجب أن تكون ios أو android");
    }

    const device = await prisma.deviceToken.upsert({
      where: { token },
      create: {
        token,
        userId: id.userId,
        platform,
        deviceId: text(b.deviceId),
        appVersion: text(b.appVersion),
      },
      update: {
        userId: id.userId,
        platform,
        deviceId: text(b.deviceId),
        appVersion: text(b.appVersion),
        // ختمٌ يميّز الجهاز الحيّ من المهجور عند تنظيف الرموز لاحقًا.
        lastSeenAt: new Date(),
      },
      // **لا يُعاد الرمز نفسه** — أُرسل من الجهاز ولا حاجة لصداه، وإبقاؤه
      // خارج الردّ يقلّل مواضع تسرّبه إلى سجلّات التطبيق.
      select: { id: true, platform: true, deviceId: true, appVersion: true, lastSeenAt: true, createdAt: true },
    });

    return cors(req, ok(device), "app", METHODS);
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}

export async function DELETE(req: Request) {
  try {
    const id = await requireApiUser(req);
    // نقبل الرمز في الجسم أو في `?token=`: بعض عملاء HTTP لا يرسلون جسمًا مع DELETE.
    const b = await body<{ token?: unknown }>(req);
    const token = readToken(b.token ?? query(req, "token"));

    const { count } = await prisma.deviceToken.deleteMany({
      where: { token, userId: id.userId },
    });

    // ننجح ولو لم يوجد صفّ: إلغاء التسجيل عند الخروج يجب ألّا يفشل في وجه
    // المستخدم، والغياب هو الحالة المطلوبة أصلًا.
    return cors(req, ok({ removed: count }), "app", METHODS);
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
