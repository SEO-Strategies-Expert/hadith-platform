import { getNav } from '../api/endpoints';
import type { NavPayload } from '../api/types';
import { siteOrigin } from './links';

/**
 * ذاكرةٌ قصيرة لحمولة `/nav`.
 *
 * فتحُ القائمة وإغلاقها متكرّران بطبعهما، وطلبُ شبكةٍ في كلّ فتحة يجعلها
 * تومض. والمهلة تُبقيها حيّة: تعديلٌ يجريه المدير في اللوحة يظهر في
 * التطبيق بعد خمس دقائق على أبعد تقدير بلا إعادة تشغيل.
 *
 * ولها فائدةٌ ثانية: شاشة صفحة الموقع تحتاج **أصل الموقع** قبل أوّل
 * تصيير لتبني الرابط، ولا تحتمل انتظار طلبٍ جديد ولا وميضَ تحميل.
 * فتقرأ الأصل من هذه الذاكرة قراءةً متزامنة (والمستخدم وصل إليها من
 * القائمة، فالذاكرة دافئة)، وتسقط إلى الموقع المضبوط في `.env` إن دخل
 * الشاشة من رابطٍ عميق قبل أن تُفتح القائمة قطّ.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: { at: number; data: NavPayload } | null = null;

export async function loadNav(): Promise<NavPayload> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;
  const data = await getNav();
  cache = { at: Date.now(), data };
  return data;
}

/** أصل الموقع بلا انتظارٍ ولا طلب — من آخر حمولةٍ وصلت، أو من الإعداد. */
export function cachedSiteOrigin(): string {
  return siteOrigin(cache?.data.site.url);
}
