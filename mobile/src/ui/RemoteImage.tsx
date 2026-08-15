import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View, type ImageResizeMode, type ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

/**
 * كل صور التطبيق تأتي من الشبكة، وقد تتأخّر أو تُخفق. هذا الغلاف
 * يضمن ثلاثة أمور لا يضمنها `<Image>` وحده:
 *  ١) لونٌ مؤقّت في مكان الصورة بدل ومضةٍ بيضاء،
 *  ٢) مؤشّر تحميل صريح،
 *  ٣) `resizeMode` مضبوط دائمًا فلا تتشوّه النسب.
 */
export function RemoteImage({
  uri,
  height,
  width,
  rounded = radius.md,
  resizeMode = 'cover',
  dim,
  style,
  children,
}: {
  uri: string | null;
  height: number | `${number}%`;
  width?: number | `${number}%`;
  rounded?: number;
  resizeMode?: ImageResizeMode;
  /** طبقة كحليّة رقيقة فوق الصورة — تُستعمل حين يعلوها نصّ. */
  dim?: number;
  style?: ViewStyle;
  children?: React.ReactNode;
}) {
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>(uri ? 'loading' : 'failed');

  return (
    <View
      style={[
        {
          height,
          width: width ?? '100%',
          borderRadius: rounded,
          overflow: 'hidden',
          backgroundColor: colors.navyMid,
        },
        style,
      ]}
    >
      {uri && state !== 'failed' ? (
        <Image
          source={{ uri }}
          resizeMode={resizeMode}
          style={StyleSheet.absoluteFill}
          onLoad={() => setState('ready')}
          onError={() => setState('failed')}
          accessibilityIgnoresInvertColors
        />
      ) : null}

      {state === 'loading' ? (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <ActivityIndicator size="small" color={colors.gold} />
        </View>
      ) : null}

      {/* بديلٌ مزخرف حين تُخفق الصورة: لا مربّع رماديّ ميّت. */}
      {state === 'failed' ? (
        <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: colors.navyMid }]}>
          <View style={styles.diamond} />
        </View>
      ) : null}

      {dim ? (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(7,22,48,${dim})` }]}
          pointerEvents="none"
        />
      ) : null}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  diamond: {
    width: 26,
    height: 26,
    borderWidth: 1.2,
    borderColor: colors.gold,
    opacity: 0.5,
    transform: [{ rotate: '45deg' }],
  },
});
