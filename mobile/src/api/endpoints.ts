import { apiRequest, type Query } from './client';
import type {
  AppNotification,
  Assignment,
  AssignmentDetail,
  AttemptView,
  Certificate,
  CourseCard,
  CourseDetailPublic,
  CourseDetailStudent,
  DeviceRegistration,
  FacultyMember,
  LessonDetail,
  Me,
  MyCourse,
  NavPayload,
  NewsDetail,
  NewsItem,
  NotificationsPage,
  Paged,
  PaymentsPage,
  ProgressResult,
  QuizOverview,
  SessionPublic,
  SessionStudent,
  StartAttemptResult,
  SubmitAttemptResult,
  TokenPair,
} from './types';

/** كل نداءات الواجهة في موضع واحد — لا `fetch` في أيّ شاشة. */

type PageArgs = { limit?: number; cursor?: string | null };

const page = (args?: PageArgs): Query => ({ limit: args?.limit, cursor: args?.cursor ?? undefined });

/* ————— المصادقة ————— */

export const login = (email: string, password: string, deviceId?: string) =>
  apiRequest<TokenPair>('/auth/login', {
    method: 'POST',
    body: { email, password, deviceId },
  });

export const logoutServer = (refreshToken: string) =>
  apiRequest<{ ok: boolean }>('/auth/logout', { method: 'POST', body: { refreshToken } });

/* ————— عامّة ————— */

export const getCourses = (args?: PageArgs & { stage?: string }) =>
  apiRequest<Paged<CourseCard>>('/courses', { query: { ...page(args), stage: args?.stage } });

export const getCourse = (id: string) => apiRequest<CourseDetailPublic>(`/courses/${id}`);

export const getNews = (args?: PageArgs & { featured?: boolean }) =>
  apiRequest<Paged<NewsItem>>('/news', {
    query: { ...page(args), featured: args?.featured ? 1 : undefined },
  });

export const getNewsItem = (idOrSlug: string) => apiRequest<NewsDetail>(`/news/${idOrSlug}`);

export const getFaculty = (args?: PageArgs & { council?: boolean }) =>
  apiRequest<Paged<FacultyMember>>('/faculty', {
    query: { ...page(args), council: args?.council ? 1 : undefined },
  });

/** لا تقبل `cursor`، و`nextCursor` فيها `null` دائمًا. */
export const getPublicSessions = (limit = 20) =>
  apiRequest<Paged<SessionPublic>>('/sessions/public', { query: { limit } });

/**
 * قائمة التنقّل الشاملة — شجرة هيدر الموقع، والمنصّات المضبوطة، ورابط البثّ.
 * تُقرأ من القاعدة حيًّا: ما يعدّله المدير في اللوحة يظهر هنا بلا إصدارٍ جديد.
 */
export const getNav = () => apiRequest<NavPayload>('/nav');

/* ————— الطالب ————— */

export const getMe = () => apiRequest<Me>('/me', { auth: true });

export const getMyCourses = (args?: PageArgs) =>
  apiRequest<Paged<MyCourse>>('/me/courses', { auth: true, query: page(args) });

export const getMyCourse = (id: string) =>
  apiRequest<CourseDetailStudent>(`/me/courses/${id}`, { auth: true });

/** مسار مختلط: يعمل بلا رمز للدروس المتاحة للمعاينة. */
export const getLesson = (id: string, authed: boolean) =>
  apiRequest<LessonDetail>(`/lessons/${id}`, { auth: authed });

export const setLessonProgress = (id: string, done: boolean) =>
  apiRequest<ProgressResult>(`/lessons/${id}/progress`, {
    method: 'POST',
    auth: true,
    body: { done },
  });

/** لا تقبل `cursor`. */
export const getMySessions = (limit = 30) =>
  apiRequest<Paged<SessionStudent>>('/me/sessions', { auth: true, query: { limit } });

/* ————— الاختبارات ————— */

export const getQuiz = (id: string) => apiRequest<QuizOverview>(`/me/quizzes/${id}`, { auth: true });

/** آمن للتكرار: `resumed: true` يعني أنّ محاولةً جارية أُعيدت ولم تُحرق أخرى. */
export const startAttempt = (quizId: string) =>
  apiRequest<StartAttemptResult>(`/me/quizzes/${quizId}/attempts`, { method: 'POST', auth: true });

export const getAttempt = (attemptId: string) =>
  apiRequest<AttemptView>(`/me/attempts/${attemptId}`, { auth: true });

/** الدرجة والنجاح يُحسبان على الخادم حصرًا — لا تُرسل شيئًا سوى الإجابات. */
export const submitAttempt = (attemptId: string, answers: Record<string, string[] | string>) =>
  apiRequest<SubmitAttemptResult>(`/me/attempts/${attemptId}/submit`, {
    method: 'POST',
    auth: true,
    body: { answers },
  });

/* ————— الواجبات ————— */

export const getAssignments = (args?: PageArgs & { courseId?: string }) =>
  apiRequest<Paged<Assignment>>('/me/assignments', {
    auth: true,
    query: { ...page(args), courseId: args?.courseId },
  });

export const getAssignment = (id: string) =>
  apiRequest<AssignmentDetail>(`/me/assignments/${id}`, { auth: true });

export const saveAssignment = (
  id: string,
  payload: { text?: string; fileUrl?: string; fileName?: string; submit?: boolean }
) => apiRequest<AssignmentDetail>(`/me/assignments/${id}`, { method: 'POST', auth: true, body: payload });

/* ————— الوثائق والرسوم ————— */

export const getCertificates = (args?: PageArgs) =>
  apiRequest<Paged<Certificate>>('/me/certificates', { auth: true, query: page(args) });

export const getPayments = (args?: PageArgs) =>
  apiRequest<PaymentsPage>('/me/payments', { auth: true, query: page(args) });

/* ————— الإشعارات ————— */

export const getNotifications = (args?: PageArgs & { unreadOnly?: boolean }) =>
  apiRequest<NotificationsPage>('/me/notifications', {
    auth: true,
    query: { ...page(args), unread: args?.unreadOnly ? 1 : undefined },
  });

export const markNotificationRead = (id: string) =>
  apiRequest<{ id: string; readAt: string; unreadCount: number }>(
    `/me/notifications/${id}/read`,
    { method: 'POST', auth: true }
  );

/* ————— الأجهزة ————— */

/** upsert على الرمز — آمن لإعادة الإرسال في كل إقلاع. */
export const registerDevice = (payload: {
  token: string;
  platform: 'ios' | 'android';
  deviceId?: string;
  appVersion?: string;
}) => apiRequest<DeviceRegistration>('/me/devices', { method: 'POST', auth: true, body: payload });

/** يحتاج `Bearer` صالحًا — استدعِه **قبل** مسح رموز المصادقة عند الخروج. */
export const unregisterDevice = (token: string) =>
  apiRequest<{ removed: number }>('/me/devices', { method: 'DELETE', auth: true, body: { token } });
