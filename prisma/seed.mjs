import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const email = (process.env.ADMIN_EMAIL || "admin@hadith-faculty.com").toLowerCase();
const password = process.env.ADMIN_PASSWORD || "ChangeMe!123";
const name = process.env.ADMIN_NAME || "مدير الكلّية";

const passwordHash = await bcrypt.hash(password, 10);

const user = await prisma.user.upsert({
  where: { email },
  update: {},
  create: { name, email, passwordHash, role: "ADMIN", status: "ACTIVE" },
});

console.log(`✓ حساب المدير جاهز: ${user.email}`);
console.log("  سجّل الدخول ثم غيّر كلمة المرور فورًا.");

await prisma.$disconnect();
