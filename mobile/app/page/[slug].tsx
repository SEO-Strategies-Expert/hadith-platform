import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '../../src/i18n';
import { sitePageUrl } from '../../src/nav/links';
import { cachedSiteOrigin } from '../../src/nav/store';
import { colors } from '../../src/theme';
import { SiteWebView } from '../../src/ui/SiteWebView';

/**
 * صفحةٌ من موقع الكلّية داخل التطبيق.
 *
 * شاشةٌ واحدة تكفي الصفحات المحتوائيّة كلّها: `slug` هو المسار كما هو
 * مخزَّن في `nav_links` (`about.html`)، و`hash` المِرساة إن وُجدت
 * (`vision`)، و`title` عنوان العنصر في القائمة كي يظهر في الترويسة قبل
 * أن تُحمَّل الصفحة — لا بعدها.
 *
 * وزرّ الرجوع يأتي من ترويسة التطبيق (`BrandHeader` في `app/_layout.tsx`)،
 * فالشاشة لا ترسم رأسًا لنفسها.
 */
export default function SitePageScreen() {
  const { slug, hash, title } = useLocalSearchParams<{
    slug: string;
    hash?: string;
    title?: string;
  }>();
  const { t, lang } = useI18n();

  /**
   * يُثبَّت مرّةً لعمر الشاشة: لو تغيّر الأصل بعد دفء الذاكرة لأُعيد
   * تحميل الصفحة تحت يد القارئ بلا سبب.
   */
  const [origin] = useState(cachedSiteOrigin);

  const path = String(slug ?? '');
  const url = sitePageUrl(origin, lang, path, hash || null);

  return (
    <>
      <Stack.Screen options={{ title: title || t('sitePage') }} />
      {/* الحافّة السفلى وحدها: الترويسة تبتلع هامش شريط الحالة أعلاه. */}
      <SafeAreaView style={styles.host} edges={['bottom']}>
        <SiteWebView url={url} origin={origin} />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1, backgroundColor: colors.cream },
});
