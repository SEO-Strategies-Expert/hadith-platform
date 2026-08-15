import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../src/i18n';
import { useAuth } from '../../src/auth/AuthContext';
import { getMySessions, getPublicSessions } from '../../src/api/endpoints';
import type { SessionPublic, SessionStudent } from '../../src/api/types';
import { spacing } from '../../src/theme';
import { Button } from '../../src/ui/Button';
import { Screen, SectionTitle } from '../../src/ui/kit';
import { SessionTile } from '../../src/ui/cards';
import { QueryView, useQuery } from '../../src/ui/states';

/**
 * `/me/sessions` و`/sessions/public` لا يقبلان مؤشّرًا (قائمة زمنيّة متحرّكة)،
 * فتُجلبان دفعةً واحدة بحدّ أقصى.
 */
export default function SessionsScreen() {
  const { t } = useI18n();
  const { status } = useAuth();
  const router = useRouter();
  const authed = status === 'authed';

  const mine = useQuery(() => getMySessions(50), [authed]);
  const publicSessions = useQuery(() => getPublicSessions(50), []);

  // أوّل مجلسٍ في القائمة هو الأقرب موعدًا، فيُبرز ببطاقةٍ كحليّة.
  const list = (items: (SessionPublic | SessionStudent)[]) => (
    <View style={{ gap: spacing.md }}>
      {items.map((session, index) => (
        <SessionTile key={session.id} session={session} featured={index === 0} />
      ))}
    </View>
  );

  const emptyAction = (
    <Button label={t('emptyBrowseCourses')} kind="ghost" small onPress={() => router.push('/courses')} />
  );

  return (
    <Screen>
      {authed ? (
        <>
          <SectionTitle title={t('sessionsMine')} />
          <QueryView
            query={mine}
            isEmpty={(d) => d.items.length === 0}
            emptyText={t('sessionsEmpty')}
            emptyIcon="calendar-outline"
            emptyAction={emptyAction}
          >
            {(data) => list(data.items)}
          </QueryView>
        </>
      ) : (
        <>
          <SectionTitle title={t('sessionsPublic')} />
          <QueryView
            query={publicSessions}
            isEmpty={(d) => d.items.length === 0}
            emptyText={t('sessionsEmpty')}
            emptyIcon="calendar-outline"
            emptyAction={emptyAction}
          >
            {(data) => list(data.items)}
          </QueryView>
        </>
      )}
    </Screen>
  );
}
