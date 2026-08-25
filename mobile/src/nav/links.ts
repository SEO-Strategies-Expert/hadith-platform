import type { Href } from 'expo-router';
import type { Ionicons } from '@expo/vector-icons';

/**
 * ترجمة روابط القائمة إلى وجهاتٍ **داخل التطبيق**.
 *
 * القاعدة الحاكمة بعد إعادة البناء: **لا شيء يخرج إلى موقع الكلّية.**
 * ما له شاشةٌ أصيلة مبنيّة (المقرّرات، الأخبار، الهيئة، التواصل، الدخول،
 * البرامج) يذهب إليها؛ وما بقي من الصفحات المحتوائيّة يُرسم أصيلًا في
 * `app/page/[slug].tsx` من `/api/v1/pages/{slug}` — والنصّ مصدرُه قاعدة
 * البيانات نفسها التي يقرأ منها الموقع، فلا نسختان تفترقان.
 *
 * ولا يخرج إلى المتصفّح إلّا ما ليس من الكلّية أصلًا: المواقع البحثيّة
 * (`sunnah.one`، `dorar.net`…) المعلَّمة `external` في القاعدة.
 */

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * وجهةُ عنصرٍ في القائمة:
 *  · `native` — شاشة مبنيّة في التطبيق.
 *  · `page`   — صفحة محتوائيّة تُرسم أصيلًا في `page/[slug]`.
 *  · `external` — موقعٌ آخر لا صلة له بالكلّية (`sunnah.one`…).
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

/*
 * حُذف من هنا كلّ ما كان يبني رابطًا إلى موقع الكلّية —
 * `siteOrigin` و`sitePageUrl` و`adminUrl` و`isSameOrigin`. لم يعد في
 * التطبيق طريقٌ يخرج إليه: الصفحات تُقرأ من الواجهة وتُرسم أصيلًا،
 * ولوحةُ التحكّم تُدار من الحاسوب لا من التطبيق.
 */

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
