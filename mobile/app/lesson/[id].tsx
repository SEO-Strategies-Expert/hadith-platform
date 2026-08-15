import React, { useState } from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/auth/AuthContext';
import { useI18n } from '../../src/i18n';
import { messageOf } from '../../src/api/client';
import { getLesson, setLessonProgress } from '../../src/api/endpoints';
import { colors, spacing } from '../../src/theme';
import { Button } from '../../src/ui/Button';
import { Badge, Card, Divider, PressableCard, Row, Screen, Txt } from '../../src/ui/kit';
import { SessionTile } from '../../src/ui/cards';
import { ErrorState, QueryView, useQuery } from '../../src/ui/states';
import { VideoPlayer } from '../../src/ui/VideoPlayer';
import { openExternal } from '../../src/ui/openLink';
import { resolveVideo } from '../../src/ui/videoUrl';

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, pick, n } = useI18n();
  const { status } = useAuth();
  const router = useRouter();
  const authed = status === 'authed';

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const query = useQuery(() => getLesson(id, authed), [id, authed]);

  const toggleDone = async (done: boolean) => {
    setSaving(true);
    setSaveError(null);
    try {
      const result = await setLessonProgress(id, done);
      // النسبة تُحسب على الخادم؛ نكتفي بمزامنة حالة الدرس محلّيًّا.
      query.setData((current) => (current ? { ...current, done: result.done } : current));
    } catch (err) {
      setSaveError(messageOf(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <QueryView query={query}>
        {(lesson) => {
          const video = resolveVideo(lesson.videoUrl);
          return (
            <>
              <Stack.Screen options={{ title: pick(lesson.titleAr, lesson.titleEn) }} />

              <View style={{ gap: spacing.xs }}>
                <Txt variant="tiny" color={colors.textMuted}>
                  {pick(lesson.course.titleAr, lesson.course.titleEn)} ·{' '}
                  {pick(lesson.module.titleAr, lesson.module.titleEn)}
                </Txt>
                <Txt variant="title">{pick(lesson.titleAr, lesson.titleEn)}</Txt>
                <Row gap={spacing.sm} wrap>
                  {lesson.durationMin ? (
                    <Badge label={`${n(lesson.durationMin)} ${t('minutes')}`} />
                  ) : null}
                  {lesson.freePreview && !lesson.enrolled ? (
                    <Badge label={t('freePreview')} tone="gold" />
                  ) : null}
                  {lesson.done ? <Badge label={t('completed')} tone="success" /> : null}
                </Row>
              </View>

              {/* ————— المقطع المرئي ————— */}
              {video ? (
                <VideoPlayer url={lesson.videoUrl} />
              ) : lesson.kind === 'VIDEO' ? (
                <Card>
                  <Txt variant="small" color={colors.textMuted}>
                    {t('videoUnavailable')}
                  </Txt>
                </Card>
              ) : null}

              {video?.kind === 'embed' && lesson.videoUrl ? (
                <Button
                  label={t('openVideoExternally')}
                  kind="ghost"
                  small
                  onPress={() => void openExternal(lesson.videoUrl)}
                />
              ) : null}

              {/* ————— النصّ ————— */}
              <Card>
                {lesson.bodyAr || lesson.bodyEn ? (
                  <Txt variant="body">{pick(lesson.bodyAr, lesson.bodyEn)}</Txt>
                ) : (
                  <Txt variant="small" color={colors.textMuted}>
                    {t('lessonNoBody')}
                  </Txt>
                )}
              </Card>

              {/* ————— المرفقات ————— */}
              {lesson.attachments.length > 0 ? (
                <>
                  <Txt variant="heading">{t('lessonAttachments')}</Txt>
                  <View style={{ gap: spacing.sm }}>
                    {lesson.attachments.map((file) => (
                      <PressableCard
                        key={file.id}
                        onPress={() => void openExternal(file.url)}
                        style={{ paddingVertical: spacing.md }}
                      >
                        <Row justify="space-between">
                          <Row gap={spacing.md} style={{ flexShrink: 1 }}>
                            <Ionicons name="document-attach-outline" size={20} color={colors.navy} />
                            <View style={{ flexShrink: 1 }}>
                              <Txt variant="small">{pick(file.titleAr, file.titleEn) || file.filename}</Txt>
                              {file.sizeKb ? (
                                <Txt variant="tiny" color={colors.textMuted}>
                                  {n(file.sizeKb)} KB
                                </Txt>
                              ) : null}
                            </View>
                          </Row>
                          <Ionicons name="open-outline" size={18} color={colors.textMuted} />
                        </Row>
                      </PressableCard>
                    ))}
                  </View>
                </>
              ) : null}

              {/* ————— المجلس والاختبار المرتبطان ————— */}
              {lesson.session ? (
                <>
                  <Txt variant="heading">{t('lessonSession')}</Txt>
                  <SessionTile session={lesson.session} />
                </>
              ) : null}

              {lesson.quiz ? (
                <Card style={{ gap: spacing.md }}>
                  <Txt variant="heading">{t('lessonQuiz')}</Txt>
                  <Txt variant="small" color={colors.textMuted}>
                    {pick(lesson.quiz.titleAr, lesson.quiz.titleEn)}
                  </Txt>
                  <Button
                    label={t('openQuiz')}
                    onPress={() => router.push(`/quiz/${lesson.quiz!.id}`)}
                  />
                </Card>
              ) : null}

              {/* ————— إتمام الدرس ————— */}
              {lesson.enrolled ? (
                <>
                  <Divider />
                  {saveError ? <ErrorState message={saveError} onRetry={() => void toggleDone(!lesson.done)} /> : null}
                  {lesson.done ? (
                    <Card style={{ gap: spacing.md, backgroundColor: colors.successBg, borderColor: '#CDE6D8' }}>
                      <Row gap={spacing.sm}>
                        <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                        <Txt variant="small" color={colors.success}>
                          {t('lessonDone')}
                        </Txt>
                      </Row>
                      <Button
                        label={saving ? t('lessonSaving') : t('lessonMarkUndone')}
                        kind="ghost"
                        small
                        loading={saving}
                        onPress={() => void toggleDone(false)}
                      />
                    </Card>
                  ) : (
                    <Button
                      label={saving ? t('lessonSaving') : t('lessonMarkDone')}
                      loading={saving}
                      onPress={() => void toggleDone(true)}
                    />
                  )}
                </>
              ) : null}

              {/* ————— التنقّل بين الدروس ————— */}
              {lesson.prev || lesson.next ? (
                <Row gap={spacing.md} justify="space-between">
                  {lesson.prev ? (
                    <Button
                      label={t('lessonPrev')}
                      kind="ghost"
                      small
                      style={{ flex: 1 }}
                      onPress={() => router.replace(`/lesson/${lesson.prev!.id}`)}
                    />
                  ) : (
                    <View style={{ flex: 1 }} />
                  )}
                  {lesson.next ? (
                    <Button
                      label={t('lessonNext')}
                      kind="secondary"
                      small
                      style={{ flex: 1 }}
                      onPress={() => router.replace(`/lesson/${lesson.next!.id}`)}
                    />
                  ) : (
                    <View style={{ flex: 1 }} />
                  )}
                </Row>
              ) : null}
            </>
          );
        }}
      </QueryView>
    </Screen>
  );
}
