import React from 'react';
import { Image, View } from 'react-native';
import { useI18n } from '../src/i18n';
import { getFaculty } from '../src/api/endpoints';
import { colors, radius, spacing } from '../src/theme';
import { Button } from '../src/ui/Button';
import { Badge, Card, Row, Screen, Txt } from '../src/ui/kit';
import { PagedView, usePagedQuery } from '../src/ui/states';

export default function FacultyScreen() {
  const { t, pick } = useI18n();
  const list = usePagedQuery((cursor) => getFaculty({ limit: 50, cursor }), []);

  return (
    <Screen>
      <PagedView state={list} emptyText={t('facultyEmpty')}>
        {(items) => (
          <View style={{ gap: spacing.md }}>
            {items.map((member) => (
              <Card key={member.id} style={{ gap: spacing.md }}>
                <Row gap={spacing.lg} align="flex-start">
                  {member.photoUrl ? (
                    <Image
                      source={{ uri: member.photoUrl }}
                      style={{ width: 64, height: 64, borderRadius: radius.pill, backgroundColor: colors.border }}
                    />
                  ) : null}
                  <View style={{ flexShrink: 1, gap: spacing.xs }}>
                    <Txt variant="heading">{pick(member.nameAr, member.nameEn)}</Txt>
                    {member.rankAr || member.rankEn ? (
                      <Txt variant="small" color={colors.textMuted}>
                        {pick(member.rankAr, member.rankEn)}
                      </Txt>
                    ) : null}
                    {member.specAr || member.specEn ? (
                      <Txt variant="tiny" color={colors.textMuted}>
                        {pick(member.specAr, member.specEn)}
                      </Txt>
                    ) : null}
                    {member.countryAr || member.countryEn ? (
                      <Txt variant="tiny" color={colors.textMuted}>
                        {pick(member.countryAr, member.countryEn)}
                      </Txt>
                    ) : null}
                    <Row gap={spacing.sm} wrap>
                      {member.isCouncilHead ? <Badge label={t('facultyCouncilHead')} tone="gold" /> : null}
                      {member.isCouncil && !member.isCouncilHead ? (
                        <Badge label={t('facultyCouncil')} tone="neutral" />
                      ) : null}
                    </Row>
                  </View>
                </Row>

                {member.bioAr || member.bioEn ? (
                  <Txt variant="small" color={colors.textMuted}>
                    {pick(member.bioAr, member.bioEn)}
                  </Txt>
                ) : null}
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
