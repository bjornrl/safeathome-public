import type { Metadata } from "next";

// Siden er en klientkomponent og kan derfor ikke selv eksportere metadata.
export const metadata: Metadata = {
  title: "Designresponser — safe@home",
  description:
    "Designresponser blir til i WP4 når feltmaterialet fra WP1–3 peker på utfordringer verdt å jobbe med.",
};

export default function SolutionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
