import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/auth/AuthContext';
import { useI18n } from '../src/i18n';
import { getNotifications, markNotificationRead } from '../src/api/endpoints';
import type { AppNotification, NotificationKind } from '../src/api/types';
import { notificationHrefToRoute } from '../src/notifications/hrefMap';
import { colors, spacing } from '../src/theme';
import { Button } from '../src/ui/Button';
import { Badge, PressableCard, Row, Screen, Txt } from '../src/ui/kit';
import { RequireAuth } from '../src/ui/RequireAuth';
import { PagedView, usePagedQuery } from '../src/ui/states';

const kindIcon: Record<NotificationKind, React.ComponentProps<typeof Ionicons>['name']> = {
  session: 'calendar-outline',
  assignment: 'document-text-outline',
  grade: 'ribbon-outline',
  certificate: 'medal-outline',
  payment: 'card-outline',
  announcement: 'megaphone-outline',
};

export default function NotificationsScreen() {
  return (
    <Screen>
      <RequireAuth>
        <NotificationsList />
      </RequireAuth>
    </Screen>
  );
}

function NotificationsList() {
  const { t, pick, dateTime } = useI18n();
  const router = useRouter();
  const { setUnreadCount } = useAuth();
  const [unreadOnly, setUnreadOnly] = useState(false);

  const list = usePagedQuery(
    async (cursor) => {
      const page = await getNotifications({ limit: 20, cursor, unreadOnly });
      if (!cursor) setUnreadCount(page.unreadCount);
      return { items: page.items, nextCursor: page.nextCursor };
    },
    [unreadOnly]
  );

  const open = async (item: AppNotification) => {
    // الختم آمن للتكرار، ولا نمنع الانتقال إن أخفق.
    if (!item.readAt) {
      try {
        const result = await markNotificationRead(item.id);
        list.replaceItem((x) => x.id === item.id, { ...item, readAt: result.readAt });
        setUnreadCount(result.unreadCount);
      } catch {
        /* لا نُزعج المستخدم بفشل الختم. */
      }
    }
    const route = notificationHrefToRoute(item.href);
    if (route) router.push(route);
  };

  return (
    <>
      <Row gap={spacing.sm}>
        <Button
          label={t('notificationsAll')}
          kind={unreadOnly ? 'ghost' : 'primary'}
          small
          onPress={() => setUnreadOnly(false)}
        />
        <Button
          label={t('notificationsUnread')}
          kind={unreadOnly ? 'primary' : 'ghost'}
          small
          onPress={() => setUnreadOnly(true)}
        />
      </Row>

      <PagedView state={list} emptyText={t('notificationsEmpty')}>
        {(items) => (
          <View style={{ gap: spacing.sm }}>
            {items.map((item) => (
              <PressableCard
                key={item.id}
                onPress={() => void open(item)}
                style={{
                  gap: spacing.xs,
                  backgroundColor: item.readAt ? colors.surface : colors.goldLight,
                  borderColor: item.readAt ? colors.border : colors.gold,
                }}
              >
                <Row gap={spacing.md} align="flex-start">
                  <Ionicons name={kindIcon[item.kind] ?? 'notifications-outline'} size={20} color={colors.navy} />
                  <View style={{ flexShrink: 1, gap: spacing.xs }}>
                    <Txt variant="heading">{pick(item.titleAr, item.titleEn)}</Txt>
                    {item.bodyAr || item.bodyEn ? (
                      <Txt variant="small" color={colors.textMuted}>
                        {pick(item.bodyAr, item.bodyEn)}
                      </Txt>
                    ) : null}
                    <Row gap={spacing.sm}>
                      <Txt variant="tiny" color={colors.textMuted}>
                        {dateTime(item.createdAt)}
                      </Txt>
                      {!item.readAt ? <Badge label={t('notificationsUnread')} tone="gold" /> : null}
                    </Row>
                  </View>
                </Row>
              </PressableCard>
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
