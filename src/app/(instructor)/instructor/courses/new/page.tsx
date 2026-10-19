import { requireInstructor } from "@/lib/instructor";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { NoScholarNotice } from "@/components/instructor/NoScholarNotice";
import { createInstructorCourse } from "./actions";

const input = "mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[13.5px] font-normal";
const label = "block text-[12.5px] font-bold text-navy-800";

export default async function NewInstructorCoursePage() {
  const me = await requireInstructor();
  if (!me.scholarId) return <div><PageHeader title="إضافة مقرّر" /><NoScholarNotice /></div>;
  const stages = await prisma.programStage.findMany({ select: { id: true, titleAr: true }, orderBy: { titleAr: "asc" } });

  return (
    <div>
      <PageHeader title="إضافة مقرّر جديد" desc="يُحفظ المقرّر باسمك غير منشور، ثم تضيف وحداته ودروسه. تراجعه الإدارة وتنشره للطلاب." />
      <Card className="max-w-3xl p-6">
        <ActionForm action={createInstructorCourse} cancelHref="/instructor/courses" submitLabel="حفظ والمتابعة لإضافة المواد">
          <label className={label}>عنوان المقرّر (عربي) *<input name="titleAr" required minLength={2} className={input} /></label>
          <label className={label}>عنوان المقرّر (إنجليزي)<input name="titleEn" dir="ltr" className={input} /></label>
          <label className={label}>نبذة مختصرة<textarea name="summaryAr" rows={2} className={input} /></label>
          <label className={label}>وصف المقرّر ومفرداته<textarea name="descAr" rows={6} className={input} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>عدد الساعات<input name="hours" type="number" min={0} className={input} /></label>
            <label className={label}>المرحلة / البرنامج
              <select name="stageId" defaultValue="" className={input}>
                <option value="">— بلا مرحلة —</option>
                {stages.map((s) => <option key={s.id} value={s.id}>{s.titleAr}</option>)}
              </select>
            </label>
          </div>
          <label className={label}>رابط صورة المقرّر (اختياري)<input name="imageUrl" dir="ltr" placeholder="https://…" className={input} /></label>
        </ActionForm>
      </Card>
    </div>
  );
}
