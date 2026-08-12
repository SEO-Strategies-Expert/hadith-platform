import { buildMetadata } from "@/lib/site-content";
import { PageRenderer } from "@/components/site/PageRenderer";

export async function generateMetadata() {
  return buildMetadata("index", "ar");
}

export default function ArabicHomePage() {
  return <PageRenderer slug="index" lang="ar" />;
}
