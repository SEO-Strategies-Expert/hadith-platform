/**
 * مصادقة تطبيق الجوال.
 *
 * لماذا مسار مستقلّ عن NextAuth؟ كعكة الجلسة مربوطة بالمتصفّح: لا تُدار بسهولة
 * من عميل أصيل، ولا تصلح لتطبيقٍ يعمل بعد إغلاقه ويُجدّد جلسته في الخلفيّة.
 * فالتطبيق يستعمل النمط المعتاد للعملاء الأصيلين:
 *
 *   رمز وصول (JWT) قصير العمر  — يُرسل في ترويسة Authorization مع كل طلب.
 *   رمز تجديد طويل العمر        — يُخزَّن **مجزَّأً** في القاعدة، ويُدوَّر عند كل استعمال.
 *
 * قرارات أمنيّة مقصودة:
 *  • رمز التجديد لا يُحفظ خامًّا قطّ — تسريب القاعدة عندئذٍ لا يمنح دخولًا.
 *  • **التدوير**: كل تجديد يُبطل الرمز القديم ويصدر غيره. فإن استُعمل رمزٌ
 *    مُبطَلٌ مرّةً أخرى فتلك علامة سرقة → تُبطَل **كل** رموز المستخدم.
 *  • المقارنة بالتجزئة تتمّ بـ`timingSafeEqual` لا بـ`===`.
 *  • رسالة فشل الدخول واحدة لكل الحالات، فلا تكشف أيّ البريدين مسجَّل.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/** عمر رمز الوصول: قصيرٌ عمدًا — سحبُ الصلاحيّة لا يُنتظر أكثر من هذا. */
const ACCESS_TTL_SEC = 60 * 30; // ٣٠ دقيقة
const REFRESH_TTL_DAYS = 60;

export type ApiRole = "ADMIN" | "EDITOR" | "STUDENT" | "INSTRUCTOR";

export interface ApiIdentity {
  userId: string;
  role: ApiRole;
  email: string;
  name: string;
}

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET غير مضبوط");
  return new TextEncoder().encode(s);
}

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

// ---------------------------------------------------------------------------
// إصدار الرموز
// ---------------------------------------------------------------------------

async function signAccessToken(id: ApiIdentity): Promise<string> {
  return new SignJWT({ role: id.role, email: id.email, name: id.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(id.userId)
    // مُصدِرٌ وجمهورٌ مميّزان: يمنعان قبول رمزٍ صُنع لغرضٍ آخر بالسرّ نفسه.
    .setIssuer("hadith-platform")
    .setAudience("hadith-mobile")
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .sign(secret());
}

async function issueRefreshToken(
  userId: string,
  deviceId?: string | null,
  deviceName?: string | null
): Promise<string> {
  const raw = randomBytes(48).toString("base64url");
  await prisma.refreshToken.create({
    data: {
      tokenHash: sha256(raw),
      userId,
      deviceId: deviceId ?? null,
      deviceName: deviceName ?? null,
      expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 86_400_000),
    },
  });
  return raw;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: { id: string; name: string; email: string; role: ApiRole };
}

async function pairFor(
  id: ApiIdentity,
  deviceId?: string | null,
  deviceName?: string | null
): Promise<TokenPair> {
  return {
    accessToken: await signAccessToken(id),
    refreshToken: await issueRefreshToken(id.userId, deviceId, deviceName),
    expiresIn: ACCESS_TTL_SEC,
    user: { id: id.userId, name: id.name, email: id.email, role: id.role },
  };
}

// ---------------------------------------------------------------------------
// الدخول
// ---------------------------------------------------------------------------

/** يعيد null عند أي فشل — لا يميّز بين بريدٍ غير موجود وكلمةِ مرورٍ خاطئة. */
export async function loginWithPassword(
  email: string,
  password: string,
  deviceId?: string | null,
  deviceName?: string | null
): Promise<TokenPair | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, name: true, email: true, role: true, status: true, passwordHash: true },
  });

  // نوازن كلمة المرور حتى مع غياب المستخدم، لئلّا يكشف فارقُ الزمن وجودَ البريد.
  const hash = user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
  const ok = await bcrypt.compare(password, hash);

  if (!user || !ok || user.status !== "ACTIVE") return null;

  return pairFor({
    userId: user.id,
    role: user.role as ApiRole,
    email: user.email,
    name: user.name,
  }, deviceId, deviceName);
}

// ---------------------------------------------------------------------------
// التجديد — بالتدوير
// ---------------------------------------------------------------------------

export async function refreshTokens(raw: string): Promise<TokenPair | null> {
  const row = await prisma.refreshToken.findUnique({
    where: { tokenHash: sha256(raw) },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, status: true } },
    },
  });
  if (!row) return null;

  // مقارنة ثابتة الزمن على التجزئة (البحث تمّ بها، وهذه حراسةٌ إضافيّة).
  const a = Buffer.from(row.tokenHash);
  const b = Buffer.from(sha256(raw));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  // رمزٌ مُبطَلٌ يُستعمل ثانيةً ⇒ نسخةٌ مسروقة تُستخدم بالتوازي.
  // الردّ الصحيح إبطال كل جلسات المستخدم لا هذا الرمز وحده.
  if (row.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: row.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    console.warn(`[api-auth] إعادة استعمال رمز تجديد مُبطَل — أُبطلت كل جلسات ${row.userId}`);
    return null;
  }

  if (row.expiresAt < new Date() || row.user.status !== "ACTIVE") return null;

  await prisma.refreshToken.update({
    where: { id: row.id },
    data: { revokedAt: new Date(), lastUsedAt: new Date() },
  });

  return pairFor({
    userId: row.user.id,
    role: row.user.role as ApiRole,
    email: row.user.email,
    name: row.user.name,
  }, row.deviceId, row.deviceName);
}

/** خروج من هذا الجهاز وحده. */
export async function revokeRefreshToken(raw: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: sha256(raw), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ---------------------------------------------------------------------------
// التحقّق من الطلبات
// ---------------------------------------------------------------------------

/** يقرأ هويّة صاحب الطلب من ترويسة Authorization، أو null. */
export async function identityFrom(req: Request): Promise<ApiIdentity | null> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  try {
    const { payload } = await jwtVerify(header.slice(7), secret(), {
      issuer: "hadith-platform",
      audience: "hadith-mobile",
    });
    if (!payload.sub) return null;
    return {
      userId: payload.sub,
      role: payload.role as ApiRole,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
    };
  } catch {
    return null; // منتهٍ أو موقَّع بغير سرّنا
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** يفرض وجود مستخدم مسجَّل، وإلّا رمى 401. */
export async function requireApiUser(req: Request): Promise<ApiIdentity> {
  const id = await identityFrom(req);
  if (!id) throw new ApiError(401, "غير مصرَّح");
  return id;
}

/**
 * يفرض أن يكون طالبًا (أو مديرًا للتفقّد).
 *
 * ⚠️ **لا تستعملها في مسارات `/me/**`.** «أنا» تعني صاحب الجلسة أيًّا كان دوره،
 * وكل استعلام هناك مقيَّد بـ`userId` أصلًا فالعزل قائم بلا حاجة لبوّابة دور.
 * حين كانت مستعملةً هناك كان عضو هيئة التدريس يسجّل دخوله في التطبيق بنجاح
 * ثمّ يُرفض بـ403 عند أوّل نداء لملفّه الشخصي — فلا يعمل التطبيق له إطلاقًا.
 */
export async function requireApiStudent(req: Request): Promise<ApiIdentity> {
  const id = await requireApiUser(req);
  if (id.role !== "STUDENT" && id.role !== "ADMIN") throw new ApiError(403, "ممنوع");
  return id;
}
