import React, { useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/auth/AuthContext';
import { useI18n } from '../../src/i18n';
import { WEBSITE_URL } from '../../src/config';
import { colors, spacing } from '../../src/theme';
import { Button } from '../../src/ui/Button';
import { Badge, Card, Divider, InfoRow, PressableCard, Row, Screen, Txt } from '../../src/ui/kit';
import { RequireAuth } from '../../src/ui/RequireAuth';
import { openExternal } from '../../src/ui/openLink';

type LinkRow = { label: string; href: Href; icon: React.ComponentProps<typeof Ionicons>['name']; badge?: string };

export default function AccountScreen() {
  const { t, n, date } = useI18n();
  const { status, me, signOut } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const authed = status === 'authed';
  const unread = me?.counts.unreadNotifications ?? 0;

  const studentLinks: LinkRow[] = [
    { label: t('assignmentsTitle'), href: '/assignments', icon: 'document-text-outline' },
    { label: t('certificatesTitle'), href: '/certificates', icon: 'ribbon-outline' },
    { label: t('paymentsTitle'), href: '/payments', icon: 'card-outline' },
    {
      label: t('notificationsTitle'),
      href: '/notifications',
      icon: 'notifications-outline',
      badge: unread > 0 ? n(unread) : undefined,
    },
  ];

  const publicLinks: LinkRow[] = [
    { label: t('newsTitle'), href: '/news', icon: 'newspaper-outline' },
    { label: t('facultyTitle'), href: '/faculty', icon: 'people-outline' },
    { label: t('contactTitle'), href: '/contact', icon: 'mail-outline' },
    { label: t('settings'), href: '/settings', icon: 'settings-outline' },
  ];

  const confirmSignOut = () => {
    const run = async () => {
      setBusy(true);
      try {
        await signOut();
        router.replace('/');
      } finally {
        setBusy(false);
      }
    };

    // `Alert` غير متاح بشكل مفيد على الويب، فنؤكّد بـ`confirm`.
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (typeof window !== 'undefined' && window.confirm(t('logoutConfirm'))) void run();
      return;
    }
    Alert.alert(t('logout'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: () => void run() },
    ]);
  };

  const renderLinks = (rows: LinkRow[]) => (
    <View style={{ gap: spacing.sm }}>
      {rows.map((row) => (
        <PressableCard key={String(row.href)} onPress={() => router.push(row.href)} style={{ paddingVertical: spacing.md }}>
          <Row justify="space-between">
            <Row gap={spacing.md}>
              <Ionicons name={row.icon} size={20} color={colors.navy} />
              <Txt variant="body">{row.label}</Txt>
            </Row>
            <Row gap={spacing.sm}>
              {row.badge ? <Badge label={row.badge} tone="gold" /> : null}
              <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
            </Row>
          </Row>
        </PressableCard>
      ))}
    </View>
  );

  return (
    <Screen>
      {authed && me ? (
        <Card style={{ gap: spacing.md }}>
          <Txt variant="title">{me.name}</Txt>
          <Divider />
          <InfoRow label={t('accountEmail')} value={me.email} />
          {me.studentNo ? <InfoRow label={t('accountStudentNo')} value={n(me.studentNo)} /> : null}
          {me.program ? <InfoRow label={t('accountProgram')} value={me.program} /> : null}
          {me.country ? <InfoRow label={t('accountCountry')} value={me.country} /> : null}
          {me.phone ? <InfoRow label={t('accountPhone')} value={n(me.phone)} /> : null}
          <InfoRow label={t('accountJoined')} value={date(me.createdAt)} />
          <Divider />
          <Row gap={spacing.xl}>
            <View>
              <Txt variant="title">{n(me.counts.courses)}</Txt>
              <Txt variant="tiny" color={colors.textMuted}>
                {t('accountCourses')}
              </Txt>
            </View>
            <View>
              <Txt variant="title">{n(me.counts.certificates)}</Txt>
              <Txt variant="tiny" color={colors.textMuted}>
                {t('accountCertificates')}
              </Txt>
            </View>
          </Row>
        </Card>
      ) : null}

      {authed ? renderLinks(studentLinks) : <RequireAuth>{null}</RequireAuth>}

      {renderLinks(publicLinks)}

      <Button label={t('visitWebsite')} kind="ghost" onPress={() => void openExternal(WEBSITE_URL)} />

      {authed ? (
        <Button label={busy ? t('loggingOut') : t('logout')} kind="danger" loading={busy} onPress={confirmSignOut} />
      ) : null}
    </Screen>
  );
}
