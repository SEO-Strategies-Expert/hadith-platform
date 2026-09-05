import { redirect } from "next/navigation";
import { currentUser } from "@/lib/guard";
import { StudentCertificates } from "@/components/site/StudentCertificates";

export default async function EnglishStudentCertificatesPage() {
  const user = await currentUser();
  if (!user?.id) redirect("/en/student-login.html");
  return <StudentCertificates lang="en" userId={user.id} />;
}
