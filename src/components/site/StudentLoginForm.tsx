"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="student-login-form">
      <div className="field student-login-field">
        <label htmlFor="login-email">{t.email}</label>
        <div><Mail size={18}/><input id="login-email" name="email" type="email" autoComplete="email" dir="ltr" placeholder="name@example.com" required /></div>
      </div>
      <div className="field student-login-field" style={{ marginTop: 16 }}>
        <label htmlFor="login-password">{t.password}</label>
        <div><LockKeyhole size={18}/><input
          id="login-password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          required
        /><button type="button" onClick={() => setShowPassword(v=>!v)} aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
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
        className="student-login-submit"
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
