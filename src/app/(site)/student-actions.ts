"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import type { Lang } from "@/lib/site-data";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@/lib/guard";
import { consumeRateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { z } from "zod";

/** دخول الطالب من بوابة الطلاب — يستخدم نفس مزوّد المصادقة. */
export async function studentLogin(
  lang: Lang,
  _prev: string | undefined,
  formData: FormData
): Promise<string | undefined> {
  try {
    if (!(await consumeRateLimit("student-login", String(formData.get("email") ?? "unknown")))) return lang === "en" ? "Too many attempts. Try again in 15 minutes." : "محاولات كثيرة. حاول بعد 15 دقيقة.";
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: lang === "en" ? "/en/student" : "/student",
    });
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      return lang === "en"
        ? "Incorrect email or password."
        : "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    }
    throw error; // إعادة توجيه Next.js يجب أن تمرّ
  }
}

export async function studentLogout(lang: Lang) {
  await signOut({ redirectTo: lang === "en" ? "/en/student-login.html" : "/student-login.html" });
}

export async function studentRegister(lang: Lang, _prev: string | undefined, formData: FormData): Promise<string | undefined> {
  const parsed = z.object({ name: z.string().trim().min(2), email: z.string().trim().email(), password: z.string().min(8), confirm: z.string() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return lang === "en" ? "Enter a name, valid email, and password of at least 8 characters." : "أدخل الاسم والبريد وكلمة مرور لا تقل عن 8 أحرف.";
  if (parsed.data.password !== parsed.data.confirm) return lang === "en" ? "Passwords do not match." : "كلمتا المرور غير متطابقتين.";
  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return lang === "en" ? "An account with this email already exists." : "يوجد حساب مسجّل بهذا البريد الإلكتروني بالفعل.";
  await prisma.user.create({ data: { name: parsed.data.name, email, passwordHash: await bcrypt.hash(parsed.data.password, 12), role: "STUDENT" } });
  return lang === "en" ? "Account created. You can sign in now." : "تم إنشاء الحساب. يمكنك تسجيل الدخول الآن.";
}

export type CourseRequestState = { ok: boolean; message: string } | undefined;
export async function requestCourseEnrollment(lang: Lang, _prev: CourseRequestState, formData: FormData): Promise<CourseRequestState> {
  const user = await currentUser();
  const ar = lang === "ar";
  if (!user?.id || user.role !== "STUDENT") return { ok:false, message:ar?"سجّل دخولك بحساب طالب أولًا.":"Sign in with a student account first." };
  const courseId=String(formData.get("courseId")??"").trim();
  const feeRaw=String(formData.get("feeOption")??"free");
  const feeOption=["full","reduced","free"].includes(feeRaw)?feeRaw:"free";
  if(!courseId)return {ok:false,message:ar?"اختر المقرر الذي تريد التسجيل فيه.":"Choose a course."};
  const now=new Date();
  const course=await prisma.course.findFirst({where:{id:courseId,visible:true,allowSelfEnrollment:true,OR:[{published:true},{publishAt:{lte:now}}],AND:[{OR:[{enrollmentOpensAt:null},{enrollmentOpensAt:{lte:now}}]},{OR:[{enrollmentClosesAt:null},{enrollmentClosesAt:{gt:now}}]}]},select:{id:true,titleAr:true,titleEn:true,prerequisiteCourseId:true}});
  if(!course)return {ok:false,message:ar?"المقرر غير متاح للتسجيل حاليًا.":"This course is not open for registration."};
  if(course.prerequisiteCourseId){const prerequisite=await prisma.enrollment.findUnique({where:{userId_courseId:{userId:user.id,courseId:course.prerequisiteCourseId}},select:{status:true}});if(prerequisite?.status!=="COMPLETED")return {ok:false,message:ar?"يجب إكمال المقرر السابق المطلوب أولًا.":"Complete the prerequisite course first."};}
  const existing=await prisma.enrollment.findUnique({where:{userId_courseId:{userId:user.id,courseId}}});
  if(existing && existing.status!=="CANCELLED")return {ok:existing.status==="PENDING",message:existing.status==="PENDING"?(ar?"طلبك لهذا المقرر قيد المراجعة بالفعل.":"Your request is already under review."):(ar?"أنت مسجّل في هذا المقرر بالفعل.":"You are already enrolled in this course.")};
  if(existing)await prisma.enrollment.update({where:{id:existing.id},data:{status:"PENDING",feeOption,progressPct:0,completedAt:null,enrolledAt:new Date()}});
  else await prisma.enrollment.create({data:{userId:user.id,courseId,status:"PENDING",feeOption}});
  revalidatePath("/admin/enrollments"); revalidatePath(lang==="en"?"/en/student":"/student");
  return {ok:true,message:ar?`تم إرسال طلب التسجيل في «${course.titleAr}». ستظهر حالته في بوابتك بعد مراجعة الإدارة.`:`Your request for “${course.titleEn||course.titleAr}” was sent and is awaiting review.`};
}
