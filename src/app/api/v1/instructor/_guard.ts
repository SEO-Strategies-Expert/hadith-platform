/**
 * حارس لوحة الأكاديميين في طبقة API.
 *
 * لماذا حارسٌ مستقلّ لا `requireInstructor` من `lib/instructor.ts`؟ لأنّ ذاك
 * يقرأ **كعكة NextAuth** عبر `currentUser()`، والتطبيق لا يحمل كعكة أصلًا بل
 * رمز `Bearer`. فالمصدر مختلف، والنتيجة المطلوبة واحدة.
 *
 * ثلاثة قرارات مقصودة:
 *
 *  ١) **الدور يُقرأ من القاعدة لا من الرمز.** رمز الوصول يعيش ٣٠ دقيقة ويحمل
 *     الدور لحظةَ إصداره؛ فلو رُقّي حسابٌ إلى `INSTRUCTOR` بعد دخوله لظلّ
 *     ممنوعًا نصفَ ساعة، ولو سُحبت صلاحيّته لظلّ داخلًا نصفَ ساعة. والأهمّ:
 *     `scholarId` **ليس في الرمز إطلاقًا**، وهو مفتاح كل عزلٍ بعده — فقراءة
 *     الاثنين من مصدرٍ واحدٍ حيّ أسلم من الجمع بين مصدرين.
 *
 *  ٢) **٤٠٣ للطالب لا ٤٠١.** الرمز صحيح والهويّة ثابتة، والمرفوض هو الدور —
 *     وهذا بالضبط معنى ٤٠٣. وردّ ٤٠١ هنا يدفع التطبيق إلى دورة تجديدٍ عبثيّة.
 *
 *  ٣) **`scholarId == null` ليس منعًا.** الحساب محاضرٌ فعلًا، لكنّ الإدارة لم
 *     تربطه بملفّه في الهيئة العلميّة. فالمسارات تردّ `scholarLinked: false`
 *     بقوائم فارغة، ليعرض التطبيق رسالةً مفهومة بدل شاشةٍ خاوية محيّرة.
 */
import { prisma } from "@/lib/prisma";
import { ApiError, requireApiUser, type ApiIdentity } from "@/lib/api-auth";

export interface ApiInstructor extends ApiIdentity {
  role: "INSTRUCTOR" | "ADMIN";
  /** ملفّ عضو الهيئة. `null` = لم تربطه الإدارة بعد ⇒ لا ملكيّة لشيء. */
  scholarId: string | null;
  scholarName: string | null;
}

/**
 * يفرض أن يكون صاحب الطلب محاضرًا (أو مديرًا للتفقّد)، ويعيد معه `scholarId`.
 *
 * ⚠️ `Course.instructorId` و`LiveSession.instructorId` يشيران إلى `Scholar`
 * لا إلى `User`. فمفتاح التصفية في كل استعلامٍ بعد هذا هو `scholarId`
 * **لا** `userId` — والخلط بينهما يفتح لوحة محاضرٍ على مقرّرات غيره.
 */
export async function requireApiInstructor(req: Request): Promise<ApiInstructor> {
  const id = await requireApiUser(req); // ٤٠١ إن لم يكن ثمّة رمز صالح

  const me = await prisma.user.findUnique({
    where: { id: id.userId },
    select: {
      role: true,
      status: true,
      scholarId: true,
      scholar: { select: { nameAr: true } },
    },
  });

  if (!me || me.status !== "ACTIVE") throw new ApiError(403, "ممنوع");
  if (me.role !== "INSTRUCTOR" && me.role !== "ADMIN") {
    throw new ApiError(403, "هذه اللوحة للأكاديميين وحدهم");
  }

  return {
    ...id,
    role: me.role,
    scholarId: me.scholarId,
    scholarName: me.scholar?.nameAr ?? null,
  };
}

/**
 * ردّ الحساب غير المربوط بملفّ هيئة — قوائم فارغة وعلامةٌ صريحة.
 * تُستعمل في مسارات القوائم؛ أمّا مسارات `[id]` فتردّ ٤٠٤: بلا ملكيّةٍ أصلًا
 * لا يُقال «ممنوع» فيُفهم منها أنّ المورد موجود.
 */
export function unlinkedBody<T extends object>(extra: T): T & { scholarLinked: false } {
  return { ...extra, scholarLinked: false };
}
