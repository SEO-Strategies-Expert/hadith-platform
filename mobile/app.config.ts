import type { ExpoConfig } from 'expo/config';

/**
 * الموضع الوحيد لضبط عنوان الخادم في كامل التطبيق.
 * اضبطه بمتغيّر البيئة `EXPO_PUBLIC_API_URL` (ملفّ .env أو أسرار EAS)،
 * ويُقرأ في الكود من `src/config.ts` وحده — لا رابط مكتوب داخل أيّ شاشة.
 */
const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || 'http://localhost:3000';
const websiteUrl = process.env.EXPO_PUBLIC_WEBSITE_URL?.trim() || 'https://hadith-platform-hassan67844-4138s-projects.vercel.app';
const easProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() || undefined;

const NAVY_DARK = '#01183A';

const config: ExpoConfig = {
  name: 'الكلّية العليا للحديث',
  slug: 'hadith-college',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'hadithcollege',
  userInterfaceStyle: 'light',
  primaryColor: NAVY_DARK,

  ios: {
    supportsTablet: true,
    // يجب أن يطابق المعرّف المسجَّل في حساب Apple Developer للعميل.
    bundleIdentifier: 'com.hadithcollege.app',
  },

  android: {
    // يجب أن يطابق المعرّف المسجَّل في Google Play Console للعميل.
    package: 'com.hadithcollege.app',
    adaptiveIcon: {
      backgroundColor: NAVY_DARK,
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },

  web: {
    bundler: 'metro',
    output: 'single',
    favicon: './assets/favicon.png',
  },

  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-video',
    /**
     * خطوط الكلّية تُضمَّن في الحزمة الأصليّة وقت البناء. القائمة هنا
     * يجب أن تطابق ما يُسجّله `useFonts` في `app/_layout.tsx` ملفًّا
     * بملفّ — وأوّلها `thuluth-dt.ttf`، وهو خطّ الثلث الحقيقيّ
     * («DecoType Thuluth 2») الذي يحمّله الموقع باسم `Thuluth`.
     * ما ينقص هنا يُحمَّل على الويب بلا شكوى ثمّ يغيب في النسخة الأصيلة.
     */
    [
      'expo-font',
      {
        fonts: [
          './assets/fonts/thuluth-dt.ttf',
          './assets/fonts/thuluth-400.ttf',
          './assets/fonts/thuluth-700.ttf',
          './assets/fonts/naskh-400.ttf',
          './assets/fonts/naskh-700.ttf',
          './assets/fonts/plex-400.ttf',
          './assets/fonts/plex-500.ttf',
          './assets/fonts/plex-700.ttf',
        ],
      },
    ],
    /**
     * عربيّة أوّلًا. هذه الإضافة تكتب `ExpoLocalization_forcesRTL=true`
     * في `strings.xml` (وفي `Info.plist` على iOS)، فتقرؤها الوحدة
     * الأصليّة وتستدعي `I18nManager.forceRTL` قبل أوّل تصيير — فلا
     * يحتاج المستخدم النهائي إلى إعادة تشغيل.
     *
     * **حدُّها:** إضافات الإعداد تسري في نسخة البناء (EAS / prebuild)
     * وحدها، ولا أثر لها في Expo Go — فهناك `strings.xml` هو ملفّ Expo
     * Go وقيمته `unset`. مسارُ Expo Go يُعالَج في `src/i18n/rtl.ts`.
     */
    // `supportsRTL` وحدها: يُسمح بالاتّجاهين ويُختار وقت التشغيل حسب لغة
    // المستخدم. `forcesRTL` كانت تُثبّت RTL على مستوى النظام، فتظهر الواجهة
    // الإنجليزيّة داخل تخطيطٍ مقلوب مهما بدّل المستخدم اللغة.
    ['expo-localization', { supportsRTL: true }],
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        backgroundColor: NAVY_DARK,
        imageWidth: 180,
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/android-icon-monochrome.png',
        color: NAVY_DARK,
      },
    ],
  ],

  /**
   * التحديث عن بُعد (OTA).
   *
   * التطبيق يفحص وجود تحديثٍ عند كل إقلاع وينزّله في الخلفيّة، فيصل تعديل
   * الشاشات والألوان بلا بناءٍ جديد ولا إعادة تثبيت عند العميل.
   *
   * ⚠️ `runtimeVersion` بسياسة `appVersion` مقصودة: التحديث لا يُطبَّق إلّا على
   * نسخةٍ تحمل إصدار التطبيق نفسه. فلو أضفنا لاحقًا وحدةً أصيلة (مكتبة تحتاج
   * كودًا أصليًّا) نرفع `version`، فلا يُرسَل إليها تحديثُ جافاسكربت يفترض
   * وجود تلك الوحدة — وهذا ما يمنع تعطُّل التطبيق في يد العميل.
   * أي: OTA لتعديلات الواجهة والمنطق، والبناء الجديد للوحدات الأصيلة وحدها.
   */
  updates: {
    url: easProjectId ? `https://u.expo.dev/${easProjectId}` : undefined,
    fallbackToCacheTimeout: 0,
    checkAutomatically: 'ON_LOAD',
  },
  runtimeVersion: { policy: 'appVersion' },

  experiments: {
    typedRoutes: true,
  },

  extra: {
    apiBaseUrl,
    websiteUrl,
    eas: easProjectId ? { projectId: easProjectId } : undefined,
  },
};

export default config;
