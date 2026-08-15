import React from 'react';
import { View } from 'react-native';
import { Stack, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../src/i18n';
import { getInstructorSummary } from '../../src/api/instructor';
import { colors, spacing } from '../../src/theme';
import { Button } from '../../src/ui/Button';
import { Card, NavyPanel, PressableCard, Row, Screen, SectionTitle, Txt } from '../../src/ui/kit';
import { GoldTitle, OrnamentRule, ThuluthText } from '../../src/ui/gold';
import { QueryView, useQuery } from '../../src/ui/states';
import { InstructorOnly, NoScholarNotice, useInstructorText } from '../../src/instructor/ui';

/**
 * الشاشة الرئيسة للوحة الأكاديميين — نداءٌ واحد (`/instructor/summary`) يملأها.
 *
 * لوحةُ قراءةٍ لا تحرير: التحرير كلّه في لوحة الإدارة على الويب، ولا يُنسخ
 * إلى الجوّال حتى لا يصير التطبيق بابًا ثانيًا لتعديل بيانات المقرّرات.
 */
export default function InstructorHomeScreen() {
  const L = useInstructorText();
  return (
    <Screen>
      <Stack.Screen options={{ title: L.console }} />
      <InstructorOnly>
        <Summary />
      </InstructorOnly>
    </Screen>
  );
}

function Summary() {
  const L = useInstructorText();
  const { n, dateTime } = useI18n();
  const router = useRouter();
  const query = useQuery(() => getInstructorSummary(), []);

  return (
    <QueryView query={query}>
      {(data) => (
        <View style={{ gap: spacing.lg }}>
          <NavyPanel style={{ gap: spacing.sm }}>
            <GoldTitle variant="ceremonial" align="center">
              {data.scholarName ?? data.name}
            </GoldTitle>
            <OrnamentRule />
            <Txt variant="small" color={colors.textOnNavyMuted} align="center">
              {`${L.welcome} ${data.name} — ${L.consoleIntro}`}
            </Txt>
          </NavyPanel>

          {/* الحساب غير المربوط بملفّ هيئة: الأصفار هنا خللُ إعدادٍ لا نتيجةَ عمل. */}
          {!data.scholarLinked ? (
            <NoScholarNotice />
          ) : (
            <>
              <View style={{ gap: spacing.md }}>
                <StatTile
                  icon="layers-outline"
                  label={L.statCourses}
                  value={n(data.coursesCount)}
                  href="/instructor/courses"
                />
                <StatTile
                  icon="school-outline"
                  label={L.statStudents}
                  value={n(data.studentsCount)}
                  href="/instructor/students"
                />
                <StatTile
                  icon="clipboard-outline"
                  label={L.statGrading}
                  value={n(data.pendingGrading)}
                  href="/instructor/courses"
                />
                <StatTile
                  icon="radio-outline"
                  label={L.sessions}
                  value={null}
                  href="/instructor/sessions"
                />
              </View>

              <SectionTitle title={L.nextSession} />
              <Card style={{ gap: spacing.sm }}>
                {(() => {
                  const next = data.nextSession;
                  if (!next) {
                    return (
                      <Txt variant="small" color={colors.textMuted}>
                        {L.noNextSession}
                      </Txt>
                    );
                  }
                  return (
                    <>
                      <Txt variant="heading">{next.titleAr}</Txt>
                      <Txt variant="small" color={colors.textMuted}>
                        {dateTime(next.startsAt)}
                        {next.course ? ` — ${next.course.titleAr}` : ''}
                      </Txt>
                      <Button
                        label={L.sessionDetails}
                        kind="ghost"
                        small
                        onPress={() => router.push(`/instructor/sessions/${next.id}`)}
                      />
                    </>
                  );
                })()}
              </Card>
            </>
          )}
        </View>
      )}
    </QueryView>
  );
}

function StatTile({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string | null;
  href: Href;
}) {
  const router = useRouter();
  return (
    <PressableCard onPress={() => router.push(href)}>
      <Row justify="space-between">
        <Row gap={spacing.md}>
          <Ionicons name={icon} size={22} color={colors.navy} />
          <Txt variant="bodyStrong">{label}</Txt>
        </Row>
        <Row gap={spacing.sm}>
          {/* رقمٌ بخطّ الثلث بلونٍ ذهبيٍّ غامق — التدرّج اللامع لا يُقرأ على الكريميّ. */}
          {value !== null ? (
            <ThuluthText variant="numeral" color={colors.goldDark}>
              {value}
            </ThuluthText>
          ) : null}
          <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
        </Row>
      </Row>
    </PressableCard>
  );
}
