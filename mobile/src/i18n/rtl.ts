import { useEffect, useState } from 'react';
import { DevSettings, I18nManager, Platform } from 'react-native';
import { getPref, setPref } from '../auth/storage';

/**
 * تثبيت اتّجاه الواجهة من اليمين إلى اليسار على المنصّات الأصليّة.
 *
 * ثلاث حقائق تحكم هذا الملفّ، وكلّها من مصدر React Native نفسه
 * (`ReactAndroid/.../i18nmanager/I18nUtil.kt`):
 *
 * ١) `I18nManager.allowRTL(true)` **إذنٌ لا أمر**: لا يقلب شيئًا، وإنّما
 *    يسمح بالقلب إن كانت لغة الجهاز عربيّةً أصلًا. وجهاز الطالب قد
 *    تكون لغته إنجليزيّة، فيبقى كلّ شيءٍ من اليسار لليمين. الأمرُ هو
 *    `forceRTL(true)`.
 *
 * ٢) `forceRTL` **لا يغيّر شيئًا في هذه الجلسة**: تنفيذه على أندرويد
 *    `setPref(context, "RCTI18nUtil_forceRTL", true)` — كتابةٌ في
 *    التفضيلات المشتركة لا غير. أمّا `I18nManager.isRTL` في جافاسكربت
 *    فيُقرأ **مرّةً واحدة** وقت تحميل الوحدة من `getConstants()`
 *    (`Libraries/ReactNative/I18nManager.js`). فلا يسري الاتّجاه الجديد
 *    إلّا بإعادة تحميلٍ تعيد تقييم حزمة جافاسكربت.
 *
 * ٣) في **نسخة البناء الأصيلة** لا حاجة إلى شيءٍ من هذا: إضافة
 *    `expo-localization` في `app.config.ts` تكتب
 *    `ExpoLocalization_forcesRTL=true` في `strings.xml`، فتقرؤها الوحدة
 *    الأصليّة عند الإقلاع وتستدعي `forceRTL` **قبل** أوّل تصيير. لكنّ
 *    إضافات الإعداد **لا تسري في Expo Go إطلاقًا** — فملفّ `strings.xml`
 *    هناك هو ملفّ Expo Go لا ملفّنا، وقيمته `unset`. وهذا بعينه سبب
 *    بقاء الواجهة من اليسار لليمين على جهاز العميل.
 *
 * فالمعالجة طبقتان: الإضافة تكفي المستخدم النهائي، وهذا الملفّ يُنقذ
 * Expo Go ونسخ التطوير.
 */

/** علامةٌ محفوظة تمنع حلقة إعادة تحميلٍ لا تنتهي. */
const RELOAD_FLAG = 'rtlReloadAttempted';

export type RtlStatus =
  /** الاتّجاه صحيح — امضِ في التصيير. */
  | 'ready'
  /** نقرأ العلامة المحفوظة لنقرّر: إعادة تحميلٍ أم مضيٌّ بلا قلب. */
  | 'checking'
  /** أُمر بإعادة التحميل؛ لا معنى لتصيير شيءٍ الآن. */
  | 'reloading';

/**
 * يُستدعى في **نطاق الوحدة** قبل أوّل تصيير — لا داخل مكوّن.
 * الكتابة في التفضيلات مبكّرًا تعني أنّ أوّل إقلاعٍ تالٍ يبدأ RTL أصلًا
 * حتّى لو لم تنجح إعادة التحميل.
 */
export function primeRTL(): void {
  // الويب لا يمرّ بـ`I18nManager`؛ اتّجاه المستند يُضبط في `I18nProvider`.
  if (Platform.OS === 'web') return;
  try {
    I18nManager.allowRTL(true);
    if (!I18nManager.isRTL) I18nManager.forceRTL(true);
  } catch {
    /* غياب الوحدة الأصليّة (اختبارات مثلًا) لا يُعطّل التطبيق. */
  }
}

/**
 * يُكمل ما بدأه `primeRTL`: إن كانت الجلسة الحاليّة ما تزال LTR فلا
 * سبيل إلّا إعادة تحميلٍ **واحدة**. `DevSettings.reload()` هي المتاحة
 * بلا اعتماديّةٍ إضافيّة، وتعمل في Expo Go وفي نسخ التطوير — وهي
 * بالضبط الحالات التي لا تسري فيها إضافة `expo-localization`. وفي نسخة
 * الإصدار تكون الإضافة قد قلبت الاتّجاه قبلًا فلا يُبلَغ هذا المسار،
 * وإن بُلِغ فـ`reload` عاجزةٌ هناك — ولذلك المهلة أدناه.
 */
export function useRTLBootstrap(): RtlStatus {
  const [status, setStatus] = useState<RtlStatus>(() =>
    Platform.OS === 'web' || I18nManager.isRTL ? 'ready' : 'checking'
  );

  useEffect(() => {
    if (status !== 'checking') return;

    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    void (async () => {
      const attempted = await getPref(RELOAD_FLAG);
      if (!alive) return;

      // أُعيد التحميل مرّةً ولم يُقلب الاتّجاه (منصّةٌ لا تدعم RTL أو
      // `android:supportsRtl` غير مضبوط). لا تُعِد الكرّة — امضِ.
      if (attempted === '1') {
        setStatus('ready');
        return;
      }

      await setPref(RELOAD_FLAG, '1');
      if (!alive) return;
      setStatus('reloading');

      // شبكة أمان: إن كانت `reload` بلا أثر (نسخة إصدار) لا يبقى
      // التطبيق معلّقًا على شاشة الإقلاع.
      timer = setTimeout(() => {
        if (alive) setStatus('ready');
      }, 1500);

      try {
        DevSettings.reload('applying right-to-left layout');
      } catch {
        if (alive) setStatus('ready');
      }
    })();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [status]);

  // نجح القلب: امحُ العلامة كي تُعاد المحاولة لو أُبطل الاتّجاه لاحقًا.
  useEffect(() => {
    if (status === 'ready' && Platform.OS !== 'web' && I18nManager.isRTL) {
      void setPref(RELOAD_FLAG, '');
    }
  }, [status]);

  return status;
}
