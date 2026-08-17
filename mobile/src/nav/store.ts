import { getNav } from '../api/endpoints';
import type { NavPayload } from '../api/types';

/**
 * ذاكرةٌ قصيرة لحمولة `/nav`.
 *
 * فتحُ القائمة وإغلاقها متكرّران بطبعهما، وطلبُ شبكةٍ في كلّ فتحة يجعلها
 * تومض. والمهلة تُبقيها حيّة: تعديلٌ يجريه المدير في اللوحة يظهر في
 * التطبيق بعد خمس دقائق على أبعد تقدير بلا إعادة تشغيل.
 */
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: { at: number; data: NavPayload } | null = null;

export async function loadNav(): Promise<NavPayload> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.data;
  const data = await getNav();
  cache = { at: Date.now(), data };
  return data;
}
