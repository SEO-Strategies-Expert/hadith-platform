import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  Navigation,
  GraduationCap,
  BookOpen,
  Newspaper,
  MessagesSquare,
  BookMarked,
  Library,
  Images,
  Settings,
  Search,
  Users,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

export const adminNav: NavSection[] = [
  {
    items: [{ label: "لوحة القيادة", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "المحتوى",
    items: [
      { label: "الصفحات والأقسام", href: "/admin/pages", icon: FileText },
      { label: "التنقّل والقوائم", href: "/admin/navigation", icon: Navigation },
      { label: "الهيئة العلمية", href: "/admin/faculty", icon: GraduationCap },
      { label: "البرامج والمقرّرات", href: "/admin/programs", icon: BookOpen },
      { label: "الأخبار والفعاليات", href: "/admin/news", icon: Newspaper },
      { label: "ديوان العلماء", href: "/admin/diwan", icon: MessagesSquare },
      { label: "الإصدارات والمجلة", href: "/admin/publications", icon: BookMarked },
      { label: "المكتبة والمصادر", href: "/admin/library", icon: Library },
      { label: "الوسائط والصور", href: "/admin/media", icon: Images },
    ],
  },
  {
    title: "النظام",
    items: [
      { label: "الإعدادات العامة", href: "/admin/settings", icon: Settings },
      { label: "تحسين محركات البحث", href: "/admin/seo", icon: Search },
      { label: "المستخدمون والأدوار", href: "/admin/users", icon: Users, adminOnly: true },
    ],
  },
];
