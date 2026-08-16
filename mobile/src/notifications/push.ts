import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { EAS_PROJECT_ID } from '../config';
import { getDeviceId, getPref, setPref } from '../auth/storage';
import { registerDevice, unregisterDevice } from '../api/endpoints';

/**
 * إشعارات Push.
 *
 * لا يُطلب الإذن عند أوّل فتح إطلاقًا: يُطلب من شاشة الإعدادات بعد الدخول،
 * مصحوبًا بشرحٍ لما سيصل المستخدم من تنبيهات.
 */

export type PushStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported';

const TOKEN_PREF = 'push_token';

/**
 * تطبيق Expo Go **أزال إشعارات Push منذ SDK 53**، ومجرّد استيراد
 * `expo-notifications` عنده يرمي خطأً غير ملتقَط يُسقط التطبيق عند الإقلاع.
 * ولأنّ هذا الملفّ يُستورَد من `AuthContext` فالسقوط يحدث قبل ظهور أيّ شاشة.
 *
 * فالوحدة تُحمَّل **كسولًا** لا في رأس الملفّ، وتُتخطّى كليًّا داخل Expo Go.
 * الإشعارات تعمل في نسخة البناء (development/production build) وحدها — وهي
 * ما يُثبَّت على أجهزة الطلاب فعلًا؛ أمّا Expo Go فأداة تجربة لا غير.
 */
const isExpoGo = Constants.executionEnvironment === 'storeClient';
const isSupported = (Platform.OS === 'ios' || Platform.OS === 'android') && !isExpoGo;

type NotificationsModule = typeof import('expo-notifications');
let cached: NotificationsModule | null = null;
let handlerSet = false;

/** يحمّل الوحدة عند أوّل حاجة فعليّة إليها، ويعيد null إن تعذّر. */
async function notifications(): Promise<NotificationsModule | null> {
  if (!isSupported) return null;
  if (cached) return cached;
  try {
    cached = await import('expo-notifications');
    if (!handlerSet) {
      cached.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      handlerSet = true;
    }
    return cached;
  } catch {
    return null;
  }
}

export async function getPushStatus(): Promise<PushStatus> {
  const N = await notifications();
  if (!N) return 'unsupported';
  try {
    const { status } = await N.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'undetermined';
  }
}

async function ensureAndroidChannel(N: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;
  // على أندرويد ١٣+ تُنشأ القناة قبل طلب الرمز.
  await N.setNotificationChannelAsync('default', {
    name: 'تنبيهات الكلّية',
    importance: N.AndroidImportance.DEFAULT,
    lightColor: '#D8AB4A',
  });
}

export type EnableResult =
  | { ok: true }
  | { ok: false; reason: 'unsupported' | 'denied' | 'no-project-id' | 'failed' };

/**
 * يطلب الإذن، ويستخرج رمز Expo، ويسجّله في الخادم.
 * يُستدعى بعد الدخول فقط — التسجيل يحتاج `Bearer` صالحًا.
 */
export async function enablePush(): Promise<EnableResult> {
  const N = await notifications();
  if (!N) return { ok: false, reason: 'unsupported' };

  try {
    await ensureAndroidChannel(N);

    const current = await N.getPermissionsAsync();
    let granted = current.status === 'granted';
    if (!granted) {
      const asked = await N.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      granted = asked.status === 'granted';
    }
    if (!granted) return { ok: false, reason: 'denied' };

    if (!EAS_PROJECT_ID) {
      // بلا معرّف مشروع EAS لا يمكن استخراج رمز Expo — يُضبط عند `eas init`.
      return { ok: false, reason: 'no-project-id' };
    }

    const { data: token } = await N.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID });
    if (!token) return { ok: false, reason: 'failed' };

    await registerDevice({
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      deviceId: await getDeviceId(),
      appVersion: Constants.expoConfig?.version ?? undefined,
    });

    await setPref(TOKEN_PREF, token);
    return { ok: true };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}

/**
 * يُلغي تسجيل الجهاز في الخادم.
 * **يجب استدعاؤه قبل مسح رموز المصادقة** لأنّه يحتاج `Bearer` صالحًا.
 */
export async function unregisterPush(): Promise<void> {
  if (!isSupported) return;
  try {
    const token = await getPref(TOKEN_PREF);
    if (!token) return;
    await unregisterDevice(token);
    await setPref(TOKEN_PREF, '');
  } catch {
    // الخروج يجب ألّا يفشل في وجه المستخدم بسبب تنظيف الإشعارات.
  }
}

/** إعادة إرسال الرمز عند الإقلاع — الخادم يعمل upsert فلا تكرار. */
export async function refreshDeviceRegistration(): Promise<void> {
  if (!isSupported) return;
  try {
    if ((await getPushStatus()) !== 'granted') return;
    await enablePush();
  } catch {
    /* لا يُعتدّ بفشله. */
  }
}
