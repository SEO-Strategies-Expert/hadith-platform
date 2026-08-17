import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../src/i18n';
import { getCertificates, verifyCertificateCode } from '../src/api/endpoints';
import { messageOf } from '../src/api/client';
import { colors, spacing } from '../src/theme';
import { Button } from '../src/ui/Button';
import { Badge, Card, Divider, InfoRow, Row, Screen, Txt } from '../src/ui/kit';
import { RequireAuth } from '../src/ui/RequireAuth';
import { PagedView, usePagedQuery } from '../src/ui/states';
import { openExternal } from '../src/ui/openLink';

/**
 * التحقّق من الوثيقة — **داخل الشاشة**.
 *
 * كان الزرّ يفتح `verify.html` على موقع الكلّية في متصفّح النظام. صار
 * ينادي `/api/v1/verify/{code}` ويعرض جوابه سطرًا تحته: صحيحة، أو ملغاة،
 * أو لا وثيقة بهذا الرمز. فلا يخرج المستخدم من التطبيق ليعرف حال وثيقته.
 */
function VerifyRow({ code }: { code: string }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);

  const run = useCallback(() => {
    setBusy(true);
    setResult(null);
    verifyCertificateCode(code)
      .then((r) => {
        if (r.status === 'valid') setResult({ tone: 'ok', text: t('certificateVerifyValid') });
        else if (r.status === 'revoked') setResult({ tone: 'bad', text: t('certificateVerifyRevoked') });
        else setResult({ tone: 'bad', text: t('certificateVerifyUnknown') });
      })
      .catch((err: unknown) => setResult({ tone: 'bad', text: messageOf(err) }))
      .finally(() => setBusy(false));
  }, [code, t]);

  return (
    <View style={{ gap: spacing.sm }}>
      <Button
        label={busy ? t('certificateVerifying') : t('certificateVerify')}
        kind="ghost"
        small
        loading={busy}
        onPress={run}
      />
      {result ? (
        <Row gap={spacing.sm}>
          <Ionicons
            name={result.tone === 'ok' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
            size={17}
            color={result.tone === 'ok' ? colors.success : colors.danger}
          />
          <Txt variant="smallStrong" color={result.tone === 'ok' ? colors.success : colors.danger}>
            {result.text}
          </Txt>
        </Row>
      ) : null}
    </View>
  );
}

export default function CertificatesScreen() {
  return (
    <Screen>
      <RequireAuth>
        <CertificatesList />
      </RequireAuth>
    </Screen>
  );
}

function CertificatesList() {
  const { t, pick, date } = useI18n();
  const list = usePagedQuery((cursor) => getCertificates({ limit: 20, cursor }), []);

  return (
    <PagedView state={list} emptyText={t('certificatesEmpty')} emptyIcon="ribbon-outline">
      {(items) => (
        <View style={{ gap: spacing.md }}>
          {items.map((cert) => (
            <Card key={cert.id} style={{ gap: spacing.md }}>
              <Row gap={spacing.sm} wrap>
                <Badge label={t(cert.kind === 'IJAZA' ? 'kindIJAZA' : 'kindCERTIFICATE')} tone="gold" />
                {cert.revoked ? <Badge label={t('certificateRevoked')} tone="danger" /> : null}
              </Row>

              <Txt variant="heading">{pick(cert.titleAr, cert.titleEn)}</Txt>

              {cert.course ? (
                <Txt variant="small" color={colors.textMuted}>
                  {pick(cert.course.titleAr, cert.course.titleEn)}
                </Txt>
              ) : null}

              <Divider />

              <InfoRow label={t('certificateSerial')} value={cert.serial} />
              <InfoRow label={t('certificateVerifyCode')} value={cert.verifyCodeFormatted} />
              <InfoRow label={t('certificateIssued')} value={date(cert.issuedAt)} />
              {cert.grantedByAr || cert.grantedByEn ? (
                <InfoRow label={t('certificateGrantedBy')} value={pick(cert.grantedByAr, cert.grantedByEn)} />
              ) : null}

              {cert.isnadAr || cert.isnadEn ? (
                <View style={{ gap: spacing.xs }}>
                  <Divider />
                  <Txt variant="tiny" color={colors.textMuted}>
                    {t('certificateIsnad')}
                  </Txt>
                  <Txt variant="small">{pick(cert.isnadAr, cert.isnadEn)}</Txt>
                </View>
              ) : null}

              {cert.pdfUrl ? (
                <Button label={t('certificateOpenPdf')} onPress={() => void openExternal(cert.pdfUrl)} />
              ) : null}
              <VerifyRow code={cert.verifyCode} />
            </Card>
          ))}
          {list.hasMore ? (
            <Button label={t('loadMore')} kind="ghost" loading={list.loadingMore} onPress={list.loadMore} />
          ) : null}
        </View>
      )}
    </PagedView>
  );
}
