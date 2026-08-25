import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useI18n } from '../../src/i18n';
import { messageOf } from '../../src/api/client';
import { getAssignment, saveAssignment } from '../../src/api/endpoints';
import type { AssignmentDetail, SubmissionState } from '../../src/api/types';
import type { StringKey } from '../../src/i18n/strings';
import { colors, latinInput, spacing } from '../../src/theme';
import { Button } from '../../src/ui/Button';
import { Field } from '../../src/ui/Field';
import { Badge, Card, Divider, InfoRow, Row, Screen, Txt } from '../../src/ui/kit';
import { RequireAuth } from '../../src/ui/RequireAuth';
import { ErrorState, QueryView, useQuery } from '../../src/ui/states';

const stateKey = (s: SubmissionState): StringKey => `state${s}` as StringKey;

export default function AssignmentScreen() {
  return (
    <Screen>
      <RequireAuth>
        <AssignmentBody />
      </RequireAuth>
    </Screen>
  );
}

function AssignmentBody() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, pick } = useI18n();
  const query = useQuery(() => getAssignment(id), [id]);

  return (
    <QueryView query={query}>
      {(assignment) => (
        <>
          <Stack.Screen options={{ title: pick(assignment.titleAr, assignment.titleEn) }} />
          <AssignmentForm assignment={assignment} onUpdated={(next) => query.setData(() => next)} />
        </>
      )}
    </QueryView>
  );
}

function AssignmentForm({
  assignment,
  onUpdated,
}: {
  assignment: AssignmentDetail;
  onUpdated: (next: AssignmentDetail) => void;
}) {
  const { t, pick, n, date, dateTime } = useI18n();
  const submission = assignment.submission;

  const [text, setText] = useState(submission?.text ?? '');
  const [fileUrl, setFileUrl] = useState(submission?.fileUrl ?? '');
  const [fileName, setFileName] = useState(submission?.fileName ?? '');
  const [busy, setBusy] = useState<'draft' | 'submit' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // إعادة المزامنة بعد تحديث البيانات من الخادم.
  useEffect(() => {
    setText(submission?.text ?? '');
    setFileUrl(submission?.fileUrl ?? '');
    setFileName(submission?.fileName ?? '');
  }, [submission?.text, submission?.fileUrl, submission?.fileName]);

  // التسليم المصحَّح مقفل — الخادم يردّ ٤٠٩، ونمنعه هنا قبل ذلك.
  const locked = submission?.state === 'GRADED';

  const persist = async (submit: boolean) => {
    if (submit && !text.trim() && !fileUrl.trim()) {
      setError(t('assignmentNeedContent'));
      return;
    }
    setBusy(submit ? 'submit' : 'draft');
    setError(null);
    setNotice(null);
    try {
      const next = await saveAssignment(assignment.id, {
        text: text.trim() || undefined,
        fileUrl: fileUrl.trim() || undefined,
        fileName: fileName.trim() || undefined,
        submit,
      });
      onUpdated(next);
      setNotice(submit ? t('assignmentSent') : t('assignmentSaved'));
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <View style={{ gap: spacing.sm }}>
        <Txt variant="tiny" color={colors.textMuted}>
          {pick(assignment.course.titleAr, assignment.course.titleEn)}
        </Txt>
        <Txt variant="title">{pick(assignment.titleAr, assignment.titleEn)}</Txt>
        <Row gap={spacing.sm} wrap>
          {submission ? (
            <Badge
              label={t(stateKey(submission.state))}
              tone={submission.state === 'GRADED' ? 'success' : 'neutral'}
            />
          ) : null}
          {assignment.overdue ? <Badge label={t('assignmentOverdue')} tone="danger" /> : null}
        </Row>
      </View>

      {assignment.descAr || assignment.descEn ? (
        <Card>
          <Txt variant="body">{pick(assignment.descAr, assignment.descEn)}</Txt>
        </Card>
      ) : null}

      <Card style={{ gap: spacing.md }}>
        <InfoRow
          label={t('assignmentDue')}
          value={assignment.dueAt ? date(assignment.dueAt) : t('assignmentNoDue')}
        />
        <InfoRow label={t('assignmentMaxScore')} value={n(assignment.maxScore)} />
        {submission?.submittedAt ? (
          <InfoRow label={t('assignmentSubmitted')} value={dateTime(submission.submittedAt)} />
        ) : null}
        {submission?.score !== null && submission?.score !== undefined ? (
          <InfoRow label={t('assignmentScore')} value={`${n(submission.score)} / ${n(assignment.maxScore)}`} />
        ) : null}
      </Card>

      {submission?.feedback ? (
        <Card style={{ gap: spacing.sm, backgroundColor: colors.goldLight, borderColor: colors.gold }}>
          <Txt variant="heading" color="#5F4712">
            {t('assignmentFeedback')}
          </Txt>
          <Txt variant="small" color="#5F4712">
            {submission.feedback}
          </Txt>
        </Card>
      ) : null}

      <Divider />

      {locked ? (
        <Card style={{ backgroundColor: colors.successBg, borderColor: '#CDE6D8' }}>
          <Txt variant="small" color={colors.success}>
            {t('assignmentGradedLock')}
          </Txt>
        </Card>
      ) : (
        <Card style={{ gap: spacing.lg }}>
          <Field
            label={t('assignmentText')}
            placeholder={t('assignmentTextPlaceholder')}
            value={text}
            onChangeText={setText}
            multiline
            editable={busy === null}
          />
          <Field
            label={`${t('assignmentFileUrl')} (${t('optional')})`}
            placeholder={t('assignmentFileUrlPlaceholder')}
            value={fileUrl}
            onChangeText={setFileUrl}
            autoCapitalize="none"
            keyboardType="url"
            editable={busy === null}
            style={latinInput}
            hint={t('assignmentUploadNote')}
          />
          {fileUrl.trim() ? (
            <Field
              label={`${t('assignmentFileName')} (${t('optional')})`}
              value={fileName}
              onChangeText={setFileName}
              editable={busy === null}
            />
          ) : null}

          {error ? <ErrorState message={error} /> : null}
          {notice ? (
            <Txt variant="small" color={colors.success}>
              {notice}
            </Txt>
          ) : null}

          <Button
            label={t('assignmentSaveDraft')}
            kind="ghost"
            loading={busy === 'draft'}
            disabled={busy !== null}
            onPress={() => void persist(false)}
          />
          <Button
            label={t('assignmentSubmit')}
            loading={busy === 'submit'}
            disabled={busy !== null}
            onPress={() => void persist(true)}
          />
        </Card>
      )}
    </>
  );
}
