import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';
import { colors, radius, spacing } from '../theme';
import { Button } from '../ui/Button';
import { Badge, Card, Row, Txt } from '../ui/kit';
import { RequireAuth } from '../ui/RequireAuth';
import { openExternal } from '../ui/openLink';

/**
 * القطع المشتركة بين شاشات لوحة الأكاديميين.
 *
 * لماذا خارج `src/ui/`؟ لأنّ تلك مكتبة هويّة الكلّية العامّة يشترك فيها كل
 * التطبيق، وهذه قطعٌ لا معنى لها إلّا في اللوحة (تحذير رابط المضيف، إشعار
 * الحساب غير المربوط). خلطُها بالمكتبة يجعل مكوّنًا خطِرًا كـ`StartSessionCard`
 * في متناول أيّ شاشةٍ طالب.
 */

/* ————————————— النصوص ————————————— */

const AR = {
  console: 'لوحة الأكاديميين',
  home: 'لوحتي',
  courses: 'مقرّراتي',
  sessions: 'مجالسي',
  students: 'طلابي',
  welcome: 'أهلًا',
  consoleIntro: 'مقرّراتك ومجالسك وطلابك.',
  statCourses: 'مقرّراتي',
  statStudents: 'طلابي',
  statGrading: 'واجبات تنتظر التصحيح',
  nextSession: 'مجلسي القادم',
  noNextSession: 'لا مجالس قادمة مسنَدة إليك حاليًّا.',
  sessionDetails: 'تفاصيل المجلس',
  upcoming: 'المجالس القادمة',
  past: 'مجالس منتهية',
  liveNow: 'مباشر الآن',
  publicSession: 'مجلس عامّ',
  hidden: 'مخفي',
  visible: 'ظاهر',
  recorded: 'مسجَّل',
  published: 'منشور',
  unpublished: 'غير منشور',
  minutes: 'دقيقة',
  stage: 'المرحلة',
  startsOn: 'يبدأ',
  hours: 'ساعة',
  modules: 'الوحدات',
  lessons: 'الدروس',
  studentsCount: 'الطلاب',
  sessionsCount: 'المجالس',
  courseStructure: 'وحدات المقرّر ودروسه',
  courseStudents: 'طلاب المقرّر',
  noModules: 'لا وحدات في هذا المقرّر بعد.',
  noLessons: 'لا دروس في هذه الوحدة بعد.',
  noCourseStudents: 'لا طلاب مسجَّلين في هذا المقرّر بعد.',
  noCourses: 'لا مقرّرات مسنَدة إليك بعد.',
  noSessions: 'لا مجالس مسنَدة إليك.',
  noStudents: 'لا طلاب في مقرّراتك بعد.',
  attendance: 'الحضور',
  present: 'حاضر',
  absent: 'غائب',
  joinedAt: 'دخل',
  leftAt: 'خرج',
  minutesShort: 'د',
  source: 'المصدر',
  sourceManual: 'يدوي',
  noAttendanceEnded:
    'لا سجلّ حضور لهذا المجلس. تُملأ السجلّات من تقرير المنصّة بعد انتهائه، أو يدويًّا من لوحة الإدارة.',
  noAttendanceUpcoming: 'يظهر الحضور بعد انعقاد المجلس.',
  startSession: 'ابدأ المجلس',
  studentsLink: 'رابط الطلاب',
  passcode: 'رمز الدخول',
  hostWarning:
    'زرّ «ابدأ المجلس» يفتح رابط المضيف الخاصّ بك. لا تُشارِكه مع الطلاب ولا تنسخه في أيّ مجموعة — من يفتحه يصير مضيفًا للمجلس. ما يُرسل للطلاب هو «رابط الطلاب» وحده.',
  noSessionLink: 'لا رابط لهذا المجلس بعد — راجع الإدارة قبل موعده.',
  recording: 'تسجيل المجلس',
  openRecording: 'فتح التسجيل',
  recordingPasscode: 'كلمة مرور التسجيل',
  readOnly: 'هذه الشاشة للاطّلاع فقط. لتعديل الوحدات أو الدروس أو تسجيل الطلاب راجع إدارة المنصّة.',
  notInstructorTitle: 'هذه اللوحة للأكاديميين',
  notInstructor: 'حسابك حساب طالب. لوحة الأكاديميين تُفتح لأعضاء هيئة التدريس وحدهم.',
  noScholarTitle: 'حسابك غير مرتبط بملفّك في الهيئة العلميّة.',
  noScholarBody:
    'مقرّراتك ومجالسك وطلابك تُشتقّ من ملفّك في «الهيئة العلميّة»، ولم تربط الإدارة حسابك بذلك الملفّ بعد — لذلك تبدو هذه اللوحة خاليةً وليست كذلك في الحقيقة.',
  noScholarAction: 'راجع إدارة المنصّة لربط حسابك من شاشة «أعضاء هيئة التدريس» في لوحة التحكّم.',
  progress: 'التقدّم',
  enrolledAt: 'تاريخ التسجيل',
  studentNo: 'الرقم الجامعي',
  enrollPENDING: 'بانتظار الاعتماد',
  enrollACTIVE: 'مُفعَّل',
  enrollCOMPLETED: 'مُنجَز',
  enrollCANCELLED: 'ملغى',
  kindVIDEO: 'درس مرئي',
  kindPDF: 'ملفّ للقراءة',
  kindTEXT: 'متن مكتوب',
  kindLIVE: 'مجلس مباشر',
  kindQUIZ: 'اختبار',
  freePreview: 'معاينة مجّانيّة',
  attachments: 'مرفقات',
  loadMore: 'المزيد',
};

const EN: Record<keyof typeof AR, string> = {
  console: 'Faculty console',
  home: 'My console',
  courses: 'My courses',
  sessions: 'My sessions',
  students: 'My students',
  welcome: 'Welcome',
  consoleIntro: 'Your courses, sessions and students.',
  statCourses: 'Courses',
  statStudents: 'Students',
  statGrading: 'Assignments awaiting grading',
  nextSession: 'My next session',
  noNextSession: 'No upcoming sessions assigned to you.',
  sessionDetails: 'Session details',
  upcoming: 'Upcoming sessions',
  past: 'Past sessions',
  liveNow: 'Live now',
  publicSession: 'Public session',
  hidden: 'Hidden',
  visible: 'Visible',
  recorded: 'Recorded',
  published: 'Published',
  unpublished: 'Unpublished',
  minutes: 'minutes',
  stage: 'Stage',
  startsOn: 'Starts',
  hours: 'hours',
  modules: 'Modules',
  lessons: 'Lessons',
  studentsCount: 'Students',
  sessionsCount: 'Sessions',
  courseStructure: 'Modules and lessons',
  courseStudents: 'Course students',
  noModules: 'No modules in this course yet.',
  noLessons: 'No lessons in this module yet.',
  noCourseStudents: 'No students enrolled in this course yet.',
  noCourses: 'No courses assigned to you yet.',
  noSessions: 'No sessions assigned to you.',
  noStudents: 'No students in your courses yet.',
  attendance: 'Attendance',
  present: 'Present',
  absent: 'Absent',
  joinedAt: 'Joined',
  leftAt: 'Left',
  minutesShort: 'min',
  source: 'Source',
  sourceManual: 'Manual',
  noAttendanceEnded:
    'No attendance record for this session. Records are filled from the platform report after it ends, or manually from the admin console.',
  noAttendanceUpcoming: 'Attendance appears after the session is held.',
  startSession: 'Start session',
  studentsLink: 'Student link',
  passcode: 'Passcode',
  hostWarning:
    'The “Start session” button opens your host link. Never share it with students or paste it in any group — whoever opens it becomes the host. Only the “Student link” is meant for students.',
  noSessionLink: 'No link for this session yet — contact the administration before it starts.',
  recording: 'Session recording',
  openRecording: 'Open recording',
  recordingPasscode: 'Recording passcode',
  readOnly:
    'This screen is read-only. To edit modules, lessons or enrolments, contact the platform administration.',
  notInstructorTitle: 'Faculty console',
  notInstructor: 'Your account is a student account. This console is for faculty members only.',
  noScholarTitle: 'Your account is not linked to your faculty profile.',
  noScholarBody:
    'Your courses, sessions and students are derived from your faculty profile, and the administration has not linked your account to it yet — so this console looks empty although it is not.',
  noScholarAction:
    'Contact the platform administration to link your account from the “Faculty” screen in the admin console.',
  progress: 'Progress',
  enrolledAt: 'Enrolled',
  studentNo: 'Student no.',
  enrollPENDING: 'Pending approval',
  enrollACTIVE: 'Active',
  enrollCOMPLETED: 'Completed',
  enrollCANCELLED: 'Cancelled',
  kindVIDEO: 'Video lesson',
  kindPDF: 'Reading file',
  kindLIVE: 'Live session',
  kindTEXT: 'Written text',
  kindQUIZ: 'Quiz',
  freePreview: 'Free preview',
  attachments: 'attachments',
  loadMore: 'Load more',
};

export type InstructorText = typeof AR;

/** نصوص اللوحة باللغة الجارية. */
export function useInstructorText(): InstructorText {
  const { lang } = useI18n();
  return lang === 'en' ? (EN as InstructorText) : AR;
}

/* ————————————— الحارس في الواجهة ————————————— */

/**
 * الدور يُتحقَّق منه في الخادم أوّلًا وأخيرًا (٤٠٣ لغير المحاضر). هذا الغلاف
 * لا يحرس شيئًا — إنّما يوفّر على الطالب رحلةَ طلبٍ ينتهي برسالة خطأ تقنيّة،
 * ويعرض بدلها جملةً مفهومة.
 */
export function InstructorOnly({ children }: { children: React.ReactNode }) {
  const { status, me } = useAuth();
  const L = useInstructorText();

  if (status !== 'authed') return <RequireAuth>{null}</RequireAuth>;
  if (me && me.role !== 'INSTRUCTOR' && me.role !== 'ADMIN') {
    return <Notice tone="warning" icon="lock-closed-outline" title={L.notInstructorTitle} body={L.notInstructor} />;
  }
  return <>{children}</>;
}

/**
 * ما يراه حسابٌ محاضرٌ لم تربطه الإدارة بملفّ الهيئة.
 *
 * الخلوّ هنا خللُ إعدادٍ لا نتيجةَ عمل: بلا `scholarId` **لا يمكن** أن يُشتقّ
 * مقرّرٌ ولا مجلس. فلو عُرضت «لا مقرّرات» لظنّ المحاضر أنّ الإدارة لم تُسنِد
 * إليه شيئًا وانتظر بلا سبب.
 */
export function NoScholarNotice() {
  const L = useInstructorText();
  return (
    <Notice tone="warning" icon="link-outline" title={L.noScholarTitle} body={L.noScholarBody} footer={L.noScholarAction} />
  );
}

export function ReadOnlyNotice() {
  const L = useInstructorText();
  return <Notice tone="info" icon="lock-closed-outline" body={L.readOnly} />;
}

type NoticeTone = 'warning' | 'info' | 'danger';

const noticeTones: Record<NoticeTone, { bg: string; border: string; fg: string }> = {
  warning: { bg: colors.warningBg, border: '#EADCC0', fg: colors.warning },
  info: { bg: colors.cream100, border: colors.borderStrong, fg: colors.navy },
  danger: { bg: colors.dangerBg, border: '#E2C4C4', fg: colors.danger },
};

export function Notice({
  tone = 'info',
  icon,
  title,
  body,
  footer,
}: {
  tone?: NoticeTone;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title?: string;
  body: string;
  footer?: string;
}) {
  const c = noticeTones[tone];
  return (
    <Card style={{ backgroundColor: c.bg, borderColor: c.border, gap: spacing.sm }}>
      <Row align="flex-start" gap={spacing.sm}>
        {icon ? <Ionicons name={icon} size={18} color={c.fg} style={{ marginTop: 3 }} /> : null}
        <View style={{ flex: 1, gap: spacing.xs }}>
          {title ? (
            <Txt variant="heading" color={c.fg}>
              {title}
            </Txt>
          ) : null}
          <Txt variant="small" color={colors.text}>
            {body}
          </Txt>
          {footer ? (
            <Txt variant="smallStrong" color={c.fg}>
              {footer}
            </Txt>
          ) : null}
        </View>
      </Row>
    </Card>
  );
}

/* ————————————— بدء المجلس ————————————— */

/**
 * أزرار دخول المجلس كما يراها **صاحبه وحده**.
 *
 * `zoomStartUrl` رابط المضيف: من فتحه صار مضيف الاجتماع. ولذلك ثلاثة قيود
 * في هذا المكوّن مقصودة:
 *  · التحذير الأحمر **تحت الزرّ مباشرةً** لا في صفحة مساعدة — الرابط يُسرَّب
 *    بلصقه في مجموعةٍ لا باختراق، واللحظة الحرجة هي لحظة الضغط.
 *  · رابط الطلاب **منفصلٌ ومعنون** — فلا يبحث المحاضر عن «الرابط» فيقع على
 *    الأوّل.
 *  · لا يُعرض الرابط نصًّا قابلًا للنسخ إطلاقًا: يُفتح ولا يُنسخ.
 */
export function StartSessionCard({
  zoomStartUrl,
  joinUrl,
  passcode,
}: {
  zoomStartUrl: string | null;
  joinUrl: string | null;
  passcode: string | null;
}) {
  const L = useInstructorText();

  if (!zoomStartUrl && !joinUrl) {
    return <Notice tone="warning" icon="alert-circle-outline" body={L.noSessionLink} />;
  }

  return (
    <View style={{ gap: spacing.md }}>
      {zoomStartUrl ? (
        <Button label={L.startSession} onPress={() => void openExternal(zoomStartUrl)} />
      ) : null}

      {zoomStartUrl ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: spacing.sm,
            backgroundColor: colors.dangerBg,
            borderColor: '#E2C4C4',
            borderWidth: 1,
            borderRadius: radius.md,
            padding: spacing.md,
          }}
        >
          <Ionicons name="shield-outline" size={17} color={colors.danger} style={{ marginTop: 3 }} />
          <Txt variant="small" color={colors.danger} style={{ flex: 1 }}>
            {L.hostWarning}
          </Txt>
        </View>
      ) : null}

      {joinUrl ? (
        <Button label={L.studentsLink} kind="ghost" onPress={() => void openExternal(joinUrl)} />
      ) : null}

      {passcode ? (
        <Row gap={spacing.sm}>
          <Txt variant="small" color={colors.textMuted}>
            {L.passcode}
          </Txt>
          <Badge label={passcode} tone="neutral" />
        </Row>
      ) : null}
    </View>
  );
}
