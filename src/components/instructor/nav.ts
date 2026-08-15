import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Layers, Radio, GraduationCap } from "lucide-react";

/**
 * تنقّل لوحة الأكاديميين — أربعة مداخل لا أكثر.
 * منفصل عن `admin-nav.ts` عمدًا: قائمة اللوحة الإداريّة تنمو بأقسام لا يملكها
 * المحاضر، وربطهما يجعل كل إضافةٍ هناك خطرًا يتسرّب إلى هنا.
 */
export type InstructorNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const instructorNav: InstructorNavItem[] = [
  { label: "لوحتي", href: "/instructor", icon: LayoutDashboard },
  { label: "مقرّراتي", href: "/instructor/courses", icon: Layers },
  { label: "مجالسي", href: "/instructor/sessions", icon: Radio },
  { label: "طلابي", href: "/instructor/students", icon: GraduationCap },
];
