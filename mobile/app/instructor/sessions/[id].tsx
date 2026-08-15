import React from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useI18n } from '../../../src/i18n';
import { getInstructorSession, type AttendanceRow } from '../../../src/api/instructor';
import { colors, spacing } from '../../../src/theme';
import { Button } from '../../../src/ui/Button';
import { Badge, Card, Row, Screen, SectionTitle, Txt } from '../../../src/ui/kit';
import { openExternal } from '../../../src/ui/openLink';
import { QueryView, useQuery } from '../../../src/ui/states';
import {
  InstructorOnly,
  Notice,
  StartSessionCard,
  useInstructorText,
  type InstructorText,
} from '../../../src/instructor/ui';

/**
 * تفاصيل مجلسٍ وحضوره — والموضع الطبيعيّ لزرّ «ابدأ المجلس».
 *
 * الخادم يردّ ٤٠٤ لمجلسٍ ليس للمحاضر (شرطان مجتمعان في الاستعلام)، فلا يصل
 * `zoomStartUrl` إلى هذه الشاشة إلّا وهو رابط صاحبها.
 */
export default function InstructorSessionScreen() {
  const L = useInstructorText();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen>
      <Stack.Screen options={{ title: L.sessions }} />
      <InstructorOnly>
        <SessionDetail id={String(id ?? '')} />
      </InstructorOnly>
    </Screen>
  );
}

function SessionDetail({ id }: { id: string }) {
  const L = useInstructorText();
  const { n, dateTime } = useI18n();
  const query = useQuery(() => getInstructorSession(id), [id]);

  return (
    <QueryView query={query}>
      {(s) => (
        <View style={{ gap: spacing.lg }}>
          <SectionTitle title={s.titleAr} />

          <Row wrap gap={spacing.xs}>
            {s.isLiveNow ? <Badge label={L.liveNow} tone="danger" /> : null}
            {s.isPublic ? <Badge label={L.publicSession} tone="neutral" /> : null}
            {!s.visible ? <Badge label={L.hidden} tone="neutral" /> : null}
          </Row>

          <Txt variant="small" color={colors.textMuted}>
            {`${dateTime(s.startsAt)} · ${n(s.durationMin)} ${L.minutes}`}
            {s.course ? ` · ${s.course.titleAr}` : s.stage ? ` · ${s.stage.titleAr}` : ''}
          </Txt>

          {s.descAr ? <Txt variant="small">{s.descAr}</Txt> : null}

          <Card style={{ gap: spacing.md }}>
            <StartSessionCard
              zoomStartUrl={s.zoomStartUrl}
              joinUrl={s.joinUrl}
              passcode={s.passcode}
            />
          </Card>

          {s.recordingUrl ? (
            <Card style={{ gap: spacing.sm }}>
              <Txt variant="heading">{L.recording}</Txt>
              {s.recordingPasscode ? (
                <Row gap={spacing.sm}>
                  <Txt variant="small" color={colors.textMuted}>
                    {L.recordingPasscode}
                  </Txt>
                  <Badge label={s.recordingPasscode} tone="neutral" />
                </Row>
              ) : null}
              <Button
                label={L.openRecording}
                kind="ghost"
                small
                onPress={() => void openExternal(s.recordingUrl)}
              />
            </Card>
          ) : null}

          <SectionTitle
            title={`${L.attendance} — ${n(s.attendance.present)} / ${n(s.attendance.total)}`}
            ornate={false}
          />
          {s.attendance.rows.length === 0 ? (
            <Notice
              tone="info"
              icon="people-outline"
              body={s.ended ? L.noAttendanceEnded : L.noAttendanceUpcoming}
            />
          ) : (
            <View style={{ gap: spacing.md }}>
              {s.attendance.rows.map((row) => (
                <AttendanceCard key={row.id} row={row} L={L} />
              ))}
            </View>
          )}
        </View>
      )}
    </QueryView>
  );
}

function AttendanceCard({ row, L }: { row: AttendanceRow; L: InstructorText }) {
  const { n, dateTime } = useI18n();
  return (
    <Card style={{ gap: spacing.xs }}>
      <Row justify="space-between" align="flex-start" gap={spacing.sm}>
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong">{row.student.name}</Txt>
          <Txt variant="tiny" color={colors.textMuted}>
            {row.student.email}
          </Txt>
        </View>
        <Badge label={row.present ? L.present : L.absent} tone={row.present ? 'success' : 'danger'} />
      </Row>
      <Txt variant="tiny" color={colors.textMuted}>
        {`${L.joinedAt}: ${dateTime(row.joinedAt)} · ${L.leftAt}: ${dateTime(row.leftAt)}`}
      </Txt>
      <Txt variant="tiny" color={colors.textMuted}>
        {`${n(row.minutes)} ${L.minutesShort} · ${L.source}: ${row.source === 'zoom' ? 'Zoom' : L.sourceManual}`}
      </Txt>
    </Card>
  );
}
