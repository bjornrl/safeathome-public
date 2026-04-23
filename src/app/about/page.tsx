import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { Card, Footer, SkipToContent } from "@/components/ui";
import { colors, space, typography } from "@/lib/design-tokens";
import { FRICTIONS, QUALITIES, QUALITY_COPY } from "@/lib/constants";
import type { CareFriction, CareQuality } from "@/lib/types";

export const metadata: Metadata = {
  title: "Om — safe@home",
  description: "Om safe@home — forskningsprosjektet, feltstedene og hvordan innsiktene er kategorisert.",
};

// phase3: copy hard-coded here for now. When public_pages has a row
// with slug='about-project', swap to load that body at render time.
const PROJECT_COPY = [
  "safe@home er et samarbeidsprosjekt (2026–2029) mellom OsloMet, Universitetet i Oslo, Durham University og Comte Bureau, i samarbeid med tre kommuner: bydelene Alna og Søndre Nordstrand i Oslo, og Skien kommune i Telemark.",
  "Prosjektet kombinerer feltarbeid, politikkanalyse og ko-design for å undersøke hvordan hjemmebaserte omsorgstjenester kan tilpasses en voksende gruppe eldre innvandrere — en gruppe hvis rutiner, familieformer og behov ofte ikke passer inn i standardiserte løsninger.",
  "Vi spør blant annet: Hva skjer når velferdsteknologi møter en transnasjonal hverdag? Hvordan virker reformen Bo trygt hjemme på tvers av språk, kultur og generasjoner? Hvilke lokale strategier og improvisasjoner holder folk oppe der tjenestene svikter?",
];

const CATEGORIZATIONS_COPY = {
  frictions:
    "Friksjoner beskriver gjentagende mønstre der velmenende omsorgstjenester skaper motstand — tapte relasjoner, feiltilpassede teknologier, byråkratiske barrierer. De er de strukturelle måtene systemet kolliderer med virkeligheten, identifisert gjennom feltarbeid og lest på tvers av de tre feltstedene.",
  qualities:
    "Kvaliteter beskriver hvordan mennesker faktisk lever, mestrer og tar vare på hverandre — transnasjonal koordinering, kulturell forankring, usynlig omsorgsarbeid. Der friksjonene fanger hva som bryter, fanger kvalitetene hva som holder. Begge linsene trengs: systemet må både reparere det som feiler og bygge videre på det som fungerer.",
};

const container: React.CSSProperties = { maxWidth: "960px", margin: "0 auto", padding: `0 ${space.s24}` };

export default function AboutPage() {
  return (
    <>
      <SkipToContent />
      <Nav />
      <main id="main-content" style={{ background: colors.bg, color: colors.textBody }}>
        <section>
          <div style={{ ...container, padding: `${space.s64} ${space.s24} ${space.s40}` }}>
            <p className="pkt-eyebrow" style={{ marginBottom: space.s16 }}>Om prosjektet</p>
            <h1 style={{ marginBottom: space.s24, maxWidth: "20ch" }}>
              Eldre, omsorg og teknologi — forskning på tvers av tre kommuner.
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
            </div>
          </div>
        </section>

        {/* Section B — how the categorizations work */}
        <section style={{ borderTop: `1px solid ${colors.borderSubtle}`, background: colors.bgSubtle }}>
          <div style={{ ...container, padding: `${space.s64} ${space.s24}` }}>
            <p className="pkt-eyebrow" style={{ marginBottom: space.s12 }}>Hvordan vi sorterer innsiktene</p>
            <h2 style={{ marginBottom: space.s32, maxWidth: "22ch" }}>
              Friksjoner og kvaliteter — to linser på samme historier.
            </h2>

            {/* Frictions */}
            <div style={{ marginBottom: space.s64 }}>
              <h3 style={{ marginBottom: space.s16 }}>Friksjoner</h3>
              <p style={{
                ...typography.sizes.t18,
                color: colors.textMuted,
                maxWidth: "680px",
                marginBottom: space.s32,
                fontWeight: typography.weights.light,
              }}>
                {CATEGORIZATIONS_COPY.frictions}
              </p>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: space.s16,
              }}>
                {(Object.entries(FRICTIONS) as [CareFriction, (typeof FRICTIONS)[CareFriction]][]).map(([key, val]) => (
                  <Card key={key} padding="md">
                    <div style={{ display: "flex", alignItems: "flex-start", gap: space.s12 }}>
                      <span aria-hidden style={{
                        display: "inline-block",
                        width: 12, height: 12,
                        marginTop: 6,
                        background: val.color,
                        flexShrink: 0,
                      }} />
                      <div>
                        <p style={{
                          ...typography.sizes.t18,
                          fontWeight: typography.weights.medium,
                          color: colors.textBody,
                          marginBottom: space.s4,
                        }}>
                          {val.label}
                        </p>
                        <p style={{ ...typography.sizes.t14, color: colors.textMuted }}>
                          {val.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Qualities */}
            <div>
              <h3 style={{ marginBottom: space.s16 }}>Kvaliteter</h3>
              <p style={{
                ...typography.sizes.t18,
                color: colors.textMuted,
                maxWidth: "680px",
                marginBottom: space.s32,
                fontWeight: typography.weights.light,
              }}>
                {CATEGORIZATIONS_COPY.qualities}
              </p>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: space.s16,
              }}>
                {(Object.entries(QUALITIES) as [CareQuality, (typeof QUALITIES)[CareQuality]][]).map(([key, val]) => (
                  <Card key={key} padding="md" style={{ borderLeft: `3px solid ${val.color}` }}>
                    <p style={{
                      ...typography.sizes.t18,
                      fontWeight: typography.weights.medium,
                      color: colors.textBody,
                      marginBottom: space.s4,
                    }}>
                      {val.label}
                    </p>
                    <p style={{ ...typography.sizes.t14, color: colors.textMuted }}>
                      {QUALITY_COPY[key]}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
