import { requireInstructor } from "@/lib/instructor";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ImagePickerField } from "@/components/admin/ImagePickerField";
import { saveInstructorProfile } from "./actions";

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const me = await requireInstructor();
  const [scholar, flags] = await Promise.all([me.scholarId ? prisma.scholar.findUnique({ where: { id: me.scholarId } }) : null, searchParams]);
  const cv = me.scholarId ? await prisma.setting.findUnique({ where: { key: `instructor.bio.${me.scholarId}` } }) : null;
  return <div><PageHeader title="ملفي الشخصي وسيرتي الذاتية" />{flags.saved && <p role="status">تم حفظ المعلومات.</p>}{!scholar ? <p>اطلب من الإدارة ربط حسابك بملف الهيئة العلمية.</p> : <Card className="p-5"><ActionForm action={saveInstructorProfile} cancelHref="/instructor">
    {[["name", "الاسم العربي", me.name], ["nameEn", "الاسم الإنجليزي", scholar.nameEn], ["email", "البريد الإلكتروني", me.email], ["rankAr", "الرتبة العلمية", scholar.rankAr], ["specAr", "التخصص", scholar.specAr], ["countryAr", "الدولة", scholar.countryAr]].map(([name, label, value]) => <label className="block" key={name}>{label}<input className="mt-1 block w-full rounded-lg border p-3" name={name!} defaultValue={value || ""} type={name === "email" ? "email" : "text"} required={["name", "nameEn", "email"].includes(name!)} /></label>)}
    <ImagePickerField name="photoUrl" label="الصورة الشخصية" defaultValue={scholar.photoUrl} />
    <label className="block">السيرة الذاتية<textarea name="bioAr" rows={8} className="mt-1 w-full rounded-lg border p-3" defaultValue={typeof cv?.value === "string" ? cv.value : scholar.bioAr || ""} /></label>
    <label className="block">كلمة مرور جديدة (اختياري)<input name="password" type="password" autoComplete="new-password" className="mt-1 block w-full rounded-lg border p-3" /></label>
  </ActionForm></Card>}</div>;
}
