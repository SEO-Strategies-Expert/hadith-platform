import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../src/i18n';
import { colors, spacing } from '../src/theme';
import { Button } from '../src/ui/Button';
import { Card, SectionTitle, Txt } from '../src/ui/kit';
import { SitePageView } from '../src/ui/PageBody';

/**
 * شاشة التواصل.
 *
 * كانت ثلاثةَ أزرارٍ تخرج كلُّها إلى الموقع (صفحة التواصل، طلب الالتحاق،
 * الموقع نفسه). فصارت تعرض **متن صفحة التواصل نفسه** مرسومًا أصيلًا من
 * `/api/v1/pages/contact` — العناوين والفقرات وبيانات المراسلة كما
 * يحرّرها المدير في اللوحة — ويبقى زرٌّ واحد ينتقل إلى صفحة القبول
 * والتسجيل داخل التطبيق.
 */
export default function ContactScreen() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <View style={styles.host}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.gutter}>
          <SectionTitle title={t('contactTitle')} />
          <Card style={{ gap: spacing.md }}>
            <Txt variant="body" color={colors.textMuted}>
              {t('contactBody')}
            </Txt>
            <Button
              label={t('applyAction')}
              onPress={() =>
                router.push({
                  pathname: '/page/[slug]',
                  params: { slug: 'admissions.html', title: t('applyAction') },
                })
              }
            />
          </Card>
        </View>

        {/* متن صفحة التواصل بلا هيرو: للشاشة عنوانها أعلاه فلا يُكرَّر. */}
        <SitePageView slug="contact" hero={false} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1, backgroundColor: colors.cream },
  content: { paddingBottom: spacing.xxl },
  gutter: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.lg },
});
