import Link from "next/link";
import { notFound } from "next/navigation";
import { Paperclip } from "lucide-react";
import { requireInstructor, getInstructorLesson, getInstructorCourseLessons } from "@/lib/instructor";
import { PageHeader, Card, Field, EmptyState } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { FilePickerField } from "@/components/admin/FilePickerField";
import { lessonFields } from "@/app/(admin)/admin/courses/fields";
import type { FieldDef } from "@/lib/resources";
import { updateInstructorLesson, createInstructorAttachment, deleteInstructorAttachment } from "../../actions";

export default async function InstructorEditLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; lessonId: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const me = await requireInstructor();
  const { id, lessonId } = await params;
  const { saved } = await searchParams;
  if (!me.scholarId) notFound();
  const lesson = await getInstructorLesson(me.scholarId, id, lessonId);
  if (!lesson) notFound();
  const siblings = await getInstructorCourseLessons(me.scholarId, id);
  const fields = lessonFields.map((f) =>
    f.name === "prerequisiteLessonId"
      ? {
          ...f,
          relation: undefined,
          options: [
            { value: "", label: "— لا يوجد —" },
            ...siblings.filter((l) => l.id !== lesson.id).map((l) => ({ value: l.id, label: l.titleAr })),
          ],
        }
      : f
  ) satisfies FieldDef[];

  const back = `/instructor/courses/${id}/manage`;

  return (
    <div>
      <PageHeader title="مواد الدرس" desc={`${lesson.module.course.titleAr} — وحدة «${lesson.module.titleAr}»`} />
      <div className="mb-4">
        <Link href={back} className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50">
          مواد المقرر ←
        </Link>
      </div>
      {saved === "1" && (
        <div role="status" className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-bold text-emerald-800">
          حُفظت تعديلات الدرس.
        </div>
      )}

      <Card className="max-w-3xl p-6">
        <ActionForm action={updateInstructorLesson.bind(null, id, lessonId)} cancelHref={back}>
          <ResourceFields fields={fields} record={lesson} />
        </ActionForm>
      </Card>

      <h2 className="mb-3 mt-8 flex items-center gap-2 text-[17px] font-extrabold text-navy-900">
        <Paperclip size={18} /> ملفات وروابط الدرس
      </h2>
      <Card className="max-w-3xl">
        {lesson.attachments.length === 0 ? (
          <EmptyState label="لا مواد مرفقة لهذا الدرس بعد." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13px]">
              <thead>
                <tr className="border-b border-black/5 text-[11.5px] text-ink-soft">
                  <th className="px-4 py-2.5 font-bold">#</th>
                  <th className="px-4 py-2.5 font-bold">المادة</th>
                  <th className="px-4 py-2.5 font-bold">الرابط</th>
                  <th className="px-4 py-2.5 font-bold"></th>
                </tr>
              </thead>
              <tbody>
                {lesson.attachments.map((a) => (
                  <tr key={a.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
                    <td className="px-4 py-2.5 text-ink-soft">{a.order}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-bold text-navy-900">{a.titleAr}</div>
                      <div className="text-[11.5px] text-ink-soft" dir="ltr">{a.titleEn}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <a href={a.url} target="_blank" rel="noreferrer" dir="ltr" className="text-[12px] text-navy-700 underline decoration-gold/60 underline-offset-2">
                        {a.filename ?? a.url}
                      </a>
                    </td>
                    <td className="px-4 py-2.5">
                      <DeleteButton action={deleteInstructorAttachment.bind(null, id, lessonId, a.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-black/5 p-6">
          <h3 className="mb-4 text-[14px] font-extrabold text-navy-900">إضافة مادة</h3>
          <ActionForm action={createInstructorAttachment.bind(null, id, lessonId)} cancelHref={back} submitLabel="إضافة المادة">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="عنوان المادة (عربي)" name="titleAr" required />
              <Field label="عنوان المادة (إنجليزي)" name="titleEn" dir="ltr" />
              <div className="sm:col-span-2">
                <FilePickerField label="الملف أو رابطه" name="url" required hint="PDF أو ورقة تطبيق أو رابط خارجي. الحد الأقصى للرفع ٨ ميجابايت." />
              </div>
              <Field label="الترتيب" name="order" type="number" defaultValue={lesson.attachments.length + 1} />
            </div>
          </ActionForm>
        </div>
      </Card>
    </div>
  );
}
