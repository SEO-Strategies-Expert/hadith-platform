import { buildMetadata } from "@/lib/site-content";
import { PageRenderer } from "@/components/site/PageRenderer";

export async function generateMetadata() {
  return buildMetadata("index", "en");
}

export default function EnglishHomePage() {
  return <PageRenderer slug="index" lang="en" />;
}
