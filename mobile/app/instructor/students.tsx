import React, { useState } from 'react';
import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../src/i18n';
import { getInstructorStudents, type InstructorStudentRow } from '../../src/api/instructor';
import { colors, spacing } from '../../src/theme';
import { Button } from '../../src/ui/Button';
import { Badge, PressableCard, ProgressBar, Row, Screen, SectionTitle, Txt } from '../../src/ui/kit';
import { PagedView, usePagedQuery } from '../../src/ui/states';
import { InstructorOnly, NoScholarNotice, useInstructorText, type InstructorText } from '../../src/instructor/ui';

/**
 * طلاب مقرّرات المحاضر.
 *
 * الصفّ **تسجيلٌ لا طالب**: من سجّل في مقرّرين للمحاضر نفسه يظهر مرّتين، لأنّ
 * تقدّمه وحالته يختلفان بين المقرّرين. أمّا العدد المتمايز فيظهر في شاشة
 * الملخّص.
 */
export default function InstructorStudentsScreen() {
  const L = useInstructorText();
  return (
    <Screen>
      <Stack.Screen options={{ title: L.students }} />
      <SectionTitle title={L.students} />
      <InstructorOnly>
        <StudentsList />
      </InstructorOnly>
    </Screen>
  );
}

function StudentsList() {
  const L = useInstructorText();
  // قائمةٌ فارغة قد تعني «لا طلاب» أو «حساب غير مربوط بملفّ هيئة»، والرسالتان
  // متباعدتان: الأولى خبر، والثانية طلبُ مراجعةٍ للإدارة. `usePagedQuery` لا
  // يمرّر إلّا `items`/`nextCursor`، فنلتقط العلامة من الصفحة الأولى وحدها.
  const [linked, setLinked] = useState(true);
  const state = usePagedQuery(async (cursor) => {
    const page = await getInstructorStudents({ limit: 30, cursor });
    if (cursor === null) setLinked(page.scholarLinked);
    return { items: page.items, nextCursor: page.nextCursor };
  }, []);

  if (!state.loading && !linked) return <NoScholarNotice />;

  return (
    <PagedView state={state} emptyText={L.noStudents} emptyIcon="school-outline">
      {(items) => (
        <View style={{ gap: spacing.md }}>
          {items.map((row) => (
            <StudentCard key={row.id} row={row} L={L} />
          ))}
          {state.hasMore ? (
            <Button
              label={L.loadMore}
              kind="ghost"
              loading={state.loadingMore}
              onPress={state.loadMore}
            />
          ) : null}
        </View>
      )}
    </PagedView>
  );
}

const statusLabel = (status: InstructorStudentRow['status'], L: InstructorText): string =>
  ({
    PENDING: L.enrollPENDING,
    ACTIVE: L.enrollACTIVE,
    COMPLETED: L.enrollCOMPLETED,
    CANCELLED: L.enrollCANCELLED,
  })[status] ?? status;

const statusTone = (status: InstructorStudentRow['status']) =>
  status === 'ACTIVE' ? 'success' : status === 'CANCELLED' ? 'danger' : 'neutral';

function StudentCard({ row, L }: { row: InstructorStudentRow; L: InstructorText }) {
  const { n, date } = useI18n();
  const router = useRouter();

  return (
    <PressableCard
      onPress={() => router.push(`/instructor/courses/${row.course.id}`)}
      style={{ gap: spacing.sm }}
    >
      <Row justify="space-between" align="flex-start" gap={spacing.sm}>
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong">{row.student.name}</Txt>
          <Row gap={spacing.xs}>
            <Ionicons name="mail-outline" size={13} color={colors.textMuted} />
            <Txt variant="tiny" color={colors.textMuted}>
              {row.student.email}
            </Txt>
          </Row>
        </View>
        <Badge label={statusLabel(row.status, L)} tone={statusTone(row.status)} />
      </Row>

      <Txt variant="small" color={colors.navy}>
        {row.course.titleAr}
      </Txt>

      <ProgressBar pct={row.progressPct} label={`${L.progress} · ${n(row.progressPct)}٪`} />

      <Row wrap gap={spacing.md}>
        {row.student.studentNo ? (
          <Txt variant="tiny" color={colors.textMuted}>
            {`${L.studentNo}: ${n(row.student.studentNo)}`}
          </Txt>
        ) : null}
        {row.student.country ? (
          <Txt variant="tiny" color={colors.textMuted}>
            {row.student.country}
          </Txt>
        ) : null}
        <Txt variant="tiny" color={colors.textMuted}>
          {`${L.enrolledAt}: ${date(row.enrolledAt)}`}
        </Txt>
      </Row>
    </PressableCard>
  );
}
