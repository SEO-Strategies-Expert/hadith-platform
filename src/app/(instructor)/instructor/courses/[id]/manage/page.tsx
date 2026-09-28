import { notFound } from "next/navigation";
import { requireInstructor, getInstructorCourse } from "@/lib/instructor";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import { addInstructorModule } from "./actions";

export default async function InstructorCourseManagePage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireInstructor();
  const { id } = await params;
  if (!me.scholarId) notFound();
  const course = await getInstructorCourse(me.scholarId, id);
  if (!course) notFound();
  return <div><PageHeader title={`إدارة محتوى: ${course.titleAr}`} desc="إضافة وحدات إلى مقررك فقط." /><Card className="mb-5 p-5"><h2 className="mb-3 font-extrabold">إضافة وحدة</h2><form action={addInstructorModule.bind(null, id)} className="grid gap-3 sm:grid-cols-2"><input name="titleAr" required placeholder="عنوان الوحدة بالعربية" className="rounded-lg border border-black/10 px-3 py-2" /><input name="titleEn" required dir="ltr" placeholder="Unit title (English)" className="rounded-lg border border-black/10 px-3 py-2" /><button className="w-fit rounded-lg bg-navy-800 px-4 py-2 text-sm font-bold text-white sm:col-span-2">إضافة الوحدة</button></form></Card><h2 className="mb-3 font-extrabold">الوحدات الحالية</h2>{course.modules.length ? <div className="space-y-3">{course.modules.map((m) => <Card key={m.id} className="p-4"><b>{m.titleAr}</b><span className="mr-2 text-sm text-ink-soft">({m.titleEn})</span></Card>)}</div> : <Card><EmptyState label="لا وحدات بعد." /></Card>}</div>;
}
