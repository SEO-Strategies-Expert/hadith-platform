import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/auth/AuthContext';
import { useI18n } from '../src/i18n';
import { messageOf } from '../src/api/client';
import { APPLY_URL } from '../src/config';
import { colors, spacing } from '../src/theme';
import { Button } from '../src/ui/Button';
import { Field } from '../src/ui/Field';
import { Card, Divider, Screen, Txt } from '../src/ui/kit';
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
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen edges={[]}>
        <View style={{ gap: spacing.sm }}>
          <Txt variant="display">{t('loginTitle')}</Txt>
          <Txt variant="small" color={colors.textMuted}>
            {t('loginSubtitle')}
          </Txt>
        </View>

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

        <Card style={{ gap: spacing.md, backgroundColor: colors.goldLight, borderColor: colors.gold }}>
          <Txt variant="heading" color="#5F4712">
            {t('noAccountTitle')}
          </Txt>
          <Txt variant="small" color="#5F4712">
            {t('noAccountBody')}
          </Txt>
          <Button label={t('applyAction')} kind="secondary" onPress={() => void openExternal(APPLY_URL)} />
        </Card>

        <Divider />

        <Button label={t('browseAsGuest')} kind="ghost" onPress={() => router.replace('/')} />
      </Screen>
    </KeyboardAvoidingView>
  );
}
