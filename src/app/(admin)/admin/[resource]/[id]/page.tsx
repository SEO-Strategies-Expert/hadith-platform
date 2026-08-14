import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getResource } from "@/lib/resources";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { updateRecord } from "@/lib/crud-actions";
import { withRelationOptions } from "@/lib/resource-options";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource, id } = await params;
  const cfg = getResource(resource);
  if (!cfg) notFound();

  const record = await (prisma as any)[cfg.model].findUnique({ where: { id } });
  if (!record) notFound();
  const fields = await withRelationOptions(cfg.fields);

  return (
    <div>
      <PageHeader title={`تعديل ${cfg.singularAr}`} desc={cfg.titleAr} />
      <Card className="max-w-3xl p-6">
        <ActionForm action={updateRecord.bind(null, resource, id)} cancelHref={`/admin/${resource}`}>
          <ResourceFields fields={fields} record={record} />
        </ActionForm>
      </Card>
    </div>
  );
}
