import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { PageBlock, PageContent } from '../api/types';
import { getPage } from '../api/endpoints';
import { toArabicDigits, useI18n } from '../i18n';
import { colors, goldHairline, navyScrim, radius, shadow, spacing, typography } from '../theme';
import { GoldTitle, GoldRule, OrnamentRule, ThuluthText } from './gold';
import { Txt } from './kit';
import { RemoteImage } from './RemoteImage';
import { EmptyState, ErrorState, LoadingState, useQuery } from './states';

/**
 * متن صفحةٍ محتوائيّة مرسومًا **أصيلًا** — لا إطار ويب ولا رابطٌ يخرج
 * إلى الموقع.
 *
 * الخادم يفكّ `bodyHtml` المحرَّر في اللوحة إلى كتلٍ بسيطة
 * (`/api/v1/pages/{slug}`)، وهذا الملفّ يرسم كلّ نوعٍ منها بخطوط الكلّية
 * وألوانها: العناوين بخطّ الثلث وتحتها الفاصل الذهبيّ، والفقرات بمقاسٍ
 * ومسافةِ أسطرٍ تحتمل العربيّة الطويلة، والقوائم بنقاطٍ ذهبيّة، والصور
 * بـ`RemoteImage`، والاقتباسات في لوحٍ كحليّ.
 *
 * فما يعدّله المدير في اللوحة يظهر في الموقع والتطبيق معًا — نصٌّ واحد
 * لا نسختان — ويبقى القارئ داخل التطبيق من أوّله إلى آخره.
 */

/* ————————————— أدوات النصّ ————————————— */

/** أرقام هنديّة في العربيّة، اتّساقًا مع بقيّة الواجهة وموقع الكلّية. */
function useDigits() {
  const { lang } = useI18n();
  return React.useCallback((s: string) => (lang === 'ar' ? toArabicDigits(s) : s), [lang]);
}

/**
 * المتن المُرحَّل يكرّر عنوان الهيرو ونصَّه وصورته داخل `#main` أيضًا،
 * فلو رُسم الاثنان لظهر العنوان مرّتين متتاليتين. تُسقَط هنا الكتلةُ التي
 * تُطابق ما رُسم في الهيرو فعلًا — مطابقةً نصّيّة لا تخمينًا.
 */
function usefulBlocks(page: PageContent): PageBlock[] {
  const skip = new Set(
    [page.heroTitle, page.heroIntro].filter((s): s is string => !!s).map((s) => s.trim())
  );
  const out: PageBlock[] = [];
  for (const block of page.blocks) {
    if (block.type === 'image') {
      if (page.heroImage && block.url === page.heroImage) continue;
      out.push(block);
      continue;
    }
    if (block.type === 'list') {
      if (block.items.length > 0) out.push(block);
      continue;
    }
    if (skip.has(block.text.trim())) continue;
    out.push(block);
  }
  return out;
}

/* ————————————— الكتل ————————————— */

/** عنوان قسم — ثلثٌ كحليّ وتحته الفاصل الذهبيّ، كعناوين أقسام التطبيق. */
function Heading({ text, level }: { text: string; level: 2 | 3 }) {
  if (level === 3) {
    return (
      <View style={styles.headingHost}>
        <Txt variant="title" color={colors.navyMid}>
          {text}
        </Txt>
        <GoldRule height={1.5} style={{ width: 48 }} />
      </View>
    );
  }
  return (
    <View style={styles.headingHost}>
      <ThuluthText variant="ceremonial" color={colors.navy}>
        {text}
      </ThuluthText>
      <GoldRule height={2} style={{ width: 88 }} />
    </View>
  );
}

/**
 * فقرة. المقاس أكبر من `typography.body` ومسافةُ الأسطر أوسع: هذه صفحاتُ
 * قراءةٍ متّصلة لا بطاقاتٌ مقتضبة، والعربيّة المشكَّلة تحتاج فسحةً رأسيّة.
 */
function Paragraph({ text }: { text: string }) {
  return <Txt style={styles.paragraph}>{text}</Txt>;
}

/** قائمة بنقاطٍ ذهبيّة — معيَّنٌ صغير كنقاط الموقع. */
function BulletList({ items }: { items: string[] }) {
  return (
    <View style={styles.list}>
      {items.map((item, i) => (
        <View key={`${i}-${item.slice(0, 24)}`} style={styles.listRow}>
          <View style={styles.bullet} />
          <Txt style={[styles.paragraph, styles.listText]}>{item}</Txt>
        </View>
      ))}
    </View>
  );
}

function BlockImage({ url, alt }: { url: string; alt?: string }) {
  const { width } = useWindowDimensions();
  // نسبةٌ عريضة معتدلة، بسقفٍ يمنع ابتلاع الشاشة على الأجهزة الكبيرة.
  const height = Math.round(Math.min(Math.max(width - spacing.lg * 2, 220), 560) * 0.62);
  return (
    <View style={styles.imageHost}>
      {/* الحدّ ونصف القطر كبقيّة بطاقات التطبيق. */}
      <View style={styles.imageFrame}>
        <RemoteImage uri={url} height={height} rounded={radius.lg - 1} resizeMode="cover" />
      </View>
      {alt ? (
        <Txt variant="tiny" color={colors.textMuted}>
          {alt}
        </Txt>
      ) : null}
    </View>
  );
}

/** اقتباس — لوحٌ كحليّ بحدٍّ ذهبيّ ونصٍّ كريميّ. */
function Quote({ text }: { text: string }) {
  return (
    <LinearGradient
      colors={[colors.navyMid, colors.navyDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.quote, shadow.card as object]}
    >
      {/* لا أيقونةَ اقتباسٍ في `Ionicons`، والفاصل الذهبيّ يؤدّي المعنى. */}
      <GoldRule height={2} style={{ width: 56 }} />
      <Txt style={styles.quoteText} color={colors.cream100}>
        {text}
      </Txt>
    </LinearGradient>
  );
}

/* ————————————— الهيرو ————————————— */

/**
 * رأس الصفحة — على طراز `Hero` في الرئيسة: صورةٌ يعلوها تدرّجٌ كحليّ،
 * فالعنوان بخطّ الثلث مذهَّبًا، ففاصلٌ زخرفيّ، فالمقدّمة.
 * وإن لم تكن للصفحة صورة، بقي اللوح الكحليّ وحده — لا فراغ.
 */
function PageHero({
  title,
  intro,
  image,
}: {
  title: string;
  intro: string | null;
  image: string | null;
}) {
  const { height: screenHeight } = useWindowDimensions();
  const minHeight = image ? Math.max(240, Math.min(360, Math.round(screenHeight * 0.4))) : 0;

  const body = (
    <LinearGradient
      colors={[...navyScrim.colors]}
      locations={[...navyScrim.locations]}
      style={[styles.heroScrim, minHeight ? { minHeight } : null]}
    >
      <GoldTitle variant="ceremonial" align="center">
        {title}
      </GoldTitle>
      <OrnamentRule width={220} />
      {intro ? (
        <Txt variant="small" color={colors.cream100} align="center" style={{ opacity: 0.94 }}>
          {intro}
        </Txt>
      ) : null}
    </LinearGradient>
  );

  return (
    <View style={[styles.heroHost, shadow.raised as object]}>
      {image ? (
        <View style={StyleSheet.absoluteFill}>
          <RemoteImage uri={image} height="100%" rounded={0} resizeMode="cover" />
        </View>
      ) : null}
      {body}
    </View>
  );
}

/* ————————————— المتن ————————————— */

export function PageBody({ page }: { page: PageContent }) {
  const digits = useDigits();
  const blocks = useMemo(() => usefulBlocks(page), [page]);

  return (
    <View style={styles.body}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case 'heading':
            return <Heading key={key} text={digits(block.text)} level={block.level} />;
          case 'paragraph':
            return <Paragraph key={key} text={digits(block.text)} />;
          case 'list':
            return <BulletList key={key} items={block.items.map(digits)} />;
          case 'image':
            return <BlockImage key={key} url={block.url} alt={block.alt} />;
          case 'quote':
            return <Quote key={key} text={digits(block.text)} />;
        }
      })}
    </View>
  );
}

/* ————————————— الشاشة الكاملة ————————————— */

/**
 * صفحةٌ كاملة بحالاتها: تحميل، وخطأٌ بزرّ إعادة محاولة، وفراغٌ مكتوب.
 * `onTitle` يُبلَّغ بعنوان الصفحة حين يصل ليُضبط عنوان الترويسة.
 */
export function SitePageView({
  slug,
  hero = true,
  onTitle,
}: {
  slug: string;
  hero?: boolean;
  onTitle?: (title: string) => void;
}) {
  const { t, lang } = useI18n();
  const digits = useDigits();
  const query = useQuery<PageContent>(() => getPage(slug, lang), [slug, lang]);

  const title = query.data?.title;
  React.useEffect(() => {
    if (title) onTitle?.(title);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const data = query.data;

  /*
    الحالات الثلاث تُلفّ بهامشٍ أفقيّ لأنّ الشاشة بلا حشوٍ عام: الهيرو
    يمتدّ من حافّةٍ إلى حافّة، فلو تُركت بطاقةُ الخطأ بلا لفافةٍ لالتصقت
    بحافّتَي الجهاز.
  */
  if (!data) {
    return (
      <View style={styles.gutter}>
        {query.error ? (
          <ErrorState message={query.error} onRetry={query.reload} />
        ) : (
          <LoadingState />
        )}
      </View>
    );
  }

  if (data.blocks.length === 0 && !data.heroIntro) {
    return (
      <View style={styles.gutter}>
        <EmptyState text={t('pageEmpty')} icon="document-text-outline" />
      </View>
    );
  }

  return (
    <>
      {/* خطأٌ أثناء تحديثٍ ومعنا محتوًى سابق: يُنبَّه فوقه ولا يُمحى. */}
      {query.error ? (
        <View style={styles.gutter}>
          <ErrorState message={query.error} onRetry={query.reload} />
        </View>
      ) : null}

      {hero && (data.heroTitle || data.heroImage) ? (
        <PageHero
          title={digits(data.heroTitle || data.title)}
          intro={data.heroIntro ? digits(data.heroIntro) : null}
          image={data.heroImage}
        />
      ) : null}

      <View style={styles.gutter}>
        <PageBody page={data} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg },
  gutter: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },

  headingHost: { gap: spacing.sm, marginTop: spacing.sm },

  /**
   * مقاسٌ ومسافةُ أسطرٍ للقراءة المتّصلة — أوسع من `typography.body`.
   * لا `textAlign` صريح: الاتّجاه يتولّاه النظام فلا ينقلب مع RTL.
   */
  paragraph: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 32,
    color: colors.text,
  },

  list: { gap: spacing.md, marginTop: spacing.xs },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  listText: { flex: 1, minWidth: 0 },
  bullet: {
    width: 8,
    height: 8,
    marginTop: 12,
    backgroundColor: colors.gold,
    transform: [{ rotate: '45deg' }],
  },

  imageHost: { gap: spacing.sm, marginVertical: spacing.xs },
  imageFrame: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },

  quote: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: goldHairline,
    padding: spacing.xl,
    gap: spacing.sm,
    // لا `borderLeft/Right`: الحدّ المنطقيّ وحده يصمد مع قلب الاتّجاه.
    borderStartWidth: 3,
    borderStartColor: colors.gold,
  },
  quoteText: { ...typography.body, fontSize: 16, lineHeight: 32 },

  heroHost: { overflow: 'hidden', backgroundColor: colors.navyDeep },
  heroScrim: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
});
