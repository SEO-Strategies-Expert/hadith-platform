import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../src/auth/AuthContext';
import { useI18n } from '../src/i18n';
import { messageOf } from '../src/api/client';
import { APPLY_URL } from '../src/config';
import { colors, goldHairline, navyScrim, radius, spacing } from '../src/theme';
import { Button } from '../src/ui/Button';
import { Field } from '../src/ui/Field';
import { Card, Txt } from '../src/ui/kit';
import { GoldTitle, OrnamentRule } from '../src/ui/gold';
import { RemoteImage } from '../src/ui/RemoteImage';
import { LOGO_URL, PILLAR_IMAGES } from '../src/ui/assets';
import { ErrorState } from '../src/ui/states';
import { openExternal } from '../src/ui/openLink';

export default function LoginScreen() {
  const { t } = useI18n();
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError(t('loginMissing'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      // بعد الدخول: عودة إلى ما قبل شاشة الدخول، أو إلى الرئيسة.
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        keyboardShouldPersistTaps="handled"
      >
        {/* رأسٌ بصورة الكلّية وشعارها — لا نموذجٌ عارٍ على أبيض. */}
        <View style={styles.head}>
          <View style={StyleSheet.absoluteFill}>
            {/* صورةٌ فوتوغرافيّة بلا نصٍّ مطبوع، فلا تُزاحم عنوان الشاشة. */}
            <RemoteImage uri={PILLAR_IMAGES.library} height="100%" rounded={0} />
          </View>
          <LinearGradient
            colors={[...navyScrim.colors]}
            locations={[...navyScrim.locations]}
            style={styles.headScrim}
          >
            <View style={styles.logoRing}>
              <Image
                source={{ uri: LOGO_URL }}
                style={styles.logo}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </View>
            <GoldTitle variant="ceremonial" align="center">
              {t('loginTitle')}
            </GoldTitle>
            <OrnamentRule />
            <Txt variant="small" color={colors.cream100} align="center">
              {t('loginSubtitle')}
            </Txt>
          </LinearGradient>
        </View>

        <View style={styles.body}>
          {error ? <ErrorState message={error} /> : null}

          <Card style={{ gap: spacing.lg }}>
            <Field
              label={t('email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              editable={!busy}
              style={{ textAlign: 'left', writingDirection: 'ltr' }}
              onSubmitEditing={() => void submit()}
            />
            <Field
              label={t('password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="password"
              autoComplete="current-password"
              editable={!busy}
              style={{ textAlign: 'left', writingDirection: 'ltr' }}
              onSubmitEditing={() => void submit()}
            />
            <Button
              label={busy ? t('loggingIn') : t('loginAction')}
              onPress={() => void submit()}
              loading={busy}
            />
          </Card>

          <LinearGradient
            colors={[colors.navyMid, colors.navyDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.applyPanel}
          >
            <Txt variant="heading" color={colors.goldLight}>
              {t('noAccountTitle')}
            </Txt>
            <Txt variant="small" color={colors.textOnNavyMuted}>
              {t('noAccountBody')}
            </Txt>
            <Button label={t('applyAction')} onPress={() => void openExternal(APPLY_URL)} />
          </LinearGradient>

          <Button label={t('browseAsGuest')} kind="ghost" onPress={() => router.replace('/')} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  head: { overflow: 'hidden', backgroundColor: colors.navyDeep },
  headScrim: {
    minHeight: 270,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl * 2,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  logoRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(217,174,75,0.4)',
    backgroundColor: 'rgba(7,22,48,0.5)',
    marginBottom: spacing.xs,
  },
  logo: { width: 54, height: 54 },
  body: { padding: spacing.lg, gap: spacing.lg },
  applyPanel: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: goldHairline,
    padding: spacing.xl,
    gap: spacing.md,
  },
});
