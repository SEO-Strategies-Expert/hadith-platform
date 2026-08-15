import React from 'react';
import { Image, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useI18n } from '../../src/i18n';
import { getNewsItem } from '../../src/api/endpoints';
import { colors, radius, spacing } from '../../src/theme';
import { Badge, Card, Screen, Txt } from '../../src/ui/kit';
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

            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={{ width: '100%', height: 190, borderRadius: radius.lg, backgroundColor: colors.border }}
                resizeMode="cover"
              />
            ) : null}

            <View style={{ gap: spacing.sm }}>
              {item.tagAr || item.tagEn ? <Badge label={pick(item.tagAr, item.tagEn)} tone="gold" /> : null}
              <Txt variant="title">{pick(item.titleAr, item.titleEn)}</Txt>
              <Txt variant="tiny" color={colors.textMuted}>
                {date(item.date)}
              </Txt>
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
