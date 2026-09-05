import { StudentPortalHeader } from "@/components/site/StudentPortalHeader";
import { StudentSidebar } from "@/components/site/StudentSidebar";

export default function ArabicStudentLayout({ children }: { children: React.ReactNode }) {
  return <><StudentPortalHeader lang="ar" /><div className="student-portal-frame container"><StudentSidebar lang="ar" /><div className="student-portal-page">{children}</div></div></>;
}
