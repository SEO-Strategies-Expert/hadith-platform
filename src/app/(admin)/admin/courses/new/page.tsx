import { getResource } from "@/lib/resources";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { createRecord } from "@/lib/crud-actions";
import { withRelationOptions } from "@/lib/resource-options";

export default async function NewCoursePage() {
  await requireUser();
  const cfg = getResource("courses")!;
  const fields = await withRelationOptions(cfg.fields);

  return (
    <div>
      <PageHeader title="إضافة مقرّر" desc="بعد الحفظ أضِف وحداته ودروسه من زرّ «المحتوى»." />
      <Card className="max-w-3xl p-6">
        <ActionForm action={createRecord.bind(null, "courses")} cancelHref="/admin/courses">
          <ResourceFields fields={fields} />
        </ActionForm>
      </Card>
    </div>
  );
}
