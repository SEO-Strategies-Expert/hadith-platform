import { StudentPortalHeader } from "@/components/site/StudentPortalHeader";

export default function EnglishStudentLayout({ children }: { children: React.ReactNode }) {
  return <><StudentPortalHeader lang="en" />{children}</>;
}
