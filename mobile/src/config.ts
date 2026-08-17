import Constants from 'expo-constants';

type Extra = {
  apiBaseUrl?: string;
  eas?: { projectId?: string };
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const stripTrailingSlash = (u: string) => u.replace(/\/+$/, '');

/** أصل الخادم. يُضبط من `EXPO_PUBLIC_API_URL` عبر app.config.ts. */
export const API_BASE_URL = stripTrailingSlash(extra.apiBaseUrl ?? 'http://localhost:3000');

/** جذر واجهة النسخة الأولى — كل نداءات الشبكة تُبنى عليه. */
export const API_V1 = `${API_BASE_URL}/api/v1`;

/**
 * لا ثابتَ هنا لموقع الكلّية بعد اليوم.
 *
 * كانت `WEBSITE_URL` و`APPLY_URL` و`CONTACT_URL` و`verifyUrl` تبني روابط
 * تخرج بالمستخدم من التطبيق إلى المتصفّح — وهو ما رفضه العميل صراحةً.
 * صار لكلٍّ منها نظيرٌ داخليّ: صفحة القبول والتواصل تُرسمان أصيلًا من
 * `/api/v1/pages/{slug}`، والتحقّق من الوثيقة يجري من `/api/v1/verify/{code}`
 * وتُعرض نتيجته في الشاشة نفسها.
 */

/** معرّف مشروع EAS — يلزم لاستخراج رمز إشعارات Expo. */
export const EAS_PROJECT_ID = extra.eas?.projectId;
