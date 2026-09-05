"use client";

import { useActionState } from "react";
import { updateCertificateDesign } from "./actions";

const STYLES = [
  { value: "classic", label: "كلاسيكي هادئ", hint: "إطار ذهبي رسمي" },
  { value: "waves", label: "موجات عصرية", hint: "موجات ناعمة وتدرجات" },
  { value: "particles", label: "جسيمات احتفالية", hint: "دوائر مضيئة ونقاط" },
];

export function CertificateStyleForm({ id, value }: { id: string; value: string }) {
  const [error, action, pending] = useActionState(updateCertificateDesign.bind(null, id), undefined);
  return (
    <form action={action} className="certificate-style-form">
      <div className="certificate-style-options">
        {STYLES.map((style) => (
          <label key={style.value} className={value === style.value ? "is-selected" : undefined}>
            <input type="radio" name="designStyle" value={style.value} defaultChecked={value === style.value} />
            <span><b>{style.label}</b><small>{style.hint}</small></span>
          </label>
        ))}
      </div>
      {error && <p className="text-[12px] font-bold text-red-700">{error}</p>}
      <button type="submit" disabled={pending} className="mt-3 rounded-xl bg-gradient-to-l from-gold-1 to-gold-3 px-4 py-2 text-[12.5px] font-extrabold text-navy-950 disabled:opacity-60">
        {pending ? "جارٍ الحفظ…" : "حفظ نمط الشهادة"}
      </button>
    </form>
  );
}
