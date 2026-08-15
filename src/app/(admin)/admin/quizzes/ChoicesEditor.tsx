import { CHOICE_SLOTS } from "./fields";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * محرّر خيارات السؤال.
 *
 * صفوفٌ ثابتة العدد بدل إضافة/حذف ديناميكيّة: النموذج كلّه يعمل بلا JavaScript
 * كبقيّة اللوحة، والصفّ الفارغ يُهمَل عند الحفظ. ستّة صفوف تكفي للأسئلة
 * الحديثيّة المعتادة، ومن أراد أكثر يقسّم السؤال.
 */
export function ChoicesEditor({ choices }: { choices?: any[] }) {
  const rows = Array.from({ length: CHOICE_SLOTS }, (_, i) => choices?.[i]);

  return (
    <div className="rounded-xl border border-black/10 bg-cream-50/60 p-4">
      <div className="mb-1 text-[13.5px] font-extrabold text-navy-900">خيارات السؤال</div>
      <p className="mb-4 text-[11.5px] leading-6 text-ink-soft">
        علّم مربّع «صحيحة» أمام الإجابة الصحيحة. اترك الصفوف الزائدة فارغةً فتُهمَل.
        <br />
        <b>اختيار واحد</b> و<b>صواب/خطأ</b>: إجابة صحيحة واحدة بالضبط. <b>اختيار متعدّد</b>: واحدة
        فأكثر. <b>إجابة قصيرة</b>: بلا خيارات إطلاقًا (تُصحَّح يدويًّا).
        <br />
        لسؤال صواب/خطأ اكتب خيارين فقط: «صواب» و«خطأ»، وعلّم الصحيح منهما.
      </p>

      <div className="space-y-2.5">
        {rows.map((c, i) => (
          <div
            key={i}
            className="grid items-center gap-2.5 rounded-lg border border-black/5 bg-white p-2.5 sm:grid-cols-[28px_minmax(0,1fr)_minmax(0,1fr)_92px]"
          >
            <span className="grid h-7 w-7 place-items-center rounded-md bg-cream-50 text-[11.5px] font-extrabold text-navy-800">
              {i + 1}
            </span>
            <input
              name={`choice_${i}_ar`}
              defaultValue={c?.textAr ?? ""}
              dir="rtl"
              placeholder="نصّ الخيار (عربي)"
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[13.5px] outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
            />
            <input
              name={`choice_${i}_en`}
              defaultValue={c?.textEn ?? ""}
              dir="ltr"
              placeholder="Choice text (English)"
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[13.5px] outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name={`choice_${i}_correct`}
                defaultChecked={Boolean(c?.correct)}
                className="h-4 w-4 rounded border-black/20 accent-emerald-600"
              />
              <span className="text-[12.5px] font-bold text-emerald-700">صحيحة</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
