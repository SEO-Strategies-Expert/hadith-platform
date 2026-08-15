import React from 'react';
import { Pressable, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/auth/AuthContext';
import { useI18n } from '../../src/i18n';
import { ApiError } from '../../src/api/client';
import { getCourse, getMyCourse } from '../../src/api/endpoints';
import type { CourseDetailPublic, CourseDetailStudent, Lesson } from '../../src/api/types';
import { colors, spacing } from '../../src/theme';
import { Badge, Card, Divider, ProgressBar, Row, Screen, SectionTitle, Txt } from '../../src/ui/kit';
import { GoldRule, ThuluthText } from '../../src/ui/gold';
import { RemoteImage } from '../../src/ui/RemoteImage';
import { courseImage } from '../../src/ui/assets';
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

            <RemoteImage uri={courseImage(course.imageUrl, course.id)} height={180} />

            <View style={{ gap: spacing.sm }}>
              <Row gap={spacing.sm} wrap>
                {course.stage ? <Badge label={pick(course.stage.titleAr, course.stage.titleEn)} tone="gold" /> : null}
                {course.category ? <Badge label={course.category} /> : null}
              </Row>
              <ThuluthText variant="ceremonial" color={colors.navy}>
                {pick(course.titleAr, course.titleEn)}
              </ThuluthText>
              <GoldRule height={2} style={{ width: 72 }} />
              {course.descAr || course.descEn ? (
                <Txt variant="body" color={colors.textMuted}>
                  {pick(course.descAr, course.descEn)}
                </Txt>
              ) : null}
            </View>

            <Card style={{ gap: spacing.md }}>
              {/* رقم المرحلة حقلٌ يُرسله الخادم دائمًا — وهو أوفى ما يملأ
                  هذه اللوحة حين تغيب بقيّة الحقول. */}
              {course.stage?.numAr ? (
                <Row justify="space-between">
                  <Txt variant="small" color={colors.textMuted}>
                    {pick('المرحلة', 'Stage')}
                  </Txt>
                  <Txt variant="smallStrong">
                    {pick(course.stage.numAr, course.stage.numEn ?? course.stage.numAr)}
                  </Txt>
                </Row>
              ) : null}
              {course.instructor ? (
                <Row justify="space-between">
                  <Txt variant="small" color={colors.textMuted}>
                    {t('instructor')}
                  </Txt>
                  <Txt variant="smallStrong">
                    {pick(course.instructor.nameAr, course.instructor.nameEn)}
                  </Txt>
                </Row>
              ) : null}
              {course.hours ? (
                <Row justify="space-between">
                  <Txt variant="small" color={colors.textMuted}>
                    {t('hours')}
                  </Txt>
                  <Txt variant="smallStrong">
                    {n(course.hours)}
                  </Txt>
                </Row>
              ) : null}
              {course.startsOn ? (
                <Row justify="space-between">
                  <Txt variant="small" color={colors.textMuted}>
                    {t('startsOn')}
                  </Txt>
                  <Txt variant="smallStrong">
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

            <SectionTitle title={t('courseModules')} />

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
