import { requireInstructor, ownedCourseFilter } from "@/lib/instructor";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState, TextArea } from "@/components/admin/ui";
import { saveGrade, addAssessmentGrade } from "./actions";
import { ActionForm } from "@/components/admin/ActionForm";

const inputClass = "w-full min-w-0 rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[14px] text-navy-900 outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15";
const labelClass = "mb-1.5 block text-[13px] font-bold text-navy-900";
export default async function Gradebook({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const me=await requireInstructor();
  if(!me.scholarId) return <p>يجب ربط حسابك بملف الهيئة العلمية.</p>;
  const roster=await prisma.enrollment.findMany({ where:{course:ownedCourseFilter(me.scholarId),status:{in:["ACTIVE","COMPLETED"]}},include:{user:{select:{name:true}},course:{select:{titleAr:true}}},orderBy:{enrolledAt:"desc"} });
  const [works, tests, flags]=await Promise.all([
    prisma.assignmentSubmission.findMany({ where: { assignment: { course: ownedCourseFilter(me.scholarId) }, state: { not: "DRAFT" } }, include: { user: { select: { name: true } }, assignment: { include: { course: { select: { titleAr: true } } } } }, orderBy: { submittedAt: "desc" } }),
    prisma.quizAttempt.findMany({ where: { submittedAt: { not: null }, quiz: { course: ownedCourseFilter(me.scholarId) } }, include: { user: { select: { name: true } }, quiz: { select: { titleAr: true } } }, orderBy: { submittedAt: "desc" } }), searchParams]);
  return (
    <div className="min-w-0 space-y-6">
      <PageHeader title="سجل الدرجات" desc="واجبات واختبارات وتقييمات طلاب مقرراتك فقط." />
      {flags.saved && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-bold text-emerald-800">تم حفظ الدرجة وإشعار الطالب.</div>}

      <Card className="p-4 sm:p-6">
        <div className="mb-5 border-b border-black/5 pb-4">
          <h2 className="text-[17px] font-extrabold text-navy-900">رصد درجة تقييم</h2>
          <p className="mt-1 text-[12.5px] leading-6 text-ink-soft">اختر الطالب ومقرره، ثم أدخل التقييم والدرجة المستحقة.</p>
        </div>
        {roster.length === 0 ? <EmptyState label="لا يوجد طلاب مسجلون في مقرراتك لرصد درجاتهم بعد." /> : (
          <ActionForm action={addAssessmentGrade} cancelHref="/instructor" submitLabel="رصد الدرجة">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block min-w-0"><span className={labelClass}>الطالب والمقرر <span className="text-red-500">*</span></span>
                <select name="enrollmentId" required defaultValue="" className={inputClass}><option value="" disabled>اختر الطالب والمقرر</option>{roster.map(e => <option key={e.id} value={e.id}>{e.user.name} — {e.course.titleAr}</option>)}</select>
              </label>
              <label className="block min-w-0"><span className={labelClass}>اسم التقييم <span className="text-red-500">*</span></span><input name="title" required maxLength={191} placeholder="مثل: اختبار شفهي، مشاركة، تقييم عملي" className={inputClass} /></label>
              <label className="block min-w-0"><span className={labelClass}>الدرجة النهائية <span className="text-red-500">*</span></span><input name="maxScore" type="number" min={1} max={1000} required defaultValue={100} dir="ltr" className={inputClass} /></label>
              <label className="block min-w-0"><span className={labelClass}>درجة الطالب <span className="text-red-500">*</span></span><input name="score" type="number" min={0} required placeholder="0" dir="ltr" className={inputClass} /></label>
              <div className="md:col-span-2"><TextArea label="ملاحظات" name="feedback" rows={3} /></div>
            </div>
          </ActionForm>
        )}
      </Card>

      <section className="space-y-4" aria-labelledby="assignment-grades-heading">
        <h2 id="assignment-grades-heading" className="flex items-center gap-2 text-[18px] font-extrabold text-navy-900">الواجبات والتقييمات <Badge tone="blue">{works.length}</Badge></h2>
        {!works.length && <Card><EmptyState label="لا توجد درجات أو واجبات مسلمة بعد." /></Card>}
        {works.map(w => (
          <Card key={w.id} className="p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-black/5 pb-4">
              <div className="min-w-0"><h3 className="break-words text-[15px] font-extrabold text-navy-900">{w.user.name} — {w.assignment.titleAr}</h3><p className="mt-1 text-[12.5px] text-ink-soft">{w.assignment.course.titleAr}</p></div>
              <Badge tone={w.state === "GRADED" ? "green" : "gold"}>{w.state === "GRADED" ? "تم التصحيح" : "بانتظار التصحيح"}</Badge>
            </div>
            {w.text && <p className="mt-4 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-[13.5px] leading-7 text-navy-800">{w.text}</p>}
            {w.fileUrl && /^https?:\/\/|^\/api\/blob\//i.test(w.fileUrl) && <a href={w.fileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-[13px] font-bold text-blue-700 underline underline-offset-4">فتح ملف الطالب</a>}
            <form action={saveGrade} className="mt-5 space-y-4">
              <input name="id" type="hidden" value={w.id} />
              <div className="grid items-start gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <label className="block min-w-0"><span className={labelClass}>الدرجة من {w.assignment.maxScore}</span><input className={inputClass} name="score" type="number" min={0} max={w.assignment.maxScore} required defaultValue={w.score ?? ""} dir="ltr" /></label>
                <TextArea label="ملاحظات التصحيح" name="feedback" rows={2} defaultValue={w.feedback} />
              </div>
              <div className="border-t border-black/5 pt-4"><button type="submit" className="rounded-xl bg-navy-800 px-5 py-2.5 text-[13.5px] font-extrabold text-white transition hover:bg-navy-900">حفظ الدرجة</button></div>
            </form>
          </Card>
        ))}
      </section>

      <section className="space-y-4" aria-labelledby="quiz-grades-heading">
        <h2 id="quiz-grades-heading" className="flex items-center gap-2 text-[18px] font-extrabold text-navy-900">نتائج الاختبارات <Badge tone="blue">{tests.length}</Badge></h2>
        <Card>
          {!tests.length ? <EmptyState label="لا توجد نتائج اختبارات بعد." /> : (
            <div className="overflow-x-auto rounded-2xl">
              <table className="w-full min-w-[580px] text-right text-[13.5px]">
                <thead className="bg-slate-50 text-[12px] text-ink-soft"><tr className="border-b border-black/5"><th scope="col" className="px-5 py-3.5 font-bold">الطالب</th><th scope="col" className="px-5 py-3.5 font-bold">الاختبار</th><th scope="col" className="px-5 py-3.5 font-bold">النسبة</th><th scope="col" className="px-5 py-3.5 font-bold">النتيجة</th></tr></thead>
                <tbody>{tests.map(t => <tr key={t.id} className="border-b border-black/5 last:border-0 hover:bg-slate-50/70"><td className="px-5 py-4 font-bold text-navy-900">{t.user.name}</td><td className="px-5 py-4 text-navy-800">{t.quiz.titleAr}</td><td className="whitespace-nowrap px-5 py-4 font-bold text-navy-900">{t.score === null ? "بانتظار التصحيح" : <span dir="ltr">{t.score}%</span>}</td><td className="whitespace-nowrap px-5 py-4"><Badge tone={t.passed === null ? "gray" : t.passed ? "green" : "red"}>{t.passed === null ? "بانتظار التصحيح" : t.passed ? "ناجح" : "غير ناجح"}</Badge></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
