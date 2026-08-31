import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card, Field, Select } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { issueCourseCertificates } from "../actions";

export default async function BatchCertificatesPage() {
  await requireUser();
  const courses = await prisma.course.findMany({ orderBy: { titleAr: "asc" }, include: { _count: { select: { enrollments: true } } } });
  return <div>
    <PageHeader title="إصدار جماعي للشهادات" desc="يصدر شهادة واحدة لكل طالب حالته «مكتمل» في المقرر، ويتجاوز من سبق إصدار شهادته بأمان." />
    <Card className="mx-auto max-w-3xl p-6">
      <ActionForm action={issueCourseCertificates} cancelHref="/admin/certificates" submitLabel="إصدار الشهادات للمقرر كاملًا">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2"><Select label="المقرر" name="courseId" options={[{ value:"", label:"— اختر المقرر —" }, ...courses.map(c => ({ value:c.id, label:`${c.titleAr} (${c._count.enrollments} مسجل)` }))]} /></div>
          <Field label="عنوان الشهادة (عربي)" name="titleAr" defaultValue="شهادة إتمام المقرر" required />
          <Field label="Certificate title (English)" name="titleEn" defaultValue="Course Completion Certificate" dir="ltr" required />
        </div>
      </ActionForm>
    </Card>
  </div>;
}
