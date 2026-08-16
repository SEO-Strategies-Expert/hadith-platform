import React from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { I18nProvider, primeRTL, useI18n, useRTLBootstrap } from '../src/i18n';
import { NavMenuProvider } from '../src/nav/NavMenu';
import { colors, fonts } from '../src/theme';
import { BrandHeader } from '../src/ui/AppHeader';
import { BrandSplash } from '../src/ui/Splash';

/**
 * قبل أوّل تصيير: يُؤمر النظام بقلب الاتّجاه (لا يُستأذن فقط). التفصيل
 * وسببُ عجز `allowRTL` وحدها في `src/i18n/rtl.ts`.
 */
primeRTL();

function Navigator() {
  const { t } = useI18n();
  const { status } = useAuth();

  // ريثما تُقرأ الرموز ويُتحقّق منها: شاشة الهويّة بدل وميض الحالات.
  if (status === 'loading') return <BrandSplash />;

  return (
    <Stack
      screenOptions={{
        /**
         * ترويسة الكلّية بدل ترويسة النظام: العميل يقارن بالموقع، وشريطٌ
         * رماديّ بعنوانٍ صغير ليس هو `.site-head`. المكوّن واحدٌ يُعاد
         * استعماله هنا وفي التبويبات معًا.
         */
        header: ({ options, route, navigation, back }) => (
          <BrandHeader
            title={options.title ?? route.name}
            canGoBack={back != null}
            onBack={navigation.goBack}
          />
        ),
        contentStyle: { backgroundColor: colors.cream },
      }}
    >
      {/* مجموعة التبويبات لها ترويستها من ملفّ تخطيطها، فلا تُكرَّر هنا. */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: t('loginAction') }} />
      <Stack.Screen name="settings" options={{ title: t('settings') }} />
      <Stack.Screen name="notifications" options={{ title: t('notificationsTitle') }} />
      <Stack.Screen name="certificates" options={{ title: t('certificatesTitle') }} />
      <Stack.Screen name="payments" options={{ title: t('paymentsTitle') }} />
      <Stack.Screen name="faculty" options={{ title: t('facultyTitle') }} />
      <Stack.Screen name="contact" options={{ title: t('contactTitle') }} />
      <Stack.Screen name="programs/index" options={{ title: t('programsTitle') }} />
      {/* عنوانها اسمُ المرحلة، فتضبطه الشاشة عند التركيب. */}
      <Stack.Screen name="programs/[stage]" options={{ title: t('programsStageCourses') }} />
      <Stack.Screen name="course/[id]" options={{ title: t('tabCourses') }} />
      <Stack.Screen name="lesson/[id]" options={{ title: t('lesson') }} />
      <Stack.Screen name="quiz/[id]" options={{ title: t('quizTitle') }} />
      <Stack.Screen name="attempt/[attemptId]" options={{ title: t('quizTitle') }} />
      <Stack.Screen name="assignments/index" options={{ title: t('assignmentsTitle') }} />
      <Stack.Screen name="assignments/[id]" options={{ title: t('assignmentsTitle') }} />
      <Stack.Screen name="news/index" options={{ title: t('newsTitle') }} />
      <Stack.Screen name="news/[id]" options={{ title: t('newsTitle') }} />
      {/* عنوانها يأتي من عنصر القائمة نفسه، فتضبطه الشاشة عند التركيب. */}
      <Stack.Screen name="page/[slug]" options={{ title: t('sitePage') }} />
    </Stack>
  );
}

/** يفصل انتظارَ الاتّجاه عن انتظارِ الخطوط كي يبقى كلٌّ منهما مقروءًا. */
function Boot() {
  const rtl = useRTLBootstrap();
  if (rtl !== 'ready') return <BrandSplash />;
  return <Navigator />;
}

export default function RootLayout() {
  /**
   * خطوط الموقع نفسها.
   *
   * `Thuluth` هنا هو خطّ الثلث الحقيقيّ: ملفّ `thuluth-dt.ttf` واسم
   * عائلته الداخليّ «DecoType Thuluth 2» — وهو ما يحمّله الموقع في
   * `@font-face{font-family:'Thuluth';src:url('../fonts/thuluth-dt.woff2')}`.
   * أمّا `thuluth-400/700.ttf` فخطّهما `Scheherazade New` نسخيٌّ لا ثلثيّ،
   * وهو `ThuluthAlt` في الموقع: احتياطيٌّ للعناوين، وخطُّ الأرقام
   * الاحتفاليّة (`.facts b`, `.stat b`) — ولذلك بقي مسجَّلًا باسمه.
   *
   * لا يُضبط `fontWeight` مع أيٍّ منها: لكلّ وزنٍ ملفّه، وضبط الوزن فوق
   * خطٍّ مخصَّص على أندرويد يُنتج عريضًا مصطنعًا أو يُسقط الخطّ كلّه.
   */
  const [fontsLoaded, fontError] = useFonts({
    [fonts.thuluth]: require('../assets/fonts/thuluth-dt.ttf'),
    [fonts.thuluthAlt]: require('../assets/fonts/thuluth-400.ttf'),
    [fonts.thuluthAltBold]: require('../assets/fonts/thuluth-700.ttf'),
    [fonts.naskh]: require('../assets/fonts/naskh-400.ttf'),
    [fonts.naskhBold]: require('../assets/fonts/naskh-700.ttf'),
    [fonts.body]: require('../assets/fonts/plex-400.ttf'),
    [fonts.bodyMedium]: require('../assets/fonts/plex-500.ttf'),
    [fonts.bodyBold]: require('../assets/fonts/plex-700.ttf'),
  });

  // إخفاق خطٍّ واحد لا يُسقط التطبيق على بياض: يُسجَّل ويُمضى بخطّ النظام.
  React.useEffect(() => {
    if (fontError) console.warn('[fonts] تعذّر تحميل أحد خطوط الكلّية:', fontError.message);
  }, [fontError]);

  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          {/*
            مزوّد القائمة فوق الملاحة لا داخلها: نافذته (`Modal`) يجب أن
            تعلو الشجرة كلّها — الشاشات وشريط التبويبات معًا — وزرّها في
            `BrandHeader` يُصيَّر في التخطيطين كليهما فلا بدّ أن يقعا تحت
            سياقٍ واحد.
          */}
          <NavMenuProvider>
            <StatusBar style="light" />
            {fontsLoaded || fontError ? <Boot /> : <BrandSplash />}
          </NavMenuProvider>
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
