import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  type RefreshControlProps,
  ScrollView,
  StyleSheet,
  Text,
  type TextProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, goldHairline, radius, shadow, spacing, typography } from '../theme';
import { GoldRule, OrnamentRule, ThuluthText } from './gold';

/* ————— نصّ ————— */

type Variant = keyof typeof typography;

export function Txt({
  variant = 'body',
  color,
  align,
  style,
  ...rest
}: TextProps & { variant?: Variant; color?: string; align?: TextStyle['textAlign'] }) {
  return (
    <Text
      {...rest}
      style={[
        typography[variant],
        { color: color ?? colors.text },
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}

/* ————— أسطح ————— */

export function Card({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  padded?: boolean;
}) {
  return (
    <View style={[styles.card, padded && { padding: spacing.lg }, shadow.card as ViewStyle, style]}>
      {children}
    </View>
  );
}

export function PressableCard({
  children,
  onPress,
  style,
  disabled,
  padded = true,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
  padded?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        padded ? { padding: spacing.lg } : null,
        shadow.card as ViewStyle,
        pressed && !disabled ? { opacity: 0.78, transform: [{ scale: 0.995 }] } : null,
        disabled ? { opacity: 0.6 } : null,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

/**
 * لوحٌ كحليّ مزخرف — قاعدة الأقسام الاحتفاليّة (النبذة، الإحصاءات،
 * دعوة الدخول). التدرّج والحدّ الذهبيّ منقولان عن أشرطة الموقع.
 */
export function NavyPanel({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}) {
  return (
    <LinearGradient
      colors={[colors.navyMid, colors.navyDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[
        styles.navyPanel,
        padded ? { padding: spacing.xl } : null,
        shadow.raised as ViewStyle,
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}

export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[{ height: 1, backgroundColor: colors.border }, style]} />;
}

export function Row({
  children,
  gap = spacing.sm,
  align = 'center',
  justify,
  wrap,
  style,
}: {
  children: React.ReactNode;
  gap?: number;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  wrap?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: align,
          justifyContent: justify,
          gap,
          flexWrap: wrap ? 'wrap' : 'nowrap',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* ————— وسوم ————— */

export type BadgeTone = 'neutral' | 'gold' | 'goldSolid' | 'success' | 'danger' | 'warning';

const badgeTones: Record<BadgeTone, { bg: string; fg: string; border: string }> = {
  neutral: { bg: '#EEF1F6', fg: colors.navy, border: '#DDE3EC' },
  gold: { bg: colors.goldLight, fg: '#6B5115', border: colors.gold },
  /** ذهبيّ صريح — للشارات فوق الصور والأسطح الكحليّة. */
  goldSolid: { bg: colors.gold, fg: colors.navyDeep, border: colors.goldHi },
  success: { bg: colors.successBg, fg: colors.success, border: '#CBE6D8' },
  danger: { bg: colors.dangerBg, fg: colors.danger, border: '#E7D6D6' },
  warning: { bg: colors.warningBg, fg: colors.warning, border: '#EADCC0' },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const c = badgeTones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Txt variant="tinyStrong" color={c.fg}>
        {label}
      </Txt>
    </View>
  );
}

/** نقطةٌ نابضة تسبق شارة «يُبثّ الآن». */
export function LivePulse({ color = colors.navyDeep }: { color?: string }) {
  return (
    <View style={styles.pulseHost}>
      <View style={[styles.pulseHalo, { backgroundColor: color }]} />
      <View style={[styles.pulseCore, { backgroundColor: color }]} />
    </View>
  );
}

/* ————— شريط تقدّم ————— */

export function ProgressBar({ pct, label }: { pct: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <View style={{ gap: spacing.xs }}>
      {label ? (
        <Txt variant="tinyStrong" color={colors.textMuted}>
          {label}
        </Txt>
      ) : null}
      <View style={styles.track}>
        <LinearGradient
          colors={[colors.goldDark, colors.gold, colors.goldHi]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${clamped}%` }]}
        />
      </View>
    </View>
  );
}

/* ————— شاشة ————— */

export function Screen({
  children,
  scroll = true,
  padded = true,
  /**
   * لا حافّة علويّة افتراضًا: `BrandHeader` يعلو كلّ شاشة وهو من يبتلع
   * `insets.top`. لو أُضيفت هنا أيضًا لتضاعف هامش شريط الحالة.
   */
  edges = [],
  refreshControl,
  contentStyle,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: readonly Edge[];
  refreshControl?: React.ReactElement<RefreshControlProps>;
  contentStyle?: ViewStyle;
}) {
  const inner = padded ? { padding: spacing.lg, gap: spacing.lg } : undefined;
  if (!scroll) {
    return (
      <SafeAreaView style={styles.screen} edges={edges}>
        <View style={[{ flex: 1 }, inner, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      <ScrollView
        contentContainerStyle={[{ paddingBottom: spacing.xxl }, inner, contentStyle]}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * عنوان قسم بخطّ الثلث فوق خلفيّةٍ كريميّة، ويعلوه فاصلٌ ذهبيّ رفيع
 * كما في أقسام الموقع.
 */
export function SectionTitle({
  title,
  action,
  ornate = true,
}: {
  title: string;
  action?: React.ReactNode;
  ornate?: boolean;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Row justify="space-between" align="flex-end" gap={spacing.md}>
        <View style={{ flexShrink: 1 }}>
          <ThuluthText variant="ceremonial" color={colors.navy} numberOfLines={2}>
            {title}
          </ThuluthText>
        </View>
        {action}
      </Row>
      {ornate ? <GoldRule height={2} style={{ width: 88 }} /> : null}
    </View>
  );
}

/** عنوان قسمٍ فوق سطحٍ كحليّ — بتدرّجٍ ذهبيّ وزخرفة تحته. */
export function SectionTitleOnNavy({ title }: { title: string }) {
  return (
    <View style={{ gap: spacing.xs, alignItems: 'center' }}>
      <ThuluthText variant="ceremonial" color={colors.goldLight} align="center">
        {title}
      </ThuluthText>
      <OrnamentRule />
    </View>
  );
}

/* ————— صفّ بيان ————— */

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Row justify="space-between" align="flex-start" gap={spacing.lg}>
      <Txt variant="small" color={colors.textMuted}>
        {label}
      </Txt>
      <Txt variant="smallStrong" style={{ flexShrink: 1 }}>
        {value}
      </Txt>
    </Row>
  );
}

export function Spinner({ small, gold }: { small?: boolean; gold?: boolean }) {
  return <ActivityIndicator size={small ? 'small' : 'large'} color={gold ? colors.gold : colors.navy} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  navyPanel: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: goldHairline,
    overflow: 'hidden',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pulseHost: { width: 10, height: 10, alignItems: 'center', justifyContent: 'center' },
  pulseHalo: { position: 'absolute', width: 10, height: 10, borderRadius: 5, opacity: 0.3 },
  pulseCore: { width: 5, height: 5, borderRadius: 3 },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.cream200,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
});
