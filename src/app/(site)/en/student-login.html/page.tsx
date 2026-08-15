import { buildMetadata } from "@/lib/site-content";
import { StudentLoginPage } from "@/components/site/StudentLoginPage";

export async function generateMetadata() {
  return buildMetadata("student-login", "en");
}

export default function EnglishStudentLogin() {
  return <StudentLoginPage lang="en" />;
}
