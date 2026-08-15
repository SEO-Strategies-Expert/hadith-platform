import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../src/i18n';
import { useAuth } from '../../src/auth/AuthContext';
import { getMyCourses } from '../../src/api/endpoints';
import type { EnrollmentStatus } from '../../src/api/types';
import { spacing } from '../../src/theme';
import { Button } from '../../src/ui/Button';
import { Screen } from '../../src/ui/kit';
import { CourseTile } from '../../src/ui/cards';
import { RequireAuth } from '../../src/ui/RequireAuth';
import { PagedView, usePagedQuery } from '../../src/ui/states';
import type { StringKey } from '../../src/i18n/strings';

const statusKey = (s: EnrollmentStatus): StringKey => `enroll${s}` as StringKey;

function MyCourses() {
  const { t } = useI18n();
  const router = useRouter();
  const enrolled = usePagedQuery((cursor) => getMyCourses({ limit: 20, cursor }), []);

  return (
    <PagedView
      state={enrolled}
      emptyText={t('myCoursesEmpty')}
      emptyAction={<Button label={t('coursesTitle')} kind="ghost" onPress={() => router.push('/courses')} />}
    >
      {(items) => (
        <View style={{ gap: spacing.md }}>
          {items.map((row) => (
            <CourseTile
              key={row.enrollmentId}
              course={row.course}
              progressPct={row.progressPct}
              statusLabel={t(statusKey(row.status))}
              // المسار الخاصّ بالمسجَّل — يفتح المحتوى كاملًا.
              onPress={() => router.push(`/course/${row.course.id}`)}
            />
          ))}
          {enrolled.hasMore ? (
            <Button
              label={t('loadMore')}
              kind="ghost"
              loading={enrolled.loadingMore}
              onPress={enrolled.loadMore}
            />
          ) : null}
        </View>
      )}
    </PagedView>
  );
}

export default function LearningScreen() {
  const { status } = useAuth();
  return (
    <Screen>
      <RequireAuth>{status === 'authed' ? <MyCourses /> : null}</RequireAuth>
    </Screen>
  );
}
