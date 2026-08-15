import { Field, Select } from "@/components/admin/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function StudentFields({ record }: { record?: any }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="اسم الطالب" name="name" defaultValue={record?.name} required />
      <Field
        label="البريد الإلكتروني"
        name="email"
        type="email"
        dir="ltr"
        defaultValue={record?.email}
        required
      />
      <Field
        label={record ? "كلمة مرور جديدة" : "كلمة المرور"}
        name="password"
        type="password"
        required={!record}
        hint={record ? "اتركها فارغة للإبقاء على الحالية." : "6 أحرف على الأقل."}
      />
      <Select
        label="الحالة"
        name="status"
        defaultValue={record?.status ?? "ACTIVE"}
        options={[
          { value: "ACTIVE", label: "نشط" },
          { value: "DISABLED", label: "معطّل" },
        ]}
      />
      <Field label="الرقم الجامعي" name="studentNo" dir="ltr" defaultValue={record?.studentNo} />
      <Field label="رقم الهاتف" name="phone" dir="ltr" defaultValue={record?.phone} />
      <Field label="الدولة" name="country" defaultValue={record?.country} />
      <Field label="البرنامج" name="program" defaultValue={record?.program} />
    </div>
  );
}
