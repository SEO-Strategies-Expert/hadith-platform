import Link from "next/link";
import { notFound } from "next/navigation";
import { ListTree } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getResource } from "@/lib/resources";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { updateRecord } from "@/lib/crud-actions";
import { withRelationOptions } from "@/lib/resource-options";

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: { instructors: { select: { id: true } } },
  });
  if (!course) notFound();

  const cfg = getResource("courses")!;
  const fields = await withRelationOptions(cfg.fields);

  return (
    <div>
      <PageHeader title="تعديل المقرّر" desc={course.titleAr} />

      <div className="mb-4">
        <Link
          href={`/admin/courses/${id}/content`}
          className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          <ListTree size={15} /> وحدات المقرّر ودروسه ←
        </Link>
      </div>

      <Card className="max-w-3xl p-6">
        <ActionForm action={updateRecord.bind(null, "courses", id)} cancelHref="/admin/courses">
          <ResourceFields
            fields={fields}
            record={{
              ...course,
              instructorIds: course.instructors.length
                ? course.instructors.map((i) => i.id)
                : course.instructorId
                  ? [course.instructorId]
                  : [],
            }}
          />
        </ActionForm>
      </Card>
    </div>
  );
}
