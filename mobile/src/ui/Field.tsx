import React from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';
import { colors, fontFamily, radius, spacing, typography } from '../theme';
import { Txt } from './kit';

export function Field({
  label,
  hint,
  multiline,
  style,
  ...rest
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Txt variant="small" color={colors.textMuted} style={{ fontWeight: '600' }}>
        {label}
      </Txt>
      <TextInput
        {...rest}
        multiline={multiline}
        placeholderTextColor="#9AA6B6"
        style={[styles.input, multiline ? styles.multiline : null, style]}
      />
      {hint ? (
        <Txt variant="tiny" color={colors.textMuted}>
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    fontFamily,
    fontSize: typography.body.fontSize,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  multiline: { minHeight: 140, textAlignVertical: 'top' },
});
