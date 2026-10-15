import Link from "next/link";
import { requireAdmin } from "@/lib/guard";
import { ActionForm } from "@/components/admin/ActionForm";
import { Card, PageHeader } from "@/components/admin/ui";
import { seedDemoFeatureData } from "./actions";

export default async function DemoDataPage({
  searchParams,
}: {
  searchParams: Promise<{ seeded?: string }>;
}) {
  await requireAdmin();
  const { seeded } = await searchParams;

  return (
    <div>
      <PageHeader
        title="بيانات العرض التجريبية"
        desc="إنشاء أو تحديث بيانات توضيحية لميزات الطالب والمعلم، دون تكرارها عند إعادة التشغيل."
      />
      {seeded && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] font-bold text-emerald-800">
          تم تجهيز بيانات العرض. سجّل الدخول بحساب الطالب أو المعلم التجريبي لعرض الصفحات.
        </div>
      )}
      <Card className="max-w-4xl p-5">
        <h2 className="text-lg font-extrabold text-navy-900">ما الذي ستضيفه العملية؟</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-[13px] leading-6 text-ink-soft">
          <li>مقرر ووحدة ودرس ومرفق تجريبي، مع تسجيل الطالب التجريبي فيه.</li>
          <li>ملف طالب تجريبي ورقم جامعي وصورة افتراضية لبطاقة الطالب.</li>
          <li>مواعيد سابقة وقادمة وروابط Zoom توضيحية، وسجلات حضور وغياب للطالب والمعلم.</li>
          <li>واجب مصحّح بدرجة، واختبار تجريبي يظهر في صفحات المقرر والدرجات.</li>
          <li>إشعار إداري توضيحي عن تسجيل حضور المعلم.</li>
        </ul>
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] leading-6 text-amber-900">
          هذه بيانات اصطناعية للحسابين الموجودين مسبقًا: <code dir="ltr">demo@hadith-faculty.com</code> و<code dir="ltr">sheikh@hadith-faculty.com</code>. لن تُنشأ حسابات أو كلمات مرور، ولن يُستبدل محتوى ملف المعلم الشخصي. روابط Zoom تجريبية وليست اجتماعات حقيقية.
        </div>
        <div className="mt-5">
          <ActionForm action={seedDemoFeatureData} cancelHref="/admin" submitLabel="إضافة / تحديث بيانات العرض">
            <input type="hidden" name="confirm" value="seed-demo-data" />
          </ActionForm>
        </div>
        <div className="mt-5 flex flex-wrap gap-3 border-t border-black/5 pt-4 text-[13px] font-bold">
          <Link href="/student" className="text-navy-700 underline">بوابة الطالب</Link>
          <Link href="/instructor" className="text-navy-700 underline">لوحة المعلم</Link>
          <Link href="/instructor/profile" className="text-navy-700 underline">الملف الشخصي للمعلم</Link>
          <Link href="/admin/sessions" className="text-navy-700 underline">المجالس والحضور</Link>
        </div>
      </Card>
    </div>
  );
}
