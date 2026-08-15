import React from 'react';
import { View } from 'react-native';
import { useI18n } from '../../src/i18n';
import { getNews } from '../../src/api/endpoints';
import { spacing } from '../../src/theme';
import { Button } from '../../src/ui/Button';
import { Screen } from '../../src/ui/kit';
import { NewsTile } from '../../src/ui/cards';
import { PagedView, usePagedQuery } from '../../src/ui/states';

export default function NewsListScreen() {
  const { t } = useI18n();
  const list = usePagedQuery((cursor) => getNews({ limit: 20, cursor }), []);

  return (
    <Screen>
      <PagedView state={list} emptyText={t('newsEmpty')}>
        {(items) => (
          <View style={{ gap: spacing.md }}>
            {items.map((item) => (
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
