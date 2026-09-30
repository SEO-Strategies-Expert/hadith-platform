import { notFound } from "next/navigation";
import { requireInstructor, getInstructorModule, getInstructorCourseLessons } from "@/lib/instructor";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { lessonFields } from "@/app/(admin)/admin/courses/fields";
import type { FieldDef } from "@/lib/resources";
import { createInstructorLesson } from "../../../../actions";

export default async function InstructorNewLessonPage({
  params,
}: {
  params: Promise<{ id: string; moduleId: string }>;
}) {
  const me = await requireInstructor();
  const { id, moduleId } = await params;
  if (!me.scholarId) notFound();
  const mod = await getInstructorModule(me.scholarId, id, moduleId);
  if (!mod) notFound();
  const lessons = await getInstructorCourseLessons(me.scholarId, id);
  const fields = lessonFieldsFor(lessons);
  const back = `/instructor/courses/${id}/manage`;

  return (
    <div>
      <PageHeader title="إضافة درس" desc={`${mod.course.titleAr} — وحدة «${mod.titleAr}»`} />
      <Card className="max-w-3xl p-6">
        <ActionForm action={createInstructorLesson.bind(null, id, moduleId)} cancelHref={back} submitLabel="حفظ الدرس">
          <ResourceFields fields={fields} record={{ order: mod._count.lessons + 1, visible: true, kind: "VIDEO", downloadable: true }} />
        </ActionForm>
      </Card>
      <p className="mt-4 max-w-3xl text-[12.5px] text-ink-soft">
        بعد الحفظ افتح الدرس لإضافة ملفات PDF أو أوراق التطبيق أو روابط المواد.
      </p>
    </div>
  );
}

function lessonFieldsFor(lessons: { id: string; titleAr: string }[]): FieldDef[] {
  return lessonFields.map((f) =>
    f.name === "prerequisiteLessonId"
      ? {
          ...f,
          relation: undefined,
          options: [{ value: "", label: "— لا يوجد —" }, ...lessons.map((l) => ({ value: l.id, label: l.titleAr }))],
        }
      : f
  );
}
