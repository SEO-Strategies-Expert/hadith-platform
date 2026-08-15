import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  clearSession,
  getRefreshToken,
  initSession,
  setSession,
  setSessionLostHandler,
} from '../api/client';
import { getMe, login as loginRequest, logoutServer } from '../api/endpoints';
import type { Me } from '../api/types';
import { getDeviceId } from './storage';
import { refreshDeviceRegistration, unregisterPush } from '../notifications/push';

type Status = 'loading' | 'authed' | 'guest';

type AuthValue = {
  status: Status;
  me: Me | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  reloadMe: () => Promise<void>;
  /** تحديث عدّاد الإشعارات غير المقروءة بعد قراءة إشعار. */
  setUnreadCount: (count: number) => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [me, setMe] = useState<Me | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const toGuest = useCallback(() => {
    if (!mounted.current) return;
    setMe(null);
    setStatus('guest');
  }, []);

  // سقوط الجلسة من أي مكان في التطبيق ⇒ عودة إلى حالة الضيف.
  useEffect(() => {
    setSessionLostHandler(() => {
      void clearSession();
      toGuest();
    });
    return () => setSessionLostHandler(null);
  }, [toGuest]);

  // الإقلاع: حمّل الرموز، وتحقّق منها بجلب الحساب.
  useEffect(() => {
    let alive = true;
    (async () => {
      const tokens = await initSession();
      if (!alive) return;
      if (!tokens) {
        setStatus('guest');
        return;
      }
      try {
        const profile = await getMe();
        if (!alive) return;
        setMe(profile);
        setStatus('authed');
        void refreshDeviceRegistration();
      } catch {
        // رمز تالف أو حساب مُعطَّل — العميل مسح الرموز عند 401.
        if (!alive) return;
        await clearSession();
        setStatus('guest');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const deviceId = await getDeviceId();
    const pair = await loginRequest(email.trim(), password, deviceId);
    await setSession({ accessToken: pair.accessToken, refreshToken: pair.refreshToken });
    const profile = await getMe();
    if (!mounted.current) return;
    setMe(profile);
    setStatus('authed');
  }, []);

  const signOut = useCallback(async () => {
    // الترتيب مقصود: إلغاء تسجيل الجهاز ثمّ إبطال رمز التجديد
    // ثمّ مسح الرموز محلّيًّا — الخطوتان الأوليان تحتاجان جلسةً صالحة.
    await unregisterPush();
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await logoutServer(refreshToken);
      } catch {
        /* الخروج لا يفشل في وجه المستخدم. */
      }
    }
    await clearSession();
    toGuest();
  }, [toGuest]);

  const reloadMe = useCallback(async () => {
    try {
      const profile = await getMe();
      if (mounted.current) setMe(profile);
    } catch {
      /* تُترك البيانات السابقة كما هي. */
    }
  }, []);

  const setUnreadCount = useCallback((count: number) => {
    setMe((current) =>
      current ? { ...current, counts: { ...current.counts, unreadNotifications: count } } : current
    );
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ status, me, signIn, signOut, reloadMe, setUnreadCount }),
    [status, me, signIn, signOut, reloadMe, setUnreadCount]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
