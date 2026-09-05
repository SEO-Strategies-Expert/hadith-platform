import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { StageFields } from "../StageFields";
import { updateStage } from "../actions";

export default async function EditStagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const stage = await prisma.programStage.findUnique({
    where: { id },
    include: { courses: { select: { id: true } } },
  });
  if (!stage) notFound();
  const courses = await prisma.course.findMany({
    orderBy: [{ order: "asc" }, { titleAr: "asc" }],
    select: { id: true, titleAr: true, titleEn: true },
  });

  return (
    <div>
      <PageHeader title="تعديل مرحلة" desc={stage.titleAr} />
      <Card className="max-w-3xl p-6">
        <ActionForm action={updateStage.bind(null, id)} cancelHref="/admin/programs">
          <StageFields s={stage} courses={courses} selectedCourseIds={stage.courses.map((course) => course.id)} />
        </ActionForm>
      </Card>
    </div>
  );
}
