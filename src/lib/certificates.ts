/**
 * الشهادات والإجازات المسنَدة — التوليد والإصدار والتحقّق العلنيّ.
 *
 * ثلاثة أحكامٍ تحكم هذا الملفّ:
 *
 * ١) **رقم التوثيق (serial) غير رمز التحقّق (verifyCode)**. الأوّل يُطبع على
 *    الوثيقة ويُقرأ في السجلّات، فوجب أن يكون مقروءًا ومتسلسلًا. والثاني
 *    يُشارَك علنًا ويُدخَل في صفحة التحقّق، فوجب أن يكون عشوائيًّا لا يُخمَّن؛
 *    ولو جعلناهما واحدًا لأمكن لمن يملك وثيقةً واحدة أن يستعرض وثائق غيره
 *    بزيادة الرقم واحدًا.
 *
 * ٢) **أبجديّة الرمز تستبعد المتشابهات** (0/O و1/I/L)، لأنّه يُملى في المجالس
 *    ويُكتب باليد؛ وحرفٌ يُقرأ على وجهين يحوّل وثيقةً صحيحة إلى «غير موجودة».
 *
 * ٣) **بيانات التحقّق العلنيّة منتقاة صراحةً**. لا يُمرَّر سجلّ Prisma كاملًا
 *    إلى العرض؛ لأنّ الصفحة تُفتح بلا تسجيل دخول، وفي سجلّ الشهادة علاقةٌ
 *    بحساب الطالب فيه بريده وهاتفه ورقمه الجامعيّ. الاسم وبيانات الوثيقة فقط.
 */
import { randomBytes } from "node:crypto";
import type { CertificateKind } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// رقم التوثيق: HC-2026-000137
// ---------------------------------------------------------------------------

export const SERIAL_PREFIX = "HC";
export const SERIAL_DIGITS = 6;

const SERIAL_RE = new RegExp(`^${SERIAL_PREFIX}-(\\d{4})-(\\d{${SERIAL_DIGITS}})$`);

export function formatSerial(year: number, seq: number): string {
  return `${SERIAL_PREFIX}-${year}-${String(seq).padStart(SERIAL_DIGITS, "0")}`;
}

/** يستخرج التسلسل من رقم توثيق، أو null إن لم يكن على الصيغة. */
export function parseSerialSeq(serial: string): number | null {
  const m = SERIAL_RE.exec(serial.trim());
  return m ? Number(m[2]) : null;
}

/**
 * التسلسل التالي في سنةٍ ما.
 *
 * الترتيب المعجميّ للنصّ يساوي الترتيب العدديّ ما دام التسلسل مصفوفًا بأصفار
 * إلى ستّ خانات، فيكفي `orderBy: desc` على النصّ بلا حقل عدديّ إضافيّ في القاعدة.
 */
async function nextSerialSeq(year: number): Promise<number> {
  const last = await prisma.certificate.findFirst({
    where: { serial: { startsWith: `${SERIAL_PREFIX}-${year}-` } },
    orderBy: { serial: "desc" },
    select: { serial: true },
  });
  return (last ? (parseSerialSeq(last.serial) ?? 0) : 0) + 1;
}

// ---------------------------------------------------------------------------
// رمز التحقّق العلنيّ
// ---------------------------------------------------------------------------

/**
 * ٣١ حرفًا: الأرقام ٢–٩ والحروف الكبيرة عدا I و L و O.
 * حُذف 0 و1 مع O و I و L معًا — إبقاء أحد المتشابهين يُبقي الالتباس قائمًا
 * على من يقرأ الرمز مكتوبًا بخطّ اليد.
 */
export const VERIFY_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
/** ١٢ محرفًا ≈ ٣١^١٢ ≈ ٧٫٩×١٠^١٧ احتمالًا (نحو ٥٩ بتًّا) — التخمين الآليّ عبثٌ. */
export const VERIFY_CODE_LENGTH = 12;
const VERIFY_GROUP = 4;

const VERIFY_CODE_RE = new RegExp(`^[${VERIFY_ALPHABET}]{${VERIFY_CODE_LENGTH}}$`);

/**
 * رمزٌ عشوائيّ من `crypto.randomBytes` بعيّنةٍ مرفوضة (rejection sampling).
 *
 * ٣١ لا تقسم ٢٥٦، فأخذ الباقي مباشرةً يجعل أوائل الأبجديّة أكثر ورودًا؛
 * فنُسقط كل بايتٍ يتجاوز أكبر مضاعفٍ لـ٣١ دون ٢٥٦ (٢٤٨) ليبقى التوزيع منتظمًا.
 */
export function generateVerifyCode(length: number = VERIFY_CODE_LENGTH): string {
  const n = VERIFY_ALPHABET.length;
  const limit = 256 - (256 % n);
  let out = "";
  while (out.length < length) {
    const buf = randomBytes(Math.max(16, (length - out.length) * 2));
    for (let i = 0; i < buf.length && out.length < length; i++) {
      const b = buf[i];
      if (b >= limit) continue;
      out += VERIFY_ALPHABET[b % n];
    }
  }
  return out;
}

/** للعرض والمشاركة: «ABCD-EFGH-JKMN» — أيسر في الإملاء والنسخ. */
export function formatVerifyCode(code: string): string {
  const groups = code.match(new RegExp(`.{1,${VERIFY_GROUP}}`, "g"));
  return groups ? groups.join("-") : code;
}

/**
 * يوحّد رمزًا مكتوبًا يدويًّا: يقبل الأرقام العربيّة والفارسيّة، والفواصل
 * والمسافات، وحالة الأحرف. يرجع null إن لم يبقَ الناتج على الصيغة المعتمدة.
 *
 * لا يُصلح المحارف المستبعدة (O، I، L، 0، 1): إصلاحها تخمينٌ عن المستخدم قد
 * يقلب رمزًا إلى رمزٍ آخر صحيح.
 */
export function normalizeVerifyCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\s\-_.،,·—–]/g, "")
    .toUpperCase();
  return VERIFY_CODE_RE.test(cleaned) ? cleaned : null;
}

/** مسار صفحة التحقّق العلنيّة مع الرمز جاهزًا للمشاركة. */
export function verifyPath(lang: "ar" | "en", code: string): string {
  const base = lang === "en" ? "/en/verify.html" : "/verify.html";
  return `${base}?code=${encodeURIComponent(formatVerifyCode(code))}`;
}

// ---------------------------------------------------------------------------
// الإصدار
// ---------------------------------------------------------------------------

export interface IssueCertificateInput {
  kind: CertificateKind;
  userId: string;
  courseId?: string | null;
  stageId?: string | null;
  titleAr: string;
  titleEn: string;
  isnadAr?: string | null;
  isnadEn?: string | null;
  grantedByAr?: string | null;
  grantedByEn?: string | null;
  issuedAt?: Date;
  issuedById?: string | null;
  pdfUrl?: string | null;
}

export interface IssuedCertificate {
  id: string;
  serial: string;
  verifyCode: string;
}

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

const MAX_ISSUE_ATTEMPTS = 8;

/**
 * يُصدر شهادةً أو إجازة برقم توثيقٍ ورمز تحقّقٍ مولَّدين آليًّا.
 *
 * `serial` و`verifyCode` كلاهما `@unique`؛ ومحرّران يُصدران في اللحظة نفسها قد
 * يحسبان التسلسل نفسه. القاعدة هي الحَكَم: نحاول الإدراج، فإن ردّت بتصادم
 * (P2002) أعدنا الحساب والتوليد بدل أن نُخفق في وجه المحرّر.
 */
export async function issueCertificate(input: IssueCertificateInput): Promise<IssuedCertificate> {
  const issuedAt = input.issuedAt ?? new Date();
  const year = issuedAt.getUTCFullYear();

  for (let attempt = 0; attempt < MAX_ISSUE_ATTEMPTS; attempt++) {
    const seq = await nextSerialSeq(year);
    try {
      return await prisma.certificate.create({
        data: {
          kind: input.kind,
          userId: input.userId,
          courseId: input.courseId || null,
          stageId: input.stageId || null,
          titleAr: input.titleAr,
          titleEn: input.titleEn,
          serial: formatSerial(year, seq),
          verifyCode: generateVerifyCode(),
          isnadAr: input.isnadAr || null,
          isnadEn: input.isnadEn || null,
          grantedByAr: input.grantedByAr || null,
          grantedByEn: input.grantedByEn || null,
          issuedAt,
          issuedById: input.issuedById || null,
          pdfUrl: input.pdfUrl || null,
        },
        select: { id: true, serial: true, verifyCode: true },
      });
    } catch (e) {
      if (!isUniqueViolation(e)) throw e;
      // تصادمٌ على الرقم أو الرمز — دورةٌ أخرى بحسابٍ وتوليدٍ جديدين.
    }
  }
  throw new Error("CERTIFICATE_ISSUE_COLLISION");
}

// ---------------------------------------------------------------------------
// التحقّق العلنيّ
// ---------------------------------------------------------------------------

/**
 * ما يجوز عرضه لمن يفتح صفحة التحقّق بلا تسجيل دخول.
 *
 * لاحِظ ما ليس فيه: لا `id` ولا `userId` ولا بريد ولا هاتف ولا رقم جامعيّ ولا
 * `issuedById` ولا `revokeNote` (قد تحوي سببًا داخليًّا لا يخصّ العموم).
 */
export interface PublicCertificate {
  kind: CertificateKind;
  holderName: string;
  titleAr: string;
  titleEn: string;
  serial: string;
  verifyCode: string;
  issuedAt: Date;
  courseAr: string | null;
  courseEn: string | null;
  stageAr: string | null;
  stageEn: string | null;
  isnadAr: string | null;
  isnadEn: string | null;
  grantedByAr: string | null;
  grantedByEn: string | null;
}

export type VerifyResult =
  | { status: "valid"; certificate: PublicCertificate }
  | { status: "revoked"; certificate: PublicCertificate }
  | { status: "unknown" };

/**
 * يبحث عن وثيقةٍ برمز تحقّقها ويرجع بيانات العرض العلنيّ وحدها.
 *
 * الرمز المشوَّه الصيغة والرمز غير الموجود يرجعان الحالة نفسها (`unknown`)
 * عمدًا: التفريق بينهما يخبر المخمِّن أنّ صيغته صحيحة وأنّ عليه المضيّ.
 */
export async function verifyCertificate(rawCode: string | null | undefined): Promise<VerifyResult> {
  const code = normalizeVerifyCode(rawCode);
  if (!code) return { status: "unknown" };

  const row = await prisma.certificate.findUnique({
    where: { verifyCode: code },
    // انتقاءٌ صريح — لا كائن Prisma كامل ولا `include` للمستخدم.
    select: {
      kind: true,
      titleAr: true,
      titleEn: true,
      serial: true,
      verifyCode: true,
      issuedAt: true,
      revoked: true,
      isnadAr: true,
      isnadEn: true,
      grantedByAr: true,
      grantedByEn: true,
      user: { select: { name: true } },
      course: { select: { titleAr: true, titleEn: true } },
      stage: { select: { titleAr: true, titleEn: true } },
    },
  });
  if (!row) return { status: "unknown" };

  const certificate: PublicCertificate = {
    kind: row.kind,
    holderName: row.user.name,
    titleAr: row.titleAr,
    titleEn: row.titleEn,
    serial: row.serial,
    verifyCode: row.verifyCode,
    issuedAt: row.issuedAt,
    courseAr: row.course?.titleAr ?? null,
    courseEn: row.course?.titleEn ?? null,
    stageAr: row.stage?.titleAr ?? null,
    stageEn: row.stage?.titleEn ?? null,
    isnadAr: row.isnadAr,
    isnadEn: row.isnadEn,
    grantedByAr: row.grantedByAr,
    grantedByEn: row.grantedByEn,
  };

  return row.revoked ? { status: "revoked", certificate } : { status: "valid", certificate };
}

// ---------------------------------------------------------------------------
// وثائق الطالب (بوابة الطالب)
// ---------------------------------------------------------------------------

/** وثائق طالبٍ بعينه — تُستدعى داخل بوابته بعد التحقّق من جلسته. */
export async function getStudentCertificates(userId: string) {
  return prisma.certificate.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
    select: {
      id: true,
      kind: true,
      titleAr: true,
      titleEn: true,
      serial: true,
      verifyCode: true,
      issuedAt: true,
      revoked: true,
      pdfUrl: true,
      isnadAr: true,
      isnadEn: true,
      grantedByAr: true,
      grantedByEn: true,
      course: { select: { titleAr: true, titleEn: true } },
      stage: { select: { titleAr: true, titleEn: true } },
    },
  });
}

export type StudentCertificate = Awaited<ReturnType<typeof getStudentCertificates>>[number];
