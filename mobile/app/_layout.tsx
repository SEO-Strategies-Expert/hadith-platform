import React from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { I18nProvider, ensureRTL, useI18n } from '../src/i18n';
import { colors, fonts } from '../src/theme';
import { BrandSplash } from '../src/ui/Splash';

ensureRTL();

function Navigator() {
  const { t } = useI18n();
  const { status } = useAuth();

  // ريثما تُقرأ الرموز ويُتحقّق منها: شاشة الهويّة بدل وميض الحالات.
  if (status === 'loading') return <BrandSplash />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navyDeep },
        headerTintColor: colors.goldLight,
        headerTitleStyle: { fontFamily: fonts.naskhBold, fontSize: 16, color: colors.goldLight },
        headerBackTitle: t('back'),
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.cream },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: t('loginAction') }} />
      <Stack.Screen name="settings" options={{ title: t('settings') }} />
      <Stack.Screen name="notifications" options={{ title: t('notificationsTitle') }} />
      <Stack.Screen name="certificates" options={{ title: t('certificatesTitle') }} />
      <Stack.Screen name="payments" options={{ title: t('paymentsTitle') }} />
      <Stack.Screen name="faculty" options={{ title: t('facultyTitle') }} />
      <Stack.Screen name="contact" options={{ title: t('contactTitle') }} />
      <Stack.Screen name="course/[id]" options={{ title: t('tabCourses') }} />
      <Stack.Screen name="lesson/[id]" options={{ title: t('lesson') }} />
      <Stack.Screen name="quiz/[id]" options={{ title: t('quizTitle') }} />
      <Stack.Screen name="attempt/[attemptId]" options={{ title: t('quizTitle') }} />
      <Stack.Screen name="assignments/index" options={{ title: t('assignmentsTitle') }} />
      <Stack.Screen name="assignments/[id]" options={{ title: t('assignmentsTitle') }} />
      <Stack.Screen name="news/index" options={{ title: t('newsTitle') }} />
      <Stack.Screen name="news/[id]" options={{ title: t('newsTitle') }} />
    </Stack>
  );
}

export default function RootLayout() {
  /**
   * خطوط الموقع نفسها. خطّ الثلث أبرز ما يميّز هويّة الكلّية، فلا
   * تُصيَّر الواجهة قبل تحميله — وإلّا ظهر العنوان بخطّ النظام ثمّ قفز.
   */
  const [fontsLoaded, fontError] = useFonts({
    [fonts.thuluth]: require('../assets/fonts/thuluth-400.ttf'),
    [fonts.thuluthBold]: require('../assets/fonts/thuluth-700.ttf'),
    [fonts.naskh]: require('../assets/fonts/naskh-400.ttf'),
    [fonts.naskhBold]: require('../assets/fonts/naskh-700.ttf'),
    [fonts.body]: require('../assets/fonts/plex-400.ttf'),
    [fonts.bodyMedium]: require('../assets/fonts/plex-600.ttf'),
    [fonts.bodyBold]: require('../assets/fonts/plex-700.ttf'),
  });

  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <StatusBar style="light" />
          {/* عند إخفاق التحميل نمضي بخطّ النظام بدل تعليق التطبيق. */}
          {fontsLoaded || fontError ? <Navigator /> : <BrandSplash />}
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
