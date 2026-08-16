import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useI18n } from '../src/i18n';
import { getFaculty } from '../src/api/endpoints';
import { colors, spacing } from '../src/theme';
import { Button } from '../src/ui/Button';
import { Card, Row, Screen, SectionTitle, Txt } from '../src/ui/kit';
import { FacultyTile } from '../src/ui/cards';
import { PagedView, usePagedQuery } from '../src/ui/states';

export default function FacultyScreen() {
  const { t, pick } = useI18n();
  const list = usePagedQuery((cursor) => getFaculty({ limit: 50, cursor }), []);
  const { width } = useWindowDimensions();

  // شبكةٌ من عمودين: الصور هي بيت القصيد في هذه الشاشة.
  const columns = width >= 720 ? 3 : 2;
  const gutter = spacing.md;
  const cardWidth = (width - spacing.lg * 2 - gutter * (columns - 1)) / columns;

  return (
    <Screen>
      <SectionTitle title={t('facultyTitle')} />

      <PagedView state={list} emptyText={t('facultyEmpty')} emptyIcon="people-outline">
        {(items) => (
          <View style={{ gap: spacing.lg }}>
            <Row gap={gutter} wrap align="stretch">
              {items.map((member) => (
                <FacultyTile key={member.id} member={member} width={cardWidth} />
              ))}
            </Row>

            {/*
              السِّيَر المكتوبة تُعرض تحت الشبكة كي لا تُشوّه ارتفاعها.
              عنوان البطاقة هنا هو الرتبة لا الاسم — الأسماء مرفوعة من
              هذه الشاشة بطلب العميل، فلا تعود من باب السيرة.
            */}
            {items
              .filter((m) => m.bioAr || m.bioEn)
              .map((m) => (
                <Card key={`${m.id}-bio`} style={{ gap: spacing.xs }}>
                  {m.rankAr || m.rankEn ? (
                    <Txt variant="heading" color={colors.navy}>
                      {pick(m.rankAr, m.rankEn)}
                    </Txt>
                  ) : null}
                  <Txt variant="small" color={colors.textMuted}>
                    {pick(m.bioAr, m.bioEn)}
                  </Txt>
                </Card>
              ))}

            {list.hasMore ? (
              <Button label={t('loadMore')} kind="ghost" loading={list.loadingMore} onPress={list.loadMore} />
            ) : null}
          </View>
        )}
      </PagedView>
    </Screen>
  );
}
