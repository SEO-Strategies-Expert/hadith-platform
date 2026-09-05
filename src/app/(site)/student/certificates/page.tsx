import { redirect } from "next/navigation";
import { currentUser } from "@/lib/guard";
import { StudentCertificates } from "@/components/site/StudentCertificates";

export default async function StudentCertificatesPage() {
  const user = await currentUser();
  if (!user?.id) redirect("/student-login.html");
  return <StudentCertificates lang="ar" userId={user.id} />;
}
