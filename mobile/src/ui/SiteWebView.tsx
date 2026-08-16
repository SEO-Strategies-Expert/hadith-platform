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
/* ————————————— تعرية الصفحة من إطار الموقع ————————————— */

/**
 * صفحة الموقع تُقدَّم للمتصفّح **كاملة**: رابط تخطٍّ، وهيدرٌ لاصق فيه
 * شريطُ المنصّات ولوحُ البحث وشريطُ الأقسام، وشريطٌ إخباريّ متحرّك،
 * وفوترٌ، وزرُّ عودةٍ عائم. وعرضُها كما هي داخل تطبيقٍ له ترويسته يُنتج
 * **ترويستين وفوترًا ملزوقًا** — وهو ما رآه العميل ووصفه بالنسخ واللصق.
 *
 * المحدِّدات ليست تخمينًا؛ هذه مواضعها في الموقع:
 *  · `.skip-link`  — `public/assets/css/style.css:74`، ومصدرها
 *                    `src/app/(site)/layout.tsx` (`<a className="skip-link">`).
 *  · `.site-head`  — `style.css:150`، وتحتها `.navbar` (١٥٣)
 *                    و`.search-panel` (٢١٤) و`.menubar` (٢٢٣).
 *  · `.ticker`     — `style.css:302`، وهو **شقيقٌ** للهيدر لا ابنٌ له
 *                    (`<Ticker/>` بعد `<SiteHeader/>` في التخطيط).
 *  · `.site-foot`  — `style.css:640` (`<footer className="site-foot orn-navy">`).
 *  · `.to-top`     — `style.css:661`، زرٌّ `position:fixed` معرّفه `#toTop`.
 * وقد تحقّقتُ من الشجرة حيًّا على `http://localhost:3000/programs.html`:
 * أبناء `<body>` هم `a.skip-link` ثمّ `header.site-head` ثمّ `div.ticker`
 * ثمّ `main#main` ثمّ `footer.site-foot` ثمّ `button#toTop`.
 *
 * وما عدا ذلك **يبقى**: `#main` بكلّ ما فيه من نصٍّ وصورٍ وجداول. الهدف
 * نزع الإطار لا المضمون.
 *
 * أمّا الهوامش فتُقلَّص لا تُلغى: الهيدر `sticky` لا `fixed` فلا هامشَ
 * يُعوَّض، لكنّ `.page-hero` مبنيٌّ على شاشة حاسوبٍ (`min-height:520px`
 * و`padding-block:78px 66px` في `inner-pages.css`) وكان يفترض هيدرًا
 * فوقه؛ فبعد رفعه يصير البياضُ فوق العنوان بلا معنى. و`.breadcrumbs`
 * كانت `position:absolute` داخله فتُعاد إلى مجرى النصّ لئلّا تركب العنوان
 * بعد أن قصُر الهيرو.
 *
 * النسخة الإنجليزيّة `/en/...` تستعمل الأصناف نفسها — `en.css` يبدّل
 * الخطوط والاتّجاه لا أسماء الأصناف — فالتنظيفة واحدة للّغتين.
 */
const CHROME_CSS = `
.skip-link,.site-head,.ticker,.site-foot,.to-top{display:none!important}
html,body{background:#FCFBF8!important}
body{margin-top:0!important;padding-top:0!important}
#main>*:first-child{margin-top:0!important}
.page-hero{min-height:0!important}
.page-hero>.container{padding-block:34px 30px!important}
.breadcrumbs{position:static!important;inset:auto!important;margin:0 0 12px!important}
.inner-section{padding-block:46px!important}
.inner-section.compact{padding-block:32px!important}
.section{padding-block:48px!important}
`;

/**
 * الحقن **قبل أوّل رسم** قدر ما تسمح المنصّة: هيدرٌ يومض ثمّ يختفي أسوأ
 * من هيدرٍ باقٍ، لأنّ الوميض عطبٌ ظاهر لا خيارُ تصميم.
 *
 * ولذلك ثلاث احتياطات في نصٍّ واحد:
 *  ١) يُعلَّق النمط على `document.head` إن وُجد، وإلّا على
 *     `document.documentElement` — فعند بدء المستند قد لا يكون الرأس
 *     أُنشئ بعد، ومحاولةُ `head.appendChild` وحدها تسقط صامتة.
 *  ٢) فإن لم يوجد جذرٌ أصلًا، يُعاد المحاولة على فتراتٍ قصيرة بسقفٍ
 *     ينتهي إليه، فلا مؤقّتٌ يدور إلى الأبد.
 *  ٣) ويُعاد التعليق عند `DOMContentLoaded` و`load` وفي الحقن التالي
 *     للتحميل — والعمليّة **متكافئة**: وجودُ العنصر بمعرّفه يمنع تكراره.
 *
 * و`true;` في آخر النصّ لازمة: `react-native-webview` تُحذّر على iOS من
 * محقونٍ لا يُرجع قيمةً أخيرة.
 */
const CHROME_JS = `
(function () {
  var ID = '__app_chrome__';
  var CSS = ${JSON.stringify(CHROME_CSS)};
  function install() {
    try {
      if (typeof document === 'undefined') return false;
      if (document.getElementById(ID)) return true;
      var root = document.head || document.documentElement;
      if (!root) return false;
      var el = document.createElement('style');
      el.id = ID;
      el.appendChild(document.createTextNode(CSS));
      root.appendChild(el);
      return true;
    } catch (e) {
      return false;
    }
  }
  if (!install()) {
    var tries = 0;
    var timer = setInterval(function () {
      if (install() || ++tries > 120) clearInterval(timer);
    }, 8);
  }
  try {
    document.addEventListener('DOMContentLoaded', install);
    window.addEventListener('load', install);
  } catch (e) {}
})();
true;
`;

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
        /*
          الاثنان معًا لا أحدهما: الأوّل يسبق محتوى الصفحة فيمنع الوميض،
          والثاني يلحق التحميل فيُمسك الحالات التي يُستبدل فيها الرأس أو
          يتأخّر فيها تنفيذ الأوّل (أندرويد يُنفّذه عند `onPageStarted`
          لا عند بناء المستند). والنصّ متكافئٌ فتكراره بلا أثر.
        */
        injectedJavaScriptBeforeContentLoaded={CHROME_JS}
        injectedJavaScript={CHROME_JS}
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
