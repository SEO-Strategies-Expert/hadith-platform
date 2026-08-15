/**
 * درسٌ مفرد بمحتواه ومرفقاته.
 *
 * هذا المسار **مختلط**: يفتح بلا رمز إن كان الدرس `freePreview`، ويطلب رمزًا
 * وتسجيلًا فيما عداه. ولذلك يُقرأ الرمز بـ`identityFrom` لا بـ`requireApiStudent`
 * — الأخيرة ترمي ٤٠١ قبل أن نعرف أنّ الدرس معاينةٌ مفتوحة أصلًا.
 *
 * وترتيب الفحص مقصود: نتحقّق من ظهور الدرس ووحدته ومقرّره أوّلًا، ثمّ من
 * المعاينة، ثمّ من التسجيل. درسٌ أخفاه المحرّر لا يُفتح ولو كان `freePreview`.
 */
import { prisma } from "@/lib/prisma";
import { identityFrom, ApiError } from "@/lib/api-auth";
import { isEnrolled, getCourseTree, flattenLessons, getProgressMap } from "@/lib/lms";
import { ok, fail } from "../../_lib";
import { cors, preflight, requireId } from "../../_http";
import { lessonFull, sessionForStudent } from "../../_dto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const lessonId = requireId((await ctx.params).id, "معرّف الدرس");

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        titleAr: true,
        titleEn: true,
        kind: true,
        videoUrl: true,
        bodyAr: true,
        bodyEn: true,
        sessionId: true,
        quizId: true,
        durationMin: true,
        freePreview: true,
        order: true,
        visible: true,
        attachments: {
          orderBy: { order: "asc" },
          select: { id: true, titleAr: true, titleEn: true, url: true, filename: true, sizeKb: true },
        },
        module: {
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            visible: true,
            course: { select: { id: true, titleAr: true, titleEn: true, visible: true, published: true } },
          },
        },
      },
    });

    const course = lesson?.module.course;
    if (!lesson || !lesson.visible || !lesson.module.visible || !course?.visible) {
      throw new ApiError(404, "الدرس غير موجود");
    }

    const identity = await identityFrom(req);
    const enrolled = identity ? await isEnrolled(identity.userId, course.id) : false;

    // غير المسجَّل لا يصل إلّا لمعاينةٍ في مقرّرٍ منشور — المقرّر غير المنشور
    // ورشةُ تحريرٍ لم تُفتح بعدُ لأحد.
    if (!enrolled && !(lesson.freePreview && course.published)) {
      throw new ApiError(identity ? 403 : 401, identity ? "هذا الدرس للمسجَّلين في المقرّر" : "غير مصرَّح");
    }

    // التقدّم والتنقّل والمرافق لا معنى لها لزائرٍ في معاينة، فلا تُحسب له.
    let done: boolean | null = null;
    let prev: { id: string; titleAr: string; titleEn: string } | null = null;
    let next: { id: string; titleAr: string; titleEn: string } | null = null;
    let session: ReturnType<typeof sessionForStudent> | null = null;
    let quiz: {
      id: string;
      titleAr: string;
      titleEn: string;
      passScore: number;
      timeLimitMin: number | null;
    } | null = null;

    if (enrolled && identity) {
      const tree = await getCourseTree(course.id);
      const flat = tree ? flattenLessons(tree) : [];
      const at = flat.findIndex((l) => l.id === lesson.id);
      const brief = (i: number) =>
        i >= 0 && i < flat.length
          ? { id: flat[i].id, titleAr: flat[i].titleAr, titleEn: flat[i].titleEn }
          : null;
      prev = at > 0 ? brief(at - 1) : null;
      next = at >= 0 ? brief(at + 1) : null;

      const map = await getProgressMap(identity.userId, [lesson.id]);
      done = map.get(lesson.id) ?? false;

      if (lesson.sessionId) {
        const row = await prisma.liveSession.findUnique({
          where: { id: lesson.sessionId },
          // **بلا `zoomStartUrl`** — رابط المضيف لا يُقرأ هنا فضلًا عن أن يُرسل.
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            descAr: true,
            descEn: true,
            startsAt: true,
            endsAt: true,
            durationMin: true,
            provider: true,
            joinUrl: true,
            passcode: true,
            recordingUrl: true,
            recordingPasscode: true,
            isPublic: true,
            visible: true,
            course: { select: { id: true, titleAr: true, titleEn: true } },
            instructor: { select: { id: true, nameAr: true, nameEn: true, rankAr: true, rankEn: true, photoUrl: true } },
          },
        });
        session = row && row.visible ? sessionForStudent(row) : null;
      }

      if (lesson.quizId) {
        quiz = await prisma.quiz.findFirst({
          where: { id: lesson.quizId, visible: true },
          select: { id: true, titleAr: true, titleEn: true, passScore: true, timeLimitMin: true },
        });
      }
    }

    return cors(
      req,
      ok({
        ...lessonFull(lesson, done),
        module: { id: lesson.module.id, titleAr: lesson.module.titleAr, titleEn: lesson.module.titleEn },
        course: { id: course.id, titleAr: course.titleAr, titleEn: course.titleEn },
        enrolled,
        prev,
        next,
        session,
        quiz,
      }),
      "app",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
