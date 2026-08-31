import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, CalendarDays, CreditCard, LogOut, ScrollText, UserRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";
import type { Lang } from "@/lib/site-data";
import { studentLogout } from "@/app/(site)/student-actions";
import { StudentCourses, StudentSessions } from "@/components/site/StudentCourses";
import { StudentCertificates } from "@/components/site/StudentCertificates";
import { StudentPayments } from "@/components/site/StudentPayments";

const T={
 ar:{portal:"بوابة الطالب",welcome:"مرحبًا",subtitle:"كل ما تحتاجه للدراسة في مكان واحد",courses:"المقررات",sessions:"المجالس",certificates:"الشهادات",payments:"المدفوعات",profile:"الملف الشخصي",logout:"خروج",card:"البطاقة الجامعية",active:"طالب فعّال",inactive:"غير مفعّل",studentNo:"الرقم الجامعي",program:"البرنامج",country:"الدولة",email:"البريد",application:"طلب الالتحاق",noApplication:"لا يوجد طلب مرتبط",accepted:"مقبول"},
 en:{portal:"Student portal",welcome:"Welcome",subtitle:"Everything you need to study, in one place",courses:"Courses",sessions:"Sessions",certificates:"Certificates",payments:"Payments",profile:"Profile",logout:"Sign out",card:"Student ID",active:"Active student",inactive:"Inactive",studentNo:"Student no.",program:"Programme",country:"Country",email:"Email",application:"Application",noApplication:"No linked application",accepted:"Accepted"}
} as const;

export async function StudentDashboard({lang}:{lang:Lang}){
 const user=await currentUser(); if(!user?.id) redirect(lang==="en"?"/en/student-login.html":"/student-login.html"); const t=T[lang];
 const [profile,application,courses,sessions,certificates,payments]=await Promise.all([
  prisma.user.findUnique({where:{id:user.id}}),
  user.email?prisma.admissionApplication.findFirst({where:{email:user.email},orderBy:{createdAt:"desc"},select:{status:true,program:true}}):null,
  prisma.enrollment.count({where:{userId:user.id,status:{in:["ACTIVE","COMPLETED"]}}}),
  prisma.liveSession.count({where:{visible:true,startsAt:{gte:new Date()},OR:[{course:{enrollments:{some:{userId:user.id}}}},{stage:{stageEnrollments:{some:{userId:user.id}}}},{isPublic:true}]}}),
  prisma.certificate.count({where:{userId:user.id,revoked:false}}),
  prisma.payment.count({where:{userId:user.id}}),
 ]);
 if(!profile) redirect(lang==="en"?"/en/student-login.html":"/student-login.html");
 const nav=[
  {href:"#my-courses",label:t.courses,count:courses,Icon:BookOpen},{href:"#my-sessions",label:t.sessions,count:sessions,Icon:CalendarDays},
  {href:"#my-certificates",label:t.certificates,count:certificates,Icon:ScrollText},{href:"#my-payments",label:t.payments,count:payments,Icon:CreditCard},
 ];
 return <main id="main" className="student-dashboard-modern">
  <section className="student-dash-top" id="student-profile"><div className="container">
   <div className="student-dash-welcome"><div><span>{t.portal}</span><h1>{t.welcome}، {profile.name}</h1><p>{t.subtitle}</p></div><form action={studentLogout.bind(null,lang)}><button type="submit"><LogOut size={16}/>{t.logout}</button></form></div>
   <div className="student-dash-grid">
    <div className="student-id-compact"><div className="student-id-head"><img src="/assets/img/logo-official.png" alt=""/><span>{t.card}<b>{profile.status==="ACTIVE"?t.active:t.inactive}</b></span></div><div className="student-id-name">{profile.name}<small dir="ltr">{profile.studentNo??"—"}</small></div><div className="student-id-foot"><span>{profile.program??"—"}</span><span>{profile.country??"—"}</span></div></div>
    <div className="student-quick-area"><div className="student-quick-grid">{nav.map(({href,label,count,Icon})=><Link key={href} href={href}><span><Icon size={20}/></span><b>{count}</b><small>{label}</small></Link>)}</div>
     <div className="student-mini-profile"><div><UserRound size={17}/><span><b>{t.email}</b><small dir="ltr">{profile.email}</small></span></div><div><span><b>{t.application}</b><small>{application?.program??t.noApplication}</small></span><em>{application?.status==="DONE"?t.accepted:application?.status??"—"}</em></div></div>
    </div>
   </div>
  </div></section>
  <StudentCourses lang={lang} userId={user.id}/><StudentSessions lang={lang} userId={user.id}/><StudentCertificates lang={lang} userId={user.id}/><StudentPayments lang={lang}/>
 </main>;
}
