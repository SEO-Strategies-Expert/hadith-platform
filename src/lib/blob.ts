/**
 * رفع الملفات إلى Vercel Blob بما يعمل مع المخزن العامّ والخاصّ معًا.
 *
 * مخزن الكلّية الحالي **خاصّ (Private)**: الرفع بوصول عام يفشل، والرابط المباشر
 * يرجع 403. فبدل تعطيل الرفع، نرفع بوصول خاصّ ونقدّم الملفّ عبر مسار من موقعنا:
 *   - صور الموقع  → `/api/blob/media/...` (عام، يخدمه الخادم بترويسة تخزين مؤقّت).
 *   - ملفات الأبحاث → `/api/admin/files/...` (يتطلّب جلسة — لا تُسرَّب للعموم).
 * ولو حوّل الفريق المخزن إلى Public لاحقًا، يعود الرفع العام تلقائيًّا بلا تغيير كود.
 */
import { put, issueSignedToken, presignUrl } from "@vercel/blob";

export const MEDIA_PREFIX = "media/";
export const SUBMISSION_PREFIX = "submissions/";

export interface StoredFile {
  /** المسار داخل المخزن — هو المفتاح المخزَّن في قاعدة البيانات. */
  pathname: string;
  /** الرابط الذي يُوضع في صفحات الموقع (مسار من موقعنا عند المخزن الخاصّ). */
  url: string;
  access: "public" | "private";
}

function isPrivateStoreError(e: unknown): boolean {
  return String((e as Error)?.message ?? e).includes("private store");
}

/** اسم ملفٍ آمن للمسار مع الحفاظ على الامتداد. */
export function safeName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return cleaned.length > 80 ? cleaned.slice(-80) : cleaned || "file";
}

export async function uploadFile(
  prefix: string,
  file: File | Blob,
  filename: string
): Promise<StoredFile> {
  const pathname = `${prefix}${Date.now()}-${safeName(filename)}`;

  // ملفات المشاركات خاصّة دائمًا حتى لو كان المخزن عامًّا.
  if (prefix === SUBMISSION_PREFIX) {
    const blob = await put(pathname, file, { access: "private", addRandomSuffix: true });
    return { pathname: blob.pathname, url: `/api/admin/files/${blob.pathname}`, access: "private" };
  }

  try {
    const blob = await put(pathname, file, { access: "public", addRandomSuffix: true });
    return { pathname: blob.pathname, url: blob.url, access: "public" };
  } catch (e) {
    if (!isPrivateStoreError(e)) throw e;
    const blob = await put(pathname, file, { access: "private", addRandomSuffix: true });
    return { pathname: blob.pathname, url: `/api/blob/${blob.pathname}`, access: "private" };
  }
}

/** رابط تنزيل موقَّع قصير العمر لملفٍّ خاصّ. */
export async function signedUrlFor(pathname: string, seconds = 300): Promise<string> {
  const signed = await issueSignedToken({
    pathname,
    operations: ["get"],
    validUntil: Date.now() + seconds * 1000,
  });
  const { presignedUrl } = await presignUrl(signed, {
    operation: "get",
    pathname,
    access: "private",
  });
  return presignedUrl;
}
