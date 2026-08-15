import React, { useCallback, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { useI18n } from '../../src/i18n';
import { getCourses, getMySessions, getNews, getPublicSessions } from '../../src/api/endpoints';
import type { SessionPublic, SessionStudent } from '../../src/api/types';
import { colors, spacing } from '../../src/theme';
import { Button } from '../../src/ui/Button';
import { Card, Screen, SectionTitle, Txt } from '../../src/ui/kit';
import { CourseTile, NewsTile, SessionTile } from '../../src/ui/cards';
import { QueryView, useQuery } from '../../src/ui/states';

export default function HomeScreen() {
  const { t, pick } = useI18n();
  const { status, me } = useAuth();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const authed = status === 'authed';

  const courses = useQuery(() => getCourses({ limit: 4 }), []);
  const news = useQuery(() => getNews({ limit: 3 }), []);
  const sessions = useQuery<{ items: (SessionPublic | SessionStudent)[] }>(
    () => (authed ? getMySessions(3) : getPublicSessions(3)),
    [authed]
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    courses.reload();
    news.reload();
    sessions.reload();
    // إعادة الجلب غير متزامنة؛ نُنهي مؤشّر السحب بعد مهلة قصيرة.
    setTimeout(() => setRefreshing(false), 600);
  }, [courses, news, sessions]);

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}>
      <View style={{ gap: spacing.sm }}>
        <Txt variant="display">{t('appNameShort')}</Txt>
        {authed && me ? (
          <Txt variant="small" color={colors.textMuted}>
            {t('welcome')}، {me.name}
          </Txt>
        ) : null}
      </View>

      <Card style={{ gap: spacing.sm, backgroundColor: colors.navyDark, borderColor: colors.navyDark }}>
        <Txt variant="heading" color={colors.goldLight}>
          {t('homeIntroTitle')}
        </Txt>
        <Txt variant="small" color={colors.textOnNavyMuted}>
          {t('homeIntro')}
        </Txt>
      </Card>

      {/* ————— المجلس القادم ————— */}
      <SectionTitle
        title={t('homeNextSession')}
        action={<Button label={t('seeAll')} kind="ghost" small onPress={() => router.push('/sessions')} />}
      />
      <QueryView query={sessions} isEmpty={(d) => d.items.length === 0} emptyText={t('homeNoSession')}>
        {(data) => (
          <View style={{ gap: spacing.md }}>
            {data.items.slice(0, 1).map((s) => (
              <SessionTile key={s.id} session={s} />
            ))}
          </View>
        )}
      </QueryView>

      {/* ————— المقرّرات ————— */}
      <SectionTitle
        title={t('homeCourses')}
        action={<Button label={t('seeAll')} kind="ghost" small onPress={() => router.push('/courses')} />}
      />
      <QueryView query={courses} isEmpty={(d) => d.items.length === 0} emptyText={t('coursesEmpty')}>
        {(data) => (
          <View style={{ gap: spacing.md }}>
            {data.items.map((course) => (
              <CourseTile
                key={course.id}
                course={course}
                onPress={() => router.push(`/course/${course.id}`)}
              />
            ))}
          </View>
        )}
      </QueryView>

      {/* ————— الأخبار ————— */}
      <SectionTitle
        title={t('homeNews')}
        action={<Button label={t('seeAll')} kind="ghost" small onPress={() => router.push('/news')} />}
      />
      <QueryView query={news} isEmpty={(d) => d.items.length === 0} emptyText={t('newsEmpty')}>
        {(data) => (
          <View style={{ gap: spacing.md }}>
            {data.items.map((item) => (
              <NewsTile key={item.id} item={item} />
            ))}
          </View>
        )}
      </QueryView>

      {!authed ? (
        <Card style={{ gap: spacing.md }}>
          <Txt variant="small" color={colors.textMuted}>
            {pick('سجّل الدخول للوصول إلى مقرّراتك ومجالسك ودرجاتك.', 'Sign in to reach your courses, sessions and grades.')}
          </Txt>
          <Button label={t('loginAction')} onPress={() => router.push('/login')} />
        </Card>
      ) : null}
    </Screen>
  );
}
