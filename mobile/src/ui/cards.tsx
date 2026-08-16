import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, goldHairline, radius, shadow, spacing } from '../theme';
import { useI18n } from '../i18n';
import type {
  CourseCard as CourseCardType,
  FacultyMember,
  NewsItem,
  SessionPublic,
  SessionStudent,
} from '../api/types';
import { Badge, Card, LivePulse, PressableCard, ProgressBar, Row, Txt } from './kit';
import { Button } from './Button';
import { RemoteImage } from './RemoteImage';
import { CornerOrnament, GoldRule, ThuluthText } from './gold';
import { assetUrl, courseImage, newsImage } from './assets';
import { openExternal } from './openLink';

/* ————— بطاقة مقرّر ————— */

/**
 * بطاقة مقرّر.
 *
 * بيانات المقرّرات في قاعدة العميل شحيحة: لا وصف ولا محاضر ولا عدد
 * دروس. فالقاعدة هنا: **ما غاب لا يُعرض** — لا حقلٌ فارغ ولا «٠ درس»
 * (والصفر بالهنديّة «٠» يُرسم نقطةً صغيرة فيبدو خطأً في التصيير، فضلًا
 * عن أنّه يقول للطالب إنّ المقرّر خاوٍ). والفراغ الناتج يُملأ بما هو
 * حقيقيّ لا بما هو مُختلَق: عنوان المقرّر بلغته الأخرى (وهو نقحرةٌ
 * لاتينيّة أنيقة تحت الثلث)، ورقم المرحلة `stage.num*` — وهو حقلٌ
 * يُرسله الخادم ولم يكن يُستعمل — ثمّ سطر «تفاصيل المقرّر» ليقفل
 * البطاقة على إجراءٍ بدل بياضٍ مفتوح.
 */
export function CourseTile({
  course,
  progressPct,
  statusLabel,
  onPress,
}: {
  course: CourseCardType;
  progressPct?: number;
  statusLabel?: string;
  onPress: () => void;
}) {
  const { pick, n, t, lang } = useI18n();

  const title = pick(course.titleAr, course.titleEn);
  // العنوان باللغة الأخرى — يُعرض سطرًا ثانويًّا ما لم يكن نسخةً منه.
  const altTitle = pick(course.titleEn, course.titleAr);
  const summary = course.summaryAr || course.summaryEn ? pick(course.summaryAr, course.summaryEn) : null;

  // ما لا قيمة له لا يدخل الصفّ أصلًا: `0` و`null` كلاهما ساقط.
  const meta: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }[] = [];
  if (course.instructor) {
    meta.push({ icon: 'person-outline', text: pick(course.instructor.nameAr, course.instructor.nameEn) });
  }
  if (course.lessonCount) meta.push({ icon: 'book-outline', text: `${n(course.lessonCount)} ${t('lesson')}` });
  if (course.hours) meta.push({ icon: 'time-outline', text: `${n(course.hours)} ${t('hours')}` });
  // حين لا يصل شيءٌ من ذلك، رقمُ المرحلة بيانٌ حقيقيّ يسدّ الصفّ.
  if (meta.length === 0 && course.stage?.numAr) {
    meta.push({ icon: 'layers-outline', text: pick(course.stage.numAr, course.stage.numEn ?? course.stage.numAr) });
  }

  return (
    <PressableCard onPress={onPress} padded={false}>
      <RemoteImage uri={courseImage(course.imageUrl, course.id)} height={150} rounded={0} dim={0.12}>
        {/* الشارات فوق الصورة على تدرّجٍ كحليّ كي تُقرأ مهما كانت الصورة. */}
        <LinearGradient
          colors={['rgba(7,22,48,0.72)', 'rgba(7,22,48,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.imageTopScrim}
        >
          <Row gap={spacing.sm} wrap>
            {course.stage ? (
              <Badge label={pick(course.stage.titleAr, course.stage.titleEn)} tone="goldSolid" />
            ) : null}
            {statusLabel ? <Badge label={statusLabel} tone="neutral" /> : null}
          </Row>
        </LinearGradient>
      </RemoteImage>

      <View style={styles.tileBody}>
        <ThuluthText variant="ceremonial" color={colors.navy} numberOfLines={2}>
          {title}
        </ThuluthText>
        <GoldRule height={2} style={{ width: 56 }} />

        {summary ? (
          <Txt variant="small" color={colors.textMuted} numberOfLines={3}>
            {summary}
          </Txt>
        ) : altTitle && altTitle !== title ? (
          /*
            النقحرة اللاتينيّة نصٌّ من اليسار داخل صفحةٍ من اليمين. تُترك
            **بلا محاذاةٍ صريحة**: المحاذاة الافتراضيّة تتبع اتّجاه الفقرة
            فتجلس على حافّة العنوان نفسها. أمّا `align="right"` فينقلب
            يسارًا متى سرى RTL — يعكس React Native `left`/`right` من
            تلقائه (انظر `latinInput` في `theme.ts`).
          */
          <Txt variant="small" color={colors.textMuted} numberOfLines={2}>
            {altTitle}
          </Txt>
        ) : null}

        <Row justify="space-between" style={{ marginTop: spacing.xs }}>
          <Row gap={spacing.lg} wrap style={{ flexShrink: 1 }}>
            {meta.map((m) => (
              <MetaChip key={m.text} icon={m.icon} text={m.text} />
            ))}
          </Row>
          {/* سطرٌ يقفل البطاقة على إجراء بدل بياضٍ مفتوح. */}
          <Row gap={2}>
            <Txt variant="tinyStrong" color={colors.goldDark}>
              {pick('التفاصيل', 'Details')}
            </Txt>
            <Ionicons
              name={lang === 'en' ? 'chevron-forward' : 'chevron-back'}
              size={13}
              color={colors.goldDark}
            />
          </Row>
        </Row>

        {progressPct !== undefined ? (
          <ProgressBar pct={progressPct} label={`${t('progress')} · ${n(Math.round(progressPct))}٪`} />
        ) : null}
      </View>
    </PressableCard>
  );
}

/** سطرُ بيانٍ صغير بأيقونة — بديلُ النصّ المجرّد في ميتا البطاقات. */
export function MetaChip({
  icon,
  text,
  color = colors.textMuted,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
  color?: string;
}) {
  return (
    <Row gap={spacing.xs}>
      <Ionicons name={icon} size={13} color={colors.gold} />
      <Txt variant="tiny" color={color}>
        {text}
      </Txt>
    </Row>
  );
}

/* ————— بطاقة مجلس ————— */

export function SessionTile({
  session,
  featured,
}: {
  session: SessionPublic | SessionStudent;
  /** المجلس القادم في الرئيسة — بطاقةٌ كحليّة بارزة. */
  featured?: boolean;
}) {
  const { pick, t, dateTime, n } = useI18n();
  const recordingUrl = 'recordingUrl' in session ? session.recordingUrl : null;
  const hasRecording = 'hasRecording' in session ? session.hasRecording : Boolean(recordingUrl);
  const live = session.isLiveNow;

  const body = (
    <>
      <Row gap={spacing.sm} wrap>
        {live ? (
          <View style={styles.liveBadge}>
            <LivePulse color={colors.navyDeep} />
            <Txt variant="tinyStrong" color={colors.navyDeep}>
              {t('liveNow')}
            </Txt>
          </View>
        ) : null}
        {session.isPublic ? (
          <Badge label={t('sessionPublicBadge')} tone={featured ? 'goldSolid' : 'neutral'} />
        ) : null}
      </Row>

      <ThuluthText
        variant="ceremonial"
        color={featured ? colors.goldLight : colors.navy}
        numberOfLines={3}
      >
        {pick(session.titleAr, session.titleEn)}
      </ThuluthText>

      <Row gap={spacing.md} wrap>
        <MetaChip
          icon="calendar-outline"
          text={dateTime(session.startsAt)}
          color={featured ? colors.textOnNavyMuted : colors.textMuted}
        />
        {session.durationMin ? (
          <MetaChip
            icon="time-outline"
            text={`${n(session.durationMin)} ${t('minutes')}`}
            color={featured ? colors.textOnNavyMuted : colors.textMuted}
          />
        ) : null}
      </Row>

      {session.course ? (
        <MetaChip
          icon="library-outline"
          text={pick(session.course.titleAr, session.course.titleEn)}
          color={featured ? colors.textOnNavyMuted : colors.textMuted}
        />
      ) : null}

      {session.instructor ? (
        <MetaChip
          icon="person-outline"
          text={pick(session.instructor.nameAr, session.instructor.nameEn)}
          color={featured ? colors.textOnNavyMuted : colors.textMuted}
        />
      ) : null}

      {/* رابط الانضمام لا يصل من الخادم إلّا داخل نافذة البثّ. */}
      {session.joinUrl ? (
        <>
          <Button label={t('joinNow')} onPress={() => void openExternal(session.joinUrl)} />
          {session.passcode ? (
            <Txt variant="tiny" color={featured ? colors.textOnNavyMuted : colors.textMuted}>
              {t('passcode')}: {session.passcode}
            </Txt>
          ) : null}
        </>
      ) : (
        <Txt variant="tiny" color={featured ? colors.textOnNavyMuted : colors.textMuted}>
          {t('notYetOpen')}
        </Txt>
      )}

      {recordingUrl ? (
        <Button
          label={t('openRecording')}
          kind={featured ? 'onNavy' : 'ghost'}
          small
          onPress={() => void openExternal(recordingUrl)}
        />
      ) : hasRecording ? (
        <Txt variant="tiny" color={featured ? colors.textOnNavyMuted : colors.textMuted}>
          {t('recording')}
        </Txt>
      ) : null}
    </>
  );

  if (featured) {
    return (
      <LinearGradient
        colors={[colors.navyMid, colors.navyDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.featuredSession, live ? { borderColor: colors.gold } : null, shadow.raised as object]}
      >
        <CornerOrnament style={{ top: -6, insetInlineEnd: -6 }} />
        {body}
      </LinearGradient>
    );
  }

  return (
    <Card style={{ gap: spacing.md, borderColor: live ? colors.gold : colors.border, borderWidth: live ? 1.5 : 1 }}>
      {body}
    </Card>
  );
}

/* ————— بطاقة خبر ————— */

export function NewsTile({ item }: { item: NewsItem }) {
  const { pick, date } = useI18n();
  const router = useRouter();
  return (
    <PressableCard onPress={() => router.push(`/news/${item.slug ?? item.id}`)} padded={false}>
      <Row gap={0} align="stretch">
        <RemoteImage uri={newsImage(item.imageUrl, item.id)} height={112} width={108} rounded={0} />
        <View style={styles.newsBody}>
          {item.tagAr || item.tagEn ? <Badge label={pick(item.tagAr, item.tagEn)} tone="gold" /> : null}
          <Txt variant="heading" color={colors.navy} numberOfLines={3}>
            {pick(item.titleAr, item.titleEn)}
          </Txt>
          <MetaChip icon="calendar-outline" text={date(item.date)} />
        </View>
      </Row>
    </PressableCard>
  );
}

/** الخبر الرئيس — صورةٌ عريضة والعنوان فوقها بتدرّجٍ كحليّ. */
export function NewsLeadTile({ item }: { item: NewsItem }) {
  const { pick, date } = useI18n();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/news/${item.slug ?? item.id}`)}
      style={({ pressed }) => [styles.leadHost, shadow.raised as object, pressed ? { opacity: 0.85 } : null]}
    >
      <RemoteImage uri={newsImage(item.imageUrl, item.id)} height={214} rounded={0}>
        <LinearGradient
          colors={['rgba(7,22,48,0.05)', 'rgba(7,22,48,0.72)', 'rgba(7,22,48,0.96)']}
          locations={[0, 0.5, 1]}
          style={styles.leadScrim}
        >
          {item.tagAr || item.tagEn ? <Badge label={pick(item.tagAr, item.tagEn)} tone="goldSolid" /> : null}
          <Txt variant="title" color={colors.cream} numberOfLines={3}>
            {pick(item.titleAr, item.titleEn)}
          </Txt>
          <MetaChip icon="calendar-outline" text={date(item.date)} color={colors.textOnNavyMuted} />
        </LinearGradient>
      </RemoteImage>
    </Pressable>
  );
}

/* ————— بطاقة عضو الهيئة ————— */

/**
 * بطاقة عضو الهيئة العلميّة — **بلا اسم**.
 *
 * طلبُ العميل صريح: تُعرَّف الهيئة بصفتها العلميّة لا بأشخاصها. فتبقى
 * الصورة والرتبة والتخصّص والدولة، ويسقط الاسم. والرتبة تخلُف الاسمَ في
 * موضع العنوان لئلّا تفتتح البطاقة على بياض؛ فإن غابت الرتبةُ أيضًا
 * تقدّم التخصّص.
 */
export function FacultyTile({ member, width }: { member: FacultyMember; width?: number }) {
  const { pick, t } = useI18n();

  const rank = member.rankAr || member.rankEn ? pick(member.rankAr, member.rankEn) : null;
  const spec = member.specAr || member.specEn ? pick(member.specAr, member.specEn) : null;
  const country = member.countryAr || member.countryEn ? pick(member.countryAr, member.countryEn) : null;

  const headline = rank ?? spec;
  const support = rank ? spec : null;

  return (
    <Card style={[styles.facultyCard, width ? { width } : { flex: 1 }]} padded={false}>
      <RemoteImage uri={assetUrl(member.photoUrl)} height={168} rounded={0}>
        <LinearGradient
          colors={['rgba(7,22,48,0)', 'rgba(7,22,48,0.55)']}
          style={styles.facultyScrim}
        >
          {member.isCouncilHead ? (
            <Badge label={t('facultyCouncilHead')} tone="goldSolid" />
          ) : member.isCouncil ? (
            <Badge label={t('facultyCouncil')} tone="gold" />
          ) : null}
        </LinearGradient>
      </RemoteImage>

      <View style={styles.facultyBody}>
        {headline ? (
          <Txt variant="heading" color={colors.navy} numberOfLines={2}>
            {headline}
          </Txt>
        ) : null}
        {support ? (
          <Txt variant="tiny" color={colors.textMuted} numberOfLines={2}>
            {support}
          </Txt>
        ) : null}
        {country ? <MetaChip icon="earth-outline" text={country} /> : null}
      </View>
    </Card>
  );
}

/* ————— بطاقة مرتكز ————— */

export function PillarTile({
  image,
  title,
  body,
  onPress,
  width,
}: {
  image: string;
  title: string;
  body: string;
  onPress?: () => void;
  width: number;
}) {
  const inner = (
    <>
      <RemoteImage uri={image} height={104} rounded={0} dim={0.2} />
      <View style={styles.pillarBody}>
        <Txt variant="heading" color={colors.navy} numberOfLines={2}>
          {title}
        </Txt>
        <Txt variant="tiny" color={colors.textMuted} numberOfLines={3}>
          {body}
        </Txt>
      </View>
    </>
  );

  if (onPress) {
    return (
      <PressableCard onPress={onPress} padded={false} style={{ width }}>
        {inner}
      </PressableCard>
    );
  }
  return (
    <Card padded={false} style={{ width }}>
      {inner}
    </Card>
  );
}

const styles = StyleSheet.create({
  imageTopScrim: { padding: spacing.md, paddingBottom: spacing.xl },
  tileBody: { padding: spacing.lg, gap: spacing.sm },

  featuredSession: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: goldHairline,
    padding: spacing.xl,
    gap: spacing.md,
    overflow: 'hidden',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
  },

  newsBody: { flex: 1, padding: spacing.md, gap: spacing.xs, justifyContent: 'center' },

  leadHost: { borderRadius: radius.lg, overflow: 'hidden' },
  leadScrim: { flex: 1, justifyContent: 'flex-end', padding: spacing.lg, gap: spacing.sm },

  facultyCard: { overflow: 'hidden' },
  facultyScrim: { flex: 1, justifyContent: 'flex-end', padding: spacing.sm },
  facultyBody: { padding: spacing.md, gap: 2 },

  pillarBody: { padding: spacing.md, gap: spacing.xs },
});
