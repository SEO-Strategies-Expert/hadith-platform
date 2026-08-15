import React from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../../src/i18n';
import {
  getInstructorCourse,
  type CourseStudentRow,
  type InstructorLesson,
  type InstructorModule,
} from '../../../src/api/instructor';
import { colors, spacing } from '../../../src/theme';
import { Badge, Card, Divider, ProgressBar, Row, Screen, SectionTitle, Txt } from '../../../src/ui/kit';
import { QueryView, useQuery } from '../../../src/ui/states';
import { InstructorOnly, ReadOnlyNotice, useInstructorText, type InstructorText } from '../../../src/instructor/ui';

/**
 * تفاصيل مقرّرٍ للمحاضر: بنيته وطلابه بنسب تقدّمهم.
 *
 * الخادم يردّ ٤٠٤ إن لم يكن المقرّر مسنَدًا إليه (شرطان مجتمعان في الاستعلام
 * لا فحصٌ بعد الجلب)، فتظهر هنا رسالة «لم نعثر على المطلوب» بلا معالجةٍ خاصّة.
 */
export default function InstructorCourseScreen() {
  const L = useInstructorText();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen>
      <Stack.Screen options={{ title: L.courses }} />
      <InstructorOnly>
        <CourseDetail id={String(id ?? '')} />
      </InstructorOnly>
    </Screen>
  );
}

function CourseDetail({ id }: { id: string }) {
  const L = useInstructorText();
  const { n, date } = useI18n();
  const query = useQuery(() => getInstructorCourse(id), [id]);

  return (
    <QueryView query={query}>
      {(course) => (
        <View style={{ gap: spacing.lg }}>
          <SectionTitle title={course.titleAr} />
          <Txt variant="tiny" color={colors.textMuted}>
            {course.titleEn}
          </Txt>

          {course.summaryAr || course.descAr ? (
            <Txt variant="small" color={colors.textMuted}>
              {course.summaryAr ?? course.descAr}
            </Txt>
          ) : null}

          <Row wrap gap={spacing.xs}>
            <Badge
              label={course.published ? L.published : L.unpublished}
              tone={course.published ? 'success' : 'neutral'}
            />
            {!course.visible ? <Badge label={L.hidden} tone="neutral" /> : null}
            {course.stage ? <Badge label={`${L.stage}: ${course.stage.titleAr}`} tone="gold" /> : null}
            {course.hours != null ? <Badge label={`${n(course.hours)} ${L.hours}`} tone="neutral" /> : null}
            {course.startsOn ? (
              <Badge label={`${L.startsOn}: ${date(course.startsOn)}`} tone="neutral" />
            ) : null}
          </Row>

          <ReadOnlyNotice />

          {/* ————— بنية المقرّر ————— */}
          <SectionTitle title={`${L.courseStructure} (${n(course.counts.lessons)})`} ornate={false} />
          {course.modules.length === 0 ? (
            <Card>
              <Txt variant="small" color={colors.textMuted}>
                {L.noModules}
              </Txt>
            </Card>
          ) : (
            <View style={{ gap: spacing.md }}>
              {course.modules.map((m) => (
                <ModuleCard key={m.id} module={m} L={L} />
              ))}
            </View>
          )}

          {/* ————— طلاب المقرّر ————— */}
          <SectionTitle
            title={`${L.courseStudents} (${n(course.counts.students)})`}
            ornate={false}
          />
          {course.students.length === 0 ? (
            <Card>
              <Txt variant="small" color={colors.textMuted}>
                {L.noCourseStudents}
              </Txt>
            </Card>
          ) : (
            <View style={{ gap: spacing.md }}>
              {course.students.map((row) => (
                <StudentCard key={row.id} row={row} L={L} />
              ))}
            </View>
          )}
        </View>
      )}
    </QueryView>
  );
}

function ModuleCard({ module: m, L }: { module: InstructorModule; L: InstructorText }) {
  const { n } = useI18n();
  return (
    <Card style={{ gap: spacing.sm }}>
      <Row justify="space-between" gap={spacing.sm}>
        <View style={{ flex: 1 }}>
          <Txt variant="heading">{`${n(m.order)}. ${m.titleAr}`}</Txt>
          <Txt variant="tiny" color={colors.textMuted}>
            {m.titleEn}
          </Txt>
        </View>
        {!m.visible ? <Badge label={L.hidden} tone="neutral" /> : null}
      </Row>

      {m.lessons.length === 0 ? (
        <Txt variant="small" color={colors.textMuted}>
          {L.noLessons}
        </Txt>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {m.lessons.map((lesson) => (
            <View key={lesson.id} style={{ gap: spacing.xs }}>
              <Divider />
              <LessonRow lesson={lesson} L={L} />
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const kindLabel = (kind: InstructorLesson['kind'], L: InstructorText): string =>
  ({
    VIDEO: L.kindVIDEO,
    PDF: L.kindPDF,
    TEXT: L.kindTEXT,
    LIVE: L.kindLIVE,
    QUIZ: L.kindQUIZ,
  })[kind] ?? kind;

function LessonRow({ lesson, L }: { lesson: InstructorLesson; L: InstructorText }) {
  const { n } = useI18n();
  return (
    <View style={{ gap: spacing.xs }}>
      <Txt variant="small">{`${n(lesson.order)}. ${lesson.titleAr}`}</Txt>
      <Row wrap gap={spacing.xs}>
        <Badge label={kindLabel(lesson.kind, L)} tone="gold" />
        {lesson.durationMin ? (
          <Badge label={`${n(lesson.durationMin)} ${L.minutesShort}`} tone="neutral" />
        ) : null}
        {lesson.attachmentCount > 0 ? (
          <Badge label={`${n(lesson.attachmentCount)} ${L.attachments}`} tone="neutral" />
        ) : null}
        {lesson.freePreview ? <Badge label={L.freePreview} tone="success" /> : null}
        {!lesson.visible ? <Badge label={L.hidden} tone="neutral" /> : null}
      </Row>
    </View>
  );
}

const statusLabel = (status: CourseStudentRow['status'], L: InstructorText): string =>
  ({
    PENDING: L.enrollPENDING,
    ACTIVE: L.enrollACTIVE,
    COMPLETED: L.enrollCOMPLETED,
    CANCELLED: L.enrollCANCELLED,
  })[status] ?? status;

const statusTone = (status: CourseStudentRow['status']) =>
  status === 'ACTIVE' ? 'success' : status === 'CANCELLED' ? 'danger' : 'neutral';

function StudentCard({ row, L }: { row: CourseStudentRow; L: InstructorText }) {
  const { n, date } = useI18n();
  return (
    <Card style={{ gap: spacing.sm }}>
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

      <ProgressBar pct={row.progressPct} label={`${L.progress}: ${n(row.progressPct)}٪`} />

      <Row wrap gap={spacing.md}>
        {row.student.studentNo ? (
          <Txt variant="tiny" color={colors.textMuted}>
            {`${L.studentNo}: ${n(row.student.studentNo)}`}
          </Txt>
        ) : null}
        <Txt variant="tiny" color={colors.textMuted}>
          {`${L.enrolledAt}: ${date(row.enrolledAt)}`}
        </Txt>
      </Row>
    </Card>
  );
}
