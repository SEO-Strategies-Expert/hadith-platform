"use client";

import { useActionState } from "react";
import { LogIn, Loader2 } from "lucide-react";
import { authenticate } from "@/app/(admin)/login/actions";

export function LoginForm() {
  const [error, formAction, pending] = useActionState(authenticate, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-[13.5px] font-bold text-navy-900">
          البريد الإلكتروني
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
          placeholder="admin@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-[13.5px] font-bold text-navy-900">
          كلمة المرور
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-gold focus:ring-4 focus:ring-gold/15"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-semibold text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-gold-1 to-gold-3 px-4 py-3 text-[15px] font-extrabold text-navy-950 shadow-lg shadow-gold/30 transition hover:brightness-105 disabled:opacity-60"
      >
        {pending ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
        {pending ? "جارٍ الدخول…" : "تسجيل الدخول"}
      </button>
    </form>
  );
}
