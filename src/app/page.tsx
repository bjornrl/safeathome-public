import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import People from "@/components/People";
import { Button, Card } from "@/components/ui";
import { clay, space, typography } from "@/lib/design-tokens";

export const metadata: Metadata = {
  title: "SAFE@HOME — Tilpasning av kommunale hjemmetjenester for aldrende innvandrere",
  description:
    "Et forskningsprosjekt (2026–2029) som tilpasser kommunale hjemmetjenester for eldre innvandrere — ledet av OsloMet med UiO, Durham og Comte Bureau, i feltsamarbeid med bydelene Alna og Søndre Nordstrand.",
};

// Each WP gets a saturated Clay feature-card color in the prescribed rotation
// (pink → teal → lavender → peach) — see .claude/design-clay.md "Iteration Guide".
const WORK_PACKAGES: {
  code: string;
  title: string;
  titleNo: string;
  lead: string;
  institution: string;
  body: string;
  bg: string;
  ink: string;
  muted: string;
}[] = [
  {
    code: "WP1",
    title: "Homes & Communities",
    titleNo: "Hjem og fellesskap",
    lead: "Carolina Rau",
    institution: "UiO",
    body: "Hvordan materielle rom og sosial dynamikk i og rundt boligen former hjemmebasert omsorg.",
    bg: clay.colors.pink,
    ink: clay.colors.onPrimary,
    muted: "rgba(255, 255, 255, 0.78)",
  },
  {
    code: "WP2",
    title: "Health & Care Institutions",
    titleNo: "Helse- og omsorgsinstitusjoner",
    lead: "Jonas Debesay",
    institution: "OsloMet",
    body: "Hvilke barrierer og muligheter institusjonene gir for tilgang til hjemmetjenester.",
    bg: clay.colors.teal,
    ink: clay.colors.onPrimary,
    muted: "rgba(255, 255, 255, 0.7)",
  },
  {
    code: "WP3",
    title: "Transnational Contexts & Policies",
    titleNo: "Transnasjonale kontekster og politikk",
    lead: "Erika Gubrium",
    institution: "OsloMet",
    body: "Hvordan familiebånd og politikk på tvers av landegrenser påvirker det å eldes hjemme.",
    bg: clay.colors.lavender,
    ink: clay.colors.ink,
    muted: "rgba(10, 10, 10, 0.65)",
  },
  {
    code: "WP4",
    title: "Innovation & Service Development",
    titleNo: "Innovasjon og tjenesteutvikling",
    lead: "Alejandro Miranda Nieto · Øystein Evensen",
    institution: "OsloMet · Comte Bureau",
    body: "Å ko-skape praktiske løsninger og tjenester sammen med beboere, ansatte og kommuner.",
    bg: clay.colors.peach,
    ink: clay.colors.ink,
    muted: "rgba(10, 10, 10, 0.65)",
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

const sectionPad: React.CSSProperties = {
  padding: `${space.s96} ${space.s24}`,
};

export default function HomePage() {
  return (
    <>
      <Nav />
      <main id="main-content" style={{ background: clay.colors.canvas, color: clay.colors.body }}>
        {/* ── Hero ────────────────────────────────────────────── */}
        <section>
          <div style={{ ...container, ...sectionPad, paddingBottom: space.s64 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 7fr) minmax(0, 5fr)",
                gap: space.s48,
                alignItems: "center",
              }}
            >
              <div>
                <p style={{ ...eyebrow, marginBottom: space.s24 }}>
                  Forskningsprosjekt · 2026–2029
                </p>
                <h1 style={{ marginBottom: space.s24, maxWidth: "12ch" }}>SAFE@HOME</h1>
                <p
                  style={{
                    fontFamily: clay.font.body,
                    fontSize: "20px",
                    lineHeight: 1.4,
                    color: clay.colors.bodyStrong,
                    maxWidth: "44ch",
                    marginBottom: space.s12,
                  }}
                >
                  Tilpasning av kommunale hjemmetjenester for aldrende innvandrere.
                </p>
                <p
                  style={{
                    ...typography.sizes.t18,
                    color: clay.colors.muted,
                    maxWidth: "44ch",
                    marginBottom: space.s32,
                    fontStyle: "italic",
                  }}
                >
                  Adapting municipal homecare for aging immigrants.
                </p>
                <p
                  style={{
                    ...typography.sizes.t18,
                    color: clay.colors.body,
                    maxWidth: "52ch",
                    marginBottom: space.s32,
                    lineHeight: 1.55,
                  }}
                >
                  SAFE@HOME undersøker hvordan reformen Bo trygt hjemme møter hverdagen i transnasjonale
                  husholdninger. Vi følger tre skalaer — fra soverom til bystyresal — og kartlegger
                  friksjonene og kvalitetene som oppstår når kommunal omsorg møter mangfoldige
                  eldreliv.
                </p>
                <div style={{ display: "flex", gap: space.s12, flexWrap: "wrap" }}>
                  <Link href="/about" style={{ textDecoration: "none" }}>
                    <Button variant="primary" size="lg">Les mer om SAFE@HOME</Button>
                  </Link>
                  <Link href="/explore" style={{ textDecoration: "none" }}>
                    <Button variant="secondary" size="lg">Utforsk plattformen →</Button>
                  </Link>
                </div>
              </div>

              {/* Hero illustration card — placeholder for the 3D claymation
                  artifact the spec calls for. Until a commissioned asset
                  exists we render a tinted surface so the layout stays. */}
              <HeroIllustration />
            </div>
          </div>
        </section>

        {/* ── About ───────────────────────────────────────────── */}
        <section>
          <div style={{ ...narrow, ...sectionPad }}>
            <p style={{ ...eyebrow, marginBottom: space.s16 }}>Om prosjektet</p>
            <h2 style={{ marginBottom: space.s32, maxWidth: "20ch" }}>
              Bo trygt hjemme — for hvem, og på hvilke vilkår?
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: space.s24, maxWidth: "60ch" }}>
              <p style={{ ...typography.sizes.t18, color: clay.colors.body, lineHeight: 1.6 }}>
                Norges «Bo trygt hjemme»-reform legger opp til at flere eldre skal kunne bli boende
                lenger hjemme. Reformen forutsetter at hjemmet, familien og lokalsamfunnet kan bære
                en større del av omsorgsarbeidet — og at kommunale tjenester møter folk der de er.
              </p>
              <p style={{ ...typography.sizes.t18, color: clay.colors.body, lineHeight: 1.6 }}>
                Men hjemmene, familiene og hverdagene til eldre med innvandrerbakgrunn følger ikke
                alltid de mønstrene tjenestene er bygget rundt. SAFE@HOME undersøker hva som skjer
                i dette møtet, og hvordan tjenestene kan tilpasses uten å miste retning eller
                rettferdighet.
              </p>
            </div>

            <div
              style={{
                marginTop: space.s48,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: space.s16,
              }}
            >
              <Card padding="md">
                <p style={{ ...eyebrow, marginBottom: space.s8 }}>Periode</p>
                <p
                  style={{
                    fontFamily: clay.font.display,
                    fontSize: "28px",
                    fontWeight: 500,
                    letterSpacing: "-0.5px",
                    color: clay.colors.ink,
                  }}
                >
                  2026–2029
                </p>
              </Card>
              <Card padding="md">
                <p style={{ ...eyebrow, marginBottom: space.s12 }}>Feltsteder</p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {FIELD_SITES.map((s) => (
                    <li
                      key={s.place}
                      style={{
                        ...typography.sizes.t16,
                        color: clay.colors.body,
                        marginBottom: space.s4,
                      }}
                    >
                      <span style={{ fontWeight: 600, color: clay.colors.ink }}>{s.place}</span>
                      <span style={{ color: clay.colors.muted }}> · {s.region}</span>
                    </li>
                  ))}
                </ul>
              </Card>
              <Card padding="md">
                <p style={{ ...eyebrow, marginBottom: space.s12 }}>Finansiering</p>
                <p style={{ ...typography.sizes.t14, color: clay.colors.muted, fontStyle: "italic", lineHeight: 1.5 }}>
                  Annonseres når midler er bekreftet.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* ── Work packages ──────────────────────────────────── */}
        <section style={{ background: clay.colors.surfaceSoft }}>
          <div style={{ ...container, ...sectionPad }}>
            <p style={{ ...eyebrow, marginBottom: space.s16 }}>Arbeidspakker</p>
            <h2 style={{ marginBottom: space.s24, maxWidth: "22ch" }}>
              Fire spor som beveger seg fra hjem til politikk.
            </h2>
            <p
              style={{
                ...typography.sizes.t18,
                color: clay.colors.muted,
                maxWidth: "58ch",
                marginBottom: space.s48,
                lineHeight: 1.55,
              }}
            >
              Hver arbeidspakke ledes av en av prosjektpartnerne, og resultatene kobles sammen i
              en felles plattform for innsikter, utfordringer og tjenesteforslag.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: space.s24,
              }}
            >
              {WORK_PACKAGES.map((wp) => (
                <article
                  key={wp.code}
                  style={{
                    background: wp.bg,
                    color: wp.ink,
                    borderRadius: "var(--clay-radius-xl)",
                    padding: space.s32,
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 320,
                  }}
                >
                  <p
                    style={{
                      fontFamily: clay.font.body,
                      fontSize: "12px",
                      fontWeight: 600,
                      letterSpacing: "1.8px",
                      textTransform: "uppercase",
                      color: wp.muted,
                      marginBottom: space.s24,
                    }}
                  >
                    {wp.code}
                  </p>
                  <h3
                    style={{
                      fontFamily: clay.font.display,
                      color: wp.ink,
                      letterSpacing: "-0.5px",
                      fontSize: "26px",
                      lineHeight: 1.15,
                      marginBottom: space.s8,
                    }}
                  >
                    {wp.title}
                  </h3>
                  <p
                    style={{
                      ...typography.sizes.t14,
                      color: wp.muted,
                      marginBottom: space.s16,
                      fontStyle: "italic",
                    }}
                  >
                    {wp.titleNo}
                  </p>
                  <p
                    style={{
                      ...typography.sizes.t16,
                      color: wp.ink,
                      lineHeight: 1.55,
                      marginBottom: "auto",
                      opacity: 0.92,
                    }}
                  >
                    {wp.body}
                  </p>
                  <p
                    style={{
                      ...typography.sizes.t12,
                      color: wp.muted,
                      marginTop: space.s24,
                    }}
                  >
                    Ledet av{" "}
                    <span style={{ color: wp.ink, fontWeight: 600 }}>{wp.lead}</span>
                    <span> · {wp.institution}</span>
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Partners ────────────────────────────────────────── */}
        <section>
          <div style={{ ...container, ...sectionPad }}>
            <p style={{ ...eyebrow, marginBottom: space.s16 }}>Partnere</p>
            <h2 style={{ marginBottom: space.s40, maxWidth: "22ch" }}>
              Et tverrfaglig konsortium på tvers av forskning, design og kommune.
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: space.s16,
              }}
            >
              {PARTNERS.map((p) => (
                <Card key={p.name} padding="md">
                  <p
                    style={{
                      fontFamily: clay.font.body,
                      fontSize: "18px",
                      fontWeight: 600,
                      color: clay.colors.ink,
                      marginBottom: space.s4,
                      lineHeight: 1.3,
                    }}
                  >
                    {p.name}
                  </p>
                  <p style={{ ...typography.sizes.t14, color: clay.colors.muted }}>{p.role}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── People ─────────────────────────────────────────── */}
        <section style={{ background: clay.colors.surfaceCard }}>
          <div style={{ ...container, ...sectionPad }}>
            <p style={{ ...eyebrow, marginBottom: space.s16 }}>Prosjektgruppe</p>
            <h2 style={{ marginBottom: space.s24, maxWidth: "22ch" }}>
              Forskere, designere og kommunale partnere.
            </h2>
            <p
              style={{
                ...typography.sizes.t18,
                color: clay.colors.muted,
                maxWidth: "58ch",
                marginBottom: space.s48,
                lineHeight: 1.55,
              }}
            >
              Prosjektet drives av et team på tvers av OsloMet, Universitetet i Oslo, Durham
              University og Comte Bureau, i tett samarbeid med Bydel Alna og Bydel Søndre
              Nordstrand.
            </p>
            <People />
          </div>
        </section>

        {/* ── Contact CTA band ────────────────────────────────── */}
        <section>
          <div style={{ ...container, padding: `${space.s96} ${space.s24}` }}>
            <div
              style={{
                background: clay.colors.surfaceSoft,
                borderRadius: "var(--clay-radius-xl)",
                padding: "80px 64px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: space.s48,
                alignItems: "center",
              }}
            >
              <div>
                <p style={{ ...eyebrow, marginBottom: space.s16 }}>Kontakt</p>
                <h2 style={{ fontSize: "40px", lineHeight: 1.1, letterSpacing: "-1px", marginBottom: space.s16, maxWidth: "16ch" }}>
                  Vil du vite mer, eller samarbeide?
                </h2>
                <p style={{ ...typography.sizes.t18, color: clay.colors.body, lineHeight: 1.55, maxWidth: "48ch" }}>
                  Ta kontakt med prosjektledelsen eller plattformteamet.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: space.s16 }}>
                <ContactCard
                  label="Prosjektleder (PI)"
                  name="Marit Haldar"
                  org="OsloMet"
                  email="mariha@oslomet.no"
                />
                <ContactCard
                  label="Plattform · WP4"
                  name="Øystein Evensen"
                  org="Comte Bureau"
                  email="oystein@comte.no"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer (cream — NOT dark, per Clay system rule) ── */}
        <footer
          style={{
            background: clay.colors.surfaceSoft,
            color: clay.colors.body,
            fontFamily: clay.font.body,
          }}
        >
          <div
            style={{
              maxWidth: "1280px",
              margin: "0 auto",
              padding: `80px ${space.s24} ${space.s40}`,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: space.s40,
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: clay.font.display,
                  fontSize: "32px",
                  fontWeight: 500,
                  letterSpacing: "-0.5px",
                  marginBottom: space.s16,
                  color: clay.colors.ink,
                }}
              >
                safe@home
              </p>
              <p
                style={{
                  ...typography.sizes.t14,
                  color: clay.colors.body,
                  maxWidth: "32ch",
                  lineHeight: 1.55,
                }}
              >
                Forskningsprosjekt om aldring, omsorg og tilhørighet i reformen Bo trygt hjemme.
              </p>
            </div>
            <div>
              <p style={{ ...eyebrow, marginBottom: space.s16 }}>Naviger</p>
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
                        color: clay.colors.body,
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
              <p style={{ ...eyebrow, marginBottom: space.s16 }}>Konsortium</p>
              <p style={{ ...typography.sizes.t14, color: clay.colors.body, marginBottom: space.s4 }}>
                OsloMet · UiO · Durham · Comte
              </p>
              <p style={{ ...typography.sizes.t14, color: clay.colors.muted }}>
                Bydel Alna · Bydel Søndre Nordstrand
              </p>
            </div>
          </div>
          <div
            style={{
              borderTop: `1px solid ${clay.colors.hairline}`,
              padding: `${space.s16} ${space.s24}`,
            }}
          >
            <div
              style={{
                maxWidth: "1280px",
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
                  color: clay.colors.mutedSoft,
                }}
              >
                © 2026 SAFE@HOME-konsortiet
              </p>
              <Link
                href="/login"
                style={{
                  ...typography.sizes.t12,
                  color: clay.colors.muted,
                  textDecoration: "none",
                  borderBottom: `1px dashed ${clay.colors.hairline}`,
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

// ─── Hero illustration placeholder ───
// The Clay system calls for a commissioned 3D claymation hero artifact;
// until we have one, render a layered cream surface with abstract shapes
// in the brand palette as a tasteful stand-in.
function HeroIllustration() {
  return (
    <div
      aria-hidden
      style={{
        background: clay.colors.surfaceCard,
        borderRadius: "var(--clay-radius-xl)",
        aspectRatio: "5 / 5",
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${clay.colors.hairline}`,
      }}
    >
      {/* Floating blobs in Clay palette to evoke a tactile 3D scene */}
      <div
        style={{
          position: "absolute",
          width: "60%",
          aspectRatio: "1",
          top: "12%",
          left: "8%",
          borderRadius: "50%",
          background: clay.colors.peach,
          filter: "blur(0.5px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "45%",
          aspectRatio: "1",
          bottom: "10%",
          right: "10%",
          borderRadius: "50%",
          background: clay.colors.lavender,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "30%",
          aspectRatio: "1",
          top: "45%",
          left: "45%",
          borderRadius: "50%",
          background: clay.colors.mint,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "auto 0 0 0",
          height: "30%",
          background:
            `linear-gradient(to top, ${clay.colors.surfaceStrong}, transparent)`,
        }}
      />
    </div>
  );
}

function ContactCard({
  label,
  name,
  org,
  email,
}: {
  label: string;
  name: string;
  org: string;
  email: string;
}) {
  return (
    <div
      style={{
        background: clay.colors.canvas,
        border: `1px solid ${clay.colors.hairline}`,
        borderRadius: "var(--clay-radius-lg)",
        padding: space.s24,
      }}
    >
      <p style={{ ...eyebrow, marginBottom: space.s8 }}>{label}</p>
      <p
        style={{
          fontFamily: clay.font.body,
          fontSize: "20px",
          fontWeight: 600,
          color: clay.colors.ink,
          marginBottom: space.s4,
        }}
      >
        {name}
      </p>
      <p style={{ ...typography.sizes.t14, color: clay.colors.muted, marginBottom: space.s12 }}>
        {org}
      </p>
      <a
        href={`mailto:${email}`}
        style={{
          ...typography.sizes.t14,
          color: clay.colors.ink,
          textDecoration: "underline",
          textUnderlineOffset: "4px",
          fontWeight: 500,
        }}
      >
        {email}
      </a>
    </div>
  );
}
