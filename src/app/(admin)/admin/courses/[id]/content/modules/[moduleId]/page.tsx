import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { moduleFields } from "../../../../fields";
import { updateModule } from "../../../../actions";

export default async function EditModulePage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  await requireUser();
  const { id, moduleId } = await params;

  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { course: { select: { id: true, titleAr: true } } },
  });
  // نتحقّق من انتماء الوحدة للمقرّر لئلّا يفتح رابطٌ ملفَّق وحدةً من مقرّر آخر.
  if (!mod || mod.course.id !== id) notFound();

  return (
    <div>
      <PageHeader title="تعديل الوحدة" desc={`${mod.course.titleAr} — ${mod.titleAr}`} />
      <Card className="max-w-3xl p-6">
        <ActionForm
          action={updateModule.bind(null, id, moduleId)}
          cancelHref={`/admin/courses/${id}/content`}
        >
          <ResourceFields fields={moduleFields} record={mod} />
        </ActionForm>
      </Card>
    </div>
  );
}
