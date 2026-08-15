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
    // خطوط الكلّية تُضمَّن في الحزمة الأصليّة، ويُحمّلها `useFonts` وقت الإقلاع.
    [
      'expo-font',
      {
        fonts: [
          './assets/fonts/thuluth-400.ttf',
          './assets/fonts/thuluth-700.ttf',
          './assets/fonts/naskh-400.ttf',
          './assets/fonts/naskh-700.ttf',
          './assets/fonts/plex-400.ttf',
          './assets/fonts/plex-600.ttf',
          './assets/fonts/plex-700.ttf',
        ],
      },
    ],
    // عربيّة أوّلًا: يُثبَّت اتّجاه RTL على مستوى النظام وقت البناء،
    // فلا يحتاج التطبيق إلى إعادة تشغيل لضبط الاتّجاه.
    ['expo-localization', { supportsRTL: true, forcesRTL: true }],
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
