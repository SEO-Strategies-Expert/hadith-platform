import { toSlug, buildMetadata } from "@/lib/site-content";
import { PageRenderer } from "@/components/site/PageRenderer";

type Params = { page: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { page } = await params;
  return buildMetadata(toSlug(page), "ar");
}

export default async function ArabicPage({ params }: { params: Promise<Params> }) {
  const { page } = await params;
  return <PageRenderer slug={toSlug(page)} lang="ar" />;
}
