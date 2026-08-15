import React from 'react';
import { View } from 'react-native';
import { useI18n } from '../src/i18n';
import { getCertificates } from '../src/api/endpoints';
import { verifyUrl } from '../src/config';
import { colors, spacing } from '../src/theme';
import { Button } from '../src/ui/Button';
import { Badge, Card, Divider, InfoRow, Row, Screen, Txt } from '../src/ui/kit';
import { RequireAuth } from '../src/ui/RequireAuth';
import { PagedView, usePagedQuery } from '../src/ui/states';
import { openExternal } from '../src/ui/openLink';

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
    <PagedView state={list} emptyText={t('certificatesEmpty')}>
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
              <Button
                label={t('certificateVerify')}
                kind="ghost"
                small
                onPress={() => void openExternal(verifyUrl(cert.verifyCode))}
              />
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
