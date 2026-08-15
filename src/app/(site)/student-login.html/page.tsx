import { buildMetadata } from "@/lib/site-content";
import { StudentLoginPage } from "@/components/site/StudentLoginPage";

export async function generateMetadata() {
  return buildMetadata("student-login", "ar");
}

export default function ArabicStudentLogin() {
  return <StudentLoginPage lang="ar" />;
}
