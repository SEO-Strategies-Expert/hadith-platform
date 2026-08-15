import { auth } from "@/auth";

export async function currentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** أي مستخدم مسجَّل (يشمل الطلاب) — لبوابة الطلاب. */
export async function requireSession() {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

/** مستخدمو اللوحة فقط (مدير أو محرّر) — حسابات الطلاب ممنوعة. */
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (user.role !== "ADMIN" && user.role !== "EDITOR") throw new Error("FORBIDDEN");
  return user;
}

export async function requireAdmin() {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
