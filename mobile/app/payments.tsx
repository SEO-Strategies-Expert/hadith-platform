import React, { useState } from 'react';
import { View } from 'react-native';
import { useI18n } from '../src/i18n';
import { getPayments } from '../src/api/endpoints';
import type { PaymentStatus, PaymentTotals } from '../src/api/types';
import type { StringKey } from '../src/i18n/strings';
import { colors, spacing } from '../src/theme';
import { Button } from '../src/ui/Button';
import { Badge, Card, Divider, InfoRow, Row, Screen, Txt } from '../src/ui/kit';
import { RequireAuth } from '../src/ui/RequireAuth';
import { PagedView, usePagedQuery } from '../src/ui/states';

const statusKey = (s: PaymentStatus): StringKey => `status${s}` as StringKey;

const statusTone = (s: PaymentStatus) =>
  s === 'PAID' ? 'success' : s === 'FAILED' ? 'danger' : s === 'WAIVED' ? 'gold' : 'neutral';

export default function PaymentsScreen() {
  return (
    <Screen>
      <RequireAuth>
        <PaymentsList />
      </RequireAuth>
    </Screen>
  );
}

function PaymentsList() {
  const { t, pick, n, date } = useI18n();
  // `totals` يصل مع الصفحة الأولى فقط، فنحتفظ به عند تحميل صفحات تالية.
  const [totals, setTotals] = useState<PaymentTotals[] | null>(null);

  const list = usePagedQuery(async (cursor) => {
    const page = await getPayments({ limit: 20, cursor });
    if (!cursor) setTotals(page.totals);
    return { items: page.items, nextCursor: page.nextCursor };
  }, []);

  return (
    <>
      {/* المبالغ نصوص عشريّة تُعرض كما وصلت — لا تحويل إلى أعداد عائمة. */}
      {totals && totals.length > 0 ? (
        <>
          <Txt variant="heading">{t('paymentsTotals')}</Txt>
          {totals.map((row) => (
            <Card key={row.currency} style={{ gap: spacing.sm }}>
              <Txt variant="heading">{row.currency}</Txt>
              <Divider />
              <InfoRow label={t('paymentCollected')} value={`${row.collected} ${row.currency}`} />
              <InfoRow label={t('paymentPending')} value={`${row.pending} ${row.currency}`} />
              <InfoRow label={t('paymentWaived')} value={`${row.waived} ${row.currency}`} />
              <InfoRow label={t('paymentRefunded')} value={`${row.refunded} ${row.currency}`} />
              <Divider />
              <InfoRow label={t('paymentNet')} value={`${row.net} ${row.currency}`} />
            </Card>
          ))}
        </>
      ) : null}

      <PagedView state={list} emptyText={t('paymentsEmpty')} emptyIcon="card-outline">
        {(items) => (
          <View style={{ gap: spacing.md }}>
            {items.map((payment) => (
              <Card key={payment.id} style={{ gap: spacing.sm }}>
                <Row justify="space-between">
                  <Txt variant="heading">
                    {payment.amount} {payment.currency}
                  </Txt>
                  <Badge label={t(statusKey(payment.status))} tone={statusTone(payment.status)} />
                </Row>

                {payment.course ? (
                  <Txt variant="small" color={colors.textMuted}>
                    {pick(payment.course.titleAr, payment.course.titleEn)}
                  </Txt>
                ) : null}

                <Divider />

                {payment.method ? <InfoRow label={t('paymentMethod')} value={payment.method} /> : null}
                <InfoRow
                  label={t('paymentDate')}
                  value={payment.paidAt ? date(payment.paidAt) : date(payment.createdAt)}
                />
              </Card>
            ))}
            {list.hasMore ? (
              <Button label={t('loadMore')} kind="ghost" loading={list.loadingMore} onPress={list.loadMore} />
            ) : null}
          </View>
        )}
      </PagedView>
    </>
  );
}
