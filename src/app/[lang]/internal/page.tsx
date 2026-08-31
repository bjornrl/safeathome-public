import type { Metadata } from "next";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import InternalHome from "./InternalHome";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/internal">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.internal.metaTitle, description: t.internal.metaDescription };
}

export default function InternalIndexPage() {
  return <InternalHome />;
}
