import React, { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { useI18n } from '../../src/i18n';
import { getCourses, getFaculty, getMySessions, getNews, getPublicSessions } from '../../src/api/endpoints';
import type { CourseCard, FacultyMember, Paged, SessionPublic, SessionStudent } from '../../src/api/types';
import { APPLY_URL } from '../../src/config';
import { colors, spacing } from '../../src/theme';
import { Button } from '../../src/ui/Button';
import { NavyPanel, SectionTitle, SectionTitleOnNavy, Txt } from '../../src/ui/kit';
import { CourseTile, NewsLeadTile, NewsTile, PillarTile, SessionTile } from '../../src/ui/cards';
import { Hero, StatsBand } from '../../src/ui/Hero';
import { heroSlide, PILLAR_IMAGES } from '../../src/ui/assets';
import { QueryView, useQuery } from '../../src/ui/states';
import { openExternal } from '../../src/ui/openLink';

/** حصيلةُ الإحصاءات — تُجلب مرّةً وتُشتقّ منها المراحل بلا مسارٍ إضافي. */
type Stats = { courses: Paged<CourseCard>; faculty: Paged<FacultyMember> };

export default function HomeScreen() {
  const { t, pick, n, lang } = useI18n();
  const { status, me } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);

  const authed = status === 'authed';

  const courses = useQuery(() => getCourses({ limit: 3 }), []);
  const news = useQuery(() => getNews({ limit: 4 }), []);
  const sessions = useQuery<{ items: (SessionPublic | SessionStudent)[] }>(
    () => (authed ? getMySessions(3) : getPublicSessions(3)),
    [authed]
  );
  // الأرقام في الشريط من الخادم لا من ثوابت مكتوبة.
  const stats = useQuery<Stats>(
    () =>
      Promise.all([getCourses({ limit: 100 }), getFaculty({ limit: 100 })]).then(
        ([c, f]) => ({ courses: c, faculty: f })
      ),
    []
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    courses.reload();
    news.reload();
    sessions.reload();
    stats.reload();
    // إعادة الجلب غير متزامنة؛ نُنهي مؤشّر السحب بعد مهلة قصيرة.
    setTimeout(() => setRefreshing(false), 600);
  }, [courses, news, sessions, stats]);

  const pillars = useMemo(
    () => [
      { image: PILLAR_IMAGES.curric, title: t('pillarCurricTitle'), body: t('pillarCurricBody') },
      {
        image: PILLAR_IMAGES.scholars,
        title: t('pillarScholarsTitle'),
        body: t('pillarScholarsBody'),
        onPress: () => router.push('/faculty'),
      },
      { image: PILLAR_IMAGES.diwan, title: t('pillarDiwanTitle'), body: t('pillarDiwanBody') },
      { image: PILLAR_IMAGES.library, title: t('pillarLibraryTitle'), body: t('pillarLibraryBody') },
      { image: PILLAR_IMAGES.research, title: t('pillarResearchTitle'), body: t('pillarResearchBody') },
      { image: PILLAR_IMAGES.alamiya, title: t('pillarAlamiyaTitle'), body: t('pillarAlamiyaBody') },
    ],
    [t, router]
  );

  const pillarWidth = Math.min(230, Math.max(180, width * 0.52));

  const statItems = useMemo(() => {
    const items = stats.data?.courses.items ?? [];
    const stageCount = new Set(items.map((c) => c.stage?.id).filter(Boolean)).size;
    const sessionCount = sessions.data?.items.length ?? 0;
    return (
      [
        { count: stageCount, label: t('statStages') },
        { count: items.length, label: t('statCourses') },
        { count: stats.data?.faculty.items.length ?? 0, label: t('statFaculty') },
        { count: sessionCount, label: t('statSessions') },
      ]
        // الصفر لا يُعرض: «٠ مجالس» يقول للزائر إنّ الكلّية خاوية، وهو
        // انطباعٌ لا داعي له حين يكون الجدول لم يُنشر بعدُ لا غير.
        .filter((s) => s.count > 0)
        .map((s) => ({ value: n(s.count), label: s.label }))
    );
  }, [stats.data, sessions.data, n, t]);

  const newsItems = news.data?.items ?? [];

  return (
    // بلا حافّةٍ علويّة: `BrandHeader` فوق الشاشة يبتلع هامش شريط الحالة.
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl, gap: spacing.xl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.gold} />
        }
      >
        {/* ————— الهيرو ————— */}
        <Hero
          image={heroSlide(0, lang === 'en')}
          title={t('appNameShort')}
          vision={t('heroVision')}
          actions={
            <>
              <Button label={t('applyAction')} onPress={() => void openExternal(APPLY_URL)} />
              <Button label={t('heroExplore')} kind="onNavy" onPress={() => router.push('/courses')} />
            </>
          }
        />

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.xl }}>
          {authed && me ? (
            <Txt variant="smallStrong" color={colors.goldDark}>
              {t('welcome')}، {me.name}
            </Txt>
          ) : null}

          {/* ————— شريط الإحصاءات ————— */}
          {statItems.length > 0 ? <StatsBand items={statItems} /> : null}

          {/* ————— نبذة الكلّية ————— */}
          <NavyPanel>
            <SectionTitleOnNavy title={t('homeIntroTitle')} />
            <Txt variant="small" color={colors.textOnNavyMuted} align="center">
              {t('homeIntro')}
            </Txt>
          </NavyPanel>
        </View>

        {/* ————— المرتكزات ————— */}
        <View style={{ gap: spacing.md }}>
          <View style={{ paddingHorizontal: spacing.lg }}>
            <SectionTitle title={t('pillarsTitle')} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}
          >
            {pillars.map((p) => (
              <PillarTile
                key={p.title}
                image={p.image}
                title={p.title}
                body={p.body}
                onPress={p.onPress}
                width={pillarWidth}
              />
            ))}
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.xl }}>
          {/* ————— المجلس القادم ————— */}
          <View style={{ gap: spacing.md }}>
            <SectionTitle
              title={t('homeNextSession')}
              action={<Button label={t('seeAll')} kind="ghost" small onPress={() => router.push('/sessions')} />}
            />
            <QueryView
              query={sessions}
              isEmpty={(d) => d.items.length === 0}
              emptyText={t('homeNoSession')}
              emptyIcon="calendar-outline"
              emptyAction={
                <Button
                  label={t('emptyNoSessionAction')}
                  kind="ghost"
                  small
                  onPress={() => router.push('/sessions')}
                />
              }
            >
              {(data) => (
                <View style={{ gap: spacing.md }}>
                  {data.items.slice(0, 1).map((s) => (
                    <SessionTile key={s.id} session={s} featured />
                  ))}
                </View>
              )}
            </QueryView>
          </View>

          {/* ————— المقرّرات ————— */}
          <View style={{ gap: spacing.md }}>
            <SectionTitle
              title={t('homeCourses')}
              action={<Button label={t('seeAll')} kind="ghost" small onPress={() => router.push('/courses')} />}
            />
            <QueryView
              query={courses}
              isEmpty={(d) => d.items.length === 0}
              emptyText={t('coursesEmpty')}
              emptyIcon="library-outline"
            >
              {(data) => (
                <View style={{ gap: spacing.lg }}>
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
          </View>

          {/* ————— الأخبار ————— */}
          <View style={{ gap: spacing.md }}>
            <SectionTitle
              title={t('homeNews')}
              action={<Button label={t('seeAll')} kind="ghost" small onPress={() => router.push('/news')} />}
            />
            <QueryView
              query={news}
              isEmpty={(d) => d.items.length === 0}
              emptyText={t('newsEmpty')}
              emptyIcon="newspaper-outline"
            >
              {() => (
                <View style={{ gap: spacing.md }}>
                  {newsItems[0] ? <NewsLeadTile item={newsItems[0]} /> : null}
                  {newsItems.slice(1).map((item) => (
                    <NewsTile key={item.id} item={item} />
                  ))}
                </View>
              )}
            </QueryView>
          </View>

          {!authed ? (
            <NavyPanel style={{ gap: spacing.md }}>
              <Txt variant="small" color={colors.textOnNavyMuted} align="center">
                {pick(
                  'سجّل الدخول للوصول إلى مقرّراتك ومجالسك ودرجاتك.',
                  'Sign in to reach your courses, sessions and grades.'
                )}
              </Txt>
              <Button label={t('loginAction')} onPress={() => router.push('/login')} />
            </NavyPanel>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
