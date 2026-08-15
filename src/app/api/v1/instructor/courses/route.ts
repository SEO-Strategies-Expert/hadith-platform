/**
 * مقرّرات المحاضر — `GET /api/v1/instructor/courses`.
 *
 * العزل كلّه في `getInstructorCourses`: `instructorId = scholarId` داخل
 * `where` نفسه. لا تصفية بعد الجلب، ولا معرّفٌ آتٍ من العميل يدخل الاستعلام.
 *
 * عدد الدروس ليس في استعلام المكتبة (فيها الوحدات والطلاب والمجالس)، فيُجلب
 * هنا باستعلامٍ ثانٍ مقيَّدٍ بمعرّفات **صفحة المقرّرات المملوكة أصلًا** — أي
 * أنّه لا يوسّع ما يُرى، بل يعدّ داخل ما رُئي.
 */
import { prisma } from "@/lib/prisma";
import { getInstructorCourses } from "@/lib/instructor";
import { ok, fail } from "../../_lib";
import { cors, preflight, paging, slicePage } from "../../_http";
import { requireApiInstructor, unlinkedBody } from "../_guard";
import { instructorCourseCard } from "../_dto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

export async function GET(req: Request) {
  try {
    const me = await requireApiInstructor(req);

    if (!me.scholarId) {
      return cors(req, ok(unlinkedBody({ items: [], nextCursor: null })), "app", METHODS);
    }

    const all = await getInstructorCourses(me.scholarId);
    const { items, nextCursor } = slicePage(all, paging(req));

    // عدّ دروس صفحةٍ واحدة: الدروس تتبع الوحدات لا المقرّر مباشرةً.
    const moduleCounts = await prisma.module.findMany({
      where: { courseId: { in: items.map((c) => c.id) } },
      select: { courseId: true, _count: { select: { lessons: true } } },
    });
    const lessonsPerCourse = new Map<string, number>();
    for (const m of moduleCounts) {
      lessonsPerCourse.set(m.courseId, (lessonsPerCourse.get(m.courseId) ?? 0) + m._count.lessons);
    }

    return cors(
      req,
      ok({
        scholarLinked: true,
        items: items.map((c) => instructorCourseCard(c, lessonsPerCourse.get(c.id) ?? 0)),
        nextCursor,
      }),
      "app",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
