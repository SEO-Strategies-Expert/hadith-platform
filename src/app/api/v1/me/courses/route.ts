/**
 * مقرّرات الطالب ونِسب تقدّمه.
 *
 * المصدر `getStudentCourses` من `lib/lms.ts` — لا نعيد كتابة استعلامه ولا
 * نحسب النسبة هنا: `progressPct` محفوظ في سجلّ التسجيل ويُعاد حسابه في
 * `setLessonDone`، فقراءته أصدق من إعادة اشتقاقه في مكانٍ ثانٍ قد يختلف.
 *
 * الترقيم على القائمة المُعادة (لا على الاستعلام): تسجيلات الطالب مجموعةٌ
 * صغيرة مقيَّدة به أصلًا، والمقصود تحديد حجم الردّ لا تخفيف الاستعلام.
 */
import { getStudentCourses } from "@/lib/lms";
import { requireApiUser } from "@/lib/api-auth";
import { ok, fail } from "../../_lib";
import { cors, preflight, paging, slicePage } from "../../_http";
import { courseCard } from "../../_dto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

export async function GET(req: Request) {
  try {
    const id = await requireApiUser(req);
    const enrollments = await getStudentCourses(id.userId);
    const { items, nextCursor } = slicePage(enrollments, paging(req));

    return cors(
      req,
      ok({
        items: items.map((e) => ({
          enrollmentId: e.id,
          status: e.status,
          feeOption: e.feeOption,
          progressPct: e.progressPct,
          enrolledAt: e.enrolledAt,
          completedAt: e.completedAt,
          course: courseCard(e.course),
        })),
        nextCursor,
      }),
      "app",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
