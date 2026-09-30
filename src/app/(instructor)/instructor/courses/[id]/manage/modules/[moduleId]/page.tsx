import { notFound } from "next/navigation";
import { requireInstructor, getInstructorModule } from "@/lib/instructor";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { moduleFields } from "@/app/(admin)/admin/courses/fields";
import { updateInstructorModule } from "../../actions";

export default async function InstructorEditModulePage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  const me = await requireInstructor();
  const { id, moduleId } = await params;
  if (!me.scholarId) notFound();
  const mod = await getInstructorModule(me.scholarId, id, moduleId);
  if (!mod) notFound();

  const back = `/instructor/courses/${id}/manage`;

  return (
    <div>
      <PageHeader title="تعديل الوحدة" desc={`${mod.course.titleAr} — ${mod.titleAr}`} />
      <Card className="max-w-3xl p-6">
        <ActionForm action={updateInstructorModule.bind(null, id, moduleId)} cancelHref={back}>
          <ResourceFields fields={moduleFields} record={mod} />
        </ActionForm>
      </Card>
    </div>
  );
}
