"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { Lang } from "@/lib/site-data";
import { siteHref } from "@/lib/site-links";
import { studentLogout } from "@/app/(site)/student-actions";

export function StudentAccountMenu({
  lang,
  name,
  email,
  labels,
}: {
  lang: Lang;
  name?: string | null;
  email?: string | null;
  labels: { account: string; profile: string; courses: string; sessions: string; certificates: string; payments: string; library: string; logout: string };
}) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const logout = studentLogout.bind(null, lang);

  useEffect(() => {
    if (menuRef.current) menuRef.current.open = false;
  }, [pathname]);

  const close = () => {
    if (menuRef.current) menuRef.current.open = false;
  };

  return (
    <details ref={menuRef} className="student-account-menu">
      <summary className="btn btn-gold btn-student">
        <span className="btn-student-ic"><svg aria-hidden="true"><use href="#i-student" /></svg></span>
        <span className="btn-student-label">{name || labels.account}</span><span className="student-account-arrow">⌄</span>
      </summary>
      <div className="student-account-drop">
        <div className="student-account-head"><b>{name}</b><small>{email}</small></div>
        <Link onClick={close} href={`${siteHref(lang, "student")}`}><span>◉</span>{labels.profile}</Link>
        <Link onClick={close} href={`${siteHref(lang, "student/courses")}`}><span>▤</span>{labels.courses}</Link>
        <Link onClick={close} href={`${siteHref(lang, "student/sessions")}`}><span>◷</span>{labels.sessions}</Link>
        <Link onClick={close} href={`${siteHref(lang, "student/certificates")}`}><span>◇</span>{labels.certificates}</Link>
        <Link onClick={close} href={`${siteHref(lang, "student/payments")}`}><span>▣</span>{labels.payments}</Link>
        <Link onClick={close} href={siteHref(lang, "library.html")}><span>▥</span>{labels.library}</Link>
        <form action={logout}><button type="submit" onClick={close}><span>↪</span>{labels.logout}</button></form>
      </div>
    </details>
  );
}
