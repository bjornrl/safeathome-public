import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import People from "@/components/People";
import { Button, Card } from "@/components/ui";
import { colors, space, typography } from "@/lib/design-tokens";

export const metadata: Metadata = {
  title: "SAFE@HOME — Tilpasning av kommunale hjemmetjenester for aldrende innvandrere",
  description:
    "Et forskningsprosjekt (2026–2029) som tilpasser kommunale hjemmetjenester for eldre innvandrere — ledet av OsloMet med UiO, Durham og Comte Bureau, i feltsamarbeid med bydelene Alna og Søndre Nordstrand.",
};

const WORK_PACKAGES = [
  {
    code: "WP1",
    title: "Homes & Communities",
    titleNo: "Hjem og fellesskap",
    lead: "Carolina Rau",
    institution: "UiO",
    body: "Hvordan materielle rom og sosial dynamikk i og rundt boligen former hjemmebasert omsorg.",
  },
  {
    code: "WP2",
    title: "Health & Care Institutions",
    titleNo: "Helse- og omsorgsinstitusjoner",
    lead: "Jonas Debesay",
    institution: "OsloMet",
    body: "Hvilke barrierer og muligheter institusjonene gir for tilgang til hjemmetjenester.",
  },
  {
    code: "WP3",
    title: "Transnational Contexts & Policies",
    titleNo: "Transnasjonale kontekster og politikk",
    lead: "Erika Gubrium",
    institution: "OsloMet",
    body: "Hvordan familiebånd og politikk på tvers av landegrenser påvirker det å eldes hjemme.",
  },
  {
    code: "WP4",
    title: "Innovation & Service Development",
    titleNo: "Innovasjon og tjenesteutvikling",
    lead: "Alejandro Miranda Nieto · Øystein Evensen",
    institution: "OsloMet · Comte Bureau",
    body: "Å ko-skape praktiske løsninger og tjenester sammen med beboere, ansatte og kommuner.",
  },
];

const PARTNERS = [
  { name: "OsloMet", role: "Prosjektleder" },
  { name: "Universitetet i Oslo (UiO)", role: "Forskningspartner" },
  { name: "Durham University", role: "Forskningspartner" },
  { name: "Comte Bureau", role: "Designpartner" },
  { name: "Bydel Alna, Oslo", role: "Feltsamarbeid" },
  { name: "Bydel Søndre Nordstrand, Oslo", role: "Feltsamarbeid" },
];

const FIELD_SITES = [
  { place: "Alna", region: "Oslo" },
  { place: "Søndre Nordstrand", region: "Oslo" },
];

const FOOTER_LINKS = [
  { href: "/about", label: "Om prosjektet" },
  { href: "/explore", label: "Utforsk" },
  { href: "/welfare-tech", label: "Velferdsteknologi" },
  { href: "/for-municipalities", label: "For kommuner" },
  { href: "/reading-room", label: "Lesesal" },
];

const container: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: `0 ${space.s24}`,
};
const narrow: React.CSSProperties = {
  maxWidth: "880px",
  margin: "0 auto",
  padding: `0 ${space.s24}`,
};
const sectionDivider: React.CSSProperties = {
  borderBottom: `1px solid ${colors.borderSubtle}`,
};

export default function HomePage() {
  return (
    <>
      <Nav />
      <main id="main-content" style={{ background: colors.bg, color: colors.textBody }}>
        {/* Hero */}
        <section style={sectionDivider}>
          <div style={{ ...narrow, padding: `${space.s104} ${space.s24} ${space.s64}` }}>
            <p className="pkt-eyebrow" style={{ marginBottom: space.s16 }}>
              Forskningsprosjekt · 2026–2029
            </p>
            <h1 style={{ marginBottom: space.s24, maxWidth: "14ch" }}>SAFE@HOME</h1>
            <p
              style={{
                ...typography.sizes.t24,
                fontWeight: typography.weights.regular,
                color: colors.textBody,
                maxWidth: "680px",
                marginBottom: space.s12,
              }}
            >
              Tilpasning av kommunale hjemmetjenester for aldrende innvandrere.
            </p>
            <p
              style={{
                ...typography.sizes.t18,
                fontWeight: typography.weights.light,
                color: colors.textMuted,
                maxWidth: "680px",
                marginBottom: space.s32,
                fontStyle: "italic",
              }}
            >
              Adapting municipal homecare for aging immigrants.
            </p>
            <p
              style={{
                ...typography.sizes.t18,
                color: colors.textBody,
                maxWidth: "680px",
                marginBottom: space.s32,
              }}
            >
              SAFE@HOME undersøker hvordan reformen Bo trygt hjemme møter hverdagen i transnasjonale
              husholdninger. Vi følger tre skalaer — fra soverom til bystyresal — og kartlegger
              friksjonene og kvalitetene som oppstår når kommunal omsorg møter mangfoldige
              eldreliv. Sammen med bydelene Alna og Søndre Nordstrand utvikler vi løsninger som
              kan gjøre tjenestene mer treffsikre.
            </p>
            <div style={{ display: "flex", gap: space.s12, flexWrap: "wrap" }}>
              <Link href="/explore" style={{ textDecoration: "none" }}>
                <Button variant="primary" size="lg">Utforsk prosjektet</Button>
              </Link>
              <Link href="/about" style={{ textDecoration: "none" }}>
                <Button variant="secondary" size="lg">Les mer om SAFE@HOME</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* About */}
        <section style={{ ...sectionDivider, background: colors.bgSubtle }}>
          <div style={{ ...narrow, padding: `${space.s64} ${space.s24}` }}>
            <p className="pkt-eyebrow" style={{ marginBottom: space.s12 }}>Om prosjektet</p>
            <h2 style={{ marginBottom: space.s24, maxWidth: "22ch" }}>
              Bo trygt hjemme — for hvem, og på hvilke vilkår?
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: space.s16, maxWidth: "680px" }}>
              <p style={{ ...typography.sizes.t18, color: colors.textBody }}>
                Norges «Bo trygt hjemme»-reform legger opp til at flere eldre skal kunne bli boende
                lenger hjemme. Reformen forutsetter at hjemmet, familien og lokalsamfunnet kan bære
                en større del av omsorgsarbeidet — og at kommunale tjenester møter folk der de er.
              </p>
              <p style={{ ...typography.sizes.t18, color: colors.textBody }}>
                Men hjemmene, familiene og hverdagene til eldre med innvandrerbakgrunn følger ikke
                alltid de mønstrene tjenestene er bygget rundt. SAFE@HOME undersøker hva som skjer
                i dette møtet, og hvordan tjenestene kan tilpasses uten å miste retning eller
                rettferdighet.
              </p>
            </div>

            <div
              style={{
                marginTop: space.s40,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: space.s16,
              }}
            >
              <Card padding="md">
                <p className="pkt-eyebrow" style={{ marginBottom: space.s8 }}>Periode</p>
                <p style={{ ...typography.sizes.t20, fontWeight: typography.weights.medium, color: colors.textBody }}>
                  2026–2029
                </p>
              </Card>
              <Card padding="md">
                <p className="pkt-eyebrow" style={{ marginBottom: space.s8 }}>Feltsteder</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {FIELD_SITES.map((s) => (
                    <li
                      key={s.place}
                      style={{
                        ...typography.sizes.t16,
                        color: colors.textBody,
                        marginBottom: space.s4,
                      }}
                    >
                      <span style={{ fontWeight: typography.weights.medium }}>{s.place}</span>
                      <span style={{ color: colors.textMuted }}> · {s.region}</span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card padding="md">
                <p className="pkt-eyebrow" style={{ marginBottom: space.s8 }}>Finansiering</p>
                <p style={{ ...typography.sizes.t14, color: colors.textMuted, fontStyle: "italic" }}>
                  Annonseres når midler er bekreftet.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Work packages */}
        <section style={sectionDivider}>
          <div style={{ ...container, padding: `${space.s64} ${space.s24}` }}>
            <p className="pkt-eyebrow" style={{ marginBottom: space.s12 }}>Arbeidspakker</p>
            <h2 style={{ marginBottom: space.s16, maxWidth: "22ch" }}>
              Fire spor som beveger seg fra hjem til politikk.
            </h2>
            <p
              style={{
                ...typography.sizes.t18,
                color: colors.textMuted,
                maxWidth: "640px",
                marginBottom: space.s40,
              }}
            >
              Hver arbeidspakke ledes av en av prosjektpartnerne, og resultatene kobles sammen i
              en felles plattform for innsikter, utfordringer og tjenesteforslag.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: space.s16,
              }}
            >
              {WORK_PACKAGES.map((wp) => (
                <Card
                  key={wp.code}
                  padding="md"
                  style={{ borderTop: `3px solid ${colors.brandDarkBlue}` }}
                >
                  <p
                    style={{
                      ...typography.sizes.t12,
                      fontWeight: typography.weights.bold,
                      letterSpacing: "0.12em",
                      color: colors.brandWarmBlue,
                      marginBottom: space.s8,
                    }}
                  >
                    {wp.code}
                  </p>
                  <h3 style={{ marginBottom: space.s4, color: colors.textBody }}>{wp.title}</h3>
                  <p style={{ ...typography.sizes.t14, color: colors.textMuted, marginBottom: space.s16, fontStyle: "italic" }}>
                    {wp.titleNo}
                  </p>
                  <p style={{ ...typography.sizes.t14, color: colors.textBody, marginBottom: space.s16 }}>
                    {wp.body}
                  </p>
                  <p style={{ ...typography.sizes.t12, color: colors.textMuted }}>
                    Ledet av <span style={{ color: colors.textBody, fontWeight: typography.weights.medium }}>{wp.lead}</span>
                    <span style={{ color: colors.textMuted }}> · {wp.institution}</span>
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Partners */}
        <section style={{ ...sectionDivider, background: colors.bgSubtle }}>
          <div style={{ ...container, padding: `${space.s64} ${space.s24}` }}>
            <p className="pkt-eyebrow" style={{ marginBottom: space.s12 }}>Partnere</p>
            <h2 style={{ marginBottom: space.s16, maxWidth: "22ch" }}>
              Et tverrfaglig konsortium på tvers av forskning, design og kommune.
            </h2>
            <div
              style={{
                marginTop: space.s32,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: space.s16,
              }}
            >
              {PARTNERS.map((p) => (
                <Card key={p.name} padding="md">
                  <p
                    style={{
                      ...typography.sizes.t18,
                      fontWeight: typography.weights.medium,
                      color: colors.textBody,
                      marginBottom: space.s4,
                    }}
                  >
                    {p.name}
                  </p>
                  <p style={{ ...typography.sizes.t14, color: colors.textMuted }}>{p.role}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* People */}
        <section style={sectionDivider}>
          <div style={{ ...container, padding: `${space.s64} ${space.s24}` }}>
            <p className="pkt-eyebrow" style={{ marginBottom: space.s12 }}>Prosjektgruppe</p>
            <h2 style={{ marginBottom: space.s16, maxWidth: "22ch" }}>
              Forskere, designere og kommunale partnere.
            </h2>
            <p
              style={{
                ...typography.sizes.t18,
                color: colors.textMuted,
                maxWidth: "640px",
                marginBottom: space.s40,
              }}
            >
              Prosjektet drives av et team på tvers av OsloMet, Universitetet i Oslo, Durham
              University og Comte Bureau, i tett samarbeid med Bydel Alna og Bydel Søndre
              Nordstrand.
            </p>
            <People />
          </div>
        </section>

        {/* Contact */}
        <section style={{ ...sectionDivider, background: colors.bgSubtle }}>
          <div style={{ ...narrow, padding: `${space.s64} ${space.s24}` }}>
            <p className="pkt-eyebrow" style={{ marginBottom: space.s12 }}>Kontakt</p>
            <h2 style={{ marginBottom: space.s32, maxWidth: "22ch" }}>
              Ta kontakt med prosjektet.
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: space.s24,
              }}
            >
              <Card padding="md">
                <p className="pkt-eyebrow" style={{ marginBottom: space.s8 }}>
                  Prosjektleder (PI)
                </p>
                <p
                  style={{
                    ...typography.sizes.t20,
                    fontWeight: typography.weights.medium,
                    color: colors.textBody,
                    marginBottom: space.s4,
                  }}
                >
                  Marit Haldar
                </p>
                <p style={{ ...typography.sizes.t14, color: colors.textMuted, marginBottom: space.s12 }}>
                  OsloMet
                </p>
                <a
                  href="mailto:mariha@oslomet.no"
                  style={{
                    ...typography.sizes.t16,
                    color: colors.brandWarmBlue,
                    textDecoration: "none",
                    fontWeight: typography.weights.medium,
                  }}
                >
                  mariha@oslomet.no
                </a>
              </Card>
              <Card padding="md">
                <p className="pkt-eyebrow" style={{ marginBottom: space.s8 }}>
                  Plattform · WP4
                </p>
                <p
                  style={{
                    ...typography.sizes.t20,
                    fontWeight: typography.weights.medium,
                    color: colors.textBody,
                    marginBottom: space.s4,
                  }}
                >
                  Øystein Evensen
                </p>
                <p style={{ ...typography.sizes.t14, color: colors.textMuted, marginBottom: space.s12 }}>
                  Comte Bureau
                </p>
                <a
                  href="mailto:oystein@comte.no"
                  style={{
                    ...typography.sizes.t16,
                    color: colors.brandWarmBlue,
                    textDecoration: "none",
                    fontWeight: typography.weights.medium,
                  }}
                >
                  oystein@comte.no
                </a>
              </Card>
            </div>
          </div>
        </section>

        {/* Footer (custom — public homepage version with team login) */}
        <footer
          style={{
            background: colors.brandDarkBlue,
            color: colors.textLight,
          }}
        >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: `${space.s64} ${space.s24} ${space.s40}`,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: space.s40,
            }}
          >
            <div>
              <p
                style={{
                  ...typography.sizes.t22,
                  fontWeight: typography.weights.bold,
                  marginBottom: space.s12,
                  color: colors.textLight,
                }}
              >
                SAFE@HOME
              </p>
              <p
                style={{
                  ...typography.sizes.t14,
                  color: "rgba(255, 255, 255, 0.75)",
                  maxWidth: "32ch",
                }}
              >
                Forskningsprosjekt om aldring, omsorg og tilhørighet i reformen Bo trygt hjemme.
              </p>
            </div>
            <div>
              <p
                className="pkt-eyebrow"
                style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: space.s12 }}
              >
                Naviger
              </p>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: space.s8,
                }}
              >
                {FOOTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      style={{
                        ...typography.sizes.t14,
                        color: colors.textLight,
                        textDecoration: "none",
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p
                className="pkt-eyebrow"
                style={{ color: "rgba(255, 255, 255, 0.6)", marginBottom: space.s12 }}
              >
                Konsortium
              </p>
              <p style={{ ...typography.sizes.t14, color: "rgba(255, 255, 255, 0.85)", marginBottom: space.s4 }}>
                OsloMet · UiO · Durham · Comte
              </p>
              <p style={{ ...typography.sizes.t14, color: "rgba(255, 255, 255, 0.7)" }}>
                Bydel Alna · Bydel Søndre Nordstrand
              </p>
            </div>
          </div>
          <div
            style={{
              borderTop: "1px solid rgba(255, 255, 255, 0.15)",
              padding: `${space.s16} ${space.s24}`,
            }}
          >
            <div
              style={{
                maxWidth: "1200px",
                margin: "0 auto",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: space.s16,
                flexWrap: "wrap",
              }}
            >
              <p
                style={{
                  ...typography.sizes.t12,
                  color: "rgba(255, 255, 255, 0.55)",
                }}
              >
                © 2026 SAFE@HOME-konsortiet
              </p>
              <Link
                href="/login"
                style={{
                  ...typography.sizes.t12,
                  color: "rgba(255, 255, 255, 0.55)",
                  textDecoration: "none",
                  borderBottom: "1px dashed rgba(255, 255, 255, 0.35)",
                  paddingBottom: "2px",
                }}
              >
                Team login →
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
