import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { moduleFields } from "../../../../fields";
import { createModule } from "../../../../actions";

export default async function NewModulePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    select: { titleAr: true, _count: { select: { modules: true } } },
  });
  if (!course) notFound();

  return (
    <div>
      <PageHeader title="إضافة وحدة" desc={course.titleAr} />
      <Card className="max-w-3xl p-6">
        <ActionForm
          action={createModule.bind(null, id)}
          cancelHref={`/admin/courses/${id}/content`}
        >
          {/* الترتيب المقترَح = بعد آخر وحدة، فلا يحتاج المحرّر لحسابه بنفسه. */}
          <ResourceFields fields={moduleFields} record={{ order: course._count.modules + 1, visible: true }} />
        </ActionForm>
      </Card>
    </div>
  );
}
