import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../src/i18n';
import { getAssignments } from '../../src/api/endpoints';
import type { SubmissionState } from '../../src/api/types';
import type { StringKey } from '../../src/i18n/strings';
import { colors, spacing } from '../../src/theme';
import { Button } from '../../src/ui/Button';
import { Badge, PressableCard, Row, Screen, Txt } from '../../src/ui/kit';
import { RequireAuth } from '../../src/ui/RequireAuth';
import { PagedView, usePagedQuery } from '../../src/ui/states';

const stateKey = (s: SubmissionState): StringKey => `state${s}` as StringKey;

export default function AssignmentsScreen() {
  return (
    <Screen>
      <RequireAuth>
        <AssignmentsList />
      </RequireAuth>
    </Screen>
  );
}

function AssignmentsList() {
  const { t, pick, n, date } = useI18n();
  const router = useRouter();
  const list = usePagedQuery((cursor) => getAssignments({ limit: 20, cursor }), []);

  return (
    <PagedView state={list} emptyText={t('assignmentsEmpty')}>
      {(items) => (
        <View style={{ gap: spacing.md }}>
          {items.map((item) => (
            <PressableCard
              key={item.id}
              onPress={() => router.push(`/assignments/${item.id}`)}
              style={{ gap: spacing.sm }}
            >
              <Row gap={spacing.sm} wrap>
                {item.submission ? (
                  <Badge
                    label={t(stateKey(item.submission.state))}
                    tone={item.submission.state === 'GRADED' ? 'success' : 'neutral'}
                  />
                ) : null}
                {item.overdue ? <Badge label={t('assignmentOverdue')} tone="danger" /> : null}
              </Row>

              <Txt variant="heading">{pick(item.titleAr, item.titleEn)}</Txt>

              <Txt variant="tiny" color={colors.textMuted}>
                {pick(item.course.titleAr, item.course.titleEn)}
              </Txt>

              <Row justify="space-between">
                <Txt variant="tiny" color={colors.textMuted}>
                  {t('assignmentDue')}: {item.dueAt ? date(item.dueAt) : t('assignmentNoDue')}
                </Txt>
                {item.submission?.score !== null && item.submission?.score !== undefined ? (
                  <Txt variant="tiny" style={{ fontWeight: '700' }}>
                    {n(item.submission.score)} / {n(item.maxScore)}
                  </Txt>
                ) : null}
              </Row>
            </PressableCard>
          ))}
          {list.hasMore ? (
            <Button label={t('loadMore')} kind="ghost" loading={list.loadingMore} onPress={list.loadMore} />
          ) : null}
        </View>
      )}
    </PagedView>
  );
}
