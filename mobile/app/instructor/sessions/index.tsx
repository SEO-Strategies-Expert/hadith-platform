import React from 'react';
import { View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useI18n } from '../../../src/i18n';
import { getInstructorSessions, type InstructorSession } from '../../../src/api/instructor';
import { colors, spacing } from '../../../src/theme';
import { Badge, Card, LivePulse, PressableCard, Row, Screen, SectionTitle, Txt } from '../../../src/ui/kit';
import { QueryView, useQuery } from '../../../src/ui/states';
import {
  InstructorOnly,
  NoScholarNotice,
  StartSessionCard,
  useInstructorText,
  type InstructorText,
} from '../../../src/instructor/ui';

/**
 * مجالس المحاضر — قادمة ومنتهية.
 *
 * أوّل مجلسٍ **مباشرٍ الآن** يُرفع إلى أعلى الشاشة ببطاقة بدءٍ كاملة: هذه هي
 * لحظة استعمال رابط المضيف، وإخفاؤها خلف نقرتين في أثناء انعقاد المجلس عبث.
 * وما دون ذلك فالرابط لا يظهر إلّا داخل شاشة المجلس.
 */
export default function InstructorSessionsScreen() {
  const L = useInstructorText();
  return (
    <Screen>
      <Stack.Screen options={{ title: L.sessions }} />
      <SectionTitle title={L.sessions} />
      <InstructorOnly>
        <SessionsList />
      </InstructorOnly>
    </Screen>
  );
}

function SessionsList() {
  const L = useInstructorText();
  const query = useQuery(() => getInstructorSessions(50), []);

  return (
    <QueryView
      query={query}
      isEmpty={(d) => d.scholarLinked && d.upcoming.length === 0 && d.past.length === 0}
      emptyText={L.noSessions}
      emptyIcon="calendar-outline"
    >
      {(data) => {
        if (!data.scholarLinked) return <NoScholarNotice />;
        const liveOne = data.upcoming.find((s) => s.isLiveNow);

        return (
          <View style={{ gap: spacing.lg }}>
            {liveOne ? <LiveCard session={liveOne} L={L} /> : null}

            {data.upcoming.length > 0 ? (
              <View style={{ gap: spacing.md }}>
                <SectionTitle title={L.upcoming} ornate={false} />
                {data.upcoming.map((s) => (
                  <SessionRow key={s.id} session={s} L={L} />
                ))}
              </View>
            ) : null}

            {data.past.length > 0 ? (
              <View style={{ gap: spacing.md }}>
                <SectionTitle title={L.past} ornate={false} />
                {data.past.map((s) => (
                  <SessionRow key={s.id} session={s} L={L} />
                ))}
              </View>
            ) : null}
          </View>
        );
      }}
    </QueryView>
  );
}

function LiveCard({ session, L }: { session: InstructorSession; L: InstructorText }) {
  const { dateTime } = useI18n();
  return (
    <Card style={{ gap: spacing.md }}>
      <Row gap={spacing.xs}>
        <LivePulse color={colors.danger} />
        <Badge label={L.liveNow} tone="danger" />
      </Row>
      <Txt variant="heading">{session.titleAr}</Txt>
      <Txt variant="small" color={colors.textMuted}>
        {dateTime(session.startsAt)}
      </Txt>
      {/* المجلس من استعلامٍ مصفّى بملكيّة المحاضر — فرابط المضيف رابطه هو. */}
      <StartSessionCard
        zoomStartUrl={session.zoomStartUrl}
        joinUrl={session.joinUrl}
        passcode={session.passcode}
      />
    </Card>
  );
}

function SessionRow({ session, L }: { session: InstructorSession; L: InstructorText }) {
  const { n, dateTime } = useI18n();
  const router = useRouter();

  return (
    <PressableCard
      onPress={() => router.push(`/instructor/sessions/${session.id}`)}
      style={{ gap: spacing.sm }}
    >
      <Txt variant="heading">{session.titleAr}</Txt>
      <Txt variant="small" color={colors.textMuted}>
        {`${dateTime(session.startsAt)} · ${n(session.durationMin)} ${L.minutes}`}
        {session.course ? ` · ${session.course.titleAr}` : session.stage ? ` · ${session.stage.titleAr}` : ''}
      </Txt>
      <Row wrap gap={spacing.xs}>
        {session.isLiveNow ? <Badge label={L.liveNow} tone="danger" /> : null}
        {session.isPublic ? <Badge label={L.publicSession} tone="neutral" /> : null}
        {!session.visible ? <Badge label={L.hidden} tone="neutral" /> : null}
        {session.recordingUrl ? <Badge label={L.recorded} tone="gold" /> : null}
        <Badge label={`${L.attendance}: ${n(session.attendanceCount)}`} tone="neutral" />
      </Row>
    </PressableCard>
  );
}
