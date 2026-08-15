import React from 'react';
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, goldHairline, heroScrim, radius, shadow, spacing } from '../theme';
import { GoldTitle, OrnamentWing } from './gold';
import { RemoteImage } from './RemoteImage';
import { Txt } from './kit';
import { LOGO_URL } from './assets';

/**
 * الهيرو — نظير رأس الصفحة الرئيسة في الموقع: صورةٌ عريضة من
 * `slide-*.jpg` يعلوها تدرّجٌ كحليّ، ثمّ اسم الكلّية بخطّ الثلث مذهَّبًا،
 * فشارة الكلّية بين جناحَي زخرفة، فعبارة الرؤية، فالإجراءان.
 *
 * الصورة الواحدة تكفي: الشاشة الواحدة لا تُحمَّل عليها صورٌ كثيرة.
 *
 * ملاحظةٌ على الشريحة المختارة: `slide-1` وحدها صورةٌ فوتوغرافيّة؛
 * الشرائح ٢ و٣ و٤ تحمل خرطوشةً كحليّة بخطّ ثلثٍ كبير تشغل نصف الكادر،
 * فلو وُضعت هنا لازدوج نصُّها المطبوع مع العنوان المكتوب فوقها. ولمّا
 * كان الشيخ في `slide-1` جالسًا في وسط الكادر الأعلى، رُفعت كلّ عناصر
 * الهيرو إلى النصف الأسفل واشتدّ التدرّج هناك — فلا شيء يعلو وجهه.
 */
/**
 * نسبة رفع الصورة فوق حدّ الإطار — تُخفي شريط العنوان المطبوع في أعلى
 * الشريحة (وهو نحو ١٢٪ من ارتفاعها) فلا يزدوج الاسم. نسبةٌ لا رقمٌ ثابت:
 * `cover` يُقيس الصورة بارتفاع الإطار، فالرفع الثابت يقتصّ الوجه على
 * الشاشات القصيرة ويُبقي الشريط على الطويلة.
 */
const LIFT_RATIO = 0.16;

export function Hero({
  image,
  title,
  vision,
  actions,
}: {
  image: string;
  title: string;
  vision: string;
  actions?: React.ReactNode;
}) {
  const { height: screenHeight } = useWindowDimensions();
  // الصورة تملأ الخلف، والمحتوى هو من يُملي الارتفاع — فلا يُضغط النصّ
  // ولا يُقتصّ إن طال العنوان أو كبر خطّ النظام.
  const minHeight = Math.max(380, Math.min(540, Math.round(screenHeight * 0.64)));
  const lift = Math.round(minHeight * LIFT_RATIO);

  return (
    <View style={[styles.host, shadow.deep as object]}>
      <View style={[StyleSheet.absoluteFill, { top: -lift }]}>
        <RemoteImage uri={image} height="100%" rounded={0} resizeMode="cover" />
      </View>

      <LinearGradient
        colors={[...heroScrim.colors]}
        locations={[...heroScrim.locations]}
        style={[styles.scrim, { minHeight }]}
      >
        <GoldTitle variant="hero" align="center">
          {title}
        </GoldTitle>

        {/*
          الشارة نزلت من فوق الصورة إلى هنا: تحت الاسم، بين جناحَي الفاصل
          الزخرفيّ، حيث التدرّج شبه معتم — فهي تُرى ولا تحجب أحدًا.
        */}
        <View style={styles.crest}>
          <OrnamentWing width={78} />
          <Image
            source={{ uri: LOGO_URL }}
            style={styles.logo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <OrnamentWing width={78} flip />
        </View>

        <Txt variant="small" color={colors.cream100} align="center" style={{ opacity: 0.94 }}>
          {vision}
        </Txt>

        {actions ? <View style={styles.actions}>{actions}</View> : null}
      </LinearGradient>
    </View>
  );
}

/**
 * شريط الإحصاءات — نظير `.facts-band`: أرقامٌ بخطّ الثلث العريض
 * وتسميّاتٌ تحتها، على خلفيّةٍ كحليّة بحدٍّ ذهبيّ.
 */
export function StatsBand({ items }: { items: { value: string; label: string }[] }) {
  return (
    <LinearGradient
      colors={[colors.navyDeep, colors.navyMid]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.band}
    >
      {items.map((item, index) => (
        <View key={item.label} style={[styles.stat, index > 0 ? styles.statDivider : null]}>
          <GoldTitle variant="numeral" align="center">
            {item.value}
          </GoldTitle>
          <View style={styles.statUnderline} />
          <Txt variant="tinyStrong" color={colors.textOnNavyMuted} align="center">
            {item.label}
          </Txt>
        </View>
      ))}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  host: { overflow: 'hidden', backgroundColor: colors.navyDeep },
  scrim: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    // مساحةٌ فوق المحتوى تُبقي نصف الصورة الأعلى — ووجه الشيخ فيه — صافيًا.
    paddingTop: spacing.xxl * 4,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  crest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  logo: { width: 40, height: 40 },
  actions: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.md },

  band: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: goldHairline,
    overflow: 'hidden',
    paddingVertical: spacing.lg,
  },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xs, gap: 2 },
  statDivider: { borderStartWidth: 1, borderStartColor: 'rgba(217,174,75,0.18)' },
  statUnderline: {
    width: 26,
    height: 1,
    backgroundColor: colors.gold,
    opacity: 0.55,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
});
