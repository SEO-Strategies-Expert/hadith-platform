import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../src/i18n';
import { getCourses } from '../../src/api/endpoints';
import { spacing } from '../../src/theme';
import { Button } from '../../src/ui/Button';
import { Screen, SectionTitle } from '../../src/ui/kit';
import { CourseTile } from '../../src/ui/cards';
import { PagedView, usePagedQuery } from '../../src/ui/states';

export default function CoursesScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const courses = usePagedQuery((cursor) => getCourses({ limit: 20, cursor }), []);

  return (
    <Screen>
      <SectionTitle title={t('coursesTitle')} />

      <PagedView state={courses} emptyText={t('coursesEmpty')} emptyIcon="library-outline">
        {(items) => (
          <View style={{ gap: spacing.lg }}>
            {items.map((course) => (
              <CourseTile
                key={course.id}
                course={course}
                onPress={() => router.push(`/course/${course.id}`)}
              />
            ))}
            {courses.hasMore ? (
              <Button
                label={t('loadMore')}
                kind="ghost"
                loading={courses.loadingMore}
                onPress={courses.loadMore}
              />
            ) : null}
          </View>
        )}
      </PagedView>
    </Screen>
  );
}
