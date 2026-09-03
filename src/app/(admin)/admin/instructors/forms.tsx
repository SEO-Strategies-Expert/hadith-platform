"use client";

import { useActionState, useTransition } from "react";
import { Loader2, Link2, Link2Off, UserPlus } from "lucide-react";
import Swal from "sweetalert2";

type Action = (prev: string | undefined, formData: FormData) => Promise<string | undefined>;

/**
 * نماذج شاشة الربط. صغيرة وداخل صفوف الجدول عمدًا: الإسناد قرار من سطر واحد،
 * وفتح صفحة مستقلّة لكل حساب يُضاعف النقر بلا فائدة.
 */

export function AssignForm({
  action,
  scholars,
  currentScholarId,
}: {
  action: Action;
  scholars: { id: string; nameAr: string; takenBy: string | null }[];
  currentScholarId: string | null;
}) {
  const [error, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <select
        name="scholarId"
        defaultValue={currentScholarId ?? ""}
        className="min-w-52 rounded-lg border border-black/10 bg-white px-3 py-2 text-[13px] outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
      >
        <option value="">— اختر ملفّ عضو الهيئة —</option>
        {scholars.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nameAr}
            {s.takenBy && s.id !== currentScholarId ? ` (مسنَد إلى ${s.takenBy})` : ""}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-l from-gold-1 to-gold-3 px-3.5 py-2 text-[12.5px] font-extrabold text-navy-950 disabled:opacity-60"
      >
        {pending ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
        {currentScholarId ? "تغيير الربط" : "ربط"}
      </button>

      {error && (
        <span className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[12px] font-semibold text-red-700">
          {error}
        </span>
      )}
    </form>
  );
}

export function UnlinkButton({ action }: { action: () => Promise<void> }) {
  const [pending, startTransition] = useTransition();

  const handleClick = async () => {
    const result = await Swal.fire({
      title: "فكّ الإسناد؟",
      text: "فكّ الإسناد يُفرغ لوحة هذا المحاضر حتى تربطه من جديد. متابعة؟",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "نعم، فكّ الإسناد",
      cancelButtonText: "إلغاء",
      reverseButtons: true,
      focusCancel: true,
    });
    if (!result.isConfirmed) return;
    startTransition(() => {
      const p = action();
      if (p instanceof Promise) {
        p.catch(() => {
          Swal.fire({
            icon: "error",
            title: "تعذّر فكّ الإسناد",
            text: "حدث خطأ. حاول مرة أخرى.",
            confirmButtonColor: "#dc2626",
            confirmButtonText: "حسنًا",
          });
        });
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-2 text-[12.5px] font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
      title="فكّ الإسناد"
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Link2Off size={14} />} فكّ الإسناد
    </button>
  );
}

export function PromoteForm({ action }: { action: Action }) {
  const [error, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-bold text-navy-900">بريد الحساب</span>
        <input
          name="email"
          type="email"
          dir="ltr"
          required
          placeholder="name@example.com"
          className="w-72 rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-gold focus:ring-4 focus:ring-gold/15"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-gold-1 to-gold-3 px-5 py-2.5 text-[13.5px] font-extrabold text-navy-950 disabled:opacity-60"
      >
        {pending ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
        ترقية إلى عضو هيئة تدريس
      </button>
      {error && (
        <div className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-semibold text-red-700">
          {error}
        </div>
      )}
    </form>
  );
}
