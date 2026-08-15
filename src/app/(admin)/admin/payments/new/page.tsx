import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card, Select, Field, TextArea, EmptyState } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { statusOptions, methodOptions, DEFAULT_CURRENCY, feeOptionLabel } from "@/lib/payments";
import { createPayment } from "../actions";
import { ConsistencyNote } from "../ConsistencyNote";

export default async function NewPaymentPage() {
  await requireUser();

  const [students, enrollments] = await Promise.all([
    // حسابات الطلاب وحدها — لا تُسجَّل دفعةٌ باسم محرّرٍ أو مدير.
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, studentNo: true },
    }),
    prisma.enrollment.findMany({
      orderBy: { enrolledAt: "desc" },
      select: {
        id: true,
        feeOption: true,
        user: { select: { name: true } },
        course: { select: { titleAr: true } },
      },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="تسجيل دفعة"
        desc="تدوين ما وصل الكلّية فعلًا، أو إثبات إعفاءٍ ممنوح للطالب."
      />

      {students.length === 0 ? (
        <Card>
          <EmptyState label="لا توجد حسابات طلاب بعد — أنشئ حساب طالب أوّلًا." />
          <div className="border-t border-black/5 px-6 py-4">
            <Link
              href="/admin/students/new"
              className="text-[13px] font-bold text-navy-800 underline decoration-gold/60 underline-offset-4"
            >
              إضافة طالب ←
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="max-w-3xl p-6">
          <ActionForm action={createPayment} cancelHref="/admin/payments" submitLabel="حفظ الدفعة">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Select
                  label="الطالب"
                  name="userId"
                  options={[
                    { value: "", label: "— اختر الطالب —" },
                    ...students.map((s) => ({
                      value: s.id,
                      label: `${s.name} · ${s.studentNo ?? s.email}`,
                    })),
                  ]}
                />
              </div>

              <div className="sm:col-span-2">
                {/* القائمة تعرض كل التسجيلات مسبوقةً باسم صاحبها، والخادم يرفض
                    نسبة المبلغ إلى تسجيلِ طالبٍ آخر. */}
                <Select
                  label="التسجيل (اختياريّ)"
                  name="enrollmentId"
                  options={[
                    { value: "", label: "— بلا نسبة إلى مقرّر —" },
                    ...enrollments.map((e) => ({
                      value: e.id,
                      label: `${e.user.name} — ${e.course.titleAr} (${feeOptionLabel(e.feeOption)})`,
                    })),
                  ]}
                />
                <p className="mt-1.5 text-[11.5px] leading-5 text-ink-soft">
                  اربط الدفعة بتسجيلٍ لينسب المبلغ إلى مقرّرٍ بعينه. اتركها فارغة للدفعات العامّة.
                </p>
              </div>

              <Field
                label="المبلغ"
                name="amount"
                required
                dir="ltr"
                placeholder="1500.00"
                hint="رقمٌ موجب بمنزلتين عشريّتين على الأكثر."
              />
              <Field
                label="العملة"
                name="currency"
                defaultValue={DEFAULT_CURRENCY}
                dir="ltr"
                hint="رمز ثلاثيّ (QAR، SAR، USD…)."
              />

              <Select label="الحالة" name="status" defaultValue="PAID" options={statusOptions()} />
              <Select
                label="الطريقة"
                name="method"
                options={[{ value: "", label: "— غير محدَّدة —" }, ...methodOptions()]}
              />

              <div className="sm:col-span-2">
                <Field
                  label="تاريخ السداد"
                  name="paidAt"
                  type="datetime-local"
                  dir="ltr"
                  hint="يلزم للحالة «مسدَّدة» — إن تُرك فارغًا ضُبط على وقت الحفظ."
                />
              </div>

              <div className="sm:col-span-2">
                <TextArea
                  label="ملاحظة"
                  name="note"
                  rows={3}
                  hint="رقم الحوالة، اسم المحوِّل، أو سبب الإعفاء — ما يعين على المراجعة لاحقًا."
                />
              </div>
            </div>

            <ConsistencyNote />
          </ActionForm>
        </Card>
      )}
    </div>
  );
}
