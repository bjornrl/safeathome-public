import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "safe@home — Aging, migration, and the meaning of home",
  description:
    "Explore how aging immigrants in Norway navigate care, technology, and belonging through an interactive map of stories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb-NO" className="h-full antialiased">
      {/* suppressHydrationWarning: browser extensions (e.g. ColorZilla) add
          attributes to <body> before React mounts, causing a harmless
          hydration warning in dev. Only silences attribute-level diffs. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
