import { notFound } from "next/navigation";
import type { Lang } from "@/lib/site-data";
import { getPageBySlug } from "@/lib/site-content";
import { StudentLoginForm } from "@/components/site/StudentLoginForm";

const T = {
  ar: { kicker:"بوابة الطالب", title:"مرحبًا بعودتك", intro:"سجّل دخولك للوصول إلى مقرراتك ومحاضراتك واختباراتك وشهاداتك.", secure:"دخول آمن إلى حسابك الأكاديمي" },
  en: { kicker:"Student portal", title:"Welcome back", intro:"Sign in to access your courses, lectures, quizzes, and certificates.", secure:"Secure access to your academic account" },
} as const;

export async function StudentLoginPage({ lang }: { lang: Lang }) {
  const page = await getPageBySlug("student-login");
  if (!page || page.status !== "PUBLISHED") notFound();
  const t=T[lang];
  return <main className="student-login-modern" style={page.heroImage ? {backgroundImage:`linear-gradient(rgba(7,22,48,.78),rgba(7,22,48,.9)),url(${page.heroImage})`} : undefined}>
    <div className="student-login-orb student-login-orb-one"/><div className="student-login-orb student-login-orb-two"/>
    <section className="student-login-card"><div className="student-login-brand"><img src="/assets/img/logo-official.png" alt="" width="82" height="82"/><span>{t.kicker}</span></div><header><h1>{t.title}</h1><p>{t.intro}</p></header><StudentLoginForm lang={lang}/><footer><span>✓</span> {t.secure}</footer></section>
  </main>;
}
