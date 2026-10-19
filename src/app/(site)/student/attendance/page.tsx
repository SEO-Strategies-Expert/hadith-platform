import { currentUser } from "@/lib/guard";
import { redirect } from "next/navigation";
import { AttendanceRegister } from "@/components/site/AttendanceRegister";
import { StudentTimetable } from "@/components/site/StudentTimetable";
export default async function Page() {
  const me = await currentUser();
  if (!me?.id || me.role !== "STUDENT") redirect("/student-login.html");
  return <><StudentTimetable userId={me.id} /><AttendanceRegister userId={me.id} /></>;
}
