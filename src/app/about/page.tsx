import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { Footer } from "@/components/ui";
import { colors, space, typography } from "@/lib/design-tokens";

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

const container: React.CSSProperties = { maxWidth: "960px", margin: "0 auto", padding: `0 ${space.s24}` };

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main id="main-content" style={{ background: colors.bg, color: colors.textBody }}>
        <section>
          <div style={{ ...container, padding: `${space.s64} ${space.s24} ${space.s40}` }}>
            <p className="pkt-eyebrow" style={{ marginBottom: space.s16 }}>Om prosjektet</p>
            <h1 style={{ marginBottom: space.s24, maxWidth: "20ch" }}>
              Eldre, omsorg og teknologi — forskning i Oslo.
            </h1>
            <div style={{ display: "flex", flexDirection: "column", gap: space.s16, maxWidth: "680px" }}>
              {PROJECT_COPY.map((paragraph, i) => (
                <p
                  key={i}
                  style={{
                    ...typography.sizes.t18,
                    color: i === PROJECT_COPY.length - 1 ? colors.textMuted : colors.textBody,
                    fontWeight: typography.weights.light,
                  }}
                >
                  {paragraph}
                </p>
              ))}
              <p
                style={{
                  ...typography.sizes.t16,
                  color: colors.textMuted,
                  fontStyle: "italic",
                  marginTop: space.s24,
                  paddingTop: space.s24,
                  borderTop: `1px solid ${colors.borderSubtle}`,
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
