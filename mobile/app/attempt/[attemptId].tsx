import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../src/i18n';
import { getAttempt } from '../../src/api/endpoints';
import type { RevealedQuestion } from '../../src/api/types';
import { colors, radius, spacing } from '../../src/theme';
import { Button } from '../../src/ui/Button';
import { Badge, Card, Divider, InfoRow, Row, Screen, Txt } from '../../src/ui/kit';
import { RequireAuth } from '../../src/ui/RequireAuth';
import { QueryView, useQuery } from '../../src/ui/states';

export default function AttemptScreen() {
  return (
    <Screen>
      <RequireAuth>
        <AttemptBody />
      </RequireAuth>
    </Screen>
  );
}

function AttemptBody() {
  const { attemptId } = useLocalSearchParams<{ attemptId: string }>();
  const { t, pick, n, dateTime } = useI18n();
  const router = useRouter();
  const query = useQuery(() => getAttempt(attemptId), [attemptId]);

  return (
    <QueryView query={query}>
      {(data) => {
        // الإجابات الصحيحة والشروح لا تصل إلّا بعد التسليم.
        if (!data.submitted) {
          return (
            <>
              <Txt variant="title">{pick(data.quiz.titleAr, data.quiz.titleEn)}</Txt>
              <Card style={{ gap: spacing.md }}>
                <Txt variant="small" color={colors.textMuted}>
                  {data.attempt.expired ? t('quizExpired') : t('quizResume')}
                </Txt>
                <Button label={t('quizResume')} onPress={() => router.replace(`/quiz/${data.quiz.id}`)} />
              </Card>
            </>
          );
        }

        const { result } = data;
        return (
          <>
            <Txt variant="title">{pick(data.quiz.titleAr, data.quiz.titleEn)}</Txt>

            {result.late ? (
              <Card style={{ backgroundColor: colors.dangerBg, borderColor: '#E7D6D6' }}>
                <Txt variant="small" color={colors.danger}>
                  {t('quizLate')}
                </Txt>
              </Card>
            ) : null}

            {result.needsManualReview ? (
              <Card style={{ backgroundColor: colors.warningBg, borderColor: '#E9D9B5' }}>
                <Txt variant="small" color={colors.warning}>
                  {t('quizNeedsReview')}
                </Txt>
              </Card>
            ) : null}

            <Card style={{ gap: spacing.md }}>
              <Row justify="space-between">
                <Txt variant="heading">{t('quizResult')}</Txt>
                {result.passed === true ? <Badge label={t('quizPassed')} tone="success" /> : null}
                {result.passed === false ? <Badge label={t('quizFailed')} tone="danger" /> : null}
                {result.passed === null ? <Badge label={t('quizPending')} tone="warning" /> : null}
              </Row>
              <Divider />
              <InfoRow label={t('quizResult')} value={result.score === null ? t('quizPending') : `${n(result.score)}٪`} />
              <InfoRow label={t('quizPassScore')} value={`${n(data.quiz.passScore)}٪`} />
              <InfoRow label={t('quizPoints')} value={n(result.earnedPoints)} />
              <InfoRow label={t('assignmentSubmitted')} value={dateTime(result.submittedAt)} />
            </Card>

            <Txt variant="heading">{t('quizQuestions')}</Txt>
            {result.questions.map((q, index) => (
              <QuestionReview key={q.id} question={q} index={index} />
            ))}
          </>
        );
      }}
    </QueryView>
  );
}

function QuestionReview({ question, index }: { question: RevealedQuestion; index: number }) {
  const { t, pick, n } = useI18n();
  const outcome = question.outcome;

  // `correct === null` تعني «لم يُصحَّح بعد» لا «خطأ».
  const tone = outcome?.correct === true ? 'success' : outcome?.correct === false ? 'danger' : 'warning';
  const label =
    outcome?.correct === true ? t('quizPassed') : outcome?.correct === false ? t('quizFailed') : t('quizPending');

  return (
    <Card style={{ gap: spacing.md }}>
      <Row justify="space-between" align="flex-start" gap={spacing.md}>
        <Txt variant="heading" style={{ flexShrink: 1 }}>
          {n(index + 1)}. {pick(question.textAr, question.textEn)}
        </Txt>
        <Badge label={label} tone={tone} />
      </Row>

      {question.kind === 'SHORT' ? (
        <View style={{ gap: spacing.xs }}>
          <Txt variant="tiny" color={colors.textMuted}>
            {t('quizYourAnswer')}
          </Txt>
          <Txt variant="small">{outcome?.textAnswer?.trim() || t('quizNoAnswer')}</Txt>
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {question.choices.map((choice) => {
            const bg = choice.correct ? colors.successBg : choice.selected ? colors.dangerBg : colors.surface;
            const border = choice.correct ? '#CDE6D8' : choice.selected ? '#E7D6D6' : colors.border;
            return (
              <Row
                key={choice.id}
                gap={spacing.md}
                align="flex-start"
                style={{
                  padding: spacing.md,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: border,
                  backgroundColor: bg,
                }}
              >
                <Ionicons
                  name={choice.correct ? 'checkmark-circle' : choice.selected ? 'close-circle' : 'ellipse-outline'}
                  size={18}
                  color={choice.correct ? colors.success : choice.selected ? colors.danger : colors.textMuted}
                />
                <Txt variant="small" style={{ flexShrink: 1 }}>
                  {pick(choice.textAr, choice.textEn)}
                </Txt>
              </Row>
            );
          })}
        </View>
      )}

      {question.explainAr || question.explainEn ? (
        <View style={{ gap: spacing.xs }}>
          <Divider />
          <Txt variant="tiny" color={colors.textMuted}>
            {t('quizExplanation')}
          </Txt>
          <Txt variant="small">{pick(question.explainAr, question.explainEn)}</Txt>
        </View>
      ) : null}

      <Txt variant="tiny" color={colors.textMuted}>
        {t('quizPoints')}: {n(outcome?.awarded ?? 0)} {t('of')} {n(question.points)}
      </Txt>
    </Card>
  );
}
