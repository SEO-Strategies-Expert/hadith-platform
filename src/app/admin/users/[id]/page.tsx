import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guard";
import { PageHeader, Card, Field, Select } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { updateUser } from "../actions";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin");
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) notFound();

  return (
    <div>
      <PageHeader title="تعديل مستخدم" desc={user.email} />
      <Card className="max-w-2xl p-6">
        <ActionForm action={updateUser.bind(null, id)} cancelHref="/admin/users">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="الاسم" name="name" defaultValue={user.name} required />
            <Field label="البريد الإلكتروني" name="email" type="email" dir="ltr" defaultValue={user.email} required />
            <Field
              label="كلمة مرور جديدة"
              name="password"
              type="password"
              hint="اتركها فارغة للإبقاء على الحالية"
            />
            <Select
              label="الدور"
              name="role"
              defaultValue={user.role}
              options={[
                { value: "EDITOR", label: "محرّر" },
                { value: "ADMIN", label: "مدير" },
              ]}
            />
            <Select
              label="الحالة"
              name="status"
              defaultValue={user.status}
              options={[
                { value: "ACTIVE", label: "نشط" },
                { value: "DISABLED", label: "معطّل" },
              ]}
            />
          </div>
        </ActionForm>
      </Card>
    </div>
  );
}
