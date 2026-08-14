import { toSlug, buildMetadata } from "@/lib/site-content";
import { PageRenderer } from "@/components/site/PageRenderer";
import type { PageParams } from "@/lib/site-sections";

type Params = { page: string };
type Search = Promise<PageParams>;

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { page } = await params;
  return buildMetadata(toSlug(page), "en");
}

export default async function EnglishPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Search;
}) {
  const { page } = await params;
  const sp = await searchParams;
  return <PageRenderer slug={toSlug(page)} lang="en" params={sp} />;
}
