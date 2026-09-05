"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProgressBar, Pill, studentHref } from "@/components/site/StudentPortalKit";
import type { Lang } from "@/lib/site-data";

type Course = { id: string; titleAr: string; titleEn: string; summaryAr: string | null; summaryEn: string | null; descAr: string | null; descEn: string | null; stage: { titleAr: string; titleEn: string } | null; instructor: { nameAr: string; nameEn: string } | null };
type Enrollment = { id: string; status: string; progressPct: number; course: Course };

export function StudentCourseGrid({ lang, enrollments, labels }: { lang: Lang; enrollments: Enrollment[]; labels: Record<string, string> }) {
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("all"); const [stage, setStage] = useState("all"); const [page, setPage] = useState(1);
  const stages = [...new Map(enrollments.filter(e => e.course.stage).map(e => [e.course.stage!.titleAr, e.course.stage!])).values()];
  const filtered = useMemo(() => enrollments.filter(e => {
    const text = `${e.course.titleAr} ${e.course.titleEn} ${e.course.instructor?.nameAr ?? ""} ${e.course.instructor?.nameEn ?? ""}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (status === "all" || e.status === status) && (stage === "all" || e.course.stage?.titleAr === stage);
  }), [enrollments, query, status, stage]);
  const perPage = 6; const pages = Math.max(1, Math.ceil(filtered.length / perPage)); const current = filtered.slice((page - 1) * perPage, page * perPage);
  const reset = (fn: (v: string) => void, value: string) => { fn(value); setPage(1); };
  return <>
    <div className="student-course-filters" dir={lang === "ar" ? "rtl" : "ltr"}>
      <input value={query} onChange={e => reset(setQuery, e.target.value)} placeholder={labels.search} aria-label={labels.search}/>
      <select value={status} onChange={e => reset(setStatus, e.target.value)} aria-label={labels.status}><option value="all">{labels.all}</option><option value="ACTIVE">{labels.active}</option><option value="COMPLETED">{labels.completed}</option><option value="PENDING">{labels.pending}</option><option value="CANCELLED">{labels.cancelled}</option></select>
      <select value={stage} onChange={e => reset(setStage, e.target.value)} aria-label={labels.stage}><option value="all">{labels.allStages}</option>{stages.map(s => <option key={s.titleAr} value={s.titleAr}>{lang === "ar" ? s.titleAr : s.titleEn}</option>)}</select>
    </div>
    {current.length === 0 ? <div className="callout"><p>{labels.noResults}</p></div> : <div className="card-grid">{current.map(e => { const c=e.course; const active=e.status === "ACTIVE" || e.status === "COMPLETED"; return <article className="info-card reveal" key={e.id}>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:10}}>{c.stage && <Pill tone="navy">{lang === "ar" ? c.stage.titleAr : c.stage.titleEn}</Pill>}{e.status === "PENDING" && <Pill tone="muted">{labels.pending}</Pill>}{e.status === "COMPLETED" && <Pill>{labels.completed}</Pill>}{e.status === "CANCELLED" && <Pill tone="muted">{labels.cancelled}</Pill>}</div>
      <h3>{lang === "ar" ? c.titleAr : c.titleEn}</h3>{c.instructor && <p style={{margin:"0 0 4px",fontWeight:700}}>{labels.instructor}: {lang === "ar" ? c.instructor.nameAr : c.instructor.nameEn}</p>}<p>{lang === "ar" ? (c.summaryAr || c.descAr) : (c.summaryEn || c.descEn)}</p><ProgressBar pct={e.progressPct} lang={lang} label={labels.progress}/>{active && <div className="page-actions" style={{marginTop:18}}><Link className="btn btn-gold" href={studentHref(lang, `/course/${c.id}`)}>{labels.resume}</Link></div>}
    </article>;})}</div>}
    {pages > 1 && <nav className="student-course-pagination" aria-label={labels.pagination}>{Array.from({length:pages},(_,i)=><button key={i} className={page===i+1?"is-active":""} onClick={()=>setPage(i+1)}>{i+1}</button>)}</nav>}
  </>;
}
