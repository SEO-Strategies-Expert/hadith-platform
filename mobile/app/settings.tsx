import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '../src/auth/AuthContext';
import { useI18n, type Lang } from '../src/i18n';
import { enablePush, getPushStatus, type PushStatus } from '../src/notifications/push';
import { colors, spacing } from '../src/theme';
import { Button } from '../src/ui/Button';
import { Card, Divider, Row, Screen, Txt } from '../src/ui/kit';

export default function SettingsScreen() {
  const { t, lang, setLang } = useI18n();
  const { status: authStatus } = useAuth();

  const [pushStatus, setPushStatus] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setPushStatus(await getPushStatus());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requestPush = async () => {
    setBusy(true);
    setNotice(null);
    const result = await enablePush();
    if (result.ok) {
      setNotice(t('notificationsEnabled'));
    } else if (result.reason === 'denied') {
      setNotice(t('notificationsDenied'));
    } else if (result.reason === 'unsupported') {
      setNotice(t('notificationsUnsupported'));
    } else if (result.reason === 'no-project-id') {
      // خطأ إعداد لا خطأ مستخدم — رسالة مفهومة بلا تفاصيل تقنيّة.
      setNotice(t('notificationsDenied'));
    } else {
      setNotice(t('notificationsDenied'));
    }
    await refresh();
    setBusy(false);
  };

  const langButton = (value: Lang, label: string) => (
    <Button
      label={label}
      kind={lang === value ? 'primary' : 'ghost'}
      small
      style={{ flex: 1 }}
      onPress={() => setLang(value)}
    />
  );

  return (
    <Screen>
      {/* ————— اللغة ————— */}
      <Card style={{ gap: spacing.md }}>
        <Txt variant="heading">{t('language')}</Txt>
        <Divider />
        <Row gap={spacing.sm}>
          {langButton('ar', t('arabic'))}
          {langButton('en', t('english'))}
        </Row>
        <Txt variant="tiny" color={colors.textMuted}>
          {lang === 'ar'
            ? 'اتّجاه الواجهة من اليمين إلى اليسار في كلتا اللغتين، وهو الاتّجاه المعتمد للكلّية.'
            : 'The layout stays right-to-left in both languages, as adopted by the college.'}
        </Txt>
      </Card>

      {/* ————— الإشعارات ————— */}
      <Card style={{ gap: spacing.md }}>
        <Txt variant="heading">{t('notificationsPermissionTitle')}</Txt>
        <Txt variant="small" color={colors.textMuted}>
          {t('notificationsPermissionBody')}
        </Txt>
        <Divider />

        {pushStatus === 'unsupported' ? (
          <Txt variant="small" color={colors.textMuted}>
            {t('notificationsUnsupported')}
          </Txt>
        ) : authStatus !== 'authed' ? (
          <Txt variant="small" color={colors.textMuted}>
            {t('guestNotice')}
          </Txt>
        ) : pushStatus === 'granted' ? (
          <Txt variant="small" color={colors.success}>
            {t('notificationsEnabled')}
          </Txt>
        ) : pushStatus === 'denied' ? (
          <Txt variant="small" color={colors.textMuted}>
            {t('notificationsDenied')}
          </Txt>
        ) : (
          <Button
            label={t('notificationsAllow')}
            loading={busy}
            onPress={() => void requestPush()}
          />
        )}

        {notice ? (
          <View>
            <Txt variant="small" color={colors.textMuted}>
              {notice}
            </Txt>
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}
