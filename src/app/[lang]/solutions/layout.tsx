import type { Metadata } from "next";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";

// Siden er en klientkomponent og kan derfor ikke selv eksportere metadata.
export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]/solutions">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.solutions.metaTitle, description: t.solutions.metaDescription };
}

export default function SolutionsLayout({ children }: LayoutProps<"/[lang]/solutions">) {
  return children;
}
