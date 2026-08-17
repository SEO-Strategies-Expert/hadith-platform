import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Alert, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NavNode, NavPayload } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { useInstructorText } from '../instructor/ui';
import { colors, goldHairline, radius, spacing } from '../theme';
import { GoldRule, GoldTitle, ThuluthText } from '../ui/gold';
import { Card, LivePulse, Row, Txt } from '../ui/kit';
import { openExternal } from '../ui/openLink';
import { ErrorState, LoadingState, useQuery } from '../ui/states';
import {
  headerIcon,
  resolveTarget,
  socialIcon,
  type IconName,
  type NavTarget,
} from './links';
import { loadNav } from './store';

/**
 * قائمة التنقّل الشاملة — نظير `.nav-toggle` في الموقع.
 *
 * الموقع نفسه يطوي `.mainnav` إلى زرّ ثلاث شُرَط على عرض الهاتف
 * (`src/components/site/SiteHeader.tsx` → `<button className="nav-toggle">`
 * ورمزه `#i-menu`)، فوجود الزرّ في التطبيق موافقةٌ للموقع لا زيادةٌ عليه.
 * وترتيب ما تحته هو ترتيب الهيدر نفسه، مقروءًا من `/api/v1/nav` لا
 * مكتوبًا هنا: ما يعدّله المدير في اللوحة يظهر في التطبيق بلا إصدارٍ جديد.
 *
 * القائمة **شاشةٌ كاملة** لا درجًا ينزلق من حافّة. والسبب اتّجاهيّ:
 * الدرج يحتاج حافّةً يُثبَّت عليها بـ`left/right`، وهما ممنوعان مع RTL
 * المفعَّل (`I18nManager.forceRTL`) لأنّ RN يعكسهما من تلقائه. والشاشة
 * الكاملة أوسع لشجرةٍ من عشرة أقسامٍ بأبنائها، وأقرب إلى ما يفعله
 * الموقع حين تُفتح قائمته على الهاتف.
 */

/* ————————————— الحالة المشتركة ————————————— */

type NavMenuValue = { open: () => void; close: () => void };

const NavMenuContext = createContext<NavMenuValue | null>(null);

/**
 * يُرجع `null` خارج المزوّد بدل أن يرمي: `BrandHeader` قد يُصيَّر في
 * مواضع تسبق تركيب الشجرة، وسقوط التطبيق هناك أسوأ من غياب زرٍّ لا
 * يفيد قبل الإقلاع أصلًا.
 */
export function useNavMenu(): NavMenuValue | null {
  return useContext(NavMenuContext);
}

/* ————————————— المزوّد ————————————— */

export function NavMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const value = useMemo<NavMenuValue>(
    () => ({ open: () => setOpen(true), close: () => setOpen(false) }),
    []
  );

  return (
    <NavMenuContext.Provider value={value}>
      {children}
      <Modal visible={open} animationType="slide" onRequestClose={value.close} statusBarTranslucent>
        {/* المحتوى يُركَّب عند الفتح وحده: لا طلبَ شبكةٍ لقائمةٍ لم تُفتح. */}
        {open ? <NavMenuSheet onClose={value.close} /> : null}
      </Modal>
    </NavMenuContext.Provider>
  );
}

/* ————————————— عناصر القائمة ————————————— */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.sm }}>
        <ThuluthText variant="ceremonial" color={colors.navy} numberOfLines={2}>
          {title}
        </ThuluthText>
        <GoldRule height={2} style={{ width: 88 }} />
      </View>
      <View style={{ gap: spacing.sm }}>{children}</View>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  hint,
  value,
  trailing,
  danger,
  live,
  chevron = true,
  onPress,
}: {
  icon: IconName;
  label: string;
  /** سطرٌ صغير تحت الاسم — لقول «تُفتح في المتصفّح» قبل الضغط لا بعده. */
  hint?: string;
  /** قيمةٌ في طرف السطر (اللغة الأخرى مثلًا). */
  value?: string;
  trailing?: IconName;
  danger?: boolean;
  live?: boolean;
  chevron?: boolean;
  onPress: () => void;
}) {
  const { isRTL } = useI18n();
  const fg = danger ? colors.danger : colors.navy;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        danger ? { borderColor: '#E2C4C4', backgroundColor: colors.dangerBg } : null,
        pressed ? { opacity: 0.75 } : null,
      ]}
    >
      <Row justify="space-between" gap={spacing.md}>
        <Row gap={spacing.md} style={{ flex: 1, minWidth: 0 }}>
          <Ionicons name={icon} size={20} color={fg} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Row gap={spacing.sm}>
              {live ? <LivePulse color={colors.danger} /> : null}
              <Txt variant="body" color={danger ? colors.danger : colors.text} numberOfLines={1}>
                {label}
              </Txt>
            </Row>
            {hint ? (
              <Txt variant="tiny" color={colors.textMuted} numberOfLines={1}>
                {hint}
              </Txt>
            ) : null}
          </View>
        </Row>
        <Row gap={spacing.sm}>
          {value ? (
            <Txt variant="smallStrong" color={colors.goldDark}>
              {value}
            </Txt>
          ) : null}
          {trailing ? (
            <Ionicons name={trailing} size={17} color={colors.textMuted} />
          ) : chevron ? (
            <Ionicons
              // الأيقونات محارفُ خطٍّ لا يقلبها `I18nManager`، فيُنتقى الرمز
              // صراحةً: «التالي» في واجهةٍ من اليمين لليسار يشير يسارًا.
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={17}
              color={colors.textMuted}
            />
          ) : null}
        </Row>
      </Row>
    </Pressable>
  );
}

/**
 * عنصرٌ رئيس وتحته أبناؤه — نظير `li.has-drop > .drop` في الموقع.
 * الضغط على السطر ينتقل إلى العنصر نفسه، والضغط على السهم وحده يطوي
 * الأبناء ويبسطهم؛ فلا يُحرم المستخدم من صفحة الأب لأنّ له أبناء —
 * وهي العلّة نفسها التي من أجلها جعل الموقع رأسَ المجموعة رابطًا لا
 * زرَّ فتحٍ فحسب.
 */
function TreeItem({
  node,
  onGo,
}: {
  node: NavNode;
  onGo: (target: NavTarget, title: string) => void;
}) {
  const { pick, t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children.length > 0;
  const label = pick(node.labelAr, node.labelEn);

  return (
    <Card padded={false}>
      <View style={styles.treeHead}>
        <Pressable
          onPress={() => onGo(resolveTarget(node.href, node.external), label)}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={({ pressed }) => [styles.treeHeadMain, pressed ? { opacity: 0.75 } : null]}
        >
          <Row gap={spacing.md} style={{ flex: 1, minWidth: 0 }}>
            <Ionicons name={headerIcon(node.icon)} size={20} color={colors.navy} />
            <Txt variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
              {label}
            </Txt>
            {node.external ? <Ionicons name="open-outline" size={16} color={colors.textMuted} /> : null}
          </Row>
        </Pressable>

        {hasChildren ? (
          <Pressable
            onPress={() => setExpanded((v) => !v)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={expanded ? t('menuCollapse') : t('menuExpand')}
            style={({ pressed }) => [styles.treeToggle, pressed ? { opacity: 0.6 } : null]}
          >
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.goldDark} />
          </Pressable>
        ) : null}
      </View>

      {expanded && hasChildren ? (
        <View style={styles.treeKids}>
          {node.children.map((child) => {
            const childLabel = pick(child.labelAr, child.labelEn);
            return (
              <Pressable
                key={child.id}
                onPress={() => onGo(resolveTarget(child.href, child.external), childLabel)}
                accessibilityRole="button"
                accessibilityLabel={childLabel}
                style={({ pressed }) => [styles.treeKid, pressed ? { opacity: 0.7 } : null]}
              >
                <Row gap={spacing.sm} style={{ flex: 1, minWidth: 0 }}>
                  <Ionicons
                    name={child.external ? 'open-outline' : 'ellipse-outline'}
                    size={child.external ? 15 : 9}
                    color={colors.goldDark}
                  />
                  <Txt variant="small" numberOfLines={1} style={{ flex: 1 }}>
                    {childLabel}
                  </Txt>
                </Row>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </Card>
  );
}

/* ————————————— الشاشة ————————————— */

function NavMenuSheet({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { t, pick, lang, setLang } = useI18n();
  const instructorText = useInstructorText();
  const { status, me, signOut } = useAuth();
  const nav = useQuery<NavPayload>(loadNav, []);

  const authed = status === 'authed';
  const isInstructor = me?.role === 'INSTRUCTOR' || me?.role === 'ADMIN';
  const isAdmin = me?.role === 'ADMIN';

  const data = nav.data;
  const live = data?.live ?? null;
  const social = data?.social ?? [];

  /** كلّ انتقالٍ يُغلق القائمة أوّلًا فلا تبقى فوق ما انتقلنا إليه. */
  const go = useCallback(
    (target: NavTarget, title: string) => {
      onClose();
      if (target.kind === 'external') {
        // موقعٌ ليس للكلّية (`sunnah.one`، `dorar.net`…): هذا وحده ما
        // يُفتح خارج التطبيق، وفتحُه خارجًا هو الصواب.
        void openExternal(target.url);
        return;
      }
      if (target.kind === 'native') {
        router.navigate(target.href);
        return;
      }
      // صفحةٌ محتوائيّة: تُرسم أصيلًا في `page/[slug]` لا في متصفّح.
      // والمِرساة تُهمَل — الصفحة تُعرض كاملةً في شاشةٍ واحدة.
      router.push({ pathname: '/page/[slug]', params: { slug: target.path, title } });
    },
    [onClose]
  );

  const goNative = useCallback(
    (href: Href) => {
      onClose();
      router.navigate(href);
    },
    [onClose]
  );

  const confirmSignOut = useCallback(() => {
    const run = async () => {
      onClose();
      await signOut();
      router.replace('/');
    };
    // `Alert` بلا أثرٍ مفيد في المتصفّح، فيؤكَّد بـ`confirm`.
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(t('logoutConfirm'))) void run();
      return;
    }
    Alert.alert(t('logout'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: () => void run() },
    ]);
  }, [onClose, signOut, t]);

  return (
    <View style={styles.sheet}>
      {/* ————— رأس القائمة: هويّة الكلّية وزرّ الإغلاق ————— */}
      <LinearGradient
        colors={[colors.navy, colors.navyDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.head, { paddingTop: insets.top + spacing.sm }]}
      >
        <Row gap={spacing.md}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.emblem}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            {/* الاسم من القاعدة حين يصل، ومن قاموس التطبيق قبل ذلك. */}
            <GoldTitle variant="ceremonial" align="auto" numberOfLines={2} style={styles.brandName}>
              {pick(data?.site.shortAr, data?.site.shortEn) || t('appNameShort')}
            </GoldTitle>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('close')}
            style={({ pressed }) => [styles.iconBtn, pressed ? { opacity: 0.6 } : null]}
          >
            <Ionicons name="close" size={22} color={colors.goldLight} />
          </Pressable>
        </Row>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{
          padding: spacing.lg,
          paddingBottom: insets.bottom + spacing.xxl,
          gap: spacing.xl,
        }}
      >
        {/* ————— ١) حسابي ————— */}
        <Section title={t('accountTitle')}>
          {authed ? (
            <MenuRow
              icon="school-outline"
              label={t('menuStudentPortal')}
              onPress={() => goNative('/learning')}
            />
          ) : (
            <MenuRow icon="log-in-outline" label={t('loginAction')} onPress={() => goNative('/login')} />
          )}

          {/*
            الإخفاء هنا راحةٌ لا حراسة: الخادم يردّ ٤٠٣ لكل مسار من مسارات
            اللوحة لغير `INSTRUCTOR`/`ADMIN` مهما فُتحت الشاشة.
          */}
          {authed && isInstructor ? (
            <MenuRow
              icon="easel-outline"
              label={instructorText.console}
              onPress={() => goNative('/instructor')}
            />
          ) : null}

          {/*
            لوحة تحكّم الموقع لوحةُ تحريرٍ كاملة على الحاسوب: رفعُ ملفّات،
            ومحرّرُ نصٍّ طويل، وجداولُ عريضة. ولا نظير لها في التطبيق.
            فلم يعد لها بندٌ يضغطه المدير: لا رابطَ يخرج إلى المتصفّح ولا
            عنوانَ يُعرض — سطرٌ مكتوب يقول أين تُدار، وكفى.
          */}
          {authed && isAdmin ? (
            <Card style={{ gap: spacing.xs }}>
              <Row gap={spacing.sm}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.navy} />
                <Txt variant="smallStrong">{t('menuAdminConsole')}</Txt>
              </Row>
              <Txt variant="tiny" color={colors.textMuted}>
                {t('menuAdminOnDesktop')}
              </Txt>
            </Card>
          ) : null}
        </Section>

        {/* ————— ٢) صفحات الكلّية — شجرة الهيدر كما في الموقع ————— */}
        <Section title={t('menuPages')}>
          {!data && nav.loading ? <LoadingState /> : null}
          {!data && nav.error ? <ErrorState message={nav.error} onRetry={nav.reload} /> : null}
          {data?.header.map((node) => (
            <TreeItem key={node.id} node={node} onGo={go} />
          ))}
        </Section>

        {/* ————— ٣) البثّ المباشر — إن ضُبط وحده ————— */}
        {live ? (
          <Section title={t('menuLive')}>
            <MenuRow
              icon="radio-outline"
              label={t('menuLive')}
              hint={t('menuOpensInBrowser')}
              trailing="open-outline"
              live
              onPress={() => void openExternal(live)}
            />
          </Section>
        ) : null}

        {/* ————— ٤) تواصل معنا ————— */}
        <Section title={t('contactTitle')}>
          {social.length > 0 ? (
            <Row gap={spacing.sm} wrap>
              {social.map((s) => (
                <Pressable
                  key={s.id}
                  onPress={() => void openExternal(s.url)}
                  accessibilityRole="link"
                  accessibilityLabel={pick(s.labelAr, s.labelEn)}
                  style={({ pressed }) => [styles.socialChip, pressed ? { opacity: 0.7 } : null]}
                >
                  <Ionicons name={socialIcon(s.key)} size={20} color={colors.navy} />
                </Pressable>
              ))}
            </Row>
          ) : data ? (
            // الفراغ يُقال ولا يُموَّه بأيقوناتٍ لا تذهب إلى شيء.
            <Card>
              <Txt variant="small" color={colors.textMuted}>
                {t('menuSocialEmpty')}
              </Txt>
            </Card>
          ) : null}

          <MenuRow icon="mail-outline" label={t('contactTitle')} onPress={() => goNative('/contact')} />
        </Section>

        {/* ————— ٥) اللغة والإعدادات والخروج ————— */}
        <Section title={t('settings')}>
          <MenuRow
            icon="globe-outline"
            label={t('menuSwitchLang')}
            value={lang === 'ar' ? t('english') : t('arabic')}
            chevron={false}
            onPress={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          />
          <MenuRow icon="settings-outline" label={t('settings')} onPress={() => goNative('/settings')} />
          {authed ? (
            <MenuRow icon="log-out-outline" label={t('logout')} danger onPress={confirmSignOut} />
          ) : null}
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.cream },
  head: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    // `.menubar{border-bottom:2px solid var(--gold)}` في الموقع.
    borderBottomWidth: 2,
    borderBottomColor: colors.gold,
  },
  emblem: { width: 40, height: 40 },
  brandName: { fontSize: 15, lineHeight: 32 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217,174,75,0.12)',
    borderWidth: 1,
    borderColor: goldHairline,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  treeHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    // لا `paddingLeft/Right`: الحشو المنطقي وحده يصمد مع قلب الاتّجاه.
    paddingStart: spacing.lg,
    paddingEnd: spacing.sm,
  },
  treeHeadMain: { flex: 1, minWidth: 0, paddingVertical: spacing.md },
  treeToggle: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cream100,
    borderWidth: 1,
    borderColor: goldHairline,
  },
  treeKids: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.cream,
    paddingVertical: spacing.xs,
  },
  treeKid: {
    paddingVertical: spacing.sm,
    paddingStart: spacing.xxl,
    paddingEnd: spacing.lg,
  },
  socialChip: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gold,
  },
});
