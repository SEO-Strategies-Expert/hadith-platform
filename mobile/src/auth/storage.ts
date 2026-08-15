import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * تخزين الرموز.
 *
 * على iOS و Android: `expo-secure-store` حصرًا (سلسلة المفاتيح / Keystore).
 * الرموز أسرار، فلا تُحفظ في تخزين عاديّ.
 *
 * على الويب: `expo-secure-store` غير مدعوم إطلاقًا، ولا يوجد في المتصفّح مكافئ
 * آمن. فنسقط إلى `sessionStorage` (يُمحى بإغلاق التبويب، ولا يشاركه تبويب آخر)
 * وهو الأقلّ سوءًا. **نسخة الويب للتطوير والمعاينة فقط ولا تُنشر للطلّاب.**
 */

const ACCESS_KEY = 'hadith_access_token';
const REFRESH_KEY = 'hadith_refresh_token';
const DEVICE_KEY = 'hadith_device_id';

const isWeb = Platform.OS === 'web';

function webStore(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    webStore()?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) return webStore()?.getItem(key) ?? null;
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    // مفتاح تالف أو أُبطل بتغيير بصمة الجهاز — عامله كغياب.
    return null;
  }
}

async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    webStore()?.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    /* الغياب هو المطلوب أصلًا. */
  }
}

export type StoredTokens = { accessToken: string; refreshToken: string };

export async function loadTokens(): Promise<StoredTokens | null> {
  const [accessToken, refreshToken] = await Promise.all([getItem(ACCESS_KEY), getItem(REFRESH_KEY)]);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  // يُكتب الرمزان معًا: رمز التجديد يُدوَّر، وضياع الجديد يعني خروجًا قسريًّا.
  await Promise.all([
    setItem(ACCESS_KEY, tokens.accessToken),
    setItem(REFRESH_KEY, tokens.refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([deleteItem(ACCESS_KEY), deleteItem(REFRESH_KEY)]);
}

/** تفضيلات غير سرّيّة (اللغة مثلًا). تمرّ بالمخزن نفسه اختصارًا للاعتماديات. */
export const getPref = (key: string) => getItem(`hadith_pref_${key}`);
export const setPref = (key: string, value: string) => setItem(`hadith_pref_${key}`, value);

/** معرّف جهاز ثابت — لا يحمل أي بيانات شخصيّة، لتمييز تسجيلات الإشعارات. */
export async function getDeviceId(): Promise<string> {
  const existing = await getItem(DEVICE_KEY);
  if (existing) return existing;
  const fresh = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  await setItem(DEVICE_KEY, fresh);
  return fresh;
}
