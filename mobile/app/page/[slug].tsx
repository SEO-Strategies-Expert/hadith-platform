import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '../../src/i18n';
import { colors, spacing } from '../../src/theme';
import { SitePageView } from '../../src/ui/PageBody';

/**
 * صفحةٌ محتوائيّة من صفحات الكلّية — **مرسومةً أصيلًا داخل التطبيق**.
 *
 * كانت هذه الشاشة تحمّل الصفحة في إطار ويب، ونسختُها في المتصفّح تعرض
 * «افتحها من الموقع». وكلاهما مرفوض: القارئ يبقى في التطبيق من أوّله
 * إلى آخره. فصار المصدر `/api/v1/pages/{slug}` يردّ المتن **كتلًا**
 * (عنوان/فقرة/قائمة/صورة/اقتباس) يرسمها `SitePageView` بخطوط الكلّية
 * وألوانها — والنصّ نفسه من قاعدة البيانات نفسها، فما يُحرَّر في اللوحة
 * يظهر هنا وفي الموقع معًا.
 *
 * `slug` هو المسار كما هو مخزَّن في `nav_links` (`about.html`) — تُقصّ
 * لاحقتُه في `getPage`. و`title` عنوان العنصر في القائمة كي تظهر
 * الترويسة صحيحةً قبل وصول الردّ لا بعده، ثمّ يحلّ محلّه عنوان الصفحة
 * من القاعدة. و`hash` يُقبل ويُهمَل: الصفحة تُعرض كاملةً ولا مِرساةَ
 * في شاشةٍ أصيلة.
 *
 * وزرّ الرجوع يأتي من ترويسة التطبيق (`BrandHeader` في `app/_layout.tsx`)،
 * فالشاشة لا ترسم رأسًا لنفسها.
 */
export default function SitePageScreen() {
  const { slug, title } = useLocalSearchParams<{
    slug: string;
    hash?: string;
    title?: string;
  }>();
  const { t } = useI18n();

  /** عنوان الترويسة: من القائمة أوّلًا، ثمّ من القاعدة حين يصل الردّ. */
  const [heading, setHeading] = useState<string>(() => String(title || ''));

  const path = String(slug ?? '');

  return (
    <>
      <Stack.Screen options={{ title: heading || t('sitePage') }} />
      {/* الحافّة السفلى وحدها: الترويسة تبتلع هامش شريط الحالة أعلاه. */}
      <SafeAreaView style={styles.host} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <SitePageView slug={path} onTitle={setHeading} />
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1, backgroundColor: colors.cream },
  // لا حشوَ أفقيّ هنا: الهيرو يمتدّ من حافّةٍ إلى حافّة، والمتن يأخذ
  // هامشه من `SitePageView` نفسه.
  content: { paddingBottom: spacing.xl },
});
