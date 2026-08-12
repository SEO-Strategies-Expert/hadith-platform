"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";

type Action = (
  prev: string | undefined,
  formData: FormData
) => Promise<string | undefined>;

export function ActionForm({
  action,
  children,
  cancelHref,
  submitLabel = "حفظ",
}: {
  action: Action;
  children: React.ReactNode;
  cancelHref: string;
  submitLabel?: string;
}) {
  const [error, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-5">
      {children}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2.5 border-t border-black/5 pt-5">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-gold-1 to-gold-3 px-6 py-2.5 text-[14px] font-extrabold text-navy-950 shadow-md hover:brightness-105 disabled:opacity-60"
        >
          {pending && <Loader2 size={16} className="animate-spin" />}
          {pending ? "جارٍ الحفظ…" : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="rounded-xl border border-black/10 px-5 py-2.5 text-[14px] font-bold text-ink-soft hover:bg-black/5"
        >
          إلغاء
        </Link>
      </div>
    </form>
  );
}
