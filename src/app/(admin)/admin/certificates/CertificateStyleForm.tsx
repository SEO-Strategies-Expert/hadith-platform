"use client";

import { useActionState, useState } from "react";
import { OfficialCertificate } from "@/components/site/OfficialCertificate";
import { CERTIFICATE_FORMULAS, formulaForCertificate, type CertificateFormulaId } from "@/lib/certificate-formulas";
import { updateCertificateDesign } from "./actions";

export function CertificateStyleForm({
  id,
  value,
  kind,
  holder,
  subject,
  extra,
  granter,
  issuedAt,
  serial,
  verifyCode,
  signatures,
}: {
  id: string;
  value: string;
  kind: string;
  holder: string;
  subject: string;
  extra: string;
  granter: string;
  issuedAt: string;
  serial: string;
  verifyCode: string;
  signatures: { src?: string | null; name?: string | null; role: string }[];
}) {
  const initial = formulaForCertificate(value, kind).id;
  const [selected, setSelected] = useState<CertificateFormulaId>(initial);
  const [error, action, pending] = useActionState(updateCertificateDesign.bind(null, id), undefined);

  return (
    <form action={action} className="grid gap-4">
      <OfficialCertificate
        formulaId={selected}
        kind={kind}
        holder={holder}
        subject={subject}
        extra={extra}
        granter={granter}
        issuedAt={issuedAt}
        serial={serial}
        verifyCode={verifyCode}
        signatures={signatures}
      />
      <div>
        <h2 className="mb-1 text-[14px] font-extrabold text-navy-900">صيغة نص الشهادة</h2>
        <p className="mb-3 text-[11.5px] leading-6 text-ink-soft">اختر إحدى الصيغ الخمس. يتغيّر النص في المعاينة، والتصميم يبقى إطار الشهادة الرسمي.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {CERTIFICATE_FORMULAS.map((formula) => (
            <label key={formula.id} className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 ${selected === formula.id ? "border-gold bg-gold/10" : "border-black/10 bg-white"}`}>
              <input
                type="radio"
                name="designStyle"
                value={formula.id}
                checked={selected === formula.id}
                onChange={() => setSelected(formula.id)}
              />
              <span>
                <b className="block text-[13px] text-navy-900">{formula.label}</b>
                <small className="text-[11.5px] text-ink-soft">{formula.titleAr}</small>
              </span>
            </label>
          ))}
        </div>
      </div>
      {error && <p className="text-[12px] font-bold text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="w-fit rounded-xl bg-gradient-to-l from-gold-1 to-gold-3 px-4 py-2 text-[12.5px] font-extrabold text-navy-950 disabled:opacity-60">
        {pending ? "جارٍ الحفظ…" : "حفظ صيغة الشهادة"}
      </button>
    </form>
  );
}
