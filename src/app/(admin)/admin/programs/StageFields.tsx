import type { ProgramStage } from "@prisma/client";
import { Field, TextArea, Checkbox } from "@/components/admin/ui";

/* eslint-disable @typescript-eslint/no-explicit-any */

export function StageFields({ s }: { s?: ProgramStage }) {
  const items = (s?.items as any) || {};
  const itemsAr = Array.isArray(items.ar) ? items.ar.join("\n") : "";
  const itemsEn = Array.isArray(items.en) ? items.en.join("\n") : "";

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="المفتاح (فريد)" name="key" defaultValue={s?.key} dir="ltr" required hint="foundation / advanced / research" />
        <Field label="الترتيب" name="order" type="number" defaultValue={s?.order ?? 0} />
        <Field label="رقم المرحلة (عربي)" name="numAr" defaultValue={s?.numAr} />
        <Field label="Stage number (English)" name="numEn" defaultValue={s?.numEn} dir="ltr" />
        <Field label="العنوان (عربي)" name="titleAr" defaultValue={s?.titleAr} required />
        <Field label="Title (English)" name="titleEn" defaultValue={s?.titleEn} dir="ltr" required />
        <Field label="معلومات (عربي)" name="metaAr" defaultValue={s?.metaAr} hint="سنة دراسية · ٨ مقرّرات" />
        <Field label="Meta (English)" name="metaEn" defaultValue={s?.metaEn} dir="ltr" />
      </div>
      <TextArea label="الوصف (عربي)" name="descAr" defaultValue={s?.descAr} dir="rtl" />
      <TextArea label="Description (English)" name="descEn" defaultValue={s?.descEn} dir="ltr" />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextArea label="المقرّرات (عربي) — سطر لكل مقرّر" name="itemsAr" defaultValue={itemsAr} dir="rtl" rows={4} />
        <TextArea label="Courses (English) — one per line" name="itemsEn" defaultValue={itemsEn} dir="ltr" rows={4} />
        <Field label="الأيقونة" name="icon" defaultValue={s?.icon} dir="ltr" />
        <Field label="رابط التفاصيل" name="moreHref" defaultValue={s?.moreHref} dir="ltr" />
      </div>
      <Checkbox label="ظاهر في الموقع" name="visible" defaultChecked={s?.visible ?? true} />
    </div>
  );
}
