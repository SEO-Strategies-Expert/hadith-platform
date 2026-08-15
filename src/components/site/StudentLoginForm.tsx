"use client";

import { useActionState } from "react";
import type { Lang } from "@/lib/site-data";
import { studentLogin } from "@/app/(site)/student-actions";

const T = {
  ar: {
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    submit: "تسجيل الدخول",
    pending: "جارٍ الدخول…",
    hint: "الحساب يُنشئه القسم الأكاديمي بعد قبول الطلب.",
  },
  en: {
    email: "Email address",
    password: "Password",
    submit: "Sign in",
    pending: "Signing in…",
    hint: "Your account is created by the academic office after your application is accepted.",
  },
} as const;

export function StudentLoginForm({ lang }: { lang: Lang }) {
  const [error, formAction, pending] = useActionState(studentLogin.bind(null, lang), undefined);
  const t = T[lang];

  return (
    <form action={formAction}>
      <div className="field">
        <label htmlFor="login-email">{t.email}</label>
        <input id="login-email" name="email" type="email" autoComplete="email" dir="ltr" required />
      </div>
      <div className="field" style={{ marginTop: 14 }}>
        <label htmlFor="login-password">{t.password}</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {error && (
        <p
          role="alert"
          style={{
            marginTop: 16,
            padding: "12px 14px",
            borderRadius: 12,
            background: "#fdecec",
            border: "1px solid #f3c2c2",
            color: "#8d1f1f",
            fontWeight: 800,
          }}
        >
          {error}
        </p>
      )}

      <button
        className="btn btn-gold btn-lg"
        style={{ width: "100%", justifyContent: "center", marginTop: 20 }}
        type="submit"
        disabled={pending}
      >
        {pending ? t.pending : t.submit}
      </button>
      <p style={{ marginTop: 14, textAlign: "center", fontSize: 13, color: "var(--ink-soft)" }}>
        {t.hint}
      </p>
    </form>
  );
}
