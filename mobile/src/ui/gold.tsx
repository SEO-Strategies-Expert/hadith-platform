import React from 'react';
import { Platform, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { colors, goldGradient, typography } from '../theme';

type CeremonialVariant = 'hero' | 'ceremonial' | 'numeral';

/**
 * تدرّج `.gold-text` نفسه كما في الموقع، مكتوبًا بصيغة CSS.
 * نسخة الويب من `MaskedView` لا تقصّ شيئًا — تُسقط الأبناء وتُبقي
 * عنصر القناع كما هو — فالويب يأخذ `background-clip:text` مباشرةً،
 * وهو ما يفعله الموقع أصلًا.
 */
const webGoldStyle = (() => {
  if (Platform.OS !== 'web') return null;
  const stops = goldGradient.colors
    .map((c, i) => `${c} ${Math.round((goldGradient.locations[i] ?? 0) * 100)}%`)
    .join(', ');
  return {
    backgroundImage: `linear-gradient(177deg, ${stops})`,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
    filter: 'drop-shadow(0 1px 0 rgba(0,0,0,.35))',
  } as unknown as TextStyle;
})();

/**
 * عنوانٌ احتفاليّ بخطّ الثلث وتدرّجٍ ذهبيّ معدني — نظير `.gold-text`
 * في الموقع. على المنصّات الأصليّة يُقصّ التدرّج على شكل الحروف
 * بـ`MaskedView`، وعلى الويب بـ`background-clip`.
 *
 * `lineHeight` واسعٌ في `typography` كي لا يُقتصّ التشكيل — وهي علّة
 * الثلث المعروفة.
 */
export function GoldTitle({
  children,
  variant = 'ceremonial',
  align = 'center',
  style,
  numberOfLines,
}: {
  children: string;
  variant?: CeremonialVariant;
  align?: TextStyle['textAlign'];
  style?: TextStyle;
  numberOfLines?: number;
}) {
  const base = typography[variant];
  const textStyle: TextStyle[] = [base, { textAlign: align }, style ?? {}];

  if (webGoldStyle) {
    return (
      <Text style={[...textStyle, webGoldStyle]} numberOfLines={numberOfLines}>
        {children}
      </Text>
    );
  }

  return (
    <MaskedView
      style={{ alignSelf: 'stretch' }}
      maskElement={
        <View style={styles.maskHost}>
          <Text style={[...textStyle, { color: '#000' }]} numberOfLines={numberOfLines}>
            {children}
          </Text>
        </View>
      }
    >
      {/* نصٌّ شفّاف يحمل التخطيط، والتدرّج يملأ خلفه. */}
      <LinearGradient
        colors={[...goldGradient.colors]}
        locations={[...goldGradient.locations]}
        start={goldGradient.start}
        end={goldGradient.end}
      >
        <Text style={[...textStyle, { opacity: 0 }]} numberOfLines={numberOfLines}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}

/** نصّ ثلثٍ بلونٍ صلب — حيث لا يليق التدرّج (خلفيّة كريميّة مثلًا). */
export function ThuluthText({
  children,
  variant = 'ceremonial',
  color = colors.navy,
  align,
  style,
  numberOfLines,
}: {
  children: string;
  variant?: CeremonialVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  style?: TextStyle;
  numberOfLines?: number;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[typography[variant], { color }, align ? { textAlign: align } : null, style]}
    >
      {children}
    </Text>
  );
}

/** شريطٌ ذهبيّ متدرّج — للفواصل وحواف البطاقات. */
export function GoldRule({ height = 2, style }: { height?: number; style?: ViewStyle }) {
  return (
    <LinearGradient
      colors={['rgba(217,174,75,0)', colors.gold, colors.goldHi, colors.gold, 'rgba(217,174,75,0)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[{ height, borderRadius: height }, style]}
    />
  );
}

/**
 * لون الزخارف: `#C79A31` هو ذهب `.ornament-rule` في الموقع بعينه —
 * أغمق قليلًا من `--gold` كي يُقرأ الخطّ الرفيع على الكريميّ.
 */
const ORNAMENT_GOLD = '#C79A31';
const ornamentColor = (tone: 'gold' | 'navy') => (tone === 'gold' ? ORNAMENT_GOLD : colors.navy);

/**
 * الفاصل الزخرفيّ في الموقع (`.ornament-rule`) — منقولٌ عن مسارات
 * الـSVG نفسها في `style.css` حرفًا بحرف: خطّان بطرفين مدوّرين، حبّتان،
 * ونجمةٌ ثمانيّة مضلَّعة يتوسّطها معيَّن مصمَت.
 *
 * النجمة ثماني الأضلاع لا يمكن رسمها بحدود `View` — المربّعان المُداران
 * يعطيان ثمانيّةً مصمتة لا مضلَّعًا واحدًا مستمرًّا، ولذلك بدت الزخرفة
 * تقريبيّة. `react-native-svg` هي مكتبة الـSVG المعتمدة في Expo،
 * وتُصيّر المسار الأصليّ كما هو على الأصليّ والويب معًا.
 */
export function OrnamentRule({
  tone = 'gold',
  width = 250,
  style,
}: {
  tone?: 'gold' | 'navy';
  /** عرض الفاصل بالنقاط — الموقع يستعمل `min(330px,74%)`. */
  width?: number;
  style?: ViewStyle;
}) {
  const c = ornamentColor(tone);
  const height = Math.round((width * 28) / 340);
  return (
    // عرضٌ مرن بسقف: الحاوية تضيق على الشاشات الصغيرة، و`viewBox` مع
    // `preserveAspectRatio` الافتراضيّ يُصغّر الرسم بدل أن يفيض عنها.
    <View style={[styles.ornHost, { width: '100%', maxWidth: width, height }, style]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 340 28">
        <G stroke={c} fill="none" strokeWidth={1.3}>
          <Path d="M14 14h116" strokeLinecap="round" opacity={0.75} />
          <Path d="M210 14h116" strokeLinecap="round" opacity={0.75} />
          <Path
            d="M170 3.5 176 8l6.5-.5-.5 6.5 4.5 6-4.5 6 .5 6.5-6.5-.5-6 4.5-6-4.5-6.5.5.5-6.5-4.5-6 4.5-6-.5-6.5 6.5.5z"
            opacity={0.9}
          />
        </G>
        <Path d="M170 8.5 175.5 14 170 19.5 164.5 14z" fill={c} opacity={0.85} />
        <Circle cx={140} cy={14} r={2.6} fill={c} />
        <Circle cx={200} cy={14} r={2.6} fill={c} />
      </Svg>
    </View>
  );
}

/**
 * نصف الفاصل — خطٌّ ينتهي بحبّة، يُحفّ به شعارٌ أو رمزٌ في الوسط.
 * مأخوذٌ من نصف `.ornament-rule` نفسه كي يتّسق الطرفان مع الفاصل الكامل.
 */
export function OrnamentWing({
  tone = 'gold',
  width = 92,
  flip = false,
  style,
}: {
  tone?: 'gold' | 'navy';
  width?: number;
  /** يعكس الجناح أفقيًّا ليصلح للطرف المقابل. */
  flip?: boolean;
  style?: ViewStyle;
}) {
  const c = ornamentColor(tone);
  const height = (width * 28) / 130;
  return (
    <View style={[style, flip ? styles.flipX : null]} pointerEvents="none">
      <Svg width={width} height={height} viewBox="0 0 130 28">
        <Path d="M6 14h108" stroke={c} strokeWidth={1.3} strokeLinecap="round" opacity={0.75} fill="none" />
        <Circle cx={124} cy={14} r={2.6} fill={c} />
      </Svg>
    </View>
  );
}

/**
 * زخرفة الزوايا — بلاطة النمط الجيريّ الثماني في الموقع (`.orn-navy`)
 * بمسـاراتها الأصليّة: أربع نجومٍ حول المركز، ومعيَّنان أخفت، وحبّة وسطى.
 */
export function CornerOrnament({ size = 58, style }: { size?: number; style?: ViewStyle }) {
  return (
    <View style={[styles.corner, { width: size, height: size }, style]} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 108 108">
        <G fill="none" stroke={colors.gold} strokeWidth={1.6}>
          <Path d="M54 6 70 22 54 38 38 22z" />
          <Path d="M54 70 70 86 54 102 38 86z" />
          <Path d="M6 54 22 38 38 54 22 70z" />
          <Path d="M102 54 86 38 70 54 86 70z" />
          <Path d="M54 22 70 38 54 54 38 38z" opacity={0.55} />
          <Path d="M54 54 70 70 54 86 38 70z" opacity={0.55} />
          <Circle cx={54} cy={54} r={3} />
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  maskHost: { backgroundColor: 'transparent', alignSelf: 'stretch' },

  ornHost: { alignSelf: 'center' },
  flipX: { transform: [{ scaleX: -1 }] },

  corner: { position: 'absolute', opacity: 0.3 },
});
