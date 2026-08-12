import { toSlug, buildMetadata } from "@/lib/site-content";
import { PageRenderer } from "@/components/site/PageRenderer";

type Params = { page: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { page } = await params;
  return buildMetadata(toSlug(page), "en");
}

export default async function EnglishPage({ params }: { params: Promise<Params> }) {
  const { page } = await params;
  return <PageRenderer slug={toSlug(page)} lang="en" />;
}
