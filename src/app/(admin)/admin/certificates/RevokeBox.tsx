"use client";

import { useActionState, useState } from "react";
import { Ban, Loader2, RotateCcw } from "lucide-react";
import Swal from "sweetalert2";

type Action = (prev: string | undefined, formData: FormData) => Promise<string | undefined>;

/**
 * إلغاء الوثيقة — بخطوتين ظاهرتين لا بضغطةٍ واحدة.
 *
 * الإلغاء يمسّ وثيقةً قد تكون في يد جهةٍ خارجيّة، فلا يُترك لزرٍّ أحمرَ قد
 * يُضغط سهوًا: يُفتح الصندوق أوّلًا، ثمّ يُكتب السبب، ثمّ يُؤشَّر الإقرار،
 * ثمّ يسأل المتصفّح تأكيدًا أخيرًا.
 */
export function RevokeBox({ action }: { action: Action }) {
  const [error, formAction, pending] = useActionState(action, undefined);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-extrabold text-red-700 transition hover:bg-red-100"
      >
        <Ban size={15} /> إلغاء هذه الوثيقة…
      </button>
    );
  }

  const handleRevokeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const result = await Swal.fire({
      title: "تأكيد الإلغاء؟",
      text: "سيصير التحقّق العلنيّ لهذه الوثيقة «ملغاة». هل أنت متأكّد؟",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "نعم، ألغِ الوثيقة",
      cancelButtonText: "تراجع",
      reverseButtons: true,
      focusCancel: true,
    });
    if (!result.isConfirmed) return;
    const fd = new FormData(form);
    formAction(fd);
  };

  return (
    <form
      onSubmit={handleRevokeSubmit}
      className="rounded-xl border border-red-200 bg-red-50 p-4"
    >
      <div className="flex items-center gap-2 text-[13.5px] font-extrabold text-red-700">
        <Ban size={16} /> إلغاء الوثيقة
      </div>
      <p className="mt-1.5 text-[11.5px] leading-6 text-red-700/90">
        لا تُحذف الوثيقة من السجلّ؛ يظلّ رقم توثيقها ورمز تحقّقها قائمين، وتقول صفحة التحقّق
        العلنيّة صراحةً إنّها ملغاة. سبب الإلغاء يُحفظ للسجلّ الداخليّ ولا يُعرض للعموم.
      </p>

      <label className="mt-3 block">
        <span className="mb-1.5 block text-[12.5px] font-bold text-red-800">سبب الإلغاء</span>
        <textarea
          name="revokeNote"
          rows={3}
          required
          dir="rtl"
          className="w-full rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-[13.5px] leading-7 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-200/40"
        />
      </label>

      <label className="mt-3 flex items-center gap-2.5">
        <input
          type="checkbox"
          name="confirmRevoke"
          required
          className="h-4 w-4 rounded border-red-300 accent-red-600"
        />
        <span className="text-[12.5px] font-bold text-red-800">
          أُقرّ بأنّي أقصد إلغاء هذه الوثيقة.
        </span>
      </label>

      {error && (
        <div className="mt-3 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-[12.5px] font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2.5">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-[13.5px] font-extrabold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
        >
          {pending && <Loader2 size={15} className="animate-spin" />}
          {pending ? "جارٍ الإلغاء…" : "تأكيد الإلغاء"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] font-bold text-ink-soft hover:bg-black/5"
        >
          تراجع
        </button>
      </div>
    </form>
  );
}

/** إعادة وثيقةٍ أُلغيت خطأً إلى السريان. */
export function RestoreBox({ action }: { action: Action }) {
  const [error, formAction, pending] = useActionState(action, undefined);

  const handleRestoreSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const result = await Swal.fire({
      title: "إعادة الوثيقة؟",
      text: "ستعود الوثيقة سارية في صفحة التحقّق العلنيّة. هل أنت متأكّد؟",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#1a365d",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "نعم، أعدها سارية",
      cancelButtonText: "إلغاء",
      reverseButtons: true,
      focusCancel: true,
    });
    if (!result.isConfirmed) return;
    const fd = new FormData(form);
    formAction(fd);
  };

  return (
    <form
      onSubmit={handleRestoreSubmit}
    >
      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[12.5px] font-semibold text-red-700">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] font-bold text-navy-800 transition hover:border-gold/50 disabled:opacity-60"
      >
        {pending ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
        إلغاء الإلغاء (إعادة الوثيقة سارية)
      </button>
    </form>
  );
}
