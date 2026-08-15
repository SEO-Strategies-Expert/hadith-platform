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
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, fontFamily, radius, shadow, spacing, typography } from '../theme';

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
        { fontFamily, color: color ?? colors.text },
        typography[variant],
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
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        { padding: spacing.lg },
        shadow.card as ViewStyle,
        pressed && !disabled ? { opacity: 0.72 } : null,
        disabled ? { opacity: 0.6 } : null,
        style,
      ]}
    >
      {children}
    </Pressable>
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

export type BadgeTone = 'neutral' | 'gold' | 'success' | 'danger' | 'warning';

const badgeTones: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: '#EEF1F6', fg: colors.navy },
  gold: { bg: colors.goldLight, fg: '#6B5115' },
  success: { bg: colors.successBg, fg: colors.success },
  danger: { bg: colors.dangerBg, fg: colors.danger },
  warning: { bg: colors.warningBg, fg: colors.warning },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const c = badgeTones[tone];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Txt variant="tiny" color={c.fg} style={{ fontWeight: '600' }}>
        {label}
      </Txt>
    </View>
  );
}

/* ————— شريط تقدّم ————— */

export function ProgressBar({ pct, label }: { pct: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <View style={{ gap: spacing.xs }}>
      {label ? (
        <Txt variant="tiny" color={colors.textMuted}>
          {label}
        </Txt>
      ) : null}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%` }]} />
      </View>
    </View>
  );
}

/* ————— شاشة ————— */

export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ['top'],
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

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <Row justify="space-between">
      <Txt variant="heading">{title}</Txt>
      {action}
    </Row>
  );
}

/* ————— صفّ بيان ————— */

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <Row justify="space-between" align="flex-start" gap={spacing.lg}>
      <Txt variant="small" color={colors.textMuted}>
        {label}
      </Txt>
      <Txt variant="small" style={{ flexShrink: 1, fontWeight: '600' }}>
        {value}
      </Txt>
    </Row>
  );
}

export function Spinner({ small }: { small?: boolean }) {
  return <ActivityIndicator size={small ? 'small' : 'large'} color={colors.navy} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: '#E9E4D6',
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.gold, borderRadius: radius.pill },
});
