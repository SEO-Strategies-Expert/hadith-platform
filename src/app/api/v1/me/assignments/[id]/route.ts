/**
 * واجبٌ واحد: عرضه (GET) وحفظه/تسليمه (POST).
 *
 * قواعد التسليم منقولةٌ حرفيًّا عن `student-quiz-actions.ts` ليتطابق سلوك
 * الويب والتطبيق، ولا يجد الطالب في أحدهما ما يمنعه الآخر:
 *  • **المصحَّح مقفل**: تعديله بعد رصد الدرجة يفسد التصحيح ويخفي ما صُحّح.
 *  • **الرابط يُفحص**: `http(s)` فقط — لا `javascript:` ولا `data:`.
 *  • **التسليم لا يقبل فراغًا**: نصٌّ أو رابط، وإلّا فهو مسوّدة.
 *  • **المتأخّر لا يُمنع**: قبولُه قرارٌ إداريّ؛ نعلّمه `overdue` ونمضي.
 */
import { prisma } from "@/lib/prisma";
import { requireApiUser, ApiError } from "@/lib/api-auth";
import { isEnrolled } from "@/lib/lms";
import { ok, fail, body } from "../../../_lib";
import { cors, preflight, requireId, text, safeUrl } from "../../../_http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS = "GET, POST, OPTIONS";

export async function OPTIONS(req: Request) {
  return preflight(req, "app", METHODS);
}

const SUBMISSION_FIELDS = {
  id: true,
  state: true,
  text: true,
  fileUrl: true,
  fileName: true,
  submittedAt: true,
  score: true,
  feedback: true,
  gradedAt: true,
} as const;

/** يحمّل الواجب ويفحص ظهوره وتسجيل الطالب في مقرّره. */
async function loadAssignment(userId: string, assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: {
      id: true,
      courseId: true,
      titleAr: true,
      titleEn: true,
      descAr: true,
      descEn: true,
      dueAt: true,
      maxScore: true,
      visible: true,
      course: { select: { id: true, titleAr: true, titleEn: true } },
    },
  });
  if (!assignment || !assignment.visible) throw new ApiError(404, "الواجب غير موجود أو لم يُفتح بعد");
  if (!(await isEnrolled(userId, assignment.courseId))) {
    throw new ApiError(404, "الواجب غير موجود أو لست مسجَّلًا في مقرّره");
  }
  return assignment;
}

type Assignment = Awaited<ReturnType<typeof loadAssignment>>;

/** انتقاءٌ صريح لا نشرًا: `visible` حالةُ تحريرٍ لا شأن للطالب بها. */
function shape(a: Assignment, submission: { submittedAt: Date | null } | null) {
  return {
    id: a.id,
    courseId: a.courseId,
    titleAr: a.titleAr,
    titleEn: a.titleEn,
    descAr: a.descAr,
    descEn: a.descEn,
    dueAt: a.dueAt,
    maxScore: a.maxScore,
    course: a.course,
    submission,
    overdue: Boolean(a.dueAt && a.dueAt < new Date() && !submission?.submittedAt),
  };
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const id = await requireApiUser(req);
    const assignmentId = requireId((await ctx.params).id, "معرّف الواجب");
    const assignment = await loadAssignment(id.userId, assignmentId);

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { assignmentId_userId: { assignmentId, userId: id.userId } },
      select: SUBMISSION_FIELDS,
    });

    return cors(req, ok(shape(assignment, submission)), "app", METHODS);
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const id = await requireApiUser(req);
    const assignmentId = requireId((await ctx.params).id, "معرّف الواجب");
    const assignment = await loadAssignment(id.userId, assignmentId);

    const existing = await prisma.assignmentSubmission.findUnique({
      where: { assignmentId_userId: { assignmentId, userId: id.userId } },
      select: { state: true },
    });
    if (existing?.state === "GRADED") {
      throw new ApiError(409, "صُحّح واجبك بالفعل، فلا يمكن تعديله. راجع ملاحظة المعلّم أو كلّمه.");
    }

    const b = await body<{ text?: unknown; fileUrl?: unknown; fileName?: unknown; submit?: unknown }>(req);
    const fileUrl = safeUrl(b.fileUrl);
    const content = text(b.text);
    const submit = b.submit === true;

    if (submit && !content && !fileUrl) {
      throw new ApiError(400, "اكتب نصّ الواجب أو ضع رابط ملفّك قبل التسليم");
    }

    const payload = {
      text: content,
      fileUrl,
      fileName: text(b.fileName),
      state: (submit ? "SUBMITTED" : "DRAFT") as "SUBMITTED" | "DRAFT",
      // وقت التسليم من ساعة الخادم؛ ويُمحى عند العودة لمسوّدة فلا يبقى أثرٌ كاذب.
      submittedAt: submit ? new Date() : null,
    };

    const submission = await prisma.assignmentSubmission.upsert({
      where: { assignmentId_userId: { assignmentId, userId: id.userId } },
      create: { assignmentId, userId: id.userId, ...payload },
      update: payload,
      select: SUBMISSION_FIELDS,
    });

    return cors(req, ok(shape(assignment, submission)), "app", METHODS);
  } catch (e) {
    return cors(req, fail(e), "app", METHODS);
  }
}
