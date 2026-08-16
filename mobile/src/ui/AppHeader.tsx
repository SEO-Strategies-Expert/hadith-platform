import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, goldHairline, radius, spacing } from '../theme';
import { useI18n } from '../i18n';
import { useNavMenu } from '../nav/NavMenu';
import { GoldTitle } from './gold';
import { Txt } from './kit';

/**
 * ترويسة التطبيق — نظير `.site-head` في الموقع لا شريطَ نظامٍ عامّ.
 *
 * الموقع (`public/assets/css/style.css`) يبني رأسه من `.menubar`:
 * تدرّجٌ كحليّ `linear-gradient(#102B46, #061A33)`، وحدٌّ سفليّ ذهبيّ
 * صُلب بسماكة ٢ بكسل، وداخله `.brand`: شعارٌ (`.brand-emblem`، ٤٤ بكسل
 * على شاشة الهاتف) ثمّ اسم الكلّية `.brand-name.thuluth.gold-text` —
 * خطّ ثلثٍ بتدرّجٍ ذهبيّ معدني و`line-height:1.9` (أضيق من ٢.٢٥ العامّة
 * كي يسع سطرين في رأسٍ قصير).
 *
 * الشريط الثاني (`.navbar`: أيقونات وروابط) لا يُنقل: بديله في التطبيق
 * شريطُ التبويبات السفليّ. فما يبقى من الرأس هو الهويّة وحدها، ويُزاد
 * عليها في الشاشات الداخليّة سطرُ العنوان وزرّ الرجوع.
 *
 * الترويسة تبتلع هامش شريط الحالة بنفسها (`insets.top`)، ولذلك تُصيَّر
 * الشاشات تحتها بلا حافّة `top` — انظر `Screen` في `kit.tsx`.
 */

/**
 * مقاس اسم الكلّية في الرأس — مطابق لـ`.brand-name` على عرض الهاتف
 * (١٦ بكسل عند ٣٧٥). أمّا ارتفاع السطر فأوسع قليلًا من ١.٩ التي في
 * الموقع: المتصفّح يدع حروف الثلث تفيض عن صندوق السطر، أمّا `Text` في
 * React Native فيقتصّ ما تجاوز `lineHeight` — والتشكيل هو أوّل ما
 * يُقتصّ. وهي العلّة نفسها التي من أجلها وُضع `THULUTH_LINE` في السمة.
 */
const BRAND_SIZE = 15;
const BRAND_LINE = Math.round(BRAND_SIZE * 2.1);

export function BrandHeader({
  title,
  canGoBack,
  onBack,
}: {
  /** عنوان الشاشة — يُعرض في سطرٍ تحت الهويّة. تُترك فارغةً في التبويبات. */
  title?: string;
  canGoBack?: boolean;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  /**
   * قد يكون `null` إن صُيّرت الترويسة خارج `NavMenuProvider` — وعندئذٍ
   * يُطوى الزرّ بدل أن تسقط الشاشة على زرٍّ لا يفتح شيئًا.
   */
  const menu = useNavMenu();

  return (
    <LinearGradient
      colors={[colors.navy, colors.navyDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.host, { paddingTop: insets.top + spacing.sm }]}
    >
      <View style={styles.brandRow}>
        {canGoBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('back')}
            style={({ pressed }) => [styles.backButton, pressed ? { opacity: 0.6 } : null]}
          >
            {/*
              الأيقونات محارفُ خطٍّ لا يقلبها `I18nManager`، فيُنتقى
              الرمز صراحةً: الرجوع في صفحةٍ من اليمين لليسار يشير يمينًا.
              ويُقرأ الاتّجاه من `useI18n` لا من `I18nManager` مباشرةً،
              فالويب يقلب باتّجاه المستند لا بمدير الترجمة.
            */}
            <Ionicons
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={20}
              color={colors.goldLight}
            />
          </Pressable>
        ) : null}

        <Image
          source={require('../../assets/icon.png')}
          style={styles.emblem}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />

        {/* الاسم يأخذ ما بقي من العرض؛ `MaskedView` يحتاج أبًا محدَّد العرض. */}
        <View style={styles.brandCopy}>
          <GoldTitle variant="ceremonial" align="auto" numberOfLines={2} style={styles.brandName}>
            {t('appName')}
          </GoldTitle>
        </View>

        {/*
          زرّ الثلاث شُرَط — نظير `.nav-toggle` في `menubar-end` بالموقع:
          الموقع يطوي قائمته الرئيسة إليه على عرض الهاتف، فهذا موافقةٌ له
          لا زيادةٌ عليه. وموضعه في آخر الصفّ كما هناك: `flexDirection`
          يقلبه `I18nManager` من تلقائه، فيقع في الطرف الصحيح بلا
          `left/right` صريحين.
        */}
        {menu ? (
          <Pressable
            onPress={menu.open}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('menu')}
            style={({ pressed }) => [styles.backButton, pressed ? { opacity: 0.6 } : null]}
          >
            <Ionicons name="menu" size={22} color={colors.goldLight} />
          </Pressable>
        ) : null}
      </View>

      {title ? (
        <View style={styles.titleRow}>
          <Txt variant="smallStrong" color={colors.goldLight} numberOfLines={1}>
            {title}
          </Txt>
        </View>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  host: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    // `.menubar{border-bottom:2px solid var(--gold)}` في الموقع.
    borderBottomWidth: 2,
    borderBottomColor: colors.gold,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  brandCopy: { flex: 1, minWidth: 0 },
  brandName: { fontSize: BRAND_SIZE, lineHeight: BRAND_LINE },
  emblem: { width: 44, height: 44 },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217,174,75,0.12)',
    borderWidth: 1,
    borderColor: goldHairline,
  },
  titleRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: goldHairline,
  },
});
