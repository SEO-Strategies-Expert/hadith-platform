import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/admin");

  return (
    <div className="grid min-h-screen place-items-center bg-navy-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-gold-1 to-gold-3 text-3xl font-black text-navy-950">
            ح
          </div>
          <h1 className="text-xl font-extrabold text-gold-1">لوحة تحكم الكلّية</h1>
          <p className="mt-1 text-[13px] text-white/60">
            الكلّية العليا للحديث النبوي وعلومه وعِلَلِه
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
          <h2 className="mb-5 text-[17px] font-bold text-navy-900">تسجيل الدخول</h2>
          <LoginForm />
        </div>

        <p className="mt-5 text-center text-[12px] text-white/40">
          الوصول للمصرّح لهم فقط — مدير أو محرّر.
        </p>
      </div>
    </div>
  );
}
