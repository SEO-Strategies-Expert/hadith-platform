import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { withRelationOptions } from "@/lib/resource-options";
import { assignmentFields } from "../fields";
import { updateAssignment } from "../actions";

export default async function EditAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: { _count: { select: { submissions: true } } },
  });
  if (!assignment) notFound();

  const fields = await withRelationOptions(assignmentFields);

  return (
    <div>
      <PageHeader title="تعديل الواجب" desc={assignment.titleAr} />

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/assignments"
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          كل الواجبات ←
        </Link>
        <Link
          href={`/admin/assignments/${id}/submissions`}
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          التسليمات والتصحيح ({assignment._count.submissions}) ←
        </Link>
      </div>

      {assignment._count.submissions > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] font-semibold leading-6 text-amber-800">
          خفض «الدرجة القصوى» بعد التصحيح لا يُعيد حساب الدرجات المرصودة — راجعها بنفسك إن غيّرتها.
        </div>
      )}

      <Card className="max-w-3xl p-6">
        <ActionForm action={updateAssignment.bind(null, id)} cancelHref="/admin/assignments">
          <ResourceFields fields={fields} record={assignment} />
        </ActionForm>
      </Card>
    </div>
  );
}
