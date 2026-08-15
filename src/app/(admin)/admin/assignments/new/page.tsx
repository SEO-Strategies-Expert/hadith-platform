import { requireUser } from "@/lib/guard";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { withRelationOptions } from "@/lib/resource-options";
import { assignmentFields } from "../fields";
import { createAssignment } from "../actions";

export default async function NewAssignmentPage() {
  await requireUser();
  const fields = await withRelationOptions(assignmentFields);

  return (
    <div>
      <PageHeader title="إضافة واجب" desc="الواجبات" />
      <Card className="max-w-3xl p-6">
        <ActionForm action={createAssignment} cancelHref="/admin/assignments">
          <ResourceFields fields={fields} record={{ maxScore: 100, order: 0, visible: true }} />
        </ActionForm>
      </Card>
    </div>
  );
}
