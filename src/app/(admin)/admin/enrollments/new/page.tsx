import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card, Select, EmptyState } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ENROLLMENT_STATUSES, FEE_OPTIONS } from "../fields";
import { createEnrollment } from "../actions";

export default async function NewEnrollmentPage() {
  await requireUser();

  const [students, courses] = await Promise.all([
    // القائمة تقتصر على حسابات الطلاب — لا يُسجَّل محرّر أو مدير في مقرّر.
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, studentNo: true },
    }),
    prisma.course.findMany({
      orderBy: { order: "asc" },
      select: { id: true, titleAr: true, published: true },
    }),
  ]);

  const blocked = students.length === 0 || courses.length === 0;

  return (
    <div>
      <PageHeader title="تسجيل طالب في مقرّر" desc="بعد التسجيل يفتح محتوى المقرّر في بوابة الطالب." />

      {blocked ? (
        <Card>
          <EmptyState
            label={
              students.length === 0
                ? "لا توجد حسابات طلاب بعد — أنشئ حساب طالب أوّلًا."
                : "لا توجد مقرّرات بعد — أضِف مقرّرًا أوّلًا."
            }
          />
          <div className="border-t border-black/5 px-6 py-4">
            <Link
              href={students.length === 0 ? "/admin/students/new" : "/admin/courses/new"}
              className="text-[13px] font-bold text-navy-800 underline decoration-gold/60 underline-offset-4"
            >
              {students.length === 0 ? "إضافة طالب ←" : "إضافة مقرّر ←"}
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="max-w-3xl p-6">
          <ActionForm action={createEnrollment} cancelHref="/admin/enrollments" submitLabel="تسجيل الطالب">
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
                <Select
                  label="المقرّر"
                  name="courseId"
                  options={[
                    { value: "", label: "— اختر المقرّر —" },
                    ...courses.map((c) => ({
                      value: c.id,
                      label: c.published ? c.titleAr : `${c.titleAr} (مسوّدة)`,
                    })),
                  ]}
                />
              </div>
              <Select
                label="الحالة"
                name="status"
                defaultValue="ACTIVE"
                options={ENROLLMENT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              />
              <Select
                label="نظام الرسوم"
                name="feeOption"
                defaultValue="free"
                options={FEE_OPTIONS.map((f) => ({ value: f.value, label: f.label }))}
              />
            </div>
            <p className="text-[12px] leading-6 text-ink-soft">
              حالة «مُفعَّل» هي التي تفتح الدروس للطالب. «بانتظار الاعتماد» تُبقيه محجوبًا حتى سداد الرسوم.
            </p>
          </ActionForm>
        </Card>
      )}
    </div>
  );
}
