import { I18nManager, Platform, type TextStyle } from 'react-native';

/**
 * نظام التصميم — منقول عن هويّة موقع الكلّية حرفًا بحرف
 * (`public/assets/css/style.css`): كحليّ متوسّط الغمق، وكريميّ،
 * وذهبيّ لامع صقيل، وخطّ ثلثٍ للعناوين الاحتفاليّة.
 */

/* ————————————— الألوان ————————————— */

export const colors = {
  navy: '#123159',
  navyDark: '#01183A',
  /** أغمق درجة في الموقع — لخلفيّات الهيرو والأشرطة. */
  navyDeep: '#071630',
  navyMid: '#0B2144',
  navySoft: '#17406F',

  gold: '#D8AB4A',
  goldLight: '#F9EDAB',
  goldDark: '#B98732',
  /** أفتح لمعةٍ في التدرّج المعدني. */
  goldHi: '#FFF8DE',
  goldDeep: '#A87C1D',

  cream: '#FDFBF5',
  cream100: '#F8F2E3',
  cream200: '#F1E8D3',

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

/**
 * تدرّج الذهب المعدني — نفس مواقف التدرّج في `.gold-text` بالموقع.
 * يُستعمل مع `expo-linear-gradient` في العناوين والأشرطة.
 */
export const goldGradient = {
  colors: [
    colors.goldHi,
    '#F7E6AE',
    '#E7C46C',
    '#C79A31',
    '#EFD489',
    '#F7E6AE',
    colors.goldHi,
  ] as const,
  locations: [0, 0.18, 0.4, 0.56, 0.72, 0.88, 1] as const,
  /** ١٧٧° في CSS ≈ رأسيّ بميلٍ يسير. */
  start: { x: 0.03, y: 0 },
  end: { x: 0, y: 1 },
};

/** تدرّج الكحلي المستعمل فوق صور الهيرو. */
export const navyScrim = {
  colors: ['rgba(7,22,48,0.28)', 'rgba(7,22,48,0.84)', 'rgba(7,22,48,0.98)'] as const,
  locations: [0, 0.5, 1] as const,
};

/**
 * تدرّج هيرو الصفحة الرئيسة — أشدّ من `navyScrim` أسفلَ وأصفى أعلى.
 * صورة الشريحة الأولى فيها شيخٌ يُلقي الدرس في أعلى الكادر، فأعلى
 * التدرّج شفّافٌ تمامًا كي يظهر وجهه، ثمّ يشتدّ حتّى يكاد يُعتم عند
 * القاع فيُقرأ العنوان والنصّ والأزرار بلا حاجةٍ إلى حجب الصورة.
 */
export const heroScrim = {
  colors: [
    'rgba(7,22,48,0)',
    'rgba(7,22,48,0.06)',
    'rgba(7,22,48,0.52)',
    'rgba(7,22,48,0.93)',
    'rgba(7,22,48,0.995)',
  ] as const,
  // المتحدّث يشغل الثلث الأعلى؛ الاشتداد يبدأ بعده مباشرةً كي يجلس
  // العنوان على كحليٍّ شبه مصمت لا على أغطية رؤوس الطلبة البيضاء.
  locations: [0, 0.17, 0.34, 0.56, 1] as const,
};

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
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

/* ————————————— الخطوط ————————————— */

/**
 * أسماء العائلات كما تُسجَّل في `useFonts` بـ`app/_layout.tsx`.
 * الويب يحتاج سقوطًا صريحًا لأنّ `expo-font` يحقن `@font-face` بهذه الأسماء.
 *
 * التسمية تتبع الموقع حرفًا بحرف:
 *  - `Thuluth`   = `thuluth-dt` — «DecoType Thuluth 2»، خطّ الثلث الحقيقيّ.
 *  - `ThuluthAlt`= `thuluth-400/700` — `Scheherazade New`، نسخيٌّ يُستعمل
 *    احتياطًا للعناوين وخطًّا للأرقام الاحتفاليّة، لا خطًّا للثلث.
 */
export const fonts = {
  thuluth: 'Thuluth',
  thuluthAlt: 'ThuluthAlt',
  thuluthAltBold: 'ThuluthAltBold',
  naskh: 'Naskh',
  naskhBold: 'NaskhBold',
  body: 'Plex',
  bodyMedium: 'PlexMedium',
  bodyBold: 'PlexBold',
} as const;

/**
 * سلسلة سقوط الثلث. على الويب يقبل `react-native-web` قائمةً بفواصل
 * فتُنقل سلسلة `.thuluth` من الموقع كما هي؛ وعلى المنصّات الأصليّة
 * لا يقبل `fontFamily` إلّا عائلةً واحدة — فإن أخفق تحميل الملفّ سقط
 * النظام إلى خطّه العربيّ الافتراضيّ، ولا سبيل إلى ترتيبٍ أدقّ.
 */
const thuluthStack =
  Platform.OS === 'web'
    ? `${fonts.thuluth}, ${fonts.thuluthAlt}, ${fonts.naskhBold}, serif`
    : fonts.thuluth;

/** المتن — يُستعمل حيثما لم يُطلب خطٌّ احتفاليّ. */
export const fontFamily = fonts.body;

/**
 * حروف الثلث المشكَّلة تتجاوز صندوق النصّ رأسيًّا، فتُقتصّ علامات
 * التشكيل ما لم يُوسَّع `lineHeight` كثيرًا. الموقع يضبط `line-height:2.25`
 * للثلث و`1.9` للنسخ — والنسب هنا مطابقة.
 */
export const THULUTH_LINE = 2.25;
export const NASKH_LINE = 1.9;

/**
 * الوزن لا يُضبط في هذه الأنماط: لكلّ وزنٍ ملفُّ خطّ مستقلّ. ضبط
 * `fontWeight` فوق خطٍّ عريضٍ أصلًا يجعل المتصفّح يصطنع عرضًا زائفًا
 * فوق العريض فيبهت الرسم — فالوزن يأتي من اسم العائلة وحده.
 */
const thuluthSize = (fontSize: number) => ({
  fontFamily: thuluthStack,
  fontSize,
  // التشكيل يخرج عن صندوق النصّ رأسيًّا؛ هذا الاتّساع يمنع اقتصاصه.
  lineHeight: Math.round(fontSize * THULUTH_LINE),
});

const naskhSize = (fontSize: number) => ({
  fontFamily: fonts.naskhBold,
  fontSize,
  lineHeight: Math.round(fontSize * NASKH_LINE),
});

export const typography = {
  /** اسم الكلّية في الهيرو — ثلثٌ كبير. */
  hero: thuluthSize(30),
  /** عنوان احتفاليّ داخل الشاشة. */
  ceremonial: thuluthSize(21),
  /** رقم إحصائيّ — `ThuluthAlt` العريض، وهو خطّ `.facts b` في الموقع. */
  numeral: {
    fontFamily: fonts.thuluthAltBold,
    fontSize: 30,
    lineHeight: 46,
  },
  /** عنوان قسم — نسخ. */
  display: naskhSize(23),
  title: naskhSize(19),
  /** عنوان بطاقة — نسخ، وهو أبرز ما يميّز البطاقات عن المتن. */
  heading: naskhSize(16.5),

  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 26 },
  bodyStrong: { fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 26 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 23 },
  smallStrong: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 23 },
  tiny: { fontFamily: fonts.body, fontSize: 11.5, lineHeight: 20 },
  tinyStrong: { fontFamily: fonts.bodyMedium, fontSize: 11.5, lineHeight: 20 },
} as const;

/* ————————————— الاتّجاه ————————————— */

/**
 * حقل مضمونُه لاتينيّ (بريد، كلمة سرّ، رابط): يُقرأ من اليسار لليمين
 * ويُحاذى إلى اليسار **بصريًّا** مهما كان اتّجاه الواجهة.
 *
 * لماذا لا يكفي `textAlign:'left'`؟ لأنّ React Native **يعكس** قيمتَي
 * `left` و`right` من تلقائه حين يكون الاتّجاه RTL — على أندرويد في
 * `TextAttributeProps.getTextAlignment` (`"left" -> if (isRTL) Gravity.RIGHT`)
 * وعلى iOS في `RCTTextAttributes` بالمثل. فكتابة `left` صراحةً تُنتج
 * يمينًا: انقلابٌ مزدوج. أمّا `react-native-web` فلا يعكس شيئًا ويترك
 * الأمر لـ`dir` في CSS — ولذلك اختلف الحلّ بين المنصّتين.
 */
export const latinInput: TextStyle = {
  writingDirection: 'ltr',
  textAlign: Platform.OS === 'web' ? 'left' : I18nManager.isRTL ? 'right' : 'left',
};

/* ————————————— الظلال ————————————— */

const nativeShadow = (opacity: number, radiusPx: number, offsetY: number) =>
  Platform.select({
    ios: {
      shadowColor: colors.navyDeep,
      shadowOpacity: opacity,
      shadowRadius: radiusPx,
      shadowOffset: { width: 0, height: offsetY },
    },
    android: { elevation: Math.max(1, Math.round(radiusPx / 4)) },
    default: {
      boxShadow: `0 ${offsetY}px ${radiusPx}px rgba(7,22,48,${opacity})`,
    } as object,
  });

export const shadow = {
  /** `--sh-1` في الموقع. */
  card: nativeShadow(0.07, 10, 2),
  /** `--sh-2` — للبطاقات البارزة والهيرو. */
  raised: nativeShadow(0.13, 26, 12),
  /** `--sh-3` — لأعلى عنصرٍ في الصفحة. */
  deep: nativeShadow(0.24, 44, 22),
};

/** حدٌّ ذهبيّ خفيف يُستعمل فوق الأسطح الكحليّة. */
export const goldHairline = 'rgba(217,174,75,0.24)';
