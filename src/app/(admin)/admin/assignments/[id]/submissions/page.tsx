import Link from "next/link";
import { notFound } from "next/navigation";
import { Paperclip, Clock, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { mediaUrl } from "@/lib/site-format";
import { PageHeader, Card, Badge, EmptyState, Field, TextArea, Select } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { formatDateTime } from "@/components/admin/datetime";
import { assignmentStateLabel, GRADING_STATES } from "../../fields";
import { gradeSubmission } from "../../actions";

/**
 * شاشة تصحيح الواجب.
 *
 * ترتيب التسليمات مقصود: **ما ينتظر التصحيح أوّلًا**، ثم المعاد، ثم المصحَّح.
 * فالمصحِّح يفتح الشاشة ليعمل لا ليتصفّح.
 */

const STATE_RANK: Record<string, number> = { SUBMITTED: 0, RETURNED: 1, DRAFT: 2, GRADED: 3 };

function stateTone(state: string): "gray" | "green" | "red" | "gold" | "blue" {
  if (state === "GRADED") return "green";
  if (state === "SUBMITTED") return "red";
  if (state === "RETURNED") return "gold";
  return "gray";
}

export default async function AssignmentSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      course: { select: { titleAr: true } },
      submissions: {
        include: {
          user: { select: { name: true, email: true, studentNo: true } },
          gradedBy: { select: { name: true } },
        },
      },
    },
  });
  if (!assignment) notFound();

  const rows = [...assignment.submissions].sort((a, b) => {
    const r = (STATE_RANK[a.state] ?? 9) - (STATE_RANK[b.state] ?? 9);
    if (r !== 0) return r;
    return (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0);
  });

  return (
    <div>
      <PageHeader
        title="تصحيح الواجب"
        desc={`${assignment.titleAr} — ${assignment.course.titleAr} — الدرجة القصوى ${assignment.maxScore}`}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/assignments"
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          كل الواجبات ←
        </Link>
        <Link
          href={`/admin/assignments/${id}`}
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          بيانات الواجب ←
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card>
          <EmptyState label="لم يسلّم أحدٌ هذا الواجب بعد." />
        </Card>
      ) : (
        <div className="space-y-4">
          {rows.map((s) => {
            const late =
              assignment.dueAt && s.submittedAt
                ? s.submittedAt.getTime() > assignment.dueAt.getTime()
                : false;
            const fileHref = mediaUrl(s.fileUrl);

            return (
              <Card key={s.id} className="p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-4 py-3.5">
                  <div>
                    <b className="text-[15px] font-extrabold text-navy-900">{s.user.name}</b>
                    <div className="text-[11.5px] text-ink-soft" dir="ltr">
                      {s.user.email}
                      {s.user.studentNo ? ` — ${s.user.studentNo}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={stateTone(s.state)}>{assignmentStateLabel(s.state)}</Badge>
                    {late && (
                      <Badge tone="gold">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} /> متأخّر
                        </span>
                      </Badge>
                    )}
                    {s.score !== null && (
                      <Badge tone="blue">
                        {s.score} / {assignment.maxScore}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                  {/* عمل الطالب */}
                  <div>
                    <div className="mb-2 text-[12px] font-bold text-ink-soft">
                      تاريخ التسليم: {s.submittedAt ? formatDateTime(s.submittedAt) : "لم يُسلَّم بعد"}
                    </div>

                    {s.text ? (
                      // نصّ الطالب يُعرض كنصٍّ صِرف لا HTML — مُدخَل مستخدم لا يُوثَق به.
                      <div className="whitespace-pre-wrap rounded-xl border border-black/10 bg-cream-50/60 px-4 py-3 text-[13.5px] leading-7 text-navy-900">
                        {s.text}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-black/15 px-4 py-6 text-center text-[12.5px] text-ink-soft">
                        لا نصّ مكتوب.
                      </div>
                    )}

                    {fileHref && (
                      <a
                        href={fileHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-800 hover:border-gold/50"
                      >
                        <Paperclip size={14} />
                        {s.fileName || "ملفّ الطالب المرفق"}
                      </a>
                    )}

                    {s.state === "DRAFT" && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] font-semibold leading-6 text-amber-800">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        مسوّدة لم يسلّمها الطالب بعد — يمكنك تصحيحها لكنّه قد يعدّلها.
                      </div>
                    )}

                    {s.gradedAt && (
                      <p className="mt-3 text-[11.5px] text-ink-soft">
                        صُحّح في {formatDateTime(s.gradedAt)}
                        {s.gradedBy?.name ? ` بيد ${s.gradedBy.name}` : ""}.
                      </p>
                    )}
                  </div>

                  {/* نموذج التصحيح */}
                  <div className="rounded-xl border border-black/10 bg-cream-50/40 p-4">
                    <h3 className="mb-3 text-[13.5px] font-extrabold text-navy-900">التصحيح</h3>
                    <ActionForm
                      action={gradeSubmission.bind(null, id, s.id)}
                      cancelHref="/admin/assignments"
                      submitLabel="اعتماد التصحيح"
                    >
                      <Field
                        label={`الدرجة (من ${assignment.maxScore})`}
                        name="score"
                        type="number"
                        defaultValue={s.score ?? undefined}
                        dir="ltr"
                        hint={`لا تتجاوز ${assignment.maxScore} — القيمة الأعلى تُرفض عند الحفظ.`}
                      />
                      <TextArea
                        label="ملاحظة للطالب"
                        name="feedback"
                        defaultValue={s.feedback}
                        dir="rtl"
                        rows={4}
                      />
                      <Select
                        label="الحالة بعد الحفظ"
                        name="state"
                        options={GRADING_STATES}
                        defaultValue={s.state === "RETURNED" ? "RETURNED" : "GRADED"}
                      />
                    </ActionForm>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
