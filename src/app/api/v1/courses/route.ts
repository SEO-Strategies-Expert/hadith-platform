// قائمة المقرّرات المنشورة — عامّة بلا مصادقة، وهي نفسها ما يعرضه الموقع.
import { prisma } from "@/lib/prisma";
import { ok, fail } from "../_lib";
import { cors, preflight, paging, cursorArgs, page, query } from "../_http";
import { courseCard } from "../_dto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "public", METHODS);
}

export async function GET(req: Request) {
  try {
    const { limit, cursor } = paging(req);
    const stage = query(req, "stage");

    const rows = await prisma.course.findMany({
      // «المنشورة الظاهرة»: شرطان لا واحد — `published` قرار المحرّر،
      // و`visible` مفتاح الإخفاء السريع.
      where: {
        published: true,
        visible: true,
        // نقبل مفتاح المرحلة (`foundation`) ومعرّفها معًا؛ التطبيق قد يملك أيّهما.
        ...(stage ? { OR: [{ stageId: stage }, { stage: { key: stage } }] } : {}),
      },
      orderBy: [{ order: "asc" }, { id: "asc" }],
      take: limit + 1,
      ...cursorArgs(cursor),
      select: {
        id: true,
        titleAr: true,
        titleEn: true,
        descAr: true,
        descEn: true,
        summaryAr: true,
        summaryEn: true,
        category: true,
        metaAr: true,
        metaEn: true,
        imageUrl: true,
        hours: true,
        startsOn: true,
        stage: { select: { id: true, key: true, titleAr: true, titleEn: true, numAr: true, numEn: true } },
        instructor: { select: { id: true, nameAr: true, nameEn: true, rankAr: true, rankEn: true, photoUrl: true } },
      },
    });

    const { items, nextCursor } = page(rows, limit);

    // عدّ الدروس المرئيّة داخل الوحدات المرئيّة. الدرس لا يحمل `courseId`،
    // فنعدّه على مستوى الوحدة ثمّ نجمع — استعلامٌ واحد لكل الصفحة لا لكل مقرّر.
    const counts = new Map<string, number>();
    if (items.length) {
      const modules = await prisma.module.findMany({
        where: { visible: true, courseId: { in: items.map((c) => c.id) } },
        select: { courseId: true, _count: { select: { lessons: { where: { visible: true } } } } },
      });
      for (const m of modules) {
        counts.set(m.courseId, (counts.get(m.courseId) ?? 0) + m._count.lessons);
      }
    }

    return cors(
      req,
      ok({ items: items.map((c) => courseCard(c, counts.get(c.id) ?? 0)), nextCursor }),
      "public",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "public", METHODS);
  }
}
