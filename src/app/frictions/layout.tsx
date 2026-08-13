import type { Metadata } from "next";

// Siden er en klientkomponent og kan derfor ikke selv eksportere metadata.
export const metadata: Metadata = {
  title: "Friksjoner — safe@home",
  description:
    "Friksjoner er mekanismer i tjenesteapparatet som gjør at velmenende omsorg likevel skader.",
};

export default function FrictionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
