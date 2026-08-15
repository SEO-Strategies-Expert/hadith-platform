import type { Href } from 'expo-router';

/**
 * `href` في الإشعار مسارٌ داخل موقع الكلّية (مثل `/student/course/…`)،
 * فيُترجم إلى مسار التطبيق المقابل.
 *
 * ملاحظة: عقد الواجهة لا يعدّد صيغ هذه المسارات، فالمطابقة هنا مبنيّة على
 * التقاط المعرّف بعد الكلمة الدالّة. ما لم يُطابَق يُترك بلا انتقال.
 */
export function notificationHrefToRoute(href: string | null): Href | null {
  if (!href) return null;
  const path = href.split('?')[0].split('#')[0];

  const idAfter = (word: string): string | null => {
    const m = path.match(new RegExp(`/${word}s?/([^/]+)`, 'i'));
    return m?.[1] ?? null;
  };

  const courseId = idAfter('course');
  if (courseId) return `/course/${courseId}`;

  const lessonId = idAfter('lesson');
  if (lessonId) return `/lesson/${lessonId}`;

  const quizId = idAfter('quiz');
  if (quizId) return `/quiz/${quizId}`;

  const attemptId = idAfter('attempt');
  if (attemptId) return `/attempt/${attemptId}`;

  const assignmentId = idAfter('assignment');
  if (assignmentId) return `/assignments/${assignmentId}`;

  const newsId = idAfter('news');
  if (newsId) return `/news/${newsId}`;

  if (/certificate/i.test(path)) return '/certificates';
  if (/payment|fee|invoice/i.test(path)) return '/payments';
  if (/session|calendar/i.test(path)) return '/sessions';

  return null;
}
