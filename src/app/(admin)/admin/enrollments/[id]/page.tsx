import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card, Select, Field } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ENROLLMENT_STATUSES, FEE_OPTIONS } from "../fields";
import { updateEnrollment } from "../actions";

export default async function EditEnrollmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, studentNo: true } },
      course: { select: { titleAr: true } },
    },
  });
  if (!enrollment) notFound();

  return (
    <div>
      <PageHeader
        title="تعديل التسجيل"
        desc={`${enrollment.user.name} — ${enrollment.course.titleAr}`}
      />

      <Card className="max-w-3xl p-6">
        {/* الطالب والمقرّر لا يُبدَّلان بعد الإنشاء: تبديلهما يعني تسجيلًا آخر،
            وتقدّم الطالب المحفوظ لا ينتقل معه. */}
        <div className="mb-5 grid gap-3 rounded-xl bg-cream-50 p-4 sm:grid-cols-2">
          <div>
            <div className="text-[11.5px] font-bold text-ink-soft">الطالب</div>
            <div className="text-[13.5px] font-bold text-navy-900">{enrollment.user.name}</div>
            <div className="text-[12px] text-ink-soft" dir="ltr">
              {enrollment.user.studentNo ? `${enrollment.user.studentNo} · ` : ""}
              {enrollment.user.email}
            </div>
          </div>
          <div>
            <div className="text-[11.5px] font-bold text-ink-soft">المقرّر</div>
            <div className="text-[13.5px] font-bold text-navy-900">{enrollment.course.titleAr}</div>
          </div>
        </div>

        <ActionForm action={updateEnrollment.bind(null, id)} cancelHref="/admin/enrollments">
          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="الحالة"
              name="status"
              defaultValue={enrollment.status}
              options={ENROLLMENT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            />
            <Select
              label="نظام الرسوم"
              name="feeOption"
              defaultValue={enrollment.feeOption ?? "free"}
              options={FEE_OPTIONS.map((f) => ({ value: f.value, label: f.label }))}
            />
            <Field
              label="نسبة التقدّم (٪)"
              name="progressPct"
              type="number"
              defaultValue={enrollment.progressPct}
              hint="تُحدَّث تلقائيًّا من إنجاز الطالب للدروس؛ لا تُحرَّر إلا لتصحيح خطأ."
            />
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
