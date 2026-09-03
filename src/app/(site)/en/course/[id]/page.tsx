import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PublicCourseView } from "@/components/site/PublicCourseView";
import { getCourseBySlugOrId, isSlugMatch } from "@/lib/course-slug";
import { siteHref } from "@/lib/site-links";

type Params = { params: Promise<{ id: string }> };

async function resolveCourse(id: string) {
  const course = await getCourseBySlugOrId(id);
  if (!course?.visible) notFound();
  // الرابط القديم بالـid يُحوَّل إلى slug (canonical واحد لمحرّكات البحث).
  // encodeURI لأن Node يرفض المحارف غير ASCII في ترويسة Location.
  if (course.slug && !isSlugMatch(id, course.slug)) redirect(encodeURI(siteHref("en", `course/${course.slug}`)));
  return course;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const course = await getCourseBySlugOrId(id);
  if (!course?.visible) return {};
  const title = course.titleEn;
  const description = course.descEn || course.summaryEn || undefined;
  return {
    title,
    description,
    alternates: { canonical: encodeURI(siteHref("en", `course/${course.slug || course.id}`)) },
    openGraph: { title, description, type: "article" },
  };
}

export default async function EnglishPublicCourse({ params }: Params) {
  const { id } = await params;
  const course = await resolveCourse(id);
  return <PublicCourseView lang="en" courseId={course.id} />;
}
