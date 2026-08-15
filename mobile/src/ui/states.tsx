import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme';
import { messageOf } from '../api/client';
import { useI18n } from '../i18n';
import { Button } from './Button';
import { Card, Row, Spinner, Txt } from './kit';
import { OrnamentRule } from './gold';

/**
 * حالات الشبكة الثلاث موحّدة في مكان واحد، فلا تُترك شاشة بيضاء صامتة:
 * تحميل، وخطأ بزرّ إعادة محاولة، وحالة فارغة مكتوبة.
 */

export type StateIcon = React.ComponentProps<typeof Ionicons>['name'];

export function LoadingState({ label }: { label?: string }) {
  const { t } = useI18n();
  return (
    <View style={{ paddingVertical: spacing.xxl, alignItems: 'center', gap: spacing.md }}>
      <Spinner />
      <Txt variant="small" color={colors.textMuted}>
        {label ?? t('loading')}
      </Txt>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <Card style={{ gap: spacing.md, borderColor: '#E7D6D6', backgroundColor: colors.dangerBg }}>
      <Row gap={spacing.sm}>
        <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
        <Txt variant="heading" color={colors.danger}>
          {t('errorTitle')}
        </Txt>
      </Row>
      <Txt variant="small" color={colors.text}>
        {message}
      </Txt>
      {onRetry ? <Button label={t('retry')} kind="ghost" small onPress={onRetry} /> : null}
    </Card>
  );
}

/**
 * الفراغ حالةٌ مقصودة لا عطل: ميداليّةٌ ذهبيّة بأيقونة، وفاصلٌ زخرفيّ،
 * وجملةٌ مكتوبة، وإجراءٌ مقترح إن وُجد.
 */
export function EmptyState({
  text,
  action,
  icon = 'sparkles-outline',
}: {
  text: string;
  action?: React.ReactNode;
  icon?: StateIcon;
}) {
  return (
    <Card style={{ gap: spacing.md, alignItems: 'center', paddingVertical: spacing.xl }}>
      <View
        style={{
          width: 62,
          height: 62,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.cream100,
          borderWidth: 1,
          borderColor: colors.gold,
        }}
      >
        <Ionicons name={icon} size={26} color={colors.goldDark} />
      </View>
      <OrnamentRule />
      <Txt variant="small" color={colors.textMuted} align="center">
        {text}
      </Txt>
      {action}
    </Card>
  );
}

/* ————————— جلب البيانات ————————— */

export type QueryState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
  /** تحديث موضعيّ للبيانات بعد عمليّة كتابة، دون إعادة جلب. */
  setData: (updater: (current: T | null) => T | null) => void;
};

/**
 * جلب بسيط بحالة ثلاثيّة. `deps` يتحكّم بإعادة الجلب،
 * و`reload` لزرّ إعادة المحاولة.
 */
export function useQuery<T>(fetcher: () => Promise<T>, deps: readonly unknown[] = []): QueryState<T> {
  const [data, setDataState] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  // نحتفظ بأحدث دالّة جلب دون أن تكون سببًا لإعادة التنفيذ.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetcherRef
      .current()
      .then((result) => {
        if (!alive) return;
        setDataState(result);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(messageOf(err));
        setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((x) => x + 1), []);
  const setData = useCallback((updater: (current: T | null) => T | null) => {
    setDataState((current) => updater(current));
  }, []);

  return { data, error, loading, reload, setData };
}

/* ————————— جلب مُرقَّم بالمؤشّر ————————— */

export type PagedState<T> = {
  items: T[];
  error: string | null;
  /** أوّل تحميل — لم تصل صفحة بعد. */
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  reload: () => void;
  loadMore: () => void;
  /** استبدال عنصر بعد عمليّة كتابة، دون إعادة جلب. */
  replaceItem: (match: (item: T) => boolean, next: T) => void;
};

/**
 * ترقيم بالمؤشّر كما في العقد: `nextCursor = null` يعني لا صفحة تالية.
 * الصفحات تُراكَم ولا تُستبدل.
 */
export function usePagedQuery<T>(
  fetchPage: (cursor: string | null) => Promise<{ items: T[]; nextCursor: string | null }>,
  deps: readonly unknown[] = []
): PagedState<T> {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nonce, setNonce] = useState(0);

  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const inFlight = useRef(false);

  // أوّل صفحة — تُعاد كلّما تغيّرت التبعيّات أو طُلبت إعادة المحاولة.
  useEffect(() => {
    let alive = true;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    fetchRef
      .current(null)
      .then((page) => {
        if (!alive) return;
        setItems(page.items);
        setCursor(page.nextCursor);
        setHasMore(page.nextCursor !== null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(messageOf(err));
        setLoading(false);
      })
      .finally(() => {
        inFlight.current = false;
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const loadMore = useCallback(() => {
    if (inFlight.current || !hasMore || !cursor) return;
    inFlight.current = true;
    setLoadingMore(true);
    setError(null);
    fetchRef
      .current(cursor)
      .then((page) => {
        setItems((current) => [...current, ...page.items]);
        setCursor(page.nextCursor);
        setHasMore(page.nextCursor !== null);
      })
      .catch((err: unknown) => setError(messageOf(err)))
      .finally(() => {
        inFlight.current = false;
        setLoadingMore(false);
      });
  }, [cursor, hasMore]);

  const reload = useCallback(() => setNonce((x) => x + 1), []);

  const replaceItem = useCallback((match: (item: T) => boolean, next: T) => {
    setItems((current) => current.map((item) => (match(item) ? next : item)));
  }, []);

  return { items, error, loading, loadingMore, hasMore, reload, loadMore, replaceItem };
}

/** نظير `QueryView` للقوائم المُرقَّمة. */
export function PagedView<T>({
  state,
  emptyText,
  emptyAction,
  emptyIcon,
  children,
}: {
  state: PagedState<T>;
  emptyText: string;
  emptyAction?: React.ReactNode;
  emptyIcon?: StateIcon;
  children: (items: T[]) => React.ReactNode;
}) {
  if (state.loading) return <LoadingState />;
  if (state.error && state.items.length === 0) {
    return <ErrorState message={state.error} onRetry={state.reload} />;
  }
  if (state.items.length === 0) {
    return <EmptyState text={emptyText} action={emptyAction} icon={emptyIcon} />;
  }
  return (
    <>
      {children(state.items)}
      {state.error ? <ErrorState message={state.error} onRetry={state.loadMore} /> : null}
    </>
  );
}

/**
 * يعرض الحالة المناسبة تلقائيًّا. المحتوى يُمرَّر كدالّة لضمان
 * أنّ البيانات غير فارغة عند التصيير.
 */
export function QueryView<T>({
  query,
  isEmpty,
  emptyText,
  emptyAction,
  emptyIcon,
  loadingLabel,
  children,
}: {
  query: QueryState<T>;
  isEmpty?: (data: T) => boolean;
  emptyText?: string;
  emptyAction?: React.ReactNode;
  emptyIcon?: StateIcon;
  loadingLabel?: string;
  children: (data: T) => React.ReactNode;
}) {
  if (query.data === null) {
    if (query.loading) return <LoadingState label={loadingLabel} />;
    if (query.error) return <ErrorState message={query.error} onRetry={query.reload} />;
    return <LoadingState label={loadingLabel} />;
  }

  const empty = isEmpty?.(query.data) ?? false;

  return (
    <>
      {/* خطأ أثناء التحديث مع وجود بيانات سابقة: نُبقي المعروض ونُنبّه فوقه. */}
      {query.error ? <ErrorState message={query.error} onRetry={query.reload} /> : null}
      {empty && emptyText ? (
        <EmptyState text={emptyText} action={emptyAction} icon={emptyIcon} />
      ) : (
        children(query.data)
      )}
    </>
  );
}
