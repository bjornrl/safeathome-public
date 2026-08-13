import type { Metadata } from "next";

// Siden er en klientkomponent og kan derfor ikke selv eksportere metadata.
export const metadata: Metadata = {
  title: "Kvaliteter — safe@home",
  description:
    "Kvaliteter er det som gjør omsorg god når den treffer — sett fra dem som mottar den.",
};

export default function QualitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
