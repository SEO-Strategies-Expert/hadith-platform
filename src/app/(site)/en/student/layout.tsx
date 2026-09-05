import { StudentPortalHeader } from "@/components/site/StudentPortalHeader";
import { StudentSidebar } from "@/components/site/StudentSidebar";

export default function EnglishStudentLayout({ children }: { children: React.ReactNode }) {
  return <><StudentPortalHeader lang="en" /><div className="student-portal-frame container"><StudentSidebar lang="en" /><div className="student-portal-page">{children}</div></div></>;
}
