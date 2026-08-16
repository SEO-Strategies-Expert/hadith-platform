import type { Href } from 'expo-router';
import type { Ionicons } from '@expo/vector-icons';
import { WEBSITE_URL } from '../config';
import type { Lang } from '../i18n';

/**
 * ترجمة روابط الموقع إلى وجهاتٍ في التطبيق.
 *
 * القاعدة الحاكمة: **الشاشة الأصيلة تسبق الويب دائمًا.** الكلّية بنت في
 * التطبيق شاشاتٍ حقيقيّة للمقرّرات والأخبار والهيئة والتواصل والدخول،
 * وهي أسرع وأليق بالجهاز من صفحةٍ محمَّلة في `WebView`. فما له نظيرٌ
 * أصيل يذهب إليه، وما ليس له يُفتح من الموقع كما هو — الموقع متجاوبٌ
 * أصلًا وبهويّة الكلّية، فإعادةُ كتابة سبعٍ وثلاثين صفحةً شاشةً شاشة
 * عملٌ بلا عائد، وتفريقٌ للمحتوى في موضعين يفترقان مع أوّل تحديث.
 */

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * وجهةُ عنصرٍ في القائمة:
 *  · `native` — شاشة في التطبيق.
 *  · `page`   — صفحة من الموقع تُعرض داخل التطبيق في `WebView`.
 *  · `external` — موقعٌ آخر (`sunnah.one`…) يُفتح في متصفّح النظام.
 */
export type NavTarget =
  | { kind: 'native'; href: Href }
  | { kind: 'page'; path: string; hash: string | null }
  | { kind: 'external'; url: string };

/**
 * ما له شاشةٌ أصيلة. المفتاح هو المسار **بلا** مِرساة: `faculty.html`
 * تذهب إلى شاشة الهيئة، أمّا `faculty.html#scientific-council` فتبقى على
 * الويب لأنّ المِرساة نفسها هي المقصودة ولا نظير لها في الشاشة الأصيلة.
 */
const NATIVE_ROUTES: Record<string, Href> = {
  'index.html': '/',
  /*
    صفحة البرامج في الموقع نصٌّ محرَّرٌ ثابت لا يعرف الكتالوج، والكتالوج
    في القاعدة. فالشاشة الأصيلة تُريه من مصدره: ثلاث درجاتٍ بمقرّراتها،
    والدورات والدبلومات إلى جانبها.
  */
  'programs.html': '/programs',
  'courses.html': '/courses',
  'news.html': '/news',
  'faculty.html': '/faculty',
  'contact.html': '/contact',
  'student-login.html': '/login',
};

/** يفصل `about.html#vision` إلى مسارٍ ومِرساة. */
export function splitHref(href: string): { path: string; hash: string | null } {
  const at = href.indexOf('#');
  if (at < 0) return { path: href, hash: null };
  return { path: href.slice(0, at), hash: href.slice(at + 1) || null };
}

export function resolveTarget(href: string, external: boolean): NavTarget {
  if (external) return { kind: 'external', url: href };
  const { path, hash } = splitHref(href);
  const native = hash === null ? NATIVE_ROUTES[path] : undefined;
  if (native !== undefined) return { kind: 'native', href: native };
  return { kind: 'page', path, hash };
}

/**
 * أصل الموقع الذي تُبنى عليه روابط الصفحات. يُقدَّم ما يرسله الخادم
 * (وهو المضيف الذي وصله الطلب فعلًا، فيوافق نسخةَ التطوير ونسخةَ
 * الإنتاج تلقائيًّا) على الثابت المضبوط في `.env`.
 */
export function siteOrigin(fromApi: string | null | undefined): string {
  const s = (fromApi ?? '').trim().replace(/\/+$/, '');
  return s || WEBSITE_URL;
}

/**
 * رابط صفحة الموقع بلغة الواجهة — منقول عن `siteHref` في
 * `src/lib/site-links.ts` بالموقع: الإنجليزيّة تحت `/en`، والرئيسة
 * مسارها الجذر لا `index.html`.
 */
export function sitePageUrl(origin: string, lang: Lang, path: string, hash?: string | null): string {
  const isHome = path === 'index.html' || path === '';
  const base = isHome ? (lang === 'ar' ? '/' : '/en') : lang === 'ar' ? `/${path}` : `/en/${path}`;
  return `${origin}${base}${hash ? `#${hash}` : ''}`;
}

/** لوحة تحكّم الموقع — صفحةُ ويبٍ لا شاشةَ تطبيق، فتُفتح في المتصفّح. */
export function adminUrl(origin: string): string {
  return `${origin}/admin`;
}

/** أمِنَ الرابطُ ووقع على نفس أصل الموقع؟ عندئذٍ يبقى داخل `WebView`. */
export function isSameOrigin(url: string, origin: string): boolean {
  try {
    return new URL(url).origin === new URL(origin).origin;
  } catch {
    return false;
  }
}

/* ————————————— الأيقونات ————————————— */

/**
 * أيقونات الهيدر في القاعدة معرّفاتُ رموز SVG في الموقع (`i-college`…)
 * ولا وجود لها في `Ionicons`، فتُترجم هنا إلى أقرب ما يؤدّي المعنى.
 * ما لا ترجمة له يسقط إلى أيقونة صفحةٍ عامّة لا إلى فراغ.
 */
const HEADER_ICONS: Record<string, IconName> = {
  'i-home': 'home-outline',
  'i-college': 'business-outline',
  'i-programs': 'school-outline',
  'i-lab': 'flask-outline',
  'i-diglib': 'book-outline',
  'i-search': 'search-outline',
  'i-scholar': 'people-outline',
  'i-journal': 'journal-outline',
  'i-news': 'newspaper-outline',
  'i-accredit': 'ribbon-outline',
  'i-live': 'radio-outline',
  'i-student': 'person-outline',
};

export function headerIcon(icon: string | null): IconName {
  return (icon && HEADER_ICONS[icon]) || 'document-text-outline';
}

/**
 * المنصّات تُقرأ بمفتاحها (`youtube`…) لا بمعرّف رمزها في الموقع:
 * المفتاح هو ما تضمن القاعدة ثباتَه (`@unique`)، والرمز عرضة للتغيير.
 * تليجرام لا شعار له في `Ionicons`، فطائرته الورقيّة أقرب المتاح.
 */
const SOCIAL_ICONS: Record<string, IconName> = {
  youtube: 'logo-youtube',
  facebook: 'logo-facebook',
  x: 'logo-twitter',
  twitter: 'logo-twitter',
  snapchat: 'logo-snapchat',
  tiktok: 'logo-tiktok',
  instagram: 'logo-instagram',
  telegram: 'paper-plane-outline',
  whatsapp: 'logo-whatsapp',
};

export function socialIcon(key: string): IconName {
  return SOCIAL_ICONS[key.toLowerCase()] || 'globe-outline';
}
