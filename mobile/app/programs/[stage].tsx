import React from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useI18n } from '../../src/i18n';
import { colors, spacing } from '../../src/theme';
import { Badge, Row, Screen, SectionTitle, Txt } from '../../src/ui/kit';
import { CourseTile, MetaChip } from '../../src/ui/cards';
import { QueryView, useQuery } from '../../src/ui/states';
import { degreeKeyOf, fetchAllCourses } from '../../src/programs/stages';

/**
 * مقرّرات درجةٍ واحدة.
 *
 * `stage` هو مفتاح المرحلة (`foundation`…) كما يُخرجه العقد، ويُمرَّر إلى
 * `/courses?stage=` — والخادم يقبل المفتاح والمعرّف معًا. و`title` عنوان
 * المرحلة يأتي من البطاقة التي فُتحت منها كي يظهر في الترويسة **قبل**
 * وصول الردّ لا بعده، كما تفعل `page/[slug]`.
 *
 * والمقرّر يفتح شاشة المقرّر الأصيلة الموجودة — لا نسخةَ ثانية منها.
 */
export default function StageCoursesScreen() {
  const { stage, title } = useLocalSearchParams<{ stage: string; title?: string }>();
  const { t, n } = useI18n();
  const router = useRouter();

  const key = String(stage ?? '');
  const degreeKey = degreeKeyOf(key);
  const courses = useQuery(() => fetchAllCourses(key), [key]);

  const heading = title || t('programsStageCourses');

  return (
    <>
      <Stack.Screen options={{ title: heading }} />
      <Screen>
        <SectionTitle title={heading} />

        <Row gap={spacing.md} wrap>
          {degreeKey ? <Badge label={t(degreeKey)} tone="gold" /> : null}
          {courses.data ? (
            <MetaChip icon="library-outline" text={`${n(courses.data.length)} ${t('courseUnit')}`} />
          ) : null}
        </Row>

        <QueryView
          query={courses}
          isEmpty={(list) => list.length === 0}
          emptyText={t('programsStageEmpty')}
          emptyIcon="library-outline"
        >
          {(list) => (
            <View style={{ gap: spacing.lg }}>
              {list.map((course) => (
                <CourseTile
                  key={course.id}
                  course={course}
                  onPress={() => router.push(`/course/${course.id}`)}
                />
              ))}
            </View>
          )}
        </QueryView>

        <Txt variant="tiny" color={colors.textMuted}>
          {t('programsStageNote')}
        </Txt>
      </Screen>
    </>
  );
}
