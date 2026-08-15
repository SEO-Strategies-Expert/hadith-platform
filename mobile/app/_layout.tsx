import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { I18nProvider, ensureRTL, useI18n } from '../src/i18n';
import { colors, fontFamily } from '../src/theme';
import { Spinner } from '../src/ui/kit';

ensureRTL();

function Navigator() {
  const { t } = useI18n();
  const { status } = useAuth();

  // ريثما تُقرأ الرموز ويُتحقّق منها: شاشة انتظار بدل وميض الحالات.
  if (status === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.navyDark, alignItems: 'center', justifyContent: 'center' }}>
        <Spinner />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navyDark },
        headerTintColor: colors.goldLight,
        headerTitleStyle: { fontFamily, fontSize: 16, fontWeight: '700', color: colors.textOnNavy },
        headerBackTitle: t('back'),
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
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Navigator />
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
