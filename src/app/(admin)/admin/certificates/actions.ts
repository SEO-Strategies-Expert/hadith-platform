"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { issueCertificate } from "@/lib/certificates";

/**
 * إجراءات الشهادات والإجازات.
 *
 * الإصدار والإلغاء عمليّتان حسّاستان: كلٌّ منهما يبدأ بـ`requireUser()` **في
 * الإجراء نفسه** لا في الصفحة وحدها، لأنّ server action نقطةُ دخولٍ مستقلّة
 * تُستدعى بطلبٍ مباشر بلا مرورٍ بالصفحة.
 *
 * ولا حذف هنا عمدًا: الوثيقة قد شُوركت خارج المنصّة برمز تحقّقها، وحذفها يجعل
 * التحقّق منها يقول «لا وجود لها» بدل «أُلغيت» — وبين الجوابين فرقٌ كبير.
 */

const issueSchema = z.object({
  kind: z.enum(["CERTIFICATE", "IJAZA"]),
  userId: z.string().trim().min(1, "اختر الطالب صاحب الوثيقة."),
  titleAr: z.string().trim().min(1, "عنوان الوثيقة بالعربية مطلوب."),
  titleEn: z.string().trim().min(1, "عنوان الوثيقة بالإنجليزية مطلوب."),
  courseId: z.string().optional(),
  stageId: z.string().optional(),
  isnadAr: z.string().optional(),
  isnadEn: z.string().optional(),
  grantedByAr: z.string().optional(),
  grantedByEn: z.string().optional(),
});

function optionalText(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

export async function createCertificate(
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const admin = await requireUser();

  const parsed = issueSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0].message;
  const d = parsed.data;

  // لا تُصدر وثيقةٌ إلّا لحسابِ طالب — الحقل قائمةُ اختيار، والقائمة ليست حارسًا.
  const holder = await prisma.user.findUnique({
    where: { id: d.userId },
    select: { id: true, role: true },
  });
  if (!holder) return "الطالب المحدَّد غير موجود.";
  if (holder.role !== "STUDENT") return "الوثائق تُصدَر لحسابات الطلاب فقط.";

  const isnadAr = optionalText(d.isnadAr);
  const grantedByAr = optionalText(d.grantedByAr);
  // الإجازة المسنَدة سندٌ متّصلٌ عن شيخ؛ إجازةٌ بلا سندٍ ولا مُجيزٍ ليست إجازة.
  if (d.kind === "IJAZA" && !isnadAr) return "نصّ السند بالعربية مطلوب للإجازة المسنَدة.";
  if (d.kind === "IJAZA" && !grantedByAr) return "اسم المُجيز بالعربية مطلوب للإجازة المسنَدة.";

  const courseId = optionalText(d.courseId);
  const stageId = optionalText(d.stageId);
  if (courseId && !(await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } }))) {
    return "المقرّر المحدَّد غير موجود.";
  }
  if (stageId && !(await prisma.programStage.findUnique({ where: { id: stageId }, select: { id: true } }))) {
    return "المرحلة المحدَّدة غير موجودة.";
  }

  let issuedId: string;
  try {
    const issued = await issueCertificate({
      kind: d.kind,
      userId: holder.id,
      courseId,
      stageId,
      titleAr: d.titleAr,
      titleEn: d.titleEn,
      isnadAr,
      isnadEn: optionalText(d.isnadEn),
      grantedByAr,
      grantedByEn: optionalText(d.grantedByEn),
      issuedById: admin.id ?? null,
    });
    issuedId = issued.id;
  } catch (e) {
    console.error("[certificates] تعذّر إصدار الوثيقة", e);
    return "تعذّر إصدار الوثيقة. أعد المحاولة، فإن تكرّر الأمر فراجع سجلّ الأخطاء.";
  }

  revalidatePath("/admin/certificates");
  // إلى صفحة الوثيقة ليرى المحرّر رقم التوثيق ورمز التحقّق المولَّدين.
  redirect(`/admin/certificates/${issuedId}?issued=1`);
}

export async function issueCourseCertificates(
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  const admin = await requireUser();
  const courseId = String(formData.get("courseId") ?? "").trim();
  const titleAr = String(formData.get("titleAr") ?? "").trim();
  const titleEn = String(formData.get("titleEn") ?? "").trim();
  if (!courseId) return "اختر المقرر.";
  if (!titleAr || !titleEn) return "أدخل عنوان الشهادة باللغتين.";
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { enrollments: { where: { status: "COMPLETED" }, select: { userId: true } } },
  });
  if (!course) return "المقرر غير موجود.";
  if (!course.enrollments.length) return "لا يوجد طلاب أكملوا هذا المقرر بعد.";
  const existing = await prisma.certificate.findMany({ where: { courseId, userId: { in: course.enrollments.map(e => e.userId) }, revoked: false }, select: { userId: true } });
  const issued = new Set(existing.map(c => c.userId));
  const targets = course.enrollments.filter(e => !issued.has(e.userId));
  if (!targets.length) return "سبق إصدار شهادات لكل الطلاب المكتملين في هذا المقرر.";
  for (const enrollment of targets) {
    await issueCertificate({ kind: "CERTIFICATE", userId: enrollment.userId, courseId, titleAr, titleEn, issuedById: admin.id ?? null });
  }
  revalidatePath("/admin/certificates");
  redirect(`/admin/certificates?batch=${targets.length}`);
}

export async function revokeCertificate(
  id: string,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  await requireUser();

  const note = String(formData.get("revokeNote") ?? "").trim();
  // سببٌ مكتوبٌ شرطٌ للإلغاء: الوثيقة الملغاة تبقى في السجلّ، ومن يراجعها
  // بعد سنةٍ يحتاج أن يعرف لِمَ أُلغيت.
  if (note.length < 5) return "اكتب سبب الإلغاء (خمسة أحرف فأكثر) — يُحفظ في سجلّ الوثيقة.";
  if (formData.get("confirmRevoke") !== "on") return "أكِّد أنّك تقصد إلغاء هذه الوثيقة.";

  const cert = await prisma.certificate.findUnique({ where: { id }, select: { revoked: true } });
  if (!cert) return "الوثيقة غير موجودة.";
  if (cert.revoked) return "الوثيقة ملغاة أصلًا.";

  await prisma.certificate.update({ where: { id }, data: { revoked: true, revokeNote: note } });

  revalidatePath("/admin/certificates");
  revalidatePath(`/admin/certificates/${id}`);
  redirect(`/admin/certificates/${id}?revoked=1`);
}

/** تراجعٌ عن إلغاءٍ وقع خطأً — يمحو الأثر بالكامل ليعود التحقّق صحيحًا. */
export async function restoreCertificate(
  id: string,
  _prev: string | undefined,
  _formData: FormData
): Promise<string | undefined> {
  await requireUser();

  const cert = await prisma.certificate.findUnique({ where: { id }, select: { revoked: true } });
  if (!cert) return "الوثيقة غير موجودة.";
  if (!cert.revoked) return "الوثيقة سارية أصلًا.";

  await prisma.certificate.update({ where: { id }, data: { revoked: false, revokeNote: null } });

  revalidatePath("/admin/certificates");
  revalidatePath(`/admin/certificates/${id}`);
  redirect(`/admin/certificates/${id}?restored=1`);
}
