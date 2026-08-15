import { Platform } from 'react-native';

/** ألوان الكلّية الرسميّة. */
export const colors = {
  navy: '#123159',
  navyDark: '#01183A',
  gold: '#D8AB4A',
  goldLight: '#F9EDAB',
  cream: '#FDFBF5',

  surface: '#FFFFFF',
  border: '#E7E1D4',
  borderStrong: '#D6CDB8',

  text: '#01183A',
  textMuted: '#5C6B80',
  textOnNavy: '#FDFBF5',
  textOnNavyMuted: '#B9C4D4',

  success: '#1F7A46',
  successBg: '#E8F5EE',
  danger: '#8C2F2F',
  dangerBg: '#F7EAEA',
  warning: '#8A6320',
  warningBg: '#FBF3E2',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/**
 * خطوط النظام: العربيّة تُصيَّر بخطّ الجهاز الافتراضي، وهو أضمن من
 * تحميل خطّ مخصّص وأخفّ في حجم الحزمة.
 */
export const fontFamily = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: "'Noto Naskh Arabic', 'Segoe UI', system-ui, sans-serif",
});

export const typography = {
  display: { fontSize: 26, lineHeight: 40, fontWeight: '700' as const },
  title: { fontSize: 20, lineHeight: 32, fontWeight: '700' as const },
  heading: { fontSize: 17, lineHeight: 28, fontWeight: '600' as const },
  body: { fontSize: 15, lineHeight: 26, fontWeight: '400' as const },
  small: { fontSize: 13, lineHeight: 22, fontWeight: '400' as const },
  tiny: { fontSize: 11, lineHeight: 18, fontWeight: '400' as const },
} as const;

export const shadow = {
  card: Platform.select({
    ios: {
      shadowColor: colors.navyDark,
      shadowOpacity: 0.06,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
    },
    android: { elevation: 2 },
    default: { boxShadow: '0 3px 10px rgba(1,24,58,0.06)' } as object,
  }),
};
