"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

/**
 * شبكة أمان لمجموعة `(instructor)`.
 *
 * الحارس يرمي `FORBIDDEN`/`UNAUTHENTICATED`، والتخطيط يحوّل قبل الوصول إلى
 * هنا في المسار الطبيعي. هذه الشاشة لما يفلت: خطأ قاعدة، أو صفحةٌ نُسي فيها
 * التحويل. المهمّ ألّا يرى المستخدم أثرًا تقنيًّا يكشف بنية النظام.
 */
export default function InstructorError({ error }: { error: Error & { digest?: string } }) {
  const denied = error.message === "FORBIDDEN" || error.message === "UNAUTHENTICATED";

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
        <ShieldAlert size={38} className="mx-auto text-amber-500" />
        <h1 className="mt-4 text-[19px] font-extrabold text-navy-900">
          {denied ? "لا تملك صلاحيّة دخول هذه اللوحة" : "تعذّر عرض الصفحة"}
        </h1>
        <p className="mt-2 text-[13.5px] leading-7 text-ink-soft">
          {denied
            ? "لوحة الأكاديميين مخصّصة لأعضاء هيئة التدريس. راجع إدارة المنصّة إن كنت تظنّ هذا خطأً."
            : "حدث خلل أثناء تحميل البيانات. أعِد المحاولة، وإن تكرّر فراجع إدارة المنصّة."}
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-gradient-to-l from-gold-1 to-gold-3 px-5 py-2.5 text-[13.5px] font-extrabold text-navy-950"
        >
          العودة إلى الموقع
        </Link>
      </div>
    </div>
  );
}
