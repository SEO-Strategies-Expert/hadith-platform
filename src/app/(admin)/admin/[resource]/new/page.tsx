import { notFound } from "next/navigation";
import { getResource } from "@/lib/resources";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { createRecord } from "@/lib/crud-actions";
import { withRelationOptions } from "@/lib/resource-options";

export default async function NewResourcePage({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource } = await params;
  const cfg = getResource(resource);
  if (!cfg) notFound();
  const fields = await withRelationOptions(cfg.fields);

  return (
    <div>
      <PageHeader title={`إضافة ${cfg.singularAr}`} desc={cfg.titleAr} />
      <Card className="max-w-3xl p-6">
        <ActionForm action={createRecord.bind(null, resource)} cancelHref={`/admin/${resource}`}>
          <ResourceFields fields={fields} />
        </ActionForm>
      </Card>
    </div>
  );
}
