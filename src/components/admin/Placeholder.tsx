import { Hammer } from "lucide-react";

export function Placeholder({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-900">{title}</h1>
        {desc && <p className="mt-1 text-[14px] text-ink-soft">{desc}</p>}
      </div>
      <div className="grid place-items-center rounded-2xl border border-dashed border-black/15 bg-white/60 px-6 py-20 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gold/15 text-gold-3">
          <Hammer size={28} />
        </div>
        <h2 className="mt-4 text-[16px] font-bold text-navy-800">قيد الإنشاء</h2>
        <p className="mt-1 max-w-md text-[13.5px] text-ink-soft">
          هذه الشاشة ستُبنى في المرحلة القادمة بعد تفعيل قاعدة البيانات وترحيل المحتوى.
        </p>
      </div>
    </div>
  );
}
