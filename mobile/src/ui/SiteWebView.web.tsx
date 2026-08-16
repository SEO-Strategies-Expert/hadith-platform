import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../i18n';
import { colors, spacing } from '../theme';
import { Button } from './Button';
import { Card, Row, Txt } from './kit';
import { openExternal } from './openLink';

/**
 * نظير `SiteWebView` في المتصفّح.
 *
 * `react-native-webview` لا يعمل على الويب (وهي علّة `VideoPlayer.web.tsx`
 * نفسها)، والإطار المضمَّن ليس بديلًا: الموقع وخادم Expo أصلان مختلفان،
 * والصفحة قد تُمنع من التضمين. فالسقوط هو ما كان يفعله المستخدم في
 * المتصفّح أصلًا: تبويبٌ جديد على الصفحة نفسها. والشاشة تبقى قائمةً
 * تقول ما يجري وتعرض الرابط — ولا تسقط ولا تُترك بيضاء.
 */
export function SiteWebView({ url }: { url: string; origin: string }) {
  const { t } = useI18n();

  return (
    <View style={styles.host}>
      <Card style={{ gap: spacing.md }}>
        <Row gap={spacing.sm}>
          <Ionicons name="open-outline" size={20} color={colors.navy} />
          <Txt variant="heading">{t('sitePage')}</Txt>
        </Row>
        <Txt variant="small" color={colors.textMuted}>
          {t('pageWebNotice')}
        </Txt>
        <Txt variant="tiny" color={colors.textMuted} selectable>
          {url}
        </Txt>
        <Button label={t('pageOpenInBrowser')} onPress={() => void openExternal(url)} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1, padding: spacing.lg, backgroundColor: colors.cream },
});
