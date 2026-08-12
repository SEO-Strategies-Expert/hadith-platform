import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/guard";
import { PageHeader, Card, Field, Select } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { createUser } from "../actions";

export default async function NewUserPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/admin");
  }

  return (
    <div>
      <PageHeader title="إضافة مستخدم" desc="أنشئ حساب مدير أو محرّر جديد." />
      <Card className="max-w-2xl p-6">
        <ActionForm action={createUser} cancelHref="/admin/users">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="الاسم" name="name" required />
            <Field label="البريد الإلكتروني" name="email" type="email" dir="ltr" required />
            <Field label="كلمة المرور" name="password" type="password" required hint="6 أحرف على الأقل" />
            <Select
              label="الدور"
              name="role"
              defaultValue="EDITOR"
              options={[
                { value: "EDITOR", label: "محرّر" },
                { value: "ADMIN", label: "مدير" },
              ]}
            />
            <Select
              label="الحالة"
              name="status"
              defaultValue="ACTIVE"
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
