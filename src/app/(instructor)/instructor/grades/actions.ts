"use server";
import { requireInstructor, ownedCourseFilter } from "@/lib/instructor";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { z } from "zod";

export async function addAssessmentGrade(_prev: string | undefined, form: FormData): Promise<string | undefined> {
  const me=await requireInstructor();
  if(!me.scholarId) return "يجب ربط حسابك بملف الهيئة العلمية.";
  const p=z.object({ enrollmentId:z.string().min(1), title:z.string().trim().min(2).max(191), maxScore:z.coerce.number().int().min(1).max(1000), score:z.coerce.number().int().min(0), feedback:z.string().max(5000) }).safeParse(Object.fromEntries(form));
  if(!p.success || !String(form.get("score")||"").trim()) return "تحقق من الطالب واسم التقييم والدرجة.";
  const d=p.data;
  if(d.score>d.maxScore) return "الدرجة أكبر من الدرجة النهائية.";
  const e=await prisma.enrollment.findFirst({ where: { id:d.enrollmentId, status: { in:["ACTIVE","COMPLETED"] }, course:ownedCourseFilter(me.scholarId) } });
  if(!e) return "الطالب غير مسجل في مقرراتك.";
  const assessmentId=`grade-${createHash("sha256").update(JSON.stringify([e.courseId,d.title,d.maxScore])).digest("hex").slice(0,40)}`;
  await prisma.$transaction(async tx=>{
    await tx.assignment.upsert({ where:{id:assessmentId}, update:{}, create:{id:assessmentId,courseId:e.courseId,titleAr:d.title,titleEn:d.title,maxScore:d.maxScore,gradingPeriod:"teacher-register",visible:false} });
    await tx.assignmentSubmission.upsert({ where:{assignmentId_userId:{assignmentId:assessmentId,userId:e.userId}}, create:{assignmentId:assessmentId,userId:e.userId,state:"GRADED",score:d.score,feedback:d.feedback,gradedById:me.id,gradedAt:new Date()}, update:{state:"GRADED",score:d.score,feedback:d.feedback,gradedById:me.id,gradedAt:new Date()} });
    await tx.notification.create({data:{userId:e.userId,kind:"grade",titleAr:"درجة جديدة في سجلك",titleEn:"New assessment grade",bodyAr:`${d.title}: ${d.score}/${d.maxScore}`,href:"/student/grades"}});
  });
  revalidatePath("/instructor/grades");
  revalidatePath("/student/grades");
  revalidatePath("/en/student/grades");
  redirect("/instructor/grades?saved=1");
}
export async function saveGrade(form: FormData) {
  const me = await requireInstructor();
  if (!me.scholarId) throw new Error("FORBIDDEN");
  const id=String(form.get("id")||"");
  const score=Number(form.get("score"));
  const row=await prisma.assignmentSubmission.findFirst({ where: { id, state: { in: ["SUBMITTED", "GRADED", "RETURNED"] }, assignment: { course: ownedCourseFilter(me.scholarId) } }, include: { assignment: true } });
  if (!row || !Number.isInteger(score) || score<0 || score>row.assignment.maxScore || form.get("score")==="") throw new Error("INVALID_GRADE");
  await prisma.$transaction([
    prisma.assignmentSubmission.update({ where: { id: row.id }, data: { score, feedback: String(form.get("feedback")||"").slice(0,5000), state: "GRADED", gradedById: me.id, gradedAt: new Date() } }),
    prisma.notification.create({ data: { userId: row.userId, kind: "grade", titleAr: "تم رصد درجة واجبك", titleEn: "Your assignment was graded", bodyAr: `${row.assignment.titleAr}: ${score}/${row.assignment.maxScore}`, href: row.assignment.visible ? `/student/assignment/${row.assignmentId}` : "/student/grades" } }),
  ]);
  revalidatePath("/instructor/grades");
  revalidatePath(`/student/assignment/${row.assignmentId}`);
  revalidatePath(`/en/student/assignment/${row.assignmentId}`);
  revalidatePath("/student/grades");
  revalidatePath("/en/student/grades");
  redirect("/instructor/grades?saved=1");
}
