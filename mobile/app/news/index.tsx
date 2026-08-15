import React from 'react';
import { View } from 'react-native';
import { useI18n } from '../../src/i18n';
import { getNews } from '../../src/api/endpoints';
import { spacing } from '../../src/theme';
import { Button } from '../../src/ui/Button';
import { Screen, SectionTitle } from '../../src/ui/kit';
import { NewsLeadTile, NewsTile } from '../../src/ui/cards';
import { PagedView, usePagedQuery } from '../../src/ui/states';

export default function NewsListScreen() {
  const { t } = useI18n();
  const list = usePagedQuery((cursor) => getNews({ limit: 20, cursor }), []);

  return (
    <Screen>
      <SectionTitle title={t('newsTitle')} />

      <PagedView state={list} emptyText={t('newsEmpty')} emptyIcon="newspaper-outline">
        {(items) => (
          <View style={{ gap: spacing.md }}>
            {/* أوّل خبر بصورةٍ رئيسة، وما بعده بصورٍ مصغّرة. */}
            {items[0] ? <NewsLeadTile item={items[0]} /> : null}
            {items.slice(1).map((item) => (
              <NewsTile key={item.id} item={item} />
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
