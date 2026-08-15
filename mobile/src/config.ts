import Constants from 'expo-constants';

type Extra = {
  apiBaseUrl?: string;
  websiteUrl?: string;
  eas?: { projectId?: string };
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const stripTrailingSlash = (u: string) => u.replace(/\/+$/, '');

/** أصل الخادم. يُضبط من `EXPO_PUBLIC_API_URL` عبر app.config.ts. */
export const API_BASE_URL = stripTrailingSlash(extra.apiBaseUrl ?? 'http://localhost:3000');

/** جذر واجهة النسخة الأولى — كل نداءات الشبكة تُبنى عليه. */
export const API_V1 = `${API_BASE_URL}/api/v1`;

/** موقع الكلّية العلني — للروابط الخارجيّة (طلب الالتحاق، التحقّق من الوثائق). */
export const WEBSITE_URL = stripTrailingSlash(extra.websiteUrl ?? API_BASE_URL);

/** صفحة طلب الالتحاق: لا تسجيل ذاتيّ داخل التطبيق، فالقبول يمرّ بالموقع. */
export const APPLY_URL = `${WEBSITE_URL}/admissions.html`;
export const CONTACT_URL = `${WEBSITE_URL}/contact.html`;

/** معرّف مشروع EAS — يلزم لاستخراج رمز إشعارات Expo. */
export const EAS_PROJECT_ID = extra.eas?.projectId;

/** رابط التحقّق العلني من وثيقة بالرمز. */
export const verifyUrl = (code: string) => `${WEBSITE_URL}/verify.html?code=${encodeURIComponent(code)}`;
