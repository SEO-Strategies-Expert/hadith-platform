import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { Txt } from './kit';

type Kind = 'primary' | 'secondary' | 'ghost' | 'danger';

const kinds: Record<Kind, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.navy, fg: colors.textOnNavy, border: colors.navy },
  secondary: { bg: colors.goldLight, fg: '#5F4712', border: colors.gold },
  ghost: { bg: 'transparent', fg: colors.navy, border: colors.borderStrong },
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
  const c = kinds[kind];
  const isOff = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isOff, busy: !!loading }}
      onPress={onPress}
      disabled={isOff}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: c.bg,
          borderColor: c.border,
          paddingVertical: small ? spacing.sm : spacing.md + 2,
          paddingHorizontal: small ? spacing.md : spacing.lg,
        },
        pressed && !isOff ? { opacity: 0.78 } : null,
        isOff ? { opacity: 0.55 } : null,
        style,
      ]}
    >
      <View style={styles.inner}>
        {loading ? <ActivityIndicator size="small" color={c.fg} /> : null}
        <Txt
          variant={small ? 'small' : 'body'}
          color={c.fg}
          style={{ fontWeight: '700', lineHeight: typography.body.lineHeight }}
        >
          {label}
        </Txt>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
