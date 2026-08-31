"use client";
import { useActionState } from "react";
import { BookOpen, CheckCircle2, Clock3, Send } from "lucide-react";
import type { Lang } from "@/lib/site-data";
import { requestCourseEnrollment } from "@/app/(site)/student-actions";

type Course={id:string;titleAr:string;titleEn:string;summaryAr:string|null;summaryEn:string|null;enrollments:{status:string}[]};
export function StudentCourseRequestForm({lang,name,studentNo,courses,selectedCourseId}:{lang:Lang;name:string;studentNo:string|null;courses:Course[];selectedCourseId?:string}){
 const [state,action,pending]=useActionState(requestCourseEnrollment.bind(null,lang),undefined); const ar=lang==="ar";
 const available=courses.filter(c=>!c.enrollments[0]||c.enrollments[0].status==="CANCELLED"); const waiting=courses.filter(c=>c.enrollments[0]?.status==="PENDING");
 const defaultCourseId=available.some(c=>c.id===selectedCourseId)?selectedCourseId:"";
 return <main className="course-request-page"><section className="course-request-card"><header><span><BookOpen size={22}/></span><div><small>{ar?"طلب تسجيل طالب":"Student registration request"}</small><h1>{ar?"اختر المقرر الذي تريد دراسته":"Choose a course to study"}</h1><p>{ar?`مرحبًا ${name} — بيانات حسابك محفوظة، لذلك لا حاجة لإدخالها مرة أخرى.`:`Welcome ${name}. Your account details are already saved.`}</p>{studentNo&&<em dir="ltr">{studentNo}</em>}</div></header>
  {state&&<div role={state.ok?"status":"alert"} className={state.ok?"course-request-result ok":"course-request-result error"}>{state.ok?<CheckCircle2 size={18}/>:null}{state.message}</div>}
  {waiting.length>0&&<div className="course-request-waiting"><b><Clock3 size={16}/>{ar?"طلبات قيد المراجعة":"Requests under review"}</b>{waiting.map(c=><span key={c.id}>{ar?c.titleAr:c.titleEn||c.titleAr}</span>)}</div>}
  {available.length?<form action={action}><label><span>{ar?"المقرر":"Course"}</span><select name="courseId" required defaultValue={defaultCourseId}><option value="" disabled>{ar?"— اختر مقررًا —":"— Select a course —"}</option>{available.map(c=><option key={c.id} value={c.id}>{ar?c.titleAr:c.titleEn||c.titleAr}</option>)}</select></label><label><span>{ar?"خيار الرسوم":"Fee option"}</span><select name="feeOption" defaultValue="free"><option value="free">{ar?"المسار المجاني":"Free"}</option><option value="reduced">{ar?"رسوم مخفّضة":"Reduced fee"}</option><option value="full">{ar?"الرسوم الكاملة":"Full fee"}</option></select></label><button type="submit" disabled={pending}><Send size={17}/>{pending?(ar?"جارٍ إرسال الطلب…":"Sending…"):(ar?"إرسال طلب التسجيل":"Send registration request")}</button></form>:<div className="course-request-empty">{ar?"لا توجد مقررات أخرى متاحة لطلب التسجيل حاليًا.":"There are no other courses available to request."}</div>}
 </section></main>;
}
