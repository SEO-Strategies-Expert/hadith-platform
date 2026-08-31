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
  Inbox,
  LayoutGrid,
  HelpCircle,
  ListOrdered,
  Table,
  Layers,
  Radio,
  UserCheck,
  FileQuestion,
  ClipboardList,
  ScrollText,
  Wallet,
  UserCog,
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
    title: "الرئيسية",
    items: [
      { label: "لوحة القيادة", href: "/admin", icon: LayoutDashboard },
      { label: "صندوق الوارد", href: "/admin/inbox", icon: Inbox },
    ],
  },
  {
    title: "المحتوى",
    items: [
      { label: "الصفحات والأقسام", href: "/admin/pages", icon: FileText },
      { label: "بطاقات الصفحات", href: "/admin/cards", icon: LayoutGrid },
      { label: "الأسئلة الشائعة", href: "/admin/faqs", icon: HelpCircle },
      { label: "خطوات المسارات", href: "/admin/steps", icon: ListOrdered },
      { label: "الجداول (الاعتماد والخطة)", href: "/admin/curriculum", icon: Table },
      { label: "التنقّل والقوائم", href: "/admin/navigation", icon: Navigation },
      { label: "الأخبار والفعاليات", href: "/admin/news", icon: Newspaper },
      { label: "ديوان العلماء", href: "/admin/diwan", icon: MessagesSquare },
      { label: "الإصدارات والمجلة", href: "/admin/publications", icon: BookMarked },
      { label: "المكتبة والمصادر", href: "/admin/library", icon: Library },
      { label: "الوسائط والصور", href: "/admin/media", icon: Images },
      { label: "شرائح الصفحة الرئيسية", href: "/admin/slides", icon: Images },
    ],
  },
  {
    title: "التعليم والمقررات",
    items: [
      { label: "البرامج والمراحل", href: "/admin/programs", icon: BookOpen },
      { label: "المقرّرات ومحتواها", href: "/admin/courses", icon: Layers },
      { label: "المجالس المباشرة", href: "/admin/sessions", icon: Radio },
      { label: "الاختبارات", href: "/admin/quizzes", icon: FileQuestion },
      { label: "الواجبات", href: "/admin/assignments", icon: ClipboardList },
    ],
  },
  {
    title: "الطلاب والشؤون الأكاديمية",
    items: [
      { label: "حسابات الطلاب", href: "/admin/students", icon: GraduationCap },
      { label: "تسجيل الطلاب بالمقررات", href: "/admin/enrollments", icon: UserCheck },
      { label: "الشهادات والإجازات", href: "/admin/certificates", icon: ScrollText },
      { label: "الرسوم والمدفوعات", href: "/admin/payments", icon: Wallet },
    ],
  },
  {
    title: "الفريق والنظام",
    items: [
      { label: "الهيئة العلمية", href: "/admin/faculty", icon: GraduationCap },
      { label: "أعضاء هيئة التدريس", href: "/admin/instructors", icon: UserCog, adminOnly: true },
      { label: "المستخدمون والأدوار", href: "/admin/users", icon: Users, adminOnly: true },
      { label: "الإعدادات العامة", href: "/admin/settings", icon: Settings },
      { label: "تحسين محركات البحث", href: "/admin/seo", icon: Search },
    ],
  },
];
