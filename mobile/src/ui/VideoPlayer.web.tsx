import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme';
import { resolveVideo } from './videoUrl';

/**
 * مشغّل الدرس في المتصفّح: عناصر DOM أصليّة.
 * `react-native-webview` لا يعمل على الويب، و`expo-video` لا داعي له هنا.
 */
export function VideoPlayer({ url }: { url: string | null | undefined }) {
  const source = resolveVideo(url);
  if (!source) return null;

  const element =
    source.kind === 'embed'
      ? React.createElement('iframe', {
          src: source.url,
          style: { width: '100%', height: '100%', border: 'none' },
          allow: 'accelerometer; encrypted-media; picture-in-picture; fullscreen',
          allowFullScreen: true,
          title: 'video',
        })
      : React.createElement('video', {
          src: source.url,
          controls: true,
          playsInline: true,
          style: { width: '100%', height: '100%', backgroundColor: colors.navyDark },
        });

  return <View style={styles.frame}>{element}</View>;
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: 16 / 9,
    width: '100%',
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.navyDark,
  },
});
