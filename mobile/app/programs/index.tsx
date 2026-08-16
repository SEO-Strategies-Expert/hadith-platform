import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../src/i18n';
import { colors, spacing } from '../../src/theme';
import { Badge, PressableCard, Row, Screen, SectionTitle, Txt } from '../../src/ui/kit';
import { CornerOrnament, GoldRule, ThuluthText } from '../../src/ui/gold';
import { CourseTile, MetaChip } from '../../src/ui/cards';
import { QueryView, useQuery } from '../../src/ui/states';
import { degreeKeyOf, fetchAllCourses, groupPrograms } from '../../src/programs/stages';

/**
 * شاشة البرامج — أصيلةٌ لا `WebView`.
 *
 * البرامج جوهر الكلّية ومدخلُ كلّ طالبٍ إليها، وصفحةُ الموقع لا تعرف
 * الكتالوج أصلًا: نصُّها محرَّرٌ ثابت، والمقرّرات في القاعدة. فالشاشة
 * تُبنى من `/api/v1/courses` مباشرةً — ثلاث بطاقاتٍ للدرجات كلٌّ برقم
 * مرحلتها وعنوانها وعدد مقرّراتها ودروسها، ورابعةٌ لما لا مرحلة له.
 *
 * ما لا يصل من الخادم لا يُكتب هنا: `stageBrief` في العقد يُخرج
 * `key/title/num` وحدها، أمّا `descAr` و`items` في جدول `program_stages`
 * فلا مسار يُخرجهما. فسطرُ الوصف هو **الدرجة المقابلة** — وهي علاقةٌ
 * تقولها شجرة الهيدر نفسها — لا نصٌّ مخترَع يوهم أنّه من اللوحة.
 */

/* ————————————— بطاقة درجة ————————————— */

function ProgramCard({
  num,
  title,
  degree,
  note,
  courses,
  lessons,
  onPress,
}: {
  /** «المرحلة الأولى» — `numAr` من القاعدة. */
  num?: string | null;
  title: string;
  /** «درجة البكالوريوس» — شارةٌ ذهبيّة فوق العنوان. */
  degree?: string | null;
  note?: string | null;
  courses: number;
  lessons: number;
  onPress: () => void;
}) {
  const { t, n, isRTL } = useI18n();

  return (
    <PressableCard onPress={onPress} padded={false}>
      <LinearGradient
        colors={[colors.navyMid, colors.navyDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.head}
      >
        <CornerOrnament style={{ top: -8, insetInlineEnd: -8 }} />
        {degree ? <Badge label={degree} tone="goldSolid" /> : null}
        <ThuluthText variant="ceremonial" color={colors.goldLight} numberOfLines={2}>
          {title}
        </ThuluthText>
        {num ? (
          <Txt variant="tinyStrong" color={colors.textOnNavyMuted}>
            {num}
          </Txt>
        ) : null}
      </LinearGradient>

      <View style={styles.body}>
        {note ? (
          <Txt variant="small" color={colors.textMuted}>
            {note}
          </Txt>
        ) : null}
        <GoldRule height={2} style={{ width: 56 }} />

        <Row justify="space-between" gap={spacing.md}>
          <Row gap={spacing.lg} wrap style={{ flexShrink: 1 }}>
            <MetaChip icon="library-outline" text={`${n(courses)} ${t('courseUnit')}`} />
            {lessons > 0 ? (
              <MetaChip icon="book-outline" text={`${n(lessons)} ${t('lesson')}`} />
            ) : null}
          </Row>
          <Row gap={2}>
            <Txt variant="tinyStrong" color={colors.goldDark}>
              {t('programsStageCourses')}
            </Txt>
            {/*
              الأيقونات محارفُ خطٍّ لا يقلبها `I18nManager`، فيُنتقى الرمز
              صراحةً كما في `NavMenu`: «التالي» في واجهةٍ من اليمين يشير يسارًا.
            */}
            <Ionicons
              name={isRTL ? 'chevron-back' : 'chevron-forward'}
              size={13}
              color={colors.goldDark}
            />
          </Row>
        </Row>
      </View>
    </PressableCard>
  );
}

/* ————————————— الشاشة ————————————— */

export default function ProgramsScreen() {
  const { t, pick, n } = useI18n();
  const router = useRouter();
  const catalogue = useQuery(() => fetchAllCourses(), []);

  return (
    <Screen>
      <SectionTitle title={t('programsTitle')} />
      <Txt variant="small" color={colors.textMuted}>
        {t('programsIntro')}
      </Txt>

      <QueryView
        query={catalogue}
        isEmpty={(list) => list.length === 0}
        emptyText={t('programsEmpty')}
        emptyIcon="school-outline"
      >
        {(list) => {
          const { stages, extra } = groupPrograms(list);
          const extraLessons = extra.reduce((sum, c) => sum + (c.lessonCount ?? 0), 0);

          return (
            <View style={{ gap: spacing.lg }}>
              {stages.map((group) => {
                const degreeKey = degreeKeyOf(group.key);
                return (
                  <ProgramCard
                    key={group.key}
                    num={pick(group.numAr, group.numEn)}
                    title={pick(group.titleAr, group.titleEn)}
                    degree={degreeKey ? t(degreeKey) : null}
                    courses={group.courses.length}
                    lessons={group.lessons}
                    onPress={() =>
                      router.push({
                        pathname: '/programs/[stage]',
                        params: { stage: group.key, title: pick(group.titleAr, group.titleEn) },
                      })
                    }
                  />
                );
              })}

              {/*
                القسم الرابع: ما لا مرحلة له. لا يُطوى خلف بطاقةٍ تُفتح
                كالدرجات — الدرجة مسارٌ متدرّج يستحقّ شاشته، أمّا الدورات
                والدبلومات فأصنافٌ مستقلّة، وإخفاء أربعةِ عناوينَ خلف نقرةٍ
                زيادةُ طريقٍ بلا زيادةِ معنى.
              */}
              {extra.length > 0 ? (
                <View style={{ gap: spacing.lg, marginTop: spacing.sm }}>
                  <SectionTitle title={t('programsExtraTitle')} />
                  <Txt variant="small" color={colors.textMuted}>
                    {t('programsExtraDesc')}
                  </Txt>
                  <Row gap={spacing.lg} wrap>
                    <MetaChip icon="library-outline" text={`${n(extra.length)} ${t('courseUnit')}`} />
                    {extraLessons > 0 ? (
                      <MetaChip icon="book-outline" text={`${n(extraLessons)} ${t('lesson')}`} />
                    ) : null}
                  </Row>
                  {extra.map((course) => (
                    <CourseTile
                      key={course.id}
                      course={course}
                      onPress={() => router.push(`/course/${course.id}`)}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          );
        }}
      </QueryView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { padding: spacing.lg, gap: spacing.sm, overflow: 'hidden' },
  body: { padding: spacing.lg, gap: spacing.sm },
});
