import { currentUser } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
export default async function Grades() {
  const me=await currentUser();
  if(!me?.id || me.role!=="STUDENT") redirect("/student-login.html");
  const rows=await prisma.assignmentSubmission.findMany({where:{userId:me.id,state:"GRADED",assignment:{course:{enrollments:{some:{userId:me.id,status:{in:["ACTIVE","COMPLETED"]}}}}}},include:{assignment:{include:{course:{select:{titleAr:true}}}}},orderBy:{gradedAt:"desc"}});
  return <section className="container"><h1>سجل درجاتي</h1>{!rows.length && <p>لم تُرصد درجات بعد.</p>}{rows.map(r=><article key={r.id} className="info-card" style={{marginBlock:18}}><h2>{r.assignment.titleAr}</h2><p>{r.assignment.course.titleAr}</p><p>الدرجة: {r.score}/{r.assignment.maxScore}</p><p>{r.feedback}</p></article>)}</section>;
}
