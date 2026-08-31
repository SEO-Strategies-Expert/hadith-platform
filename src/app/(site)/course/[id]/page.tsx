import { PublicCourseView } from "@/components/site/PublicCourseView";

export default async function ArabicPublicCourse({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PublicCourseView lang="ar" courseId={id} />;
}
