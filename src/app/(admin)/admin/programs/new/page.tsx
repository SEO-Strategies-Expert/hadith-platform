import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { StageFields } from "../StageFields";
import { createStage } from "../actions";
import { prisma } from "@/lib/prisma";

export default async function NewStagePage() {
  const courses = await prisma.course.findMany({
    orderBy: [{ order: "asc" }, { titleAr: "asc" }],
    select: { id: true, titleAr: true, titleEn: true },
  });
  return (
    <div>
      <PageHeader title="إضافة مرحلة" desc="البرامج والمقرّرات" />
      <Card className="max-w-3xl p-6">
        <ActionForm action={createStage} cancelHref="/admin/programs">
          <StageFields courses={courses} />
        </ActionForm>
      </Card>
    </div>
  );
}
