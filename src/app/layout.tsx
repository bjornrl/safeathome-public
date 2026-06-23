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
  title: "safe@home — Aldring, migrasjon og betydningen av hjem",
  description:
    "Utforsk hvordan eldre innvandrere i Norge navigerer omsorg, teknologi og tilhørighet — gjennom et interaktivt kart av historier.",
  icons: {
    icon: "/images/Safe@Home_favicon.png",
    shortcut: "/images/Safe@Home_favicon.png",
    apple: "/images/Safe@Home_favicon.png",
  },
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
