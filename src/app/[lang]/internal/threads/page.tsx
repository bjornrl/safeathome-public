import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import ThreadsClient from "./ThreadsClient";
import { FONT_STACK } from "@/lib/design-tokens";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/internal/threads">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.threads.metaTitle, description: t.threads.metaDescription };
}

export default async function ThreadsPage({ params }: PageProps<"/[lang]/internal/threads">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);

  // Nav comes from src/app/internal/layout.tsx.
  return (
    <main
      id="main-content"
      style={{ fontFamily: FONT_STACK }}
      className="[max-width:1000px] [margin:0_auto] [padding:40px_24px_96px]"
    >
      <header className="[margin-bottom:24px]">
        <h1 className="[font-size:40px] [font-weight:700] [letter-spacing:-0.02em] [color:#2a2859] [margin:0_0_12px]">
          {t.threads.heading}
        </h1>
        <p className="[font-size:15px] [color:#666666] [margin:0] [line-height:1.6] [max-width:720px]">
          {t.threads.lead}
        </p>
      </header>

      {/* ThreadsClient reads ?thread=<id>; useSearchParams needs a boundary. */}
      <Suspense fallback={null}>
        <ThreadsClient />
      </Suspense>
    </main>
  );
}
