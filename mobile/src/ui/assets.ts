import { API_BASE_URL } from '../config';

/**
 * صور الموقع تُخدَم من الخادم نفسه على `/assets/img/…`، فلا تُحزَم مع
 * التطبيق. الخادم يُرجع في حقول الصور مسارًا نسبيًّا مثل
 * `assets/img/news-1.jpg`، و`<Image>` لا يقبل نسبيًّا — فكلّ رابط صورة
 * يمرّ من هنا.
 */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (/^(https?:|data:|file:|blob:)/i.test(trimmed)) return trimmed;
  return `${API_BASE_URL}/${trimmed.replace(/^\/+/, '')}`;
}

const img = (name: string) => `${API_BASE_URL}/assets/img/${name}`;

/** شعار الكلّية الرسمي. */
export const LOGO_URL = img('logo-official.png');

/** صور الهيرو العريضة — النسخة الإنجليزيّة لها ملفّاتها. */
export const heroSlide = (index: number, english: boolean): string => {
  const n = (Math.abs(index) % 4) + 1;
  return img(english ? `slide-${n}-en.jpg` : `slide-${n}.jpg`);
};

/** بطاقات المرتكزات في الصفحة الرئيسة — نفس صور الموقع. */
export const PILLAR_IMAGES = {
  curric: img('card-curric.jpg'),
  scholars: img('card-scholars.jpg'),
  diwan: img('card-diwan.jpg'),
  library: img('card-library.jpg'),
  research: img('card-research.jpg'),
  alamiya: img('card-alamiya.jpg'),
} as const;

/**
 * المقرّرات في قاعدة العميل بلا صور بعد. بدل مربّعٍ فارغ نُسند صورةً
 * ثابتة من صور الموقع اشتقاقًا من المعرّف — فلا تتبدّل بين التصييرات،
 * ولا تتكرّر صورتان متجاورتان في الغالب.
 */
const COURSE_FALLBACKS = [
  PILLAR_IMAGES.curric,
  PILLAR_IMAGES.library,
  PILLAR_IMAGES.scholars,
  PILLAR_IMAGES.research,
  PILLAR_IMAGES.alamiya,
  PILLAR_IMAGES.diwan,
] as const;

function hashOf(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h;
}

export function courseImage(imageUrl: string | null | undefined, id: string): string {
  return assetUrl(imageUrl) ?? COURSE_FALLBACKS[hashOf(id) % COURSE_FALLBACKS.length];
}

const NEWS_FALLBACKS = [
  img('news-1.jpg'),
  img('news-2.jpg'),
  img('news-3.jpg'),
  img('news-4.jpg'),
] as const;

export function newsImage(imageUrl: string | null | undefined, id: string): string {
  return assetUrl(imageUrl) ?? NEWS_FALLBACKS[hashOf(id) % NEWS_FALLBACKS.length];
}
