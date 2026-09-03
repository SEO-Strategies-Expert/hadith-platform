import { prisma } from "@/lib/prisma";
import type { Lang } from "@/lib/site-data";

/**
 * روابط المقرّرات الصديقة لمحرّكات البحث:
 * `/course/دورة-مصطلح-الحديث-التطبيقي` بدل `/course/cmthkrkcx0002a0cz0m86t29n`.
 * الشرطات بدل المسافات، والتشكيل والتطويل يُحذفان، والروابط القديمة بالـid
 * تبقى عاملة (تُحوَّل 301 إلى الرابط الجديد).
 */

/** يشكّل، تطويل، وعلامات لا تنطق — تُحذف قبل التوليد. */
const SILENT = /[ً-ٰٟـ]/g;

/** همزات الألف تُطبَّع — «مقدّمة ابن الصلاح» لا «مقدّمة إبن الصلاح». */
function normalizeAr(s: string): string {
  return s
    .replace(SILENT, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();
}

/** عنوان عربي ← «دورة-مصطلح-الحديث-التطبيقي». عنوان لاتيني ← kebab-case معتاد. */
export function slugifyCourseTitle(titleAr: string, titleEn: string): string {
  const ar = normalizeAr(titleAr);
  const hasAr = /[\u0600-\u06FF]/.test(ar);
  if (hasAr) {
    return ar
      .split(/\s+/)
      .map((w) => w.replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, ""))
      .filter(Boolean)
      .join("-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 120);
  }
  return titleEn
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

/** slug فريد: «…-2»، «…-3» عند التصادم (باستثناء سجلّ بعينه عند التحرير). */
export async function uniqueCourseSlug(base: string, excludeId?: string): Promise<string> {
  const clean = base || "course";
  let candidate = clean;
  for (let n = 2; ; n++) {
    const clash = await prisma.course.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!clash || clash.id === excludeId) return candidate;
    candidate = `${clean}-${n}`;
    if (n > 99) return `${clean}-${Date.now().toString(36)}`;
  }
}

/** من عنوانَي المقرّر إلى slug فريد جاهز للحفظ. */
export async function courseSlugFor(titleAr: string, titleEn: string, excludeId?: string): Promise<string> {
  return uniqueCourseSlug(slugifyCourseTitle(titleAr, titleEn) || "course", excludeId);
}

/** الرابط العام للمقرّر: slug أولًا، ثم id احتياطًا (كما في newsHref). */
export function courseHref(_lang: Lang, c: { slug: string | null; id: string }): string {
  return `course/${c.slug || c.id}`;
}

/** مقارنة معرّف المسار مع slug مخزَّن — أيًّا كانت صيغة الترميز الواردة. */
export function isSlugMatch(slugOrId: string, slug: string): boolean {
  if (slugOrId === slug) return true;
  try {
    return decodeURIComponent(slugOrId) === slug;
  } catch {
    return false;
  }
}
/** حلّ معرّف المسار: slug أولًا ثم id — فالروابط القديمة لا تنكسر. */
export async function getCourseBySlugOrId(slugOrId: string) {
  let decoded = slugOrId;
  try {
    decoded = decodeURIComponent(slugOrId);
  } catch {
    /* معرّف خام فيه ٪ — نجرّبه كما هو */
  }
  return (
    (await prisma.course.findUnique({
      where: { slug: decoded },
      include: { stage: true, instructor: true },
    })) ??
    (await prisma.course.findUnique({
      where: { id: slugOrId },
      include: { stage: true, instructor: true },
    }))
  );
}
