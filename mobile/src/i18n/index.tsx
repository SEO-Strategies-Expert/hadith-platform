import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager, Platform } from 'react-native';
import { getPref, setPref } from '../auth/storage';
import { applyDirectionForLang } from './rtl';
import { strings, type Lang, type StringKey } from './strings';

export { primeRTL, useRTLBootstrap, type RtlStatus } from './rtl';

/** ضمانة وقت الترجمة: القاموس الإنجليزي يغطّي كل مفاتيح العربي. */
const _completeness: Record<StringKey, string> = strings.en;
void _completeness;

const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** يحوّل الأرقام اللاتينيّة إلى هنديّة، اتّساقًا مع موقع الكلّية. */
export function toArabicDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);
}

const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * العربيّة هي لغة الكلّية وواجهتها الافتراضيّة — لا تُشتقّ من لغة الجهاز.
 * الإنجليزيّة اختيارٌ صريح من شاشة الإعدادات ويُحفظ تفضيلًا.
 */
const DEFAULT_LANG: Lang = 'ar';

type I18nValue = {
  lang: Lang;
  isRTL: boolean;
  ready: boolean;
  setLang: (lang: Lang) => void;
  /** نصّ من القاموس. */
  t: (key: StringKey) => string;
  /** يختار الحقل ثنائي اللغة مع سقوط آمن إلى العربي. */
  pick: (ar: string | null | undefined, en: string | null | undefined) => string;
  /** رقم بأرقام الواجهة (هنديّة في العربيّة). */
  n: (value: number | string | null | undefined) => string;
  /** تاريخ مقروء. */
  date: (iso: string | null | undefined) => string;
  /** تاريخ ووقت. */
  dateTime: (iso: string | null | undefined) => string;
  /** وقت فقط. */
  time: (iso: string | null | undefined) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ar');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await getPref('lang');
      if (!alive) return;
      setLangState(saved === 'en' || saved === 'ar' ? saved : DEFAULT_LANG);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // الويب: اتّجاه المستند يُضبط يدويًّا (I18nManager لا يكفي في المتصفّح).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    // الاتّجاه يتبع اللغة: الإنجليزيّة LTR والعربيّة RTL.
    // كان مثبَّتًا على 'rtl' فكانت الواجهة الإنجليزيّة تُعرض بمحاذاةٍ مقلوبة.
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    void setPref('lang', next);
    // على الأصيل الاتّجاه قرارٌ عامّ في `I18nManager` يُقرأ مرّةً عند الإقلاع،
    // فلا يكفي تبديل النصوص: لا بدّ من قلب الاتّجاه ثمّ إعادة تحميلٍ واحدة.
    // بدونها تظهر الإنجليزيّة داخل تخطيطٍ من اليمين لليسار.
    void applyDirectionForLang(next);
  }, []);

  const value = useMemo<I18nValue>(() => {
    const dict = strings[lang] as Record<string, string>;
    const isAr = lang === 'ar';

    const n = (v: number | string | null | undefined) => {
      if (v === null || v === undefined || v === '') return isAr ? '—' : '—';
      return isAr ? toArabicDigits(v) : String(v);
    };

    const pad = (x: number) => String(x).padStart(2, '0');

    const parse = (iso: string | null | undefined) => {
      if (!iso) return null;
      const d = new Date(iso);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const date = (iso: string | null | undefined) => {
      const d = parse(iso);
      if (!d) return '—';
      const months = isAr ? MONTHS_AR : MONTHS_EN;
      const text = isAr
        ? `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
        : `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      return isAr ? toArabicDigits(text) : text;
    };

    const time = (iso: string | null | undefined) => {
      const d = parse(iso);
      if (!d) return '—';
      const text = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
      return isAr ? toArabicDigits(text) : text;
    };

    const dateTime = (iso: string | null | undefined) => {
      const d = parse(iso);
      if (!d) return '—';
      return `${date(iso)} · ${time(iso)}`;
    };

    return {
      lang,
      // الواجهة عربيّةٌ دائمًا، لكنّ **تحقّق** الاتّجاه على المنصّة
      // الأصليّة ليس مضمونًا (انظر `rtl.ts`) — فلا يُدّعى ما لم يقع.
      isRTL: Platform.OS === 'web' ? true : I18nManager.isRTL,
      ready,
      setLang,
      t: (key: StringKey) => dict[key] ?? strings.ar[key],
      pick: (ar, en) => (isAr ? ar || en || '' : en || ar || ''),
      n,
      date,
      dateTime,
      time,
    };
  }, [lang, ready, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

export type { Lang };
