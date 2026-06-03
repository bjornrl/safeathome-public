import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { Footer } from "@/components/ui";
import { clay, space, typography } from "@/lib/design-tokens";

export const metadata: Metadata = {
  title: "Om — safe@home",
  description: "Om safe@home — forskningsprosjektet og feltstedene.",
};

const PROJECT_COPY = [
  "safe@home er et samarbeidsprosjekt (2026–2029) mellom OsloMet, Universitetet i Oslo, Durham University og Comte Bureau, i samarbeid med bydelene Alna og Søndre Nordstrand i Oslo.",
  "Prosjektet kombinerer feltarbeid, politikkanalyse og ko-design for å undersøke hvordan hjemmebaserte omsorgstjenester kan tilpasses en voksende gruppe eldre innvandrere — en gruppe hvis rutiner, familieformer og behov ofte ikke passer inn i standardiserte løsninger.",
  "Vi spør blant annet: Hva skjer når velferdsteknologi møter en transnasjonal hverdag? Hvordan virker reformen Bo trygt hjemme på tvers av språk, kultur og generasjoner? Hvilke lokale strategier og improvisasjoner holder folk oppe der tjenestene svikter?",
];

const RESULTS_NOTE =
  "Resultater fra prosjektet vil bli publisert her etter hvert som de blir tilgjengelige.";

const PILLARS: { tag: string; title: string; body: string; bg: string; ink: string; muted: string }[] = [
  {
    tag: "Feltarbeid",
    title: "Hverdagen som datakilde",
    body:
      "Vi tilbringer tid i hjem, på møteplasser og hos tjenestemottakere — fra Alna til Søndre Nordstrand — og lytter til hvordan omsorg faktisk leves.",
    bg: clay.colors.peach,
    ink: clay.colors.ink,
    muted: "rgba(10, 10, 10, 0.65)",
  },
  {
    tag: "Politikkanalyse",
    title: "Reformen møter virkeligheten",
    body:
      "Vi sporer hvordan «Bo trygt hjemme»-reformen oversettes til kommunal praksis — og hvor den mister grep i det transnasjonale.",
    bg: clay.colors.lavender,
    ink: clay.colors.ink,
    muted: "rgba(10, 10, 10, 0.65)",
  },
  {
    tag: "Ko-design",
    title: "Verktøy som forhandler",
    body:
      "Sammen med beboere, ansatte og kommunale partnere bygger vi små, konkrete tjeneste- og teknologigrep som forskningen kan teste.",
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

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main id="main-content" style={{ background: clay.colors.canvas, color: clay.colors.body }}>
        <section>
          <div style={{ ...narrow, padding: `${space.s96} ${space.s24} ${space.s48}` }}>
            <p style={{ ...eyebrow, marginBottom: space.s24 }}>Om prosjektet</p>
            <h1 style={{ marginBottom: space.s32, maxWidth: "16ch" }}>
              Eldre, omsorg og teknologi — forskning i Oslo.
            </h1>
            <div style={{ display: "flex", flexDirection: "column", gap: space.s24, maxWidth: "60ch" }}>
              {PROJECT_COPY.map((paragraph, i) => (
                <p
                  key={i}
                  style={{
                    fontFamily: clay.font.body,
                    fontSize: i === 0 ? "20px" : "18px",
                    lineHeight: 1.55,
                    color: i === PROJECT_COPY.length - 1 ? clay.colors.muted : clay.colors.body,
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
            <p style={{ ...eyebrow, marginBottom: space.s16 }}>Tre tilnærminger</p>
            <h2 style={{ marginBottom: space.s48, maxWidth: "22ch" }}>
              Forskning som beveger seg mellom kjøkkenbord og kommunestyre.
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: space.s24,
              }}
            >
              {PILLARS.map((p) => (
                <article
                  key={p.tag}
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
                    {p.tag}
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
                    {p.title}
                  </h3>
                  <p
                    style={{
                      ...typography.sizes.t16,
                      color: p.ink,
                      opacity: 0.92,
                      lineHeight: 1.55,
                    }}
                  >
                    {p.body}
                  </p>
                </article>
              ))}
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
              <p style={{ ...eyebrow, marginBottom: space.s12 }}>Status</p>
              <p
                style={{
                  fontFamily: clay.font.body,
                  fontSize: "18px",
                  color: clay.colors.body,
                  fontStyle: "italic",
                  lineHeight: 1.55,
                }}
              >
                {RESULTS_NOTE}
              </p>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
