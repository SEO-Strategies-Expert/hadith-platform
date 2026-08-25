import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '../theme';
import { Txt } from './kit';

/**
 * الأزرار — نظير `.btn` في الموقع: كبسولاتٌ لا مستطيلات.
 *  · `primary` = `.btn-gold` (تدرّج ذهبيّ معدنيّ ونصٌّ كحليّ).
 *  · `navy` = كحليٌّ صلب، للإجراء الثانوي فوق خلفيّة كريميّة.
 *  · `onNavy` = `.btn-outline`، لأنّه لا يُقرأ إلّا فوق سطحٍ كحليّ.
 */
type Kind = 'primary' | 'navy' | 'secondary' | 'ghost' | 'onNavy' | 'danger';

const GOLD_FACE = ['#FAE7B3', '#F6E2A0', '#E2BC5E', '#B28426', '#F6E2A0'] as const;
const GOLD_STOPS = [0, 0.26, 0.52, 0.78, 1] as const;

const kinds: Record<Exclude<Kind, 'primary'>, { bg: string; fg: string; border: string }> = {
  navy: { bg: colors.navy, fg: colors.goldLight, border: colors.navy },
  secondary: { bg: colors.goldLight, fg: '#5F4712', border: colors.gold },
  ghost: { bg: 'transparent', fg: colors.navy, border: colors.borderStrong },
  onNavy: { bg: 'rgba(255,255,255,0.07)', fg: colors.cream, border: 'rgba(255,255,255,0.28)' },
  danger: { bg: colors.dangerBg, fg: colors.danger, border: '#E2C4C4' },
};

export function Button({
  label,
  onPress,
  kind = 'primary',
  loading,
  disabled,
  small,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: Kind;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
}) {
  const isOff = disabled || loading;
  const pad = {
    paddingVertical: small ? spacing.sm : spacing.md + 2,
    paddingHorizontal: small ? spacing.lg : spacing.xl,
  };

  const face = (fg: string) => (
    <View style={styles.inner}>
      {loading ? <ActivityIndicator size="small" color={fg} /> : null}
      <Txt variant={small ? 'smallStrong' : 'bodyStrong'} color={fg}>
        {label}
      </Txt>
    </View>
  );

  if (kind === 'primary') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!isOff, busy: !!loading }}
        onPress={onPress}
        disabled={isOff}
        style={({ pressed }) => [
          styles.base,
          styles.goldShadow,
          pressed && !isOff ? { opacity: 0.85 } : null,
          isOff ? { opacity: 0.55 } : null,
          style,
        ]}
      >
        <LinearGradient
          colors={[...GOLD_FACE]}
          locations={[...GOLD_STOPS]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.base, styles.fill, pad]}
        >
          {face(colors.navyDeep)}
        </LinearGradient>
      </Pressable>
    );
  }

  const c = kinds[kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isOff, busy: !!loading }}
      onPress={onPress}
      disabled={isOff}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: c.bg, borderColor: c.border, borderWidth: 1.5 },
        pad,
        pressed && !isOff ? { opacity: 0.78 } : null,
        isOff ? { opacity: 0.55 } : null,
        style,
      ]}
    >
      {face(c.fg)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: { width: '100%' },
  goldShadow: {
    shadowColor: colors.gold,
    shadowOpacity: 0.34,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
