import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { lessonFields } from "../../../../../../fields";
import { createLesson } from "../../../../../../actions";

export default async function NewLessonPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  await requireUser();
  const { id, moduleId } = await params;

  const mod = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { course: { select: { id: true, titleAr: true } }, _count: { select: { lessons: true } } },
  });
  if (!mod || mod.course.id !== id) notFound();

  return (
    <div>
      <PageHeader title="إضافة درس" desc={`${mod.course.titleAr} — وحدة «${mod.titleAr}»`} />
      <Card className="max-w-3xl p-6">
        <ActionForm
          action={createLesson.bind(null, id, moduleId)}
          cancelHref={`/admin/courses/${id}/content`}
        >
          <ResourceFields
            fields={lessonFields}
            record={{ order: mod._count.lessons + 1, visible: true, kind: "VIDEO" }}
          />
        </ActionForm>
      </Card>
      <p className="mt-4 max-w-3xl text-[12.5px] text-ink-soft">
        المرفقات تُضاف بعد حفظ الدرس من شاشة تعديله.
      </p>
    </div>
  );
}
