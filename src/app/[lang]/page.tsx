import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import People from "@/components/People";
import { Button, Card } from "@/components/ui";
import { clay, space, typography } from "@/lib/design-tokens";
import { isLocale, withLocale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionary";
import { getTaxonomy } from "@/lib/i18n/taxonomy";

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = await getDictionary(lang);
  return { title: t.home.metaTitle, description: t.home.metaDescription };
}

// Each WP gets a saturated Clay feature-card color in the prescribed rotation
// (pink → teal → lavender → peach) — see .claude/design-clay.md "Iteration Guide".
// Titles come from the taxonomy; only colour, lead and institution live here.
const WORK_PACKAGE_CARDS: {
  code: string;
  key: keyof Dictionary["home"]["workPackages"];
  lead: string;
  institution: string;
  bg: string;
  ink: string;
  muted: string;
}[] = [
    {
      code: "WP1",
      key: "wp1",
      lead: "Carolina Rau",
      institution: "UiO",
      bg: clay.colors.pink,
      ink: clay.colors.onPrimary,
      muted: "rgba(255, 255, 255, 0.78)",
    },
    {
      code: "WP2",
      key: "wp2",
      lead: "Jonas Debesay",
      institution: "OsloMet",
      bg: clay.colors.teal,
      ink: clay.colors.onPrimary,
      muted: "rgba(255, 255, 255, 0.7)",
    },
    {
      code: "WP3",
      key: "wp3",
      lead: "Erika Gubrium",
      institution: "OsloMet",
      bg: clay.colors.lavender,
      ink: clay.colors.ink,
      muted: "rgba(10, 10, 10, 0.65)",
    },
    {
      code: "WP4",
      key: "wp4",
      lead: "Alejandro Miranda Nieto · Øystein Evensen",
      institution: "OsloMet · Comte Bureau",
      bg: clay.colors.peach,
      ink: clay.colors.ink,
      muted: "rgba(10, 10, 10, 0.65)",
    },
  ];

type PartnerTitleKey = keyof Dictionary["home"]["partnerTitles"];
type PartnerRoleKey = keyof Dictionary["home"]["partnerRoles"];

// Names, addresses, logos and institutions are proper nouns and stay as they
// are; only roles and job titles are translated.
const PARTNERS: {
  name: string;
  role: PartnerRoleKey;
  logo?: string;
  contacts?: { name: string; title: PartnerTitleKey; email: string }[];
}[] = [
    {
      name: "OsloMet",
      role: "lead",
      logo: "/images/collaborator_logos/oslomet_gul.png",
      contacts: [
        { name: "Marit Haldar", title: "pi", email: "mariha@oslomet.no" },
        { name: "Jonas Debesay", title: "wp2Lead", email: "jonasd@oslomet.no" },
        { name: "Erika Gubrium", title: "wp3Lead", email: "erikgu@oslomet.no" },
        { name: "Alejandro Miranda Nieto", title: "wp4CoLead", email: "alejandr@oslomet.no" },
        { name: "Carolina Borges Rau Steuernagel", title: "platform", email: "caste4774@oslomet.no" },
      ],
    },
    {
      name: "Universitetet i Oslo (UiO)",
      role: "research",
      logo: "/images/collaborator_logos/UiO.png",
      contacts: [
        { name: "Carolina Borges Rau Steuernagel", title: "wp1Lead", email: "c.b.r.steuernagel@medisin.uio.no" },
        { name: "Tony Joakim Ananiassen Sandset", title: "wp1Member", email: "t.j.a.sandset@medisin.uio.no" },
      ],
    },
    {
      name: "Durham University",
      role: "research",
      logo: "/images/collaborator_logos/Durham_Logo.png",
      contacts: [
        { name: "Tiago Moreira", title: "researcher", email: "https://www.durham.ac.uk/staff/tiago-moreira/" },
      ],
    },
    {
      name: "Bydel Alna, Oslo",
      role: "field",
      logo: "/images/collaborator_logos/Oslo-logo-sort-RGB.png",
      contacts: [
        { name: "Elisabeth Lie Arulnesar", title: "municipalPartner", email: "elisabeth.lie@bal.oslo.kommune.no" },
        { name: "Aina Westby", title: "municipalPartner", email: "aina.westby@bal.oslo.kommune.no" },
      ],
    },
    {
      name: "Bydel Søndre Nordstrand, Oslo",
      role: "field",
      logo: "/images/collaborator_logos/Oslo-logo-sort-RGB.png",
      contacts: [
        { name: "Bodil Johansen Ananiassen", title: "municipalPartner", email: "bodil.ananiassen@bsn.oslo.kommune.no" },
        { name: "Gudrun Barlund Broback", title: "municipalPartner", email: "gudrunbarlund.broback@bsn.oslo.kommune.no" },
        { name: "Lillian Rognstad", title: "municipalPartner", email: "lillian.rognstad@bsn.oslo.kommune.no" },
        { name: "Linda Mari Tahir", title: "municipalPartner", email: "linda.mari.tahir@bsn.oslo.kommune.no" },
        { name: "Ninni Marie Staff Ingjær Handal", title: "municipalPartner", email: "ninni.handal@bsn.oslo.kommune.no" },
        { name: "Dijana Vesovic", title: "municipalPartner", email: "dijana.vesovic@bsn.oslo.kommune.no" },
      ],
    },
    {
      name: "comte",
      role: "design",
      logo: "/images/collaborator_logos/Comte_logo_red.png",
      contacts: [
        { name: "Øystein Evensen", title: "wp4Platform", email: "oystein@comte.no" },
        { name: "Bjørn Ravlo-Leira", title: "platform", email: "bjorn@comte.no" },
      ],
    },
  ];

const FIELD_SITES = [
  { place: "Alna", region: "Oslo" },
  { place: "Søndre Nordstrand", region: "Oslo" },
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

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = await getDictionary(lang);
  const tax = getTaxonomy(lang);
  const href = (path: string) => withLocale(lang, path);

  const footerLinks = [
    { href: href("/about"), label: t.home.footerLinks.about },
    { href: href("/welfare-tech"), label: t.home.footerLinks.welfareTech },
    { href: href("/for-municipalities"), label: t.home.footerLinks.municipalities },
  ];

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
                gap: space.s24,
                alignItems: "center",
              }}
            >
              <div>
                <p style={{ ...eyebrow, marginBottom: space.s24 }}>{t.home.heroEyebrow}</p>
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
                  {t.home.heroLead}
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
                  {t.home.heroBody}
                </p>
                <Link href={href("/about")} style={{ textDecoration: "none" }}>
                  <Button variant="primary" size="lg">{t.home.heroCta}</Button>
                </Link>
              </div>

              <HeroIllustration alt={t.home.heroIllustrationAlt} />
            </div>
          </div>
        </section>

        {/* ── About ───────────────────────────────────────────── */}
        <section style={{ background: clay.colors.surfaceCard }}>
          <div style={{ ...narrow, ...sectionPad }}>
            <p style={{ ...eyebrow, marginBottom: space.s16 }}>{t.home.aboutEyebrow}</p>
            <h2 style={{ marginBottom: space.s32, maxWidth: "20ch" }}>{t.home.aboutHeading}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: space.s24, maxWidth: "60ch" }}>
              {t.home.aboutParagraphs.map((paragraph, i) => (
                <p key={i} style={{ ...typography.sizes.t18, color: clay.colors.body, lineHeight: 1.6 }}>
                  {paragraph}
                </p>
              ))}
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
                <p style={{ ...eyebrow, marginBottom: space.s8 }}>{t.home.factPeriod}</p>
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
                <p style={{ ...eyebrow, marginBottom: space.s12 }}>{t.home.factFieldSites}</p>
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
                <p style={{ ...eyebrow, marginBottom: space.s12 }}>{t.home.factFunding}</p>
                <p style={{ ...typography.sizes.t14, color: clay.colors.muted, lineHeight: 1.5 }}>
                  {t.home.fundingBody}{" "}
                  <a
                    href="https://www.forskningsradet.no/nyheter/2025/277-millioner-kroner-til-helseforskning-og-helseinnovasjon/"
                    style={{ color: clay.colors.ink, textDecoration: "underline" }}
                  >
                    SAFE@HOME
                  </a>
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* ── Work packages ──────────────────────────────────── */}
        <section style={{ background: clay.colors.surfaceSoft }}>
          <div style={{ ...container, ...sectionPad }}>
            <p style={{ ...eyebrow, marginBottom: space.s16 }}>{t.home.wpEyebrow}</p>
            <h2 style={{ marginBottom: space.s24, maxWidth: "22ch" }}>{t.home.wpHeading}</h2>
            <p
              style={{
                ...typography.sizes.t18,
                color: clay.colors.muted,
                maxWidth: "58ch",
                marginBottom: space.s48,
                lineHeight: 1.55,
              }}
            >
              {t.home.wpLead}
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: space.s24,
              }}
            >
              {WORK_PACKAGE_CARDS.map((wp) => (
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
                      marginBottom: space.s16,
                    }}
                  >
                    {/* Strip the "WP1: " prefix — the code already sits above. */}
                    {tax.wpLabels[wp.key].label.replace(/^WP\d:\s*/, "")}
                  </h3>
                  <p
                    style={{
                      ...typography.sizes.t16,
                      color: wp.ink,
                      lineHeight: 1.55,
                      marginBottom: "auto",
                      opacity: 0.92,
                    }}
                  >
                    {t.home.workPackages[wp.key]}
                  </p>
                  <p
                    style={{
                      ...typography.sizes.t12,
                      color: wp.muted,
                      marginTop: space.s24,
                    }}
                  >
                    {t.home.wpLedBy}{" "}
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
            <p style={{ ...eyebrow, marginBottom: space.s16 }}>{t.home.partnersEyebrow}</p>
            <h2 style={{ marginBottom: space.s40, maxWidth: "22ch" }}>{t.home.partnersHeading}</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: space.s16,
              }}
            >
              {PARTNERS.map((p) => (
                <Card key={p.name} padding="md">
                  {p.logo && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        height: "56px",
                        marginBottom: space.s16,
                      }}
                    >
                      <img
                        src={p.logo}
                        alt={`${p.name} logo`}
                        style={{
                          maxHeight: "100%",
                          maxWidth: "100%",
                          width: "auto",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  )}
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
                  <p style={{ ...typography.sizes.t14, color: clay.colors.muted, marginBottom: p.contacts?.length ? space.s16 : 0 }}>
                    {t.home.partnerRoles[p.role]}
                  </p>
                  {p.contacts && p.contacts.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: space.s12,
                        paddingTop: space.s16,
                        borderTop: `1px solid ${clay.colors.hairline}`,
                      }}
                    >
                      {p.contacts.map((c) => (
                        <div key={c.email}>
                          <p
                            style={{
                              ...typography.sizes.t14,
                              fontWeight: 600,
                              color: clay.colors.ink,
                              marginBottom: space.s4,
                              lineHeight: 1.35,
                            }}
                          >
                            {c.name}
                          </p>
                          <p
                            style={{
                              ...typography.sizes.t12,
                              color: clay.colors.muted,
                              marginBottom: space.s4,
                              lineHeight: 1.4,
                            }}
                          >
                            {t.home.partnerTitles[c.title]}
                          </p>
                          <a
                            href={`mailto:${c.email}`}
                            style={{
                              ...typography.sizes.t14,
                              color: clay.colors.ink,
                              textDecoration: "underline",
                              textUnderlineOffset: "4px",
                              wordBreak: "break-word",
                            }}
                          >
                            {c.email}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── People ─────────────────────────────────────────── */}
        <section style={{ background: clay.colors.surfaceCard }}>
          <div style={{ ...container, ...sectionPad }}>
            <p style={{ ...eyebrow, marginBottom: space.s16 }}>{t.home.peopleEyebrow}</p>
            <h2 style={{ marginBottom: space.s24, maxWidth: "22ch" }}>{t.home.peopleHeading}</h2>
            <p
              style={{
                ...typography.sizes.t18,
                color: clay.colors.muted,
                maxWidth: "58ch",
                marginBottom: space.s48,
                lineHeight: 1.55,
              }}
            >
              {t.home.peopleLead}
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
                <p style={{ ...eyebrow, marginBottom: space.s16 }}>{t.home.contactEyebrow}</p>
                <h2 style={{ fontSize: "40px", lineHeight: 1.1, letterSpacing: "-1px", marginBottom: space.s16, maxWidth: "16ch" }}>
                  {t.home.contactHeading}
                </h2>
                <p style={{ ...typography.sizes.t18, color: clay.colors.body, lineHeight: 1.55, maxWidth: "48ch" }}>
                  {t.home.contactLead}
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: space.s16 }}>
                <ContactCard
                  label={t.home.partnerTitles.pi}
                  name="Marit Haldar"
                  org="OsloMet"
                  email="mariha@oslomet.no"
                />
                <ContactCard
                  label={t.home.partnerTitles.platform}
                  name="Carolina Borges Rau Steuernagel"
                  org="OsloMet"
                  email="caste4774@oslomet.no"
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
                {t.home.footerBlurb}
              </p>
            </div>
            <div>
              <p style={{ ...eyebrow, marginBottom: space.s16 }}>{t.home.footerNavigate}</p>
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
                {footerLinks.map((link) => (
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
              <p style={{ ...eyebrow, marginBottom: space.s16 }}>{t.home.footerConsortium}</p>
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
                {t.home.footerCopyright}
              </p>
              <Link
                href={href("/login")}
                style={{
                  ...typography.sizes.t12,
                  color: clay.colors.muted,
                  textDecoration: "none",
                  borderBottom: `1px dashed ${clay.colors.hairline}`,
                  paddingBottom: "2px",
                }}
              >
                {t.nav.signInTeam}
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

// ─── Hero illustration ───
function HeroIllustration({ alt }: { alt: string }) {
  return (
    <div
      style={{
        borderRadius: "var(--clay-radius-xl)",
        aspectRatio: "5 / 5",
        position: "relative",
        overflow: "visible",
      }}
    >
      <img
        style={{ width: "100%", height: "100%", zIndex: 10, position: "relative" }}
        src="/images/Safeathome_illustration_with_color.png"
        alt={alt}
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
