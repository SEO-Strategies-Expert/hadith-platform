/**
 * ملخّص لوحة المحاضر — `GET /api/v1/instructor/summary`.
 *
 * نداءٌ واحد للشاشة الرئيسة: عدد المقرّرات، وعدد الطلاب المتمايزين، والواجبات
 * المنتظرة للتصحيح، والمجلس القادم. كلّها من `getInstructorOverview` في
 * استعلامٍ متوازٍ واحد، تفاديًا لأربع رحلاتٍ من التطبيق.
 *
 * الاسم يُعاد ليُخاطَب المحاضر باسمه في الترويسة، و`scholarLinked` يقول
 * للتطبيق صراحةً: هذا حسابٌ لم تربطه الإدارة بملفّ هيئة بعد — فيعرض رسالةً
 * مفهومة بدل أصفارٍ يظنّها المحاضر نتيجةَ عملٍ لا خللَ إعداد.
 *
 * **لا `zoomStartUrl` هنا**: `nextSessionBrief` لا تحمله، وزرّ البدء موضعه
 * شاشة المجلس وحدها.
 */
import { getInstructorOverview } from "@/lib/instructor";
import { ok, fail } from "../../_lib";
import { cors, preflight } from "../../_http";
import { requireApiInstructor, unlinkedBody } from "../_guard";
import { nextSessionBrief } from "../_dto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

export async function GET(req: Request) {
  try {
    const me = await requireApiInstructor(req);

    const identity = {
      name: me.name,
      role: me.role,
      scholarName: me.scholarName,
    };

    if (!me.scholarId) {
      return cors(
        req,
        ok(
          unlinkedBody({
            ...identity,
            coursesCount: 0,
            studentsCount: 0,
            pendingGrading: 0,
            nextSession: null,
          })
        ),
        "app",
        METHODS
      );
    }

    const { coursesCount, studentsCount, pendingGrading, nextSession } =
      await getInstructorOverview(me.scholarId);

    return cors(
      req,
      ok({
        scholarLinked: true,
        ...identity,
        coursesCount,
        studentsCount,
        pendingGrading,
        nextSession: nextSession ? nextSessionBrief(nextSession) : null,
      }),
      "app",
      METHODS
    );
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
