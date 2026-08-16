import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useI18n } from '../i18n';
import { isSameOrigin } from '../nav/links';
import { colors, spacing } from '../theme';
import { Txt } from './kit';
import { ErrorState } from './states';
import { openExternal } from './openLink';

/**
 * صفحةٌ من موقع الكلّية معروضةً داخل التطبيق.
 *
 * لماذا `WebView` لا شاشةٌ أصيلة؟ لأنّ في القاعدة سبعًا وثلاثين صفحة
 * محتوائيّة (`Page`) نصُّها `bodyHtml` محرَّرٌ من لوحة التحكّم. إعادةُ
 * بنائها شاشةً شاشة تعني نسختين من كلّ نصّ تفترقان مع أوّل تحرير،
 * ومحرّرًا في اللوحة لا أثر لتعديله في التطبيق. والموقع متجاوبٌ أصلًا
 * وبهويّة الكلّية نفسها، فعرضُه هو نفسه أصدقُ مزامنةٍ ممكنة.
 * أمّا ما بُني في التطبيق أصيلًا (المقرّرات، الأخبار، الهيئة، التواصل،
 * الدخول، بوابة الطالب، لوحة الأكاديميين) فلا يُستبدل بهذا — انظر
 * `NATIVE_ROUTES` في `src/nav/links.ts`.
 *
 * وقاعدة الروابط داخله واحدة: **ما كان على أصل الموقع يبقى داخل
 * التطبيق، وما خرج عنه يُفتح في متصفّح النظام.** بدونها ينزلق المستخدم
 * من صفحةٍ إلى `sunnah.one` إلى غيرها وهو يظنّ نفسه في التطبيق، ثمّ لا
 * يجد زرَّ رجوعٍ يُخرجه.
 */
export function SiteWebView({ url, origin }: { url: string; origin: string }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  /** تغييره يُعيد تركيب `WebView` — وهو أضمن من `reload()` بعد عطلٍ. */
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setFailed(false);
    setLoading(true);
    setAttempt((n) => n + 1);
  }, []);

  const shouldStart = useCallback(
    (req: { url: string }) => {
      const target = req.url;
      if (target === 'about:blank') return true;
      if (isSameOrigin(target, origin)) return true;
      if (/^https?:/i.test(target)) {
        void openExternal(target);
      } else {
        // `mailto:` و`tel:` — يتولّاها النظام، وفشلُها لا يُسقط الصفحة.
        void Linking.openURL(target).catch(() => undefined);
      }
      return false;
    },
    [origin]
  );

  if (failed) {
    return (
      <View style={styles.fallback}>
        <ErrorState message={t('pageError')} onRetry={retry} />
      </View>
    );
  }

  return (
    <View style={styles.host}>
      <WebView
        key={attempt}
        source={{ uri: url }}
        originWhitelist={['https://*', 'http://*']}
        onShouldStartLoadWithRequest={shouldStart}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
        onHttpError={({ nativeEvent }) => {
          // ٤٠٤ من الموقع خطأُ صفحةٍ لا خطأ شبكة، لكنّه في كلتا الحالتين
          // شاشةٌ لا تنفع المستخدم — فتُعرض رسالةٌ مكتوبة بدل صفحة الخادم.
          if (nativeEvent.statusCode >= 400) {
            setLoading(false);
            setFailed(true);
          }
        }}
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
        style={styles.web}
      />

      {loading ? (
        <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none">
          <ActivityIndicator size="large" color={colors.navy} />
          <Txt variant="small" color={colors.textMuted}>
            {t('loading')}
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1, backgroundColor: colors.cream },
  web: { flex: 1, backgroundColor: colors.cream },
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.cream,
  },
  fallback: { flex: 1, padding: spacing.lg, backgroundColor: colors.cream },
});
