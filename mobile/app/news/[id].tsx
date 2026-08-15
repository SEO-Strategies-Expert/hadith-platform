import React from 'react';
import { View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useI18n } from '../../src/i18n';
import { getNewsItem } from '../../src/api/endpoints';
import { colors, spacing } from '../../src/theme';
import { Badge, Card, Screen, Txt } from '../../src/ui/kit';
import { GoldRule, ThuluthText } from '../../src/ui/gold';
import { RemoteImage } from '../../src/ui/RemoteImage';
import { MetaChip } from '../../src/ui/cards';
import { newsImage } from '../../src/ui/assets';
import { QueryView, useQuery } from '../../src/ui/states';

export default function NewsDetailScreen() {
  // المسار يقبل المعرّف أو الـ slug.
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, pick, date } = useI18n();
  const query = useQuery(() => getNewsItem(id), [id]);

  return (
    <Screen>
      <QueryView query={query}>
        {(item) => (
          <>
            <Stack.Screen options={{ title: pick(item.titleAr, item.titleEn) }} />

            <RemoteImage uri={newsImage(item.imageUrl, item.id)} height={210} />

            <View style={{ gap: spacing.sm }}>
              {item.tagAr || item.tagEn ? <Badge label={pick(item.tagAr, item.tagEn)} tone="gold" /> : null}
              <ThuluthText variant="ceremonial" color={colors.navy}>
                {pick(item.titleAr, item.titleEn)}
              </ThuluthText>
              <GoldRule height={2} style={{ width: 72 }} />
              <MetaChip icon="calendar-outline" text={date(item.date)} />
            </View>

            <Card>
              {item.bodyAr || item.bodyEn ? (
                <Txt variant="body">{pick(item.bodyAr, item.bodyEn)}</Txt>
              ) : (
                <Txt variant="body" color={colors.textMuted}>
                  {pick(item.excerptAr, item.excerptEn) || t('newsEmpty')}
                </Txt>
              )}
            </Card>
          </>
        )}
      </QueryView>
    </Screen>
  );
}
