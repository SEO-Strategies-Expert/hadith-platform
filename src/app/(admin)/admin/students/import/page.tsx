import { ActionForm } from "@/components/admin/ActionForm";
import { Card, PageHeader, TextArea } from "@/components/admin/ui";
import { importStudents } from "./actions";
export default function ImportStudentsPage(){return <div><PageHeader title="استيراد الطلاب" desc="CSV: name,email,password,studentNo,program. البريد الموجود يُحدّث دون تغيير كلمة مروره."/><Card className="max-w-3xl p-6"><ActionForm action={importStudents} cancelHref="/admin/students" submitLabel="استيراد"><TextArea label="بيانات CSV" name="csv" rows={14} dir="ltr" defaultValue={'name,email,password,studentNo,program\n'} /></ActionForm></Card></div>}
