import React from 'react';
import { View } from 'react-native';
import { useI18n } from '../../src/i18n';
import { useAuth } from '../../src/auth/AuthContext';
import { getMySessions, getPublicSessions } from '../../src/api/endpoints';
import { spacing } from '../../src/theme';
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
  const authed = status === 'authed';

  const mine = useQuery(() => getMySessions(50), [authed]);
  const publicSessions = useQuery(() => getPublicSessions(50), []);

  return (
    <Screen>
      {authed ? (
        <>
          <SectionTitle title={t('sessionsMine')} />
          <QueryView query={mine} isEmpty={(d) => d.items.length === 0} emptyText={t('sessionsEmpty')}>
            {(data) => (
              <View style={{ gap: spacing.md }}>
                {data.items.map((session) => (
                  <SessionTile key={session.id} session={session} />
                ))}
              </View>
            )}
          </QueryView>
        </>
      ) : (
        <>
          <SectionTitle title={t('sessionsPublic')} />
          <QueryView
            query={publicSessions}
            isEmpty={(d) => d.items.length === 0}
            emptyText={t('sessionsEmpty')}
          >
            {(data) => (
              <View style={{ gap: spacing.md }}>
                {data.items.map((session) => (
                  <SessionTile key={session.id} session={session} />
                ))}
              </View>
            )}
          </QueryView>
        </>
      )}
    </Screen>
  );
}
