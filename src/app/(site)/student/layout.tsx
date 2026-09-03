import { StudentPortalHeader } from "@/components/site/StudentPortalHeader";

export default function ArabicStudentLayout({ children }: { children: React.ReactNode }) {
  return <><StudentPortalHeader lang="ar" />{children}</>;
}
