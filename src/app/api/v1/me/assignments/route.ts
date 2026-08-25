/**
 * واجبات الطالب في مقرّراته الفعّالة، وحالة تسليمه في كلٍّ منها.
 *
 * شرط الوصول مبنيّ في الاستعلام نفسه لا مضافًا بعده: لا تُجلب إلّا واجبات
 * مقرّرٍ للطالب فيه تسجيلٌ فعّال. و`submissions` مفلترة بـ`userId` — لولا
 * ذلك لجاءت تسليمات زملائه مع الواجب.
 */
import { prisma } from "@/lib/prisma";
import { requireApiUser } from "@/lib/api-auth";
import { ACTIVE_ENROLLMENT } from "@/lib/lms";
import { ok, fail } from "../../_lib";
import { cors, preflight, paging, cursorArgs, page, query } from "../../_http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

export async function GET(req: Request) {
  try {
    const id = await requireApiUser(req);
    const { limit, cursor } = paging(req);
    const courseId = query(req, "courseId");

    const rows = await prisma.assignment.findMany({
      where: {
        visible: true,
        ...(courseId ? { courseId } : {}),
        course: {
          enrollments: { some: { userId: id.userId, status: { in: [...ACTIVE_ENROLLMENT] } } },
        },
      },
      orderBy: [{ dueAt: "asc" }, { order: "asc" }, { id: "asc" }],
      take: limit + 1,
      ...cursorArgs(cursor),
      select: {
        id: true,
        titleAr: true,
        titleEn: true,
        descAr: true,
        descEn: true,
        dueAt: true,
        maxScore: true,
        course: { select: { id: true, titleAr: true, titleEn: true } },
        submissions: {
          where: { userId: id.userId },
          // **لا `gradedById`**: معرّف المصحِّح شأنٌ داخليّ لا يخصّ الطالب.
          select: {
            id: true,
            state: true,
            text: true,
            fileUrl: true,
            fileName: true,
            submittedAt: true,
            score: true,
            feedback: true,
            gradedAt: true,
          },
        },
      },
    });

    const { items, nextCursor } = page(rows, limit);

    return cors(
      req,
      ok({
        items: items.map(({ submissions, ...a }) => ({
          ...a,
          submission: submissions[0] ?? null,
          // المتأخّر يُعلَّم ولا يُمنع: قبول المتأخّر قرارٌ إداريّ لا تقنيّ.
          overdue: Boolean(a.dueAt && a.dueAt < new Date() && !submissions[0]?.submittedAt),
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
