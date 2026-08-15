import React from 'react';
import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useI18n } from '../../../src/i18n';
import { getInstructorCourses, type InstructorCourseCard } from '../../../src/api/instructor';
import { colors, spacing } from '../../../src/theme';
import { Badge, PressableCard, Row, Screen, SectionTitle, Txt } from '../../../src/ui/kit';
import { QueryView, useQuery } from '../../../src/ui/states';
import { InstructorOnly, NoScholarNotice, ReadOnlyNotice, useInstructorText } from '../../../src/instructor/ui';

/** مقرّرات المحاضر — قائمة للاطّلاع، والتفاصيل في `courses/[id]`. */
export default function InstructorCoursesScreen() {
  const L = useInstructorText();
  return (
    <Screen>
      <Stack.Screen options={{ title: L.courses }} />
      <SectionTitle title={L.courses} />
      <InstructorOnly>
        <CoursesList />
      </InstructorOnly>
    </Screen>
  );
}

function CoursesList() {
  const L = useInstructorText();
  const query = useQuery(() => getInstructorCourses({ limit: 50 }), []);

  return (
    <QueryView
      query={query}
      // الحساب غير المربوط لا يُعامَل كفراغ: له رسالته الخاصّة أدناه.
      isEmpty={(d) => d.scholarLinked && d.items.length === 0}
      emptyText={L.noCourses}
      emptyIcon="layers-outline"
    >
      {(data) =>
        !data.scholarLinked ? (
          <NoScholarNotice />
        ) : (
          <View style={{ gap: spacing.md }}>
            <ReadOnlyNotice />
            {data.items.map((course) => (
              <CourseRow key={course.id} course={course} />
            ))}
          </View>
        )
      }
    </QueryView>
  );
}

function CourseRow({ course }: { course: InstructorCourseCard }) {
  const L = useInstructorText();
  const { n } = useI18n();
  const router = useRouter();

  return (
    <PressableCard
      onPress={() => router.push(`/instructor/courses/${course.id}`)}
      style={{ gap: spacing.sm }}
    >
      <Txt variant="heading">{course.titleAr}</Txt>
      <Txt variant="tiny" color={colors.textMuted}>
        {course.titleEn}
      </Txt>

      <Row wrap gap={spacing.xs}>
        <Badge
          label={course.published ? L.published : L.unpublished}
          tone={course.published ? 'success' : 'neutral'}
        />
        {!course.visible ? <Badge label={L.hidden} tone="neutral" /> : null}
        {course.stage ? <Badge label={`${L.stage}: ${course.stage.titleAr}`} tone="gold" /> : null}
      </Row>

      <Row wrap gap={spacing.lg}>
        <Count label={L.modules} value={n(course.counts.modules)} />
        <Count label={L.lessons} value={n(course.counts.lessons)} />
        <Count label={L.studentsCount} value={n(course.counts.students)} />
        <Count label={L.sessionsCount} value={n(course.counts.sessions)} />
      </Row>
    </PressableCard>
  );
}

function Count({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Txt variant="bodyStrong" color={colors.navy}>
        {value}
      </Txt>
      <Txt variant="tiny" color={colors.textMuted}>
        {label}
      </Txt>
    </View>
  );
}
