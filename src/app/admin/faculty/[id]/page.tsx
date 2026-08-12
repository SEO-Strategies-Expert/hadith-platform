import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ScholarFields } from "../ScholarFields";
import { updateScholar } from "../actions";

export default async function EditScholarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scholar = await prisma.scholar.findUnique({ where: { id } });
  if (!scholar) notFound();

  return (
    <div>
      <PageHeader title="تعديل عضو" desc={scholar.nameAr} />
      <Card className="max-w-3xl p-6">
        <ActionForm action={updateScholar.bind(null, id)} cancelHref="/admin/faculty">
          <ScholarFields s={scholar} />
        </ActionForm>
      </Card>
    </div>
  );
}
