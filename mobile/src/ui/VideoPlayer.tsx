import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors, radius } from '../theme';
import { resolveVideo } from './videoUrl';

/**
 * مشغّل الدرس (iOS/Android).
 * روابط يوتيوب/فيميو تُعرض بـ WebView، والملفّات المباشرة بـ expo-video.
 * لنسخة الويب ملفّ مستقلّ (`VideoPlayer.web.tsx`) لا يستورد WebView إطلاقًا.
 */
export function VideoPlayer({ url }: { url: string | null | undefined }) {
  const source = resolveVideo(url);
  const fileUri = source?.kind === 'file' ? source.url : null;
  const player = useVideoPlayer(fileUri, (p) => {
    p.loop = false;
  });

  if (!source) return null;

  if (source.kind === 'embed') {
    return (
      <View style={styles.frame}>
        <WebView
          source={{ uri: source.url }}
          style={styles.fill}
          allowsFullscreenVideo
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction
        />
      </View>
    );
  }

  return (
    <View style={styles.frame}>
      <VideoView style={styles.fill} player={player} nativeControls />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: 16 / 9,
    width: '100%',
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.navyDark,
  },
  fill: { flex: 1, backgroundColor: colors.navyDark },
});
