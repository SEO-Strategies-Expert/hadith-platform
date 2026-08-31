import { PublicCourseView } from "@/components/site/PublicCourseView";

export default async function EnglishPublicCourse({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PublicCourseView lang="en" courseId={id} />;
}
