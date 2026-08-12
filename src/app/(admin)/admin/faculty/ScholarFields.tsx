import type { Scholar } from "@prisma/client";
import { Field, TextArea, Checkbox } from "@/components/admin/ui";

export function ScholarFields({ s }: { s?: Scholar }) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="الاسم (عربي)" name="nameAr" defaultValue={s?.nameAr} required dir="rtl" />
        <Field label="Name (English)" name="nameEn" defaultValue={s?.nameEn} required dir="ltr" />
        <Field label="الرتبة (عربي)" name="rankAr" defaultValue={s?.rankAr} dir="rtl" />
        <Field label="Rank (English)" name="rankEn" defaultValue={s?.rankEn} dir="ltr" />
        <Field label="التخصّص (عربي)" name="specAr" defaultValue={s?.specAr} dir="rtl" />
        <Field label="Specialty (English)" name="specEn" defaultValue={s?.specEn} dir="ltr" />
        <Field
          label="رابط الصورة"
          name="photoUrl"
          defaultValue={s?.photoUrl}
          dir="ltr"
          hint="مسار مثل assets/img/scholar-1.jpg — رفع الصور من مكتبة الوسائط لاحقًا"
        />
        <Field label="الترتيب" name="order" type="number" defaultValue={s?.order ?? 0} />
      </div>
      <TextArea label="نبذة (عربي)" name="bioAr" defaultValue={s?.bioAr} dir="rtl" />
      <TextArea label="Bio (English)" name="bioEn" defaultValue={s?.bioEn} dir="ltr" />
      <div className="flex flex-wrap gap-6 pt-1">
        <Checkbox label="عضو المجلس العلمي" name="isCouncil" defaultChecked={s?.isCouncil} />
        <Checkbox label="رئيس المجلس العلمي" name="isCouncilHead" defaultChecked={s?.isCouncilHead} />
        <Checkbox label="ظاهر في الموقع" name="visible" defaultChecked={s?.visible ?? true} />
      </div>
    </>
  );
}
