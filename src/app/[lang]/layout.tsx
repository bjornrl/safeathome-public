import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { HTML_LANG, LOCALES, isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionary";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import ContactWidget from "@/components/ContactWidget";
import { Footer } from "@/components/ui";

// Inter is the working substitute for Clay's licensed Plain Black face.
// Exposed as --font-inter for the Clay --clay-font-* tokens.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

// Both locales are known up front, so both trees can be prerendered.
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getDictionary(lang);
  return {
    title: t.home.metaTitle,
    description: t.home.metaDescription,
    icons: {
      icon: "/images/Safe@Home_favicon.png",
      shortcut: "/images/Safe@Home_favicon.png",
      apple: "/images/Safe@Home_favicon.png",
    },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  // An unknown segment is a 404, not a silent fallback to Norwegian — a typo in
  // the URL should not quietly serve the wrong language.
  if (!isLocale(lang)) notFound();

  const dictionary = await getDictionary(lang);

  return (
    <html lang={HTML_LANG[lang]} className={`${inter.variable} h-full antialiased`}>
      {/* suppressHydrationWarning: browser extensions (e.g. ColorZilla) add
          attributes to <body> before React mounts, causing a harmless
          hydration warning in dev. Only silences attribute-level diffs. */}
      <body suppressHydrationWarning>
        <I18nProvider lang={lang} dictionary={dictionary}>
          {/* Flex-kolonne med minHeight: på korte sider (t.d. /internal mens
              økta sjekkes) ville bunnteksten ellers lagt seg midt på skjermen
              med bakgrunnsfargen sin og etterlatt en stripe under. */}
          <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
            <div style={{ flex: "1 0 auto" }}>{children}</div>
            {/* Montert her og ikke per side, av samme grunn som boblen under:
                sider som legges til seinere får den uten at noen må huske det.
                Bunnteksten skjuler seg selv på innloggingsskjermene. */}
            <Footer />
          </div>
          {/* Mounted here rather than per page so the channel is genuinely
              always open — including on pages added later. */}
          <ContactWidget />
        </I18nProvider>
      </body>
    </html>
  );
}
