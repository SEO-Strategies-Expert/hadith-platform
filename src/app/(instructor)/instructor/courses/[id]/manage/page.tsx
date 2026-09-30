import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, ChevronUp, Eye, EyeOff, Paperclip, Pencil, Plus } from "lucide-react";
import { requireInstructor, getInstructorCourse, LESSON_KIND_LABEL } from "@/lib/instructor";
import { PageHeader, Card, Badge, EmptyState, Field } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import {
  addInstructorModule,
  deleteInstructorLesson,
  deleteInstructorModule,
  moveInstructorLesson,
  moveInstructorModule,
} from "./actions";

function MoveButton({ action, dir }: { action: () => Promise<void>; dir: "up" | "down" }) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="grid h-8 w-8 place-items-center rounded-lg text-navy-700 transition hover:bg-black/5"
        title={dir === "up" ? "تقديم" : "تأخير"}
        aria-label={dir === "up" ? "تقديم" : "تأخير"}
      >
        {dir === "up" ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    </form>
  );
}

export default async function InstructorCourseManagePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireInstructor();
  const { id } = await params;
  if (!me.scholarId) notFound();
  const course = await getInstructorCourse(me.scholarId, id);
  if (!course) notFound();

  const base = `/instructor/courses/${id}/manage`;

  return (
    <div>
      <PageHeader
        title={`مواد المقرر: ${course.titleAr}`}
        desc="أضف الوحدات والدروس والملفات والروابط التي يراها طلاب هذا المقرر."
      />

      <div className="mb-4">
        <Link
          href={`/instructor/courses/${id}`}
          className="rounded-lg border border-black/10 bg-white px-3.5 py-2 text-[12.5px] font-bold text-navy-700 hover:border-gold/50"
        >
          تفاصيل المقرر ←
        </Link>
      </div>

      <Card className="mb-5 p-5">
        <h2 className="mb-3 text-[16px] font-extrabold text-navy-900">إضافة وحدة</h2>
        <ActionForm action={addInstructorModule.bind(null, id)} cancelHref={base} submitLabel="إضافة الوحدة">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="عنوان الوحدة (عربي)" name="titleAr" required />
            <Field label="عنوان الوحدة (إنجليزي)" name="titleEn" dir="ltr" hint="إن تُرك فارغًا يُنسخ العنوان العربي." />
          </div>
        </ActionForm>
      </Card>

      <h2 className="mb-3 text-[16px] font-extrabold text-navy-900">الوحدات والدروس</h2>
      {course.modules.length === 0 ? (
        <Card>
          <EmptyState label="لا وحدات بعد. أضف وحدة ثم أضف دروسها وملفاتها." />
        </Card>
      ) : (
        <div className="space-y-4">
          {course.modules.map((m) => (
            <Card key={m.id}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cream-50 text-[12px] font-extrabold text-navy-800">
                    {m.order}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <b className="text-[15px] font-extrabold text-navy-900">{m.titleAr}</b>
                      {m.visible ? <Eye size={14} className="text-emerald-600" aria-label="ظاهرة" /> : <EyeOff size={14} className="text-ink-soft" aria-label="مخفية" />}
                    </div>
                    <div className="text-[12px] text-ink-soft" dir="ltr">{m.titleEn}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <MoveButton action={moveInstructorModule.bind(null, id, m.id, "up")} dir="up" />
                  <MoveButton action={moveInstructorModule.bind(null, id, m.id, "down")} dir="down" />
                  <Link href={`${base}/modules/${m.id}`} className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5" title="تعديل الوحدة">
                    <Pencil size={16} />
                  </Link>
                  <DeleteButton action={deleteInstructorModule.bind(null, id, m.id)} confirm="حذف الوحدة يحذف دروسها ومرفقاتها. هل أنت متأكد؟" />
                </div>
              </div>

              {m.lessons.length === 0 ? (
                <div className="px-4 py-6 text-center text-[13px] text-ink-soft">لا دروس في هذه الوحدة بعد.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-[13px]">
                    <thead>
                      <tr className="border-b border-black/5 text-[11.5px] text-ink-soft">
                        <th className="px-4 py-2.5 font-bold">#</th>
                        <th className="px-4 py-2.5 font-bold">الدرس</th>
                        <th className="px-4 py-2.5 font-bold">النوع</th>
                        <th className="px-4 py-2.5 font-bold">المدة</th>
                        <th className="px-4 py-2.5 font-bold">مرفقات</th>
                        <th className="px-4 py-2.5 font-bold">الحالة</th>
                        <th className="px-4 py-2.5 font-bold">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {m.lessons.map((l) => (
                        <tr key={l.id} className="border-b border-black/5 last:border-0 hover:bg-cream-50">
                          <td className="px-4 py-2.5 text-ink-soft">{l.order}</td>
                          <td className="px-4 py-2.5">
                            <Link href={`${base}/lessons/${l.id}`} className="font-bold text-navy-900 hover:underline">{l.titleAr}</Link>
                            <div className="text-[11.5px] text-ink-soft" dir="ltr">{l.titleEn}</div>
                          </td>
                          <td className="px-4 py-2.5"><Badge tone="gold">{LESSON_KIND_LABEL[l.kind] ?? l.kind}</Badge></td>
                          <td className="px-4 py-2.5 text-ink-soft">{l.durationMin ? `${l.durationMin} د` : "—"}</td>
                          <td className="px-4 py-2.5 text-ink-soft">
                            {l._count.attachments > 0 ? <span className="inline-flex items-center gap-1"><Paperclip size={13} /> {l._count.attachments}</span> : "—"}
                          </td>
                          <td className="px-4 py-2.5">
                            {l.visible ? <Badge tone="green">ظاهر</Badge> : <Badge tone="gray">مخفي</Badge>}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1">
                              <MoveButton action={moveInstructorLesson.bind(null, id, m.id, l.id, "up")} dir="up" />
                              <MoveButton action={moveInstructorLesson.bind(null, id, m.id, l.id, "down")} dir="down" />
                              <Link href={`${base}/lessons/${l.id}`} className="grid h-9 w-9 place-items-center rounded-lg text-navy-700 hover:bg-black/5" title="تعديل الدرس ومواده">
                                <Pencil size={16} />
                              </Link>
                              <DeleteButton action={deleteInstructorLesson.bind(null, id, l.id)} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="border-t border-black/5 px-4 py-3">
                <Link
                  href={`${base}/modules/${m.id}/lessons/new`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-[12.5px] font-bold text-navy-800 hover:border-gold/50"
                >
                  <Plus size={15} /> إضافة درس إلى «{m.titleAr}»
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
