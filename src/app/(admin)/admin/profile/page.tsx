import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card, Field } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { updateProfile } from "./actions";

export default async function ProfilePage() {
  const me = await requireUser();
  const user = await prisma.user.findUnique({ where: { id: me.id }, select: { name: true, email: true, avatarUrl: true } });
  if (!user) redirect("/admin");
  return <div><PageHeader title="ملفي الشخصي" desc="تعديل بيانات حسابك في لوحة الإدارة." /><Card className="max-w-2xl p-6"><ActionForm action={updateProfile} cancelHref="/admin"><div className="grid gap-5 sm:grid-cols-2"><Field label="الاسم" name="name" defaultValue={user.name} required /><Field label="البريد الإلكتروني" name="email" type="email" dir="ltr" defaultValue={user.email} required /><div className="sm:col-span-2"><Field label="رابط الصورة الشخصية" name="avatarUrl" type="url" dir="ltr" defaultValue={user.avatarUrl} hint="يمكنك إدخال رابط صورة مباشر." /></div><Field label="كلمة مرور جديدة" name="password" type="password" hint="اتركها فارغة للإبقاء على الحالية." /></div></ActionForm></Card></div>;
}
