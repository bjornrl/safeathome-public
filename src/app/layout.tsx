import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter is the working substitute for Clay's licensed Plain Black face.
// Exposed as --font-inter for the Clay --clay-font-* tokens.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="nb-NO" className={`${inter.variable} h-full antialiased`}>
      {/* suppressHydrationWarning: browser extensions (e.g. ColorZilla) add
          attributes to <body> before React mounts, causing a harmless
          hydration warning in dev. Only silences attribute-level diffs. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
