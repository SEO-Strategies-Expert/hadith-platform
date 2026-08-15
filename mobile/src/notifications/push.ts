import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
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
const isSupported = Platform.OS === 'ios' || Platform.OS === 'android';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function getPushStatus(): Promise<PushStatus> {
  if (!isSupported) return 'unsupported';
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'undetermined';
  }
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  // على أندرويد ١٣+ تُنشأ القناة قبل طلب الرمز.
  await Notifications.setNotificationChannelAsync('default', {
    name: 'تنبيهات الكلّية',
    importance: Notifications.AndroidImportance.DEFAULT,
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
  if (!isSupported) return { ok: false, reason: 'unsupported' };

  try {
    await ensureAndroidChannel();

    const current = await Notifications.getPermissionsAsync();
    let granted = current.status === 'granted';
    if (!granted) {
      const asked = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      granted = asked.status === 'granted';
    }
    if (!granted) return { ok: false, reason: 'denied' };

    if (!EAS_PROJECT_ID) {
      // بلا معرّف مشروع EAS لا يمكن استخراج رمز Expo — يُضبط عند `eas init`.
      return { ok: false, reason: 'no-project-id' };
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId: EAS_PROJECT_ID });
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
