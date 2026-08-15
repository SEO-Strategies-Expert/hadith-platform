import Link from "next/link";
import { notFound } from "next/navigation";
import { Paperclip } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card, Field, EmptyState } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { FilePickerField } from "@/components/admin/FilePickerField";
import { lessonFields } from "../../../../fields";
import { updateLesson, createAttachment, deleteAttachment } from "../../../../actions";

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  await requireUser();
  const { id, lessonId } = await params;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: { select: { titleAr: true, courseId: true, course: { select: { titleAr: true } } } },
      attachments: { orderBy: { order: "asc" } },
    },
  });
  // الدرس يجب أن يكون في هذا المقرّر فعلًا — لا نكتفي بمعرّفه في الرابط.
  if (!lesson || lesson.module.courseId !== id) notFound();

  const backHref = `/admin/courses/${id}/content`;

  return (
    <div>
      <PageHeader
        title="تعديل الدرس"
        desc={`${lesson.module.course.titleAr} — وحدة «${lesson.module.titleAr}»`}
      />

      <div className="mb-4">
        <Link
          href={backHref}
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          محتوى المقرّر ←
        </Link>
      </div>

      <Card className="max-w-3xl p-6">
        <ActionForm action={updateLesson.bind(null, id, lessonId)} cancelHref={backHref}>
          <ResourceFields fields={lessonFields} record={lesson} />
        </ActionForm>
      </Card>

      {/* ---------------- المرفقات ---------------- */}
      <h2 className="mb-3 mt-8 flex items-center gap-2 text-[17px] font-extrabold text-navy-900">
        <Paperclip size={18} /> مرفقات الدرس
      </h2>

      <Card className="max-w-3xl">
        {lesson.attachments.length === 0 ? (
          <EmptyState label="لا مرفقات لهذا الدرس." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13px]">
              <thead>
                <tr className="border-b border-black/5 text-[11.5px] text-ink-soft">
                  <th className="px-4 py-2.5 font-bold">#</th>
                  <th className="px-4 py-2.5 font-bold">المرفق</th>
                  <th className="px-4 py-2.5 font-bold">الرابط</th>
                  <th className="px-4 py-2.5 font-bold">إجراءات</th>
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
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        dir="ltr"
                        className="text-[12px] text-navy-700 underline decoration-gold/60 underline-offset-2"
                      >
                        {a.filename ?? a.url}
                      </a>
                    </td>
                    <td className="px-4 py-2.5">
                      <DeleteButton action={deleteAttachment.bind(null, id, lessonId, a.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-black/5 p-6">
          <h3 className="mb-4 text-[14px] font-extrabold text-navy-900">إضافة مرفق</h3>
          <ActionForm
            action={createAttachment.bind(null, id, lessonId)}
            cancelHref={backHref}
            submitLabel="إضافة المرفق"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="عنوان المرفق (عربي)" name="titleAr" required dir="rtl" />
              <Field label="عنوان المرفق (إنجليزي)" name="titleEn" dir="ltr" />
              <div className="sm:col-span-2">
                <FilePickerField
                  label="ملفّ المرفق أو رابطه"
                  name="url"
                  required
                  hint="PDF أو ورقة تطبيق. الحجم الأقصى ٨ ميجابايت."
                />
              </div>
              <Field
                label="الترتيب"
                name="order"
                type="number"
                defaultValue={lesson.attachments.length + 1}
              />
            </div>
          </ActionForm>
        </div>
      </Card>
    </div>
  );
}
