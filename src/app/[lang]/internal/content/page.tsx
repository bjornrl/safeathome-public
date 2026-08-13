import type { Metadata } from "next";
import { Suspense } from "react";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import ContentTabs from "./ContentTabs";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/internal/content">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.content.metaTitle, description: t.content.metaDescription };
}

export default function ContentPage() {
  // Nav comes from src/app/internal/layout.tsx — rendering it here too would
  // give the page two headers.
  return (
    // useSearchParams needs a Suspense boundary above it.
    <Suspense fallback={null}>
      <ContentTabs />
    </Suspense>
  );
}
