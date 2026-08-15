import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/auth/AuthContext';
import { useI18n } from '../../src/i18n';
import { ApiError } from '../../src/api/client';
import { getCourse, getMyCourse } from '../../src/api/endpoints';
import type { CourseDetailPublic, CourseDetailStudent, Lesson } from '../../src/api/types';
import { colors, radius, spacing } from '../../src/theme';
import { Badge, Card, Divider, ProgressBar, Row, Screen, Txt } from '../../src/ui/kit';
import { QueryView, useQuery } from '../../src/ui/states';

type Loaded =
  | { enrolled: true; course: CourseDetailStudent }
  | { enrolled: false; course: CourseDetailPublic };

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, pick, n, date } = useI18n();
  const { status } = useAuth();
  const router = useRouter();
  const authed = status === 'authed';

  const query = useQuery<Loaded>(async () => {
    if (authed) {
      try {
        return { enrolled: true, course: await getMyCourse(id) };
      } catch (err) {
        // ٤٠٤ هنا تعني «غير مسجَّل» أيضًا — نسقط إلى العرض العامّ المقفل.
        if (!(err instanceof ApiError && err.status === 404)) throw err;
      }
    }
    return { enrolled: false, course: await getCourse(id) };
  }, [id, authed]);

  const renderLesson = (lesson: Lesson) => {
    const locked = lesson.locked;
    const body = (
      <Row justify="space-between" style={{ paddingVertical: spacing.md }}>
        <Row gap={spacing.md} style={{ flexShrink: 1 }}>
          <Ionicons
            name={locked ? 'lock-closed-outline' : lesson.done ? 'checkmark-circle' : 'play-circle-outline'}
            size={20}
            color={locked ? colors.textMuted : lesson.done ? colors.success : colors.navy}
          />
          <View style={{ flexShrink: 1, gap: 2 }}>
            <Txt variant="small" color={locked ? colors.textMuted : colors.text} style={{ flexShrink: 1 }}>
              {pick(lesson.titleAr, lesson.titleEn)}
            </Txt>
            {lesson.durationMin ? (
              <Txt variant="tiny" color={colors.textMuted}>
                {n(lesson.durationMin)} {t('minutes')}
              </Txt>
            ) : null}
          </View>
        </Row>
        {lesson.freePreview && locked === false && !authed ? (
          <Badge label={t('freePreview')} tone="gold" />
        ) : null}
      </Row>
    );

    if (locked) {
      return (
        <View key={lesson.id} style={{ opacity: 0.6 }}>
          {body}
        </View>
      );
    }

    return (
      <Pressable
        key={lesson.id}
        onPress={() => router.push(`/lesson/${lesson.id}`)}
        style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
      >
        {body}
      </Pressable>
    );
  };

  return (
    <Screen>
      <QueryView query={query}>
        {({ enrolled, course }) => (
          <>
            <Stack.Screen options={{ title: pick(course.titleAr, course.titleEn) }} />

            {course.imageUrl ? (
              <Image
                source={{ uri: course.imageUrl }}
                style={{ width: '100%', height: 170, borderRadius: radius.lg, backgroundColor: colors.border }}
                resizeMode="cover"
              />
            ) : null}

            <View style={{ gap: spacing.sm }}>
              <Row gap={spacing.sm} wrap>
                {course.stage ? <Badge label={pick(course.stage.titleAr, course.stage.titleEn)} tone="gold" /> : null}
                {course.category ? <Badge label={course.category} /> : null}
              </Row>
              <Txt variant="title">{pick(course.titleAr, course.titleEn)}</Txt>
              {course.descAr || course.descEn ? (
                <Txt variant="body" color={colors.textMuted}>
                  {pick(course.descAr, course.descEn)}
                </Txt>
              ) : null}
            </View>

            <Card style={{ gap: spacing.md }}>
              {course.instructor ? (
                <Row justify="space-between">
                  <Txt variant="small" color={colors.textMuted}>
                    {t('instructor')}
                  </Txt>
                  <Txt variant="small" style={{ fontWeight: '600' }}>
                    {pick(course.instructor.nameAr, course.instructor.nameEn)}
                  </Txt>
                </Row>
              ) : null}
              {course.hours !== null ? (
                <Row justify="space-between">
                  <Txt variant="small" color={colors.textMuted}>
                    {t('hours')}
                  </Txt>
                  <Txt variant="small" style={{ fontWeight: '600' }}>
                    {n(course.hours)}
                  </Txt>
                </Row>
              ) : null}
              {course.startsOn ? (
                <Row justify="space-between">
                  <Txt variant="small" color={colors.textMuted}>
                    {t('startsOn')}
                  </Txt>
                  <Txt variant="small" style={{ fontWeight: '600' }}>
                    {date(course.startsOn)}
                  </Txt>
                </Row>
              ) : null}

              {enrolled ? (
                <>
                  <Divider />
                  <ProgressBar
                    pct={course.progress.pct}
                    label={`${t('progress')} · ${n(course.progress.done)} ${t('of')} ${n(course.progress.total)}`}
                  />
                </>
              ) : (
                <>
                  <Divider />
                  <Txt variant="tiny" color={colors.textMuted}>
                    {t('enrollNotice')}
                  </Txt>
                  {course.freePreviewCount > 0 ? (
                    <Txt variant="tiny" color={colors.textMuted}>
                      {t('freePreviewCount')}: {n(course.freePreviewCount)}
                    </Txt>
                  ) : null}
                </>
              )}
            </Card>

            <Txt variant="heading">{t('courseModules')}</Txt>

            {course.modules.length === 0 ? (
              <Card>
                <Txt variant="small" color={colors.textMuted}>
                  {t('courseNoModules')}
                </Txt>
              </Card>
            ) : (
              course.modules.map((mod) => (
                <Card key={mod.id} style={{ gap: spacing.xs }}>
                  <Txt variant="heading">{pick(mod.titleAr, mod.titleEn)}</Txt>
                  {mod.descAr || mod.descEn ? (
                    <Txt variant="small" color={colors.textMuted}>
                      {pick(mod.descAr, mod.descEn)}
                    </Txt>
                  ) : null}
                  <Divider style={{ marginTop: spacing.sm }} />
                  {mod.lessons.map(renderLesson)}
                </Card>
              ))
            )}
          </>
        )}
      </QueryView>
    </Screen>
  );
}
