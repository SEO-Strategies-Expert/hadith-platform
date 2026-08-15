"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PAYMENT_STATUSES, PAYMENT_METHODS, DEFAULT_CURRENCY } from "@/lib/payments";

/**
 * إجراءات السجلّ الماليّ اليدويّ.
 *
 * لا بوّابة دفع في المنصّة: هذه الشاشة تدوّن ما وصل الكلّية فعلًا (تحويل،
 * نقدًا) أو ما أُعفي منه الطالب. لذلك لا يُنشئ شيءٌ هنا عمليّةَ سدادٍ ولا
 * يمسّ `provider`/`providerRef` — هما محجوزان لبوّابةٍ تُضاف لاحقًا.
 */

const STATUS_VALUES = PAYMENT_STATUSES.map((s) => s.value) as [string, ...string[]];
const METHOD_VALUES = PAYMENT_METHODS.map((m) => m.value) as [string, ...string[]];

/**
 * المبلغ يبقى **نصًّا** من النموذج حتّى القاعدة.
 * تحويله إلى `number` وسطًا يُدخل خطأ الفاصلة العائمة في حقلٍ عشريٍّ دقيق،
 * وPrisma يقبل النصّ لحقل `Decimal` فيحفظه كما هو.
 */
const amountField = z
  .string()
  .trim()
  .min(1, "أدخل المبلغ")
  .regex(/^\d{1,8}(\.\d{1,2})?$/, "المبلغ يُكتب رقمًا موجبًا بمنزلتين عشريّتين على الأكثر (مثل 1500.00).");

const baseSchema = z.object({
  amount: amountField,
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "رمز العملة ثلاثة أحرف (مثل QAR).")
    .default(DEFAULT_CURRENCY),
  status: z.enum(STATUS_VALUES),
  method: z.string().trim().optional(),
  enrollmentId: z.string().trim().optional(),
  paidAt: z.string().trim().optional(),
  note: z.string().trim().optional(),
});

const createSchema = baseSchema.extend({
  userId: z.string().trim().min(1, "اختر الطالب"),
});

type Parsed = z.infer<typeof baseSchema>;

/**
 * `datetime-local` يصل نصًّا فارغًا حين لا يُملأ — والفراغ ليس تاريخًا.
 * ويصل بلا منطقةٍ زمنيّة، فنقرؤه توقيتًا عالميًّا لا توقيتَ خادم: بقيّة
 * اللوحة والموقع تعرض التواريخ بـ`getUTC*`، فلو قرأناه محلّيًّا لعاد التاريخ
 * إلى شاشة التعديل مزاحًا بساعات.
 */
const LOCAL_DT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

function parseDate(v: string | undefined): Date | null {
  if (!v) return null;
  const iso = LOCAL_DT.test(v) ? `${v.length === 16 ? `${v}:00` : v}Z` : v;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * قاعدة الاتّساق: دفعةٌ «مسدَّدة» بلا تاريخِ سدادٍ سجلٌّ ناقص لا يُدقَّق لاحقًا.
 * فإن تُرك الحقل فارغًا ختمناه بوقت الحفظ بدل قبول الفراغ.
 * وما عدا `PAID` يبقى التاريخ اختياريًّا كما أدخلته الإدارة.
 */
function resolvePaidAt(status: string, raw: string | undefined): Date | null {
  const given = parseDate(raw);
  if (status === "PAID") return given ?? new Date();
  return given;
}

function normalizeMethod(v: string | undefined): string | null {
  if (!v) return null;
  return METHOD_VALUES.includes(v) ? v : null;
}

/** التسجيل المنسوب إليه المبلغ يجب أن يكون تسجيلَ الطالب نفسه. */
async function resolveEnrollment(
  userId: string,
  enrollmentId: string | undefined
): Promise<{ ok: true; value: string | null } | { ok: false; error: string }> {
  if (!enrollmentId) return { ok: true, value: null };
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: { userId: true },
  });
  if (!enrollment) return { ok: false, error: "سجلّ التسجيل غير موجود." };
  if (enrollment.userId !== userId) {
    return { ok: false, error: "التسجيل المختار يخصّ طالبًا آخر — لا يُنسب إليه هذا المبلغ." };
  }
  return { ok: true, value: enrollmentId };
}

function commonData(parsed: Parsed, enrollmentId: string | null) {
  return {
    amount: parsed.amount, // نصًّا إلى `Decimal` — بلا مرورٍ بالعائم
    currency: parsed.currency,
    status: parsed.status as "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "WAIVED",
    method: normalizeMethod(parsed.method),
    enrollmentId,
    paidAt: resolvePaidAt(parsed.status, parsed.paidAt),
    note: parsed.note || null,
  };
}

export async function createPayment(
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0].message;

  const student = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { role: true },
  });
  if (!student || student.role !== "STUDENT") return "الحساب المختار ليس حساب طالب.";

  const enrollment = await resolveEnrollment(parsed.data.userId, parsed.data.enrollmentId);
  if (!enrollment.ok) return enrollment.error;

  await prisma.payment.create({
    data: { userId: parsed.data.userId, ...commonData(parsed.data, enrollment.value) },
  });

  revalidatePath("/admin/payments");
  redirect("/admin/payments");
}

export async function updatePayment(
  id: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();
  const parsed = baseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0].message;

  const current = await prisma.payment.findUnique({ where: { id }, select: { userId: true } });
  if (!current) return "الدفعة غير موجودة.";

  // الطالب لا يُبدَّل بعد الإنشاء: نقل مبلغٍ من ذمّة طالبٍ إلى آخر يفسد سجلَّين معًا.
  const enrollment = await resolveEnrollment(current.userId, parsed.data.enrollmentId);
  if (!enrollment.ok) return enrollment.error;

  await prisma.payment.update({
    where: { id },
    data: commonData(parsed.data, enrollment.value),
  });

  revalidatePath("/admin/payments");
  redirect("/admin/payments");
}

export async function deletePayment(id: string) {
  await requireUser();
  await prisma.payment.delete({ where: { id } });
  revalidatePath("/admin/payments");
}
