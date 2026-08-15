import React from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { Button } from './Button';
import { EmptyState } from './states';

/** يحرس الأقسام الخاصّة بالطالب ويعرض دعوةً مهذّبة للدخول بدلًا من شاشة فارغة. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  if (status !== 'authed') {
    return (
      <EmptyState
        icon="lock-closed-outline"
        text={t('guestNotice')}
        action={<Button label={t('goToLogin')} onPress={() => router.push('/login')} />}
      />
    );
  }

  return <>{children}</>;
}
