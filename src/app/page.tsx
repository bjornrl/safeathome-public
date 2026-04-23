import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import { Button, Card, Footer, SkipToContent } from "@/components/ui";
import { colors, radius, space, typography } from "@/lib/design-tokens";
import { FRICTIONS, QUALITIES } from "@/lib/constants";
import type { CareFriction, CareQuality } from "@/lib/types";

export const metadata: Metadata = {
  title: "safe@home — Technologies of care for aging migrants",
  description:
    "A research platform mapping how aging immigrants in Norway navigate care, technology, and belonging — across the intimacy of a bedroom and the policies that shape a city.",
};

const FRICTION_COPY: Record<CareFriction, string> = {
  rotate: "Staff turnover breaks relational continuity",
  script: "Technologies embed assumptions that don't fit",
  isolate: "Care plans sever people from support systems",
  reduce: "Complex lives flattened to categories",
  exclude: "Barriers prevent access to services",
  invisible: "Care work the system doesn't see",
  displace: "Interventions make people feel less at home",
};

const QUALITY_COPY: Record<CareQuality, string> = {
  transnational_flow: "Care circulating across borders",
  household_choreography: "Daily orchestration of multi-use spaces",
  invisible_labor: "Unpaid care by relatives and community",
  cultural_anchoring: "Practices sustaining identity",
  adaptive_resistance: "Quietly working around services",
  intergenerational_exchange: "Bidirectional care between old and young",
  digital_bridging: "Technology maintaining connections",
  belonging_negotiation: "Tension between here and there",
};

const FOUR_ENTRIES = [
  { href: "/explore",   title: "Utforsk kartet",     line: "Fra soverommet til rådhuset",       hint: "HVOR" },
  { href: "/frictions", title: "Omsorgsfriksjoner",  line: "Hvordan systemer kolliderer med folk", hint: "HVORDAN DET SVIKTER" },
  { href: "/qualities", title: "Omsorgskvaliteter",  line: "Hvordan folk faktisk lever og mestrer",  hint: "HVORDAN DE LEVER" },
  { href: "/solutions", title: "Designløsninger",    line: "Fra observasjon til inngripen",           hint: "SVAR" },
];

const SCALES_COPY = [
  { label: "Mikro", title: "I hjemmet",
    body: "Der omsorgsteknologi møter hverdagen — en bønneteppe ved siden av en bevegelsessensor, en telefon på stuebordet, en baderomsdør med lås på utsiden." },
  { label: "Meso", title: "Nabolaget",
    body: "Der tjenester møter mennesker — apoteket som ble et klasserom, moskeen som er venterom, tolv ansikter på tre måneder." },
  { label: "Makro", title: "Byen",
    body: "Der politikk treffer husstandene — en nedlagt bussrute, en digital søknadsportal, en standardisert tildelingsalgoritme." },
];

const WORK_PACKAGES = [
  { code: "WP1", title: "Hjem og fellesskap",
    body: "Hvordan materielle rom og sosial dynamikk former hjemmebasert omsorg." },
  { code: "WP2", title: "Helse- og omsorgsinstitusjoner",
    body: "Hvilke barrierer og muligheter påvirker tilgang til tjenester." },
  { code: "WP3", title: "Transnasjonale kontekster",
    body: "Hvordan familiebånd på tvers av landegrenser påvirker det å eldes hjemme." },
  { code: "WP4", title: "Innovasjon og design",
    body: "Å ko-skape praktiske løsninger sammen med brukere og kommuner." },
];

const container: React.CSSProperties = { maxWidth: "1200px", margin: "0 auto", padding: `0 ${space.s24}` };
const narrow: React.CSSProperties = { maxWidth: "960px", margin: "0 auto", padding: `0 ${space.s24}` };
const sectionDivider: React.CSSProperties = { borderBottom: `1px solid ${colors.borderSubtle}` };

export default function HomePage() {
  return (
    <>
      <SkipToContent />
      <Nav />
      <main id="main-content" style={{ background: colors.bg, color: colors.textBody }}>
        {/* Hero */}
        <section style={sectionDivider}>
          <div style={{ ...narrow, padding: `${space.s104} ${space.s24} ${space.s64}` }}>
            <p className="pkt-eyebrow" style={{ marginBottom: space.s16 }}>
              Forskningsplattform · 2026–2029
            </p>
            <h1 style={{ marginBottom: space.s24, maxWidth: "12ch" }}>safe@home</h1>
            <p style={{
              ...typography.sizes.t24,
              fontWeight: typography.weights.regular,
              color: colors.textBody,
              maxWidth: "680px",
              marginBottom: space.s24,
            }}>
              Teknologier for omsorg til eldre med innvandrerbakgrunn.
            </p>
            <p style={{
              ...typography.sizes.t18,
              fontWeight: typography.weights.light,
              color: colors.textMuted,
              maxWidth: "680px",
              marginBottom: space.s32,
            }}>
              Hva skjer når reformen Bo trygt hjemme møter hverdagen i transnasjonale husholdninger?
              Plattformen kartlegger erfaringer til eldre innvandrere som navigerer omsorg, teknologi
              og tilhørighet i tre skalaer — fra et soverom til byens beslutninger.
            </p>
            <div style={{ display: "flex", gap: space.s12, flexWrap: "wrap" }}>
              <Link href="/explore" style={{ textDecoration: "none" }}>
                <Button variant="primary" size="lg">Utforsk kartet</Button>
              </Link>
              <Link href="/about" style={{ textDecoration: "none" }}>
                <Button variant="secondary" size="lg">Om prosjektet</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Four entries */}
        <section style={{ ...sectionDivider, background: colors.bgSubtle }}>
          <div style={{ ...container, padding: `${space.s64} ${space.s24}` }}>
            <p className="pkt-eyebrow" style={{ marginBottom: space.s12 }}>Fire innganger</p>
            <h2 style={{ marginBottom: space.s40, maxWidth: "20ch" }}>
              Samme historier, sett gjennom fire ulike linser.
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: space.s16,
            }}>
              {FOUR_ENTRIES.map((entry) => (
                <Card key={entry.href} variant="interactive" href={entry.href} padding="md" style={{ borderTop: `3px solid ${colors.brandDarkBlue}` }}>
                  <p className="pkt-eyebrow" style={{ color: colors.brandWarmBlue, marginBottom: space.s16 }}>
                    {entry.hint}
                  </p>
                  <h3 style={{ marginBottom: space.s8, color: colors.textBody }}>{entry.title}</h3>
                  <p style={{ ...typography.sizes.t14, color: colors.textMuted, marginBottom: space.s24 }}>
                    {entry.line}
                  </p>
                  <span style={{ ...typography.sizes.t14, fontWeight: typography.weights.medium, color: colors.brandWarmBlue }}>
                    Åpne →
                  </span>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section style={sectionDivider}>
          <div style={{ ...narrow, padding: `${space.s64} ${space.s24}` }}>
            <p className="pkt-eyebrow" style={{ marginBottom: space.s12 }}>Om prosjektet</p>
            <h2 style={{ marginBottom: space.s32, maxWidth: "22ch" }}>
              Et forskningsprosjekt om Bo trygt hjemme-reformen.
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: space.s16, maxWidth: "680px" }}>
              <p style={{ ...typography.sizes.t18, color: colors.textBody }}>
                SAFE@HOME er et samarbeidsprosjekt (2026–2029) mellom OsloMet, Universitetet i Oslo,
                Durham University, Comte Bureau og tre kommuner: bydelene Alna og Søndre Nordstrand i Oslo,
                og Skien i Telemark.
              </p>
              <p style={{ ...typography.sizes.t18, color: colors.textBody }}>
                Prosjektet undersøker hvordan hjemmebasert omsorg kan tilpasses en voksende gruppe
                eldre innvandrere — en gruppe hvis behov, rutiner og familieformer ofte ikke passer
                inn i standardiserte omsorgsteknologier og byråkratiske løp.
              </p>
              <p style={{ ...typography.sizes.t18, color: colors.textMuted }}>
                Fire arbeidspakker beveger seg fra hjemmet utover til politikkens rammer, og tilbake igjen.
              </p>
            </div>
            <div style={{
              marginTop: space.s40,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: space.s16,
            }}>
              {WORK_PACKAGES.map((wp) => (
                <Card key={wp.code} padding="md">
                  <p style={{
                    ...typography.sizes.t12,
                    fontWeight: typography.weights.bold,
                    letterSpacing: "0.12em",
                    color: colors.brandWarmBlue,
                    marginBottom: space.s8,
                  }}>
                    {wp.code}
                  </p>
                  <h4 style={{ marginBottom: space.s8 }}>{wp.title}</h4>
                  <p style={{ ...typography.sizes.t14, color: colors.textMuted }}>{wp.body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Three scales */}
        <section style={sectionDivider}>
          <div style={{ ...container, padding: `${space.s64} ${space.s24}` }}>
            <p className="pkt-eyebrow" style={{ marginBottom: space.s12 }}>Tre skalaer</p>
            <h2 style={{ marginBottom: space.s16, maxWidth: "22ch" }}>Fra soverom til rådhus.</h2>
            <p style={{ ...typography.sizes.t18, color: colors.textMuted, maxWidth: "640px", marginBottom: space.s40 }}>
              Den samme historien utspiller seg på tre skalaer samtidig. Zoom inn og se en bønneteppe
              ved siden av en bevegelsessensor. Zoom ut og se budsjettlinjen som stille fjernet en bussrute.
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: space.s24,
            }}>
              {SCALES_COPY.map((s) => (
                <Card key={s.label} padding="md">
                  <p className="pkt-eyebrow" style={{ color: colors.brandWarmBlue, marginBottom: space.s8 }}>
                    {s.label}
                  </p>
                  <h3 style={{ marginBottom: space.s12 }}>{s.title}</h3>
                  <p style={{ ...typography.sizes.t16, color: colors.textBody }}>{s.body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Care frictions */}
        <section style={{ ...sectionDivider, background: colors.bgSubtle }}>
          <div style={{ ...container, padding: `${space.s64} ${space.s24}` }}>
            <p className="pkt-eyebrow" style={{ marginBottom: space.s12 }}>Omsorgsfriksjoner</p>
            <h2 style={{ marginBottom: space.s16, maxWidth: "22ch" }}>
              Sju måter systemet kolliderer med virkeligheten.
            </h2>
            <p style={{ ...typography.sizes.t18, color: colors.textMuted, maxWidth: "640px", marginBottom: space.s40 }}>
              Gjentagende mønstre der velmenende omsorg skaper motstand for menneskene den skal betjene.
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: space.s16,
            }}>
              {(Object.entries(FRICTIONS) as [CareFriction, (typeof FRICTIONS)[CareFriction]][]).map(([key, val]) => (
                <Card key={key} variant="interactive" href={`/frictions?friction=${key}`} padding="md">
                  <div style={{ display: "flex", alignItems: "flex-start", gap: space.s12 }}>
                    <span aria-hidden style={{
                      display: "inline-block",
                      width: 12, height: 12,
                      marginTop: 6,
                      background: val.color,
                      flexShrink: 0,
                    }} />
                    <div>
                      <p style={{ ...typography.sizes.t18, fontWeight: typography.weights.medium, color: colors.textBody, marginBottom: space.s4 }}>
                        {val.label}
                      </p>
                      <p style={{ ...typography.sizes.t14, color: colors.textMuted }}>{FRICTION_COPY[key]}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Care qualities */}
        <section style={sectionDivider}>
          <div style={{ ...container, padding: `${space.s64} ${space.s24}` }}>
            <p className="pkt-eyebrow" style={{ marginBottom: space.s12 }}>Omsorgskvaliteter</p>
            <h2 style={{ marginBottom: space.s16, maxWidth: "22ch" }}>
              Hvordan folk faktisk lever og mestrer.
            </h2>
            <p style={{ ...typography.sizes.t18, color: colors.textMuted, maxWidth: "640px", marginBottom: space.s40 }}>
              Kvalitetene beskriver hverdagen, strategiene og styrkene til eldre innvandrere og
              familiene deres — delene av omsorg som sjelden finner veien inn i tjenesteloggen.
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: space.s16,
            }}>
              {(Object.entries(QUALITIES) as [CareQuality, (typeof QUALITIES)[CareQuality]][]).map(([key, val]) => (
                <Card key={key} padding="md" style={{ borderLeft: `3px solid ${val.color}` }}>
                  <p style={{ ...typography.sizes.t18, fontWeight: typography.weights.medium, color: colors.textBody, marginBottom: space.s4 }}>
                    {val.label}
                  </p>
                  <p style={{ ...typography.sizes.t14, color: colors.textMuted }}>{QUALITY_COPY[key]}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section style={{ background: colors.brandDarkBlue, color: colors.textLight }}>
          <div style={{ ...narrow, padding: `${space.s104} ${space.s24}`, textAlign: "center" }}>
            <h2 style={{ marginBottom: space.s16, color: colors.textLight }}>Klar til å utforske?</h2>
            <p style={{
              ...typography.sizes.t18,
              color: "rgba(255, 255, 255, 0.85)",
              maxWidth: "560px",
              margin: `0 auto ${space.s32}`,
              fontWeight: typography.weights.light,
            }}>
              Start på byskalaen og zoom inn til du står i en stue. Eller følg én friksjon gjennom
              alle sju historiene den berører.
            </p>
            <Link href="/explore" style={{ textDecoration: "none" }}>
              <Button
                size="lg"
                style={{ background: colors.white, color: colors.brandDarkBlue, borderColor: colors.white, borderRadius: radius.none }}
              >
                Åpne kartet
              </Button>
            </Link>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
