import { API_V1 } from '../config';
import { clearTokens, loadTokens, saveTokens, type StoredTokens } from '../auth/storage';

/**
 * عميل الشبكة.
 *
 * مسؤوليّاته الثلاث:
 *  ١) فكّ غلاف `{ data }` / `{ error }` وتحويل الفشل إلى `ApiError` برسالة عربيّة.
 *  ٢) إلحاق `Authorization: Bearer` وتجديد الرمز عند `401` **تجديدًا مسلسلًا**.
 *  ٣) ترجمة أعطال الشبكة إلى رسائل مفهومة، فلا تصل نصوص تقنيّة إلى المستخدم.
 */

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const NETWORK_MESSAGE = 'تعذّر الاتّصال بالخادم. تحقّق من اتّصالك بالإنترنت ثمّ أعد المحاولة.';
const TIMEOUT_MESSAGE = 'استغرق الاتّصال وقتًا أطول من المعتاد. أعد المحاولة.';
const SESSION_MESSAGE = 'انتهت جلستك. سجّل الدخول من جديد.';
const REQUEST_TIMEOUT_MS = 20000;

function defaultMessage(status: number): string {
  if (status === 401) return SESSION_MESSAGE;
  if (status === 403) return 'ليس لك صلاحيّة الوصول إلى هذا المحتوى.';
  if (status === 404) return 'لم نعثر على المطلوب.';
  if (status >= 500) return 'حدث خلل في الخادم. أعد المحاولة بعد قليل.';
  return 'تعذّر إتمام الطلب. أعد المحاولة.';
}

/* ————————————— حالة الجلسة ————————————— */

let tokens: StoredTokens | null = null;
let refreshPromise: Promise<StoredTokens | null> | null = null;
let onSessionLost: (() => void) | null = null;

/** يُستدعى مرّةً عند الإقلاع لتحميل الرموز المحفوظة. */
export async function initSession(): Promise<StoredTokens | null> {
  tokens = await loadTokens();
  return tokens;
}

export function hasSession(): boolean {
  return tokens !== null;
}

export async function setSession(pair: StoredTokens): Promise<void> {
  tokens = pair;
  await saveTokens(pair);
}

export async function clearSession(): Promise<void> {
  tokens = null;
  await clearTokens();
}

export function getRefreshToken(): string | null {
  return tokens?.refreshToken ?? null;
}

/** يسجّله `AuthContext` ليُعيد المستخدم إلى شاشة الدخول عند سقوط الجلسة. */
export function setSessionLostHandler(fn: (() => void) | null): void {
  onSessionLost = fn;
}

/* ————————————— التجديد المسلسل ————————————— */

/**
 * رموز التجديد **تُدوَّر**: كل تجديد يُبطل القديم، واستعمال مُبطَل يُبطل كل
 * جلسات المستخدم على كل أجهزته. لذلك لا يجوز إطلاق تجديدين متوازيين أبدًا —
 * كل الطلبات المتزامنة تنتظر وعدًا واحدًا مشتركًا.
 */
async function performRefresh(): Promise<StoredTokens | null> {
  const refreshToken = tokens?.refreshToken;
  if (!refreshToken) return null;

  let res: Response;
  try {
    res = await fetch(`${API_V1}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    // عطل شبكة لا رفض من الخادم: الرمز ما زال صالحًا، فلا نُسقط الجلسة.
    throw new ApiError(NETWORK_MESSAGE, 0);
  }

  if (res.status === 401) {
    // رمز التجديد مرفوض نهائيًّا ⇒ امسح كل شيء وأعد المستخدم للدخول.
    await clearSession();
    return null;
  }

  const json = (await res.json().catch(() => null)) as { data?: unknown; error?: string } | null;
  if (!res.ok) throw new ApiError(json?.error || defaultMessage(res.status), res.status);

  const data = json?.data as { accessToken?: string; refreshToken?: string } | undefined;
  if (!data?.accessToken || !data?.refreshToken) {
    await clearSession();
    return null;
  }

  // يُحفظ الجديد فورًا قبل أي طلب آخر — فقدانه يعني خروجًا قسريًّا.
  await setSession({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return tokens;
}

function refreshShared(): Promise<StoredTokens | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/* ————————————— الطلب ————————————— */

export type Query = Record<string, string | number | boolean | null | undefined>;

function buildUrl(path: string, query?: Query): string {
  const url = `${API_V1}${path}`;
  if (!query) return url;
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `${url}?${parts.join('&')}` : url;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  query?: Query;
  /** `true` يُلحق ترويسة المصادقة ويفعّل دورة التجديد. */
  auth?: boolean;
  signal?: AbortSignal;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return send<T>(path, options, false);
}

async function send<T>(path: string, options: RequestOptions, isRetry: boolean): Promise<T> {
  const { method = 'GET', body, query, auth = false, signal } = options;

  if (auth && !tokens) {
    onSessionLost?.();
    throw new ApiError(SESSION_MESSAGE, 401);
  }

  // نلتقط الرمز المستعمل لنميّز لاحقًا بين «رمزي قديم» و«الجلسة سقطت».
  const usedAccessToken = tokens?.accessToken;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && usedAccessToken) headers.Authorization = `Bearer ${usedAccessToken}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (signal?.aborted) throw new ApiError('أُلغي الطلب.', 0);
    const aborted = (err as { name?: string })?.name === 'AbortError';
    throw new ApiError(aborted ? TIMEOUT_MESSAGE : NETWORK_MESSAGE, 0);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }

  if (res.status === 401 && auth && !isRetry) {
    // جُدِّد الرمز أثناء رحلة هذا الطلب؟ أعد المحاولة بالجديد بلا تجديد ثانٍ.
    if (tokens && tokens.accessToken !== usedAccessToken) {
      return send<T>(path, options, true);
    }
    const fresh = await refreshShared();
    if (!fresh) {
      onSessionLost?.();
      throw new ApiError(SESSION_MESSAGE, 401);
    }
    return send<T>(path, options, true);
  }

  if (res.status === 401 && auth) {
    onSessionLost?.();
    throw new ApiError(SESSION_MESSAGE, 401);
  }

  if (res.status === 204) return undefined as T;

  const json = (await res.json().catch(() => null)) as { data?: T; error?: string } | null;

  if (!res.ok) {
    // رسالة الخادم عربيّة وصالحة للعرض؛ وإلّا فرسالة عامّة مفهومة.
    throw new ApiError(json?.error || defaultMessage(res.status), res.status);
  }

  return json?.data as T;
}

/** رسالة صالحة للعرض من أيّ خطأ كان — لا يصل نصّ تقنيّ إلى المستخدم. */
export function messageOf(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return 'حدث خطأ غير متوقّع. أعد المحاولة.';
}
