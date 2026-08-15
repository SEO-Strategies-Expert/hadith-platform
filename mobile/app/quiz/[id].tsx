import React, { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../src/i18n';
import { messageOf } from '../../src/api/client';
import { getQuiz, startAttempt, submitAttempt } from '../../src/api/endpoints';
import type { OpenAttempt, QuizCard, SafeQuestion } from '../../src/api/types';
import { colors, radius, spacing } from '../../src/theme';
import { Button } from '../../src/ui/Button';
import { Badge, Card, Divider, InfoRow, Row, Screen, Txt } from '../../src/ui/kit';
import { Field } from '../../src/ui/Field';
import { Countdown } from '../../src/ui/Countdown';
import { RequireAuth } from '../../src/ui/RequireAuth';
import { ErrorState, QueryView, useQuery } from '../../src/ui/states';

/**
 * الأسئلة لا تصل إلّا مع محاولة مفتوحة، فتُؤدَّى المحاولة في هذه الشاشة نفسها.
 * الإجابات تبقى في ذاكرة الشاشة ولا تُكتب في أي تخزين محلّي.
 */

type Answers = Record<string, string[] | string>;

export default function QuizScreen() {
  return (
    <Screen>
      <RequireAuth>
        <QuizBody />
      </RequireAuth>
    </Screen>
  );
}

function QuizBody() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, pick, n } = useI18n();
  const query = useQuery(() => getQuiz(id), [id]);

  const [attempt, setAttempt] = useState<OpenAttempt | null>(null);
  const [quizOverride, setQuizOverride] = useState<QuizCard | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const begin = useCallback(async () => {
    setStarting(true);
    setStartError(null);
    try {
      const result = await startAttempt(id);
      setQuizOverride(result.quiz);
      setAttempt(result.attempt);
    } catch (err) {
      setStartError(messageOf(err));
    } finally {
      setStarting(false);
    }
  }, [id]);

  return (
    <QueryView query={query}>
      {(data) => {
        const quiz = quizOverride ?? data.quiz;
        const active = attempt ?? data.openAttempt;

        // ————— أداء المحاولة —————
        if (active) {
          return (
            <>
              <Stack.Screen options={{ title: pick(quiz.titleAr, quiz.titleEn) }} />
              <AttemptForm quiz={quiz} attempt={active} />
            </>
          );
        }

        // ————— عرض الاختبار قبل البدء —————
        return (
          <>
            <Stack.Screen options={{ title: pick(quiz.titleAr, quiz.titleEn) }} />

            <Txt variant="title">{pick(quiz.titleAr, quiz.titleEn)}</Txt>
            {quiz.descAr || quiz.descEn ? (
              <Txt variant="body" color={colors.textMuted}>
                {pick(quiz.descAr, quiz.descEn)}
              </Txt>
            ) : null}

            <Card style={{ gap: spacing.md }}>
              <InfoRow label={t('quizQuestions')} value={n(data.questionCount)} />
              <InfoRow label={t('quizPassScore')} value={`${n(quiz.passScore)}٪`} />
              <InfoRow
                label={t('quizTimeLimit')}
                value={quiz.timeLimitMin ? `${n(quiz.timeLimitMin)} ${t('minutes')}` : t('quizNoTimeLimit')}
              />
              <InfoRow
                label={t('quizAttemptsLeft')}
                value={data.attemptsLeft === null ? t('quizAttemptsUnlimited') : n(data.attemptsLeft)}
              />
            </Card>

            {startError ? <ErrorState message={startError} onRetry={() => void begin()} /> : null}

            {data.canStart ? (
              <Button
                label={starting ? t('quizStarting') : t('quizStart')}
                loading={starting}
                onPress={() => void begin()}
              />
            ) : (
              <Card style={{ backgroundColor: colors.warningBg, borderColor: '#E9D9B5' }}>
                <Txt variant="small" color={colors.warning}>
                  {t('quizCannotStart')}
                </Txt>
              </Card>
            )}

            <Txt variant="heading">{t('quizPreviousAttempts')}</Txt>
            {data.attempts.length === 0 ? (
              <Card>
                <Txt variant="small" color={colors.textMuted}>
                  {t('quizNoAttempts')}
                </Txt>
              </Card>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {data.attempts.map((a) => (
                  <AttemptRow key={a.id} attemptId={a.id} submittedAt={a.submittedAt} score={a.score} passed={a.passed} />
                ))}
              </View>
            )}
          </>
        );
      }}
    </QueryView>
  );
}

function AttemptRow({
  attemptId,
  submittedAt,
  score,
  passed,
}: {
  attemptId: string;
  submittedAt: string | null;
  score: number | null;
  passed: boolean | null;
}) {
  const { t, n, dateTime } = useI18n();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/attempt/${attemptId}`)}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          padding: spacing.md,
        },
        pressed ? { opacity: 0.7 } : null,
      ]}
    >
      <Row justify="space-between">
        <View style={{ gap: 2 }}>
          <Txt variant="small">{dateTime(submittedAt)}</Txt>
          <Txt variant="tiny" color={colors.textMuted}>
            {score === null ? t('quizPending') : `${t('quizResult')}: ${n(score)}٪`}
          </Txt>
        </View>
        <Row gap={spacing.sm}>
          {passed === true ? <Badge label={t('quizPassed')} tone="success" /> : null}
          {passed === false ? <Badge label={t('quizFailed')} tone="danger" /> : null}
          {passed === null ? <Badge label={t('quizPending')} tone="warning" /> : null}
          <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
        </Row>
      </Row>
    </Pressable>
  );
}

/* ————————— نموذج المحاولة ————————— */

function AttemptForm({ quiz, attempt }: { quiz: QuizCard; attempt: OpenAttempt }) {
  const { t, pick, n } = useI18n();
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setChoice = (q: SafeQuestion, choiceId: string) => {
    setAnswers((current) => {
      if (q.kind === 'MULTI') {
        const existing = Array.isArray(current[q.id]) ? (current[q.id] as string[]) : [];
        const next = existing.includes(choiceId)
          ? existing.filter((c) => c !== choiceId)
          : [...existing, choiceId];
        return { ...current, [q.id]: next };
      }
      return { ...current, [q.id]: choiceId };
    });
  };

  const setText = (questionId: string, text: string) =>
    setAnswers((current) => ({ ...current, [questionId]: text }));

  const isSelected = (q: SafeQuestion, choiceId: string) => {
    const value = answers[q.id];
    if (Array.isArray(value)) return value.includes(choiceId);
    return value === choiceId;
  };

  const doSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // نُسلّم دائمًا حتّى لو بدا الوقت منقضيًا — الخادم هو الفصل.
      const result = await submitAttempt(attempt.id, answers);
      router.replace(`/attempt/${result.result.id}`);
    } catch (err) {
      setError(messageOf(err));
      setSubmitting(false);
    }
  };

  const confirmSubmit = () => {
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (typeof window !== 'undefined' && window.confirm(t('quizConfirmSubmitBody'))) void doSubmit();
      return;
    }
    Alert.alert(t('quizConfirmSubmit'), t('quizConfirmSubmitBody'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('quizSubmit'), onPress: () => void doSubmit() },
    ]);
  };

  const answeredCount = attempt.questions.filter((q) => {
    const v = answers[q.id];
    if (Array.isArray(v)) return v.length > 0;
    return typeof v === 'string' && v.trim().length > 0;
  }).length;

  return (
    <>
      <Card style={{ gap: spacing.sm }}>
        <Txt variant="heading">{pick(quiz.titleAr, quiz.titleEn)}</Txt>
        <Row justify="space-between">
          <Txt variant="small" color={colors.textMuted}>
            {t('quizAnswered')}: {n(answeredCount)} {t('of')} {n(attempt.questions.length)}
          </Txt>
          <Countdown deadline={attempt.deadline} label={t('quizDeadline')} />
        </Row>
        {attempt.expired ? (
          <Txt variant="tiny" color={colors.danger}>
            {t('quizExpired')}
          </Txt>
        ) : null}
      </Card>

      {attempt.questions.map((q, index) => (
        <Card key={q.id} style={{ gap: spacing.md }}>
          <Row justify="space-between" align="flex-start" gap={spacing.md}>
            <Txt variant="heading" style={{ flexShrink: 1 }}>
              {n(index + 1)}. {pick(q.textAr, q.textEn)}
            </Txt>
            <Badge label={`${n(q.points)} ${t('quizPoints')}`} />
          </Row>

          {q.kind === 'MULTI' ? (
            <Txt variant="tiny" color={colors.textMuted}>
              {t('quizMultiHint')}
            </Txt>
          ) : null}

          {q.kind === 'SHORT' ? (
            <Field
              label={t('quizShortAnswerHint')}
              value={typeof answers[q.id] === 'string' ? (answers[q.id] as string) : ''}
              onChangeText={(text) => setText(q.id, text)}
              multiline
              editable={!submitting}
            />
          ) : (
            <View style={{ gap: spacing.sm }}>
              {q.choices.map((choice) => {
                const selected = isSelected(q, choice.id);
                return (
                  <Pressable
                    key={choice.id}
                    disabled={submitting}
                    onPress={() => setChoice(q, choice.id)}
                    style={({ pressed }) => [
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.md,
                        padding: spacing.md,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: selected ? colors.gold : colors.border,
                        backgroundColor: selected ? colors.goldLight : colors.surface,
                      },
                      pressed ? { opacity: 0.75 } : null,
                    ]}
                  >
                    <Ionicons
                      name={
                        q.kind === 'MULTI'
                          ? selected
                            ? 'checkbox'
                            : 'square-outline'
                          : selected
                            ? 'radio-button-on'
                            : 'radio-button-off'
                      }
                      size={20}
                      color={selected ? '#8A6320' : colors.textMuted}
                    />
                    <Txt variant="small" style={{ flexShrink: 1 }}>
                      {pick(choice.textAr, choice.textEn)}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>
          )}
        </Card>
      ))}

      {error ? <ErrorState message={error} onRetry={() => void doSubmit()} /> : null}

      <Divider />
      <Button
        label={submitting ? t('quizSubmitting') : t('quizSubmit')}
        loading={submitting}
        onPress={confirmSubmit}
      />
    </>
  );
}
