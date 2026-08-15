import { LinkIcon } from "lucide-react";

/**
 * ما يراه حسابٌ لم تربطه الإدارة بملفّ هيئة تدريس.
 *
 * لماذا رسالة صريحة لا شاشة فارغة؟ لأنّ الحساب بلا `scholarId` **لا يمكن** أن
 * يُشتقّ له مقرّر ولا مجلس — فالخلوّ هنا خللٌ في الإعداد لا نتيجةَ عمل. لو
 * عُرضت «لا مقرّرات» لظنّ المحاضر أنّ الإدارة لم تُسنِد إليه شيئًا وانتظر.
 */
export function NoScholarNotice() {
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-6 text-amber-900">
      <div className="flex items-start gap-3">
        <LinkIcon size={20} className="mt-0.5 shrink-0" />
        <div className="space-y-2 text-[13.5px] leading-7">
          <b className="block text-[15px] font-extrabold">حسابك غير مرتبط بملفّك في الهيئة العلميّة.</b>
          <p>
            مقرّراتك ومجالسك وطلابك تُشتقّ من ملفّك في «الهيئة العلميّة»، ولم تربط الإدارة حسابك
            بذلك الملفّ بعد — لذلك تبدو هذه اللوحة خاليةً وليست كذلك في الحقيقة.
          </p>
          <p className="font-semibold">
            راجع إدارة المنصّة لربط حسابك من شاشة «أعضاء هيئة التدريس» في لوحة التحكم.
          </p>
        </div>
      </div>
    </div>
  );
}
