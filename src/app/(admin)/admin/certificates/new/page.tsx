import { Info, ScrollText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { ResourceFields } from "@/components/admin/ResourceFields";
import { withRelationOptions } from "@/lib/resource-options";
import type { FieldDef } from "@/lib/resources";
import { certificateCoreFields, ijazaFields, certificateFormulaFields } from "../fields";
import { createCertificate } from "../actions";
import { CERTIFICATE_FORMULAS } from "@/lib/certificate-formulas";

export default async function NewCertificatePage() {
  await requireUser();

  // حسابات الطلاب وحدها — لا مديرين ولا محرّرين ولا أعضاء هيئة.
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, studentNo: true },
  });

  const withOptions = await withRelationOptions(certificateCoreFields);
  const fields: FieldDef[] = withOptions.map((f) =>
    f.name === "userId"
      ? {
          ...f,
          options: [
            { value: "", label: "— اختر الطالب —" },
            ...students.map((s) => ({
              value: s.id,
              label: s.studentNo ? `${s.name} — ${s.studentNo}` : s.name,
            })),
          ],
        }
      : f
  );

  return (
    <div>
      <PageHeader
        title="إصدار وثيقة"
        desc="الشهادات والإجازات المسنَدة"
      />

      {students.length === 0 ? (
        <Card className="max-w-3xl">
          <EmptyState label="لا حسابات طلاب بعد. أنشئ حساب الطالب من «حسابات الطلاب» ثم عُد لإصدار وثيقته." />
        </Card>
      ) : (
        <Card className="max-w-3xl p-6">
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-[12.5px] text-sky-900">
            <Info size={16} className="mt-0.5 shrink-0" />
            <p className="font-semibold leading-6">
              رقم التوثيق ورمز التحقّق يُولَّدان تلقائيًّا عند الحفظ ويظهران لك في صفحة الوثيقة
              بعد الإصدار. الوثيقة بعد إصدارها لا تُحرَّر: إن وقع خطأ فألغِها وأصدِر غيرها.
            </p>
          </div>

          <ActionForm action={createCertificate} cancelHref="/admin/certificates" submitLabel="إصدار الوثيقة">
            <fieldset className="mb-5 grid gap-2 sm:grid-cols-2">
              <legend className="mb-2 text-[13.5px] font-extrabold text-navy-900">صيغة نص الشهادة</legend>
              {CERTIFICATE_FORMULAS.map((formula) => (
                <label key={formula.id} className="flex cursor-pointer items-start gap-2 rounded-xl border border-black/10 px-3 py-2.5 has-[:checked]:border-gold has-[:checked]:bg-gold/10">
                  <input type="radio" name="designStyle" value={formula.id} defaultChecked={formula.id === "course"} required />
                  <span>
                    <b className="block text-[13px] text-navy-900">{formula.label}</b>
                    <small className="text-[11.5px] text-ink-soft">{formula.titleAr}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            <ResourceFields fields={fields} record={{ kind: "CERTIFICATE" }} />

            <div className="rounded-xl border border-black/10 bg-cream-50 p-5">
              <h2 className="mb-1 text-[13.5px] font-extrabold text-navy-900">البيانات التي تُدرج في نص الشهادة</h2>
              <p className="mb-4 text-[11.5px] leading-6 text-ink-soft">املأ ما ينطبق على الصيغة المختارة؛ بقية الحقول اختيارية. اسم الطالب وتاريخ الإصدار يؤخذان تلقائيًا من السجل.</p>
              <ResourceFields fields={certificateFormulaFields} />
            </div>

            {/* السند والمُجيز في صندوقٍ مستقلّ: مصطلحٌ شرعيّ لا يخصّ شهادة الإتمام. */}
            <div className="rounded-xl border border-gold/40 bg-gold/5 p-5">
              <div className="mb-1.5 flex items-center gap-2 text-[13.5px] font-extrabold text-navy-900">
                <ScrollText size={16} /> بيانات الإجازة المسنَدة
              </div>
              <p className="mb-4 text-[11.5px] leading-6 text-ink-soft">
                تُملأ إذا كان نوع الوثيقة «إجازة مسنَدة»: السند المتّصل بالرواية عن الشيخ، واسم
                المُجيز. وتُترك فارغةً في شهادة الإتمام.
              </p>
              <ResourceFields fields={ijazaFields} />
            </div>
          </ActionForm>
        </Card>
      )}
    </div>
  );
}
