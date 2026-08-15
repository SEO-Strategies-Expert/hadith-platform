import React from 'react';
import { Image, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from '../theme';
import { useI18n } from '../i18n';
import type { CourseCard as CourseCardType, NewsItem, SessionPublic, SessionStudent } from '../api/types';
import { Badge, PressableCard, ProgressBar, Row, Txt } from './kit';
import { Button } from './Button';
import { openExternal } from './openLink';

/* ————— بطاقة مقرّر ————— */

export function CourseTile({
  course,
  progressPct,
  statusLabel,
  onPress,
}: {
  course: CourseCardType;
  progressPct?: number;
  statusLabel?: string;
  onPress: () => void;
}) {
  const { pick, n, t } = useI18n();
  return (
    <PressableCard onPress={onPress} style={{ gap: spacing.md }}>
      {course.imageUrl ? (
        <Image
          source={{ uri: course.imageUrl }}
          style={{ width: '100%', height: 132, borderRadius: radius.md, backgroundColor: colors.border }}
          resizeMode="cover"
        />
      ) : null}

      <Row gap={spacing.sm} wrap>
        {course.stage ? <Badge label={pick(course.stage.titleAr, course.stage.titleEn)} tone="gold" /> : null}
        {statusLabel ? <Badge label={statusLabel} tone="neutral" /> : null}
      </Row>

      <Txt variant="heading">{pick(course.titleAr, course.titleEn)}</Txt>

      {course.summaryAr || course.summaryEn ? (
        <Txt variant="small" color={colors.textMuted} numberOfLines={3}>
          {pick(course.summaryAr, course.summaryEn)}
        </Txt>
      ) : null}

      <Row gap={spacing.lg} wrap>
        {course.instructor ? (
          <Txt variant="tiny" color={colors.textMuted}>
            {t('instructor')}: {pick(course.instructor.nameAr, course.instructor.nameEn)}
          </Txt>
        ) : null}
        {course.lessonCount !== null ? (
          <Txt variant="tiny" color={colors.textMuted}>
            {n(course.lessonCount)} {t('lesson')}
          </Txt>
        ) : null}
        {course.hours !== null ? (
          <Txt variant="tiny" color={colors.textMuted}>
            {n(course.hours)} {t('hours')}
          </Txt>
        ) : null}
      </Row>

      {progressPct !== undefined ? (
        <ProgressBar pct={progressPct} label={`${t('progress')} · ${n(Math.round(progressPct))}٪`} />
      ) : null}
    </PressableCard>
  );
}

/* ————— بطاقة مجلس ————— */

export function SessionTile({ session }: { session: SessionPublic | SessionStudent }) {
  const { pick, t, dateTime, n } = useI18n();
  const recordingUrl = 'recordingUrl' in session ? session.recordingUrl : null;
  const hasRecording = 'hasRecording' in session ? session.hasRecording : Boolean(recordingUrl);

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: session.isLiveNow ? colors.gold : colors.border,
        padding: spacing.lg,
        gap: spacing.md,
      }}
    >
      <Row gap={spacing.sm} wrap>
        {session.isLiveNow ? <Badge label={t('liveNow')} tone="gold" /> : null}
        {session.isPublic ? <Badge label={t('sessionPublicBadge')} tone="neutral" /> : null}
      </Row>

      <Txt variant="heading">{pick(session.titleAr, session.titleEn)}</Txt>

      <Txt variant="small" color={colors.textMuted}>
        {dateTime(session.startsAt)}
        {session.durationMin ? ` · ${n(session.durationMin)} ${t('minutes')}` : ''}
      </Txt>

      {session.course ? (
        <Txt variant="tiny" color={colors.textMuted}>
          {pick(session.course.titleAr, session.course.titleEn)}
        </Txt>
      ) : null}

      {session.instructor ? (
        <Txt variant="tiny" color={colors.textMuted}>
          {pick(session.instructor.nameAr, session.instructor.nameEn)}
        </Txt>
      ) : null}

      {/* رابط الانضمام لا يصل من الخادم إلّا داخل نافذة البثّ. */}
      {session.joinUrl ? (
        <>
          <Button label={t('joinNow')} onPress={() => void openExternal(session.joinUrl)} />
          {session.passcode ? (
            <Txt variant="tiny" color={colors.textMuted}>
              {t('passcode')}: {session.passcode}
            </Txt>
          ) : null}
        </>
      ) : (
        <Txt variant="tiny" color={colors.textMuted}>
          {t('notYetOpen')}
        </Txt>
      )}

      {recordingUrl ? (
        <Button label={t('openRecording')} kind="ghost" small onPress={() => void openExternal(recordingUrl)} />
      ) : hasRecording ? (
        <Txt variant="tiny" color={colors.textMuted}>
          {t('recording')}
        </Txt>
      ) : null}
    </View>
  );
}

/* ————— بطاقة خبر ————— */

export function NewsTile({ item }: { item: NewsItem }) {
  const { pick, date } = useI18n();
  const router = useRouter();
  return (
    <PressableCard onPress={() => router.push(`/news/${item.slug ?? item.id}`)} style={{ gap: spacing.sm }}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={{ width: '100%', height: 120, borderRadius: radius.md, backgroundColor: colors.border }}
          resizeMode="cover"
        />
      ) : null}
      {item.tagAr || item.tagEn ? <Badge label={pick(item.tagAr, item.tagEn)} tone="gold" /> : null}
      <Txt variant="heading">{pick(item.titleAr, item.titleEn)}</Txt>
      <Txt variant="tiny" color={colors.textMuted}>
        {date(item.date)}
      </Txt>
      {item.excerptAr || item.excerptEn ? (
        <Txt variant="small" color={colors.textMuted} numberOfLines={3}>
          {pick(item.excerptAr, item.excerptEn)}
        </Txt>
      ) : null}
    </PressableCard>
  );
}
