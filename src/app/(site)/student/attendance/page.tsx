import { currentUser } from "@/lib/guard";
import { redirect } from "next/navigation";
import { AttendanceRegister } from "@/components/site/AttendanceRegister";
export default async function Page() { const me=await currentUser(); if(!me?.id || me.role!=="STUDENT") redirect("/student-login.html"); return <AttendanceRegister userId={me.id} />; }
