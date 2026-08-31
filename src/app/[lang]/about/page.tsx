import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import { Footer } from "@/components/ui";
import { clay, space, typography } from "@/lib/design-tokens";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionary";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.about.metaTitle, description: t.about.metaDescription };
}

// Colours only; the copy is looked up per locale.
const PILLARS: { key: keyof Dictionary["about"]["pillars"]; bg: string; ink: string; muted: string }[] = [
  {
    key: "fieldwork",
    bg: clay.colors.peach,
    ink: clay.colors.ink,
    muted: "rgba(10, 10, 10, 0.65)",
  },
  {
    key: "policy",
    bg: clay.colors.lavender,
    ink: clay.colors.ink,
    muted: "rgba(10, 10, 10, 0.65)",
  },
  {
    key: "codesign",
    bg: clay.colors.teal,
    ink: clay.colors.onPrimary,
    muted: "rgba(255, 255, 255, 0.7)",
  },
];

const container: React.CSSProperties = {
  maxWidth: "1280px",
  margin: "0 auto",
  padding: `0 ${space.s24}`,
};
const narrow: React.CSSProperties = {
  maxWidth: "920px",
  margin: "0 auto",
  padding: `0 ${space.s24}`,
};

const eyebrow: React.CSSProperties = {
  display: "inline-block",
  fontFamily: clay.font.body,
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  color: clay.colors.muted,
};

export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);

  return (
    <>
      <Nav />
      <main id="main-content" style={{ background: clay.colors.canvas, color: clay.colors.body }}>
        <section>
          <div style={{ ...narrow, padding: `${space.s96} ${space.s24} ${space.s48}` }}>
            <p style={{ ...eyebrow, marginBottom: space.s24 }}>{t.about.eyebrow}</p>
            <h1 style={{ marginBottom: space.s32, maxWidth: "16ch" }}>{t.about.heading}</h1>
            <div style={{ display: "flex", flexDirection: "column", gap: space.s24, maxWidth: "60ch" }}>
              {t.about.paragraphs.map((paragraph, i) => (
                <p
                  key={i}
                  style={{
                    fontFamily: clay.font.body,
                    fontSize: i === 0 ? "20px" : "18px",
                    lineHeight: 1.55,
                    color: i === t.about.paragraphs.length - 1 ? clay.colors.muted : clay.colors.body,
                    fontWeight: 400,
                  }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* Three pillars — saturated feature cards */}
        <section>
          <div style={{ ...container, padding: `${space.s48} ${space.s24} ${space.s96}` }}>
            <p style={{ ...eyebrow, marginBottom: space.s16 }}>{t.about.pillarsEyebrow}</p>
            <h2 style={{ marginBottom: space.s48, maxWidth: "22ch" }}>{t.about.pillarsHeading}</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: space.s24,
              }}
            >
              {PILLARS.map((p) => {
                const copy = t.about.pillars[p.key];
                return (
                  <article
                    key={p.key}
                    style={{
                      background: p.bg,
                      color: p.ink,
                      borderRadius: "var(--clay-radius-xl)",
                      padding: space.s32,
                      display: "flex",
                      flexDirection: "column",
                      minHeight: 280,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: clay.font.body,
                        fontSize: "12px",
                        fontWeight: 600,
                        letterSpacing: "1.8px",
                        textTransform: "uppercase",
                        color: p.muted,
                        marginBottom: space.s24,
                      }}
                    >
                      {copy.tag}
                    </p>
                    <h3
                      style={{
                        fontFamily: clay.font.display,
                        color: p.ink,
                        letterSpacing: "-0.5px",
                        fontSize: "26px",
                        lineHeight: 1.15,
                        marginBottom: space.s16,
                      }}
                    >
                      {copy.title}
                    </h3>
                    <p
                      style={{
                        ...typography.sizes.t16,
                        color: p.ink,
                        opacity: 0.92,
                        lineHeight: 1.55,
                      }}
                    >
                      {copy.body}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Results note as cream card */}
        <section style={{ background: clay.colors.surfaceSoft }}>
          <div style={{ ...narrow, padding: `${space.s96} ${space.s24}` }}>
            <div
              style={{
                background: clay.colors.canvas,
                border: `1px solid ${clay.colors.hairline}`,
                borderRadius: "var(--clay-radius-lg)",
                padding: `${space.s32} ${space.s40}`,
              }}
            >
              <p style={{ ...eyebrow, marginBottom: space.s12 }}>{t.about.statusEyebrow}</p>
              <p
                style={{
                  fontFamily: clay.font.body,
                  fontSize: "18px",
                  color: clay.colors.body,
                  fontStyle: "italic",
                  lineHeight: 1.55,
                }}
              >
                {t.about.statusNote}
              </p>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
