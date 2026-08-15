import type { Metadata } from "next";
// أنماط اللوحة نفسها (Tailwind + متغيّرات هوية الكلّية) — لا نظام تصميم ثانٍ.
import "../(admin)/globals.css";

export const metadata: Metadata = {
  title: "لوحة الأكاديميين — الكلّية العليا للحديث النبوي",
  description: "مقرّرات عضو هيئة التدريس ومجالسه وطلابه",
};

/**
 * جذر مستقلّ لمجموعة `(instructor)`.
 * لماذا جذر خاصّ لا تفرّع من تخطيط اللوحة؟ لأنّ `(admin)` جذرٌ بنفسه، ولأنّ
 * فصلهما يمنع تسرّب قشرة الإدارة (قائمتها الكاملة) إلى صفحة محاضر.
 */
export default function InstructorRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
