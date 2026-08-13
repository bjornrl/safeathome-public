import type { Metadata } from "next";
import { Suspense } from "react";
import ContentTabs from "./ContentTabs";

export const metadata: Metadata = {
  title: "Innhold — safe@home",
  description:
    "Alt materialet i prosjektet: søk, nodekart, friksjoner, kvaliteter og ressurser.",
};

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
