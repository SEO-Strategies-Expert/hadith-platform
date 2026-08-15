import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../theme';
import { OrnamentRule } from './gold';
import { Spinner } from './kit';

/**
 * شاشة الإقلاع داخل التطبيق — تُعرض ريثما تُحمَّل الخطوط وتُقرأ
 * الرموز المحفوظة، فتصل شاشةَ النظام بالتطبيق بلا وميضٍ أبيض بينهما.
 * الشعار محزوم محلّيًّا لا من الشبكة: هذه اللحظة تسبق أوّل طلب.
 *
 * لا نستعمل هنا خطّ الثلث: قد لا يكون قد حُمِّل بعد.
 */
export function BrandSplash() {
  return (
    <LinearGradient
      colors={[colors.navyMid, colors.navyDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.host}
    >
      <View style={styles.logoRing}>
        <Image
          source={require('../../assets/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
      <OrnamentRule />
      <Spinner gold />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },
  logoRing: {
    width: 148,
    height: 148,
    borderRadius: 74,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217,174,75,0.35)',
    backgroundColor: 'rgba(217,174,75,0.06)',
  },
  logo: { width: 108, height: 108 },
});
