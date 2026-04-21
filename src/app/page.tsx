import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
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
  {
    href: "/explore",
    title: "Explore the map",
    line: "Navigate from bedroom to city hall",
    accent: "#3A8A7D",
    hint: "WHERE",
  },
  {
    href: "/frictions",
    title: "Care frictions",
    line: "How systemic mechanisms interrelate",
    accent: "#9B59B6",
    hint: "HOW IT FAILS",
  },
  {
    href: "/qualities",
    title: "Care qualities",
    line: "How people actually live and cope",
    accent: "#5B6AAF",
    hint: "HOW THEY LIVE",
  },
  {
    href: "/solutions",
    title: "Design solutions",
    line: "From observation to intervention",
    accent: "#3A8A7D",
    hint: "RESPONSES",
  },
];

const SCALES_COPY = [
  {
    label: "Micro",
    title: "Inside the home",
    body: "Where care technologies meet daily life — a prayer rug beside an alarm sensor, a phone on the coffee table, a locked bathroom door.",
  },
  {
    label: "Meso",
    title: "The neighborhood",
    body: "Where services interact with people — the pharmacy that became a classroom, the mosque that doubles as a waiting room, twelve faces in three months.",
  },
  {
    label: "Macro",
    title: "The city",
    body: "Where policies ripple into households — a cancelled bus route, a digital-first application portal, a standardized assessment algorithm.",
  },
];

const WORK_PACKAGES = [
  {
    code: "WP1",
    title: "Homes & Communities",
    body: "How material spaces and social dynamics shape homecare in practice.",
  },
  {
    code: "WP2",
    title: "Health & Care Institutions",
    body: "What barriers and enablers shape service access for aging immigrants.",
  },
  {
    code: "WP3",
    title: "Transnational Contexts",
    body: "How cross-border ties affect aging in place and care coordination.",
  },
  {
    code: "WP4",
    title: "Innovation & Design",
    body: "Co-creating practical solutions with users and municipalities.",
  },
];

export default function HomePage() {
  return (
    <>
      <Nav />
      <main
        style={{
          background: "#F7F5F0",
          color: "#2C2A25",
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        {/* ─── Hero ─── */}
        <section
          style={{
            maxWidth: 960,
            margin: "0 auto",
            padding: "120px 24px 96px",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "#A09A8E",
              marginBottom: 24,
            }}
          >
            A research platform · 2026 — 2029
          </p>
          <h1
            style={{
              fontFamily: "var(--font-source-serif)",
              fontSize: "clamp(48px, 8vw, 96px)",
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              marginBottom: 24,
              color: "#2C2A25",
            }}
          >
            safe@home
          </h1>
          <p
            style={{
              fontFamily: "var(--font-source-serif)",
              fontStyle: "italic",
              fontSize: "clamp(22px, 3vw, 30px)",
              lineHeight: 1.3,
              color: "#7A756B",
              marginBottom: 32,
              maxWidth: 680,
            }}
          >
            Technologies of care for aging migrants.
          </p>
          <p
            style={{
              fontFamily: "var(--font-source-serif)",
              fontSize: 20,
              lineHeight: 1.7,
              color: "#2C2A25",
              maxWidth: 680,
              marginBottom: 40,
            }}
          >
            What happens when Norway&rsquo;s homecare reform meets the reality of
            transnational households? This platform maps the experiences of
            aging immigrants navigating care, technology, and belonging across
            three scales &mdash; from the intimacy of a bedroom to the policies
            that shape a city.
          </p>
          <Link
            href="/explore"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "16px 28px",
              background: "#C45D3E",
              color: "#fff",
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 600,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(196,93,62,.25)",
            }}
          >
            Explore the map
            <span aria-hidden>→</span>
          </Link>
        </section>

        {/* ─── Four ways to explore ─── */}
        <section
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "32px 24px 96px",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "#A09A8E",
              marginBottom: 12,
            }}
          >
            Four ways to explore
          </p>
          <h2
            style={{
              fontFamily: "var(--font-source-serif)",
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "#2C2A25",
              marginBottom: 40,
              maxWidth: 720,
            }}
          >
            The same stories, seen through four different lenses.
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {FOUR_ENTRIES.map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                style={{
                  display: "block",
                  background: "#fff",
                  border: "1px solid #E8E4DB",
                  borderRadius: 14,
                  padding: 28,
                  textDecoration: "none",
                  color: "#2C2A25",
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform .18s, box-shadow .18s",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: 4,
                    width: "100%",
                    background: entry.accent,
                  }}
                />
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: entry.accent,
                    marginBottom: 14,
                  }}
                >
                  {entry.hint}
                </p>
                <h3
                  style={{
                    fontFamily: "var(--font-source-serif)",
                    fontSize: 24,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    marginBottom: 10,
                    color: "#2C2A25",
                  }}
                >
                  {entry.title}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.5, color: "#7A756B" }}>
                  {entry.line}
                </p>
                <span
                  aria-hidden
                  style={{
                    display: "inline-block",
                    marginTop: 20,
                    fontSize: 14,
                    fontWeight: 600,
                    color: entry.accent,
                  }}
                >
                  Open →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── About the project ─── */}
        <section
          style={{
            background: "#EDE9E0",
            borderTop: "1px solid #E8E4DB",
            borderBottom: "1px solid #E8E4DB",
          }}
        >
          <div
            style={{
              maxWidth: 960,
              margin: "0 auto",
              padding: "96px 24px",
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "#A09A8E",
                marginBottom: 16,
              }}
            >
              About the project
            </p>
            <h2
              style={{
                fontFamily: "var(--font-source-serif)",
                fontSize: "clamp(30px, 4.5vw, 44px)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                color: "#2C2A25",
                marginBottom: 32,
                maxWidth: 760,
              }}
            >
              A research platform for the Bo Trygt Hjemme reform.
            </h2>

            <div style={{ maxWidth: 680 }}>
              <p
                style={{
                  fontFamily: "var(--font-source-serif)",
                  fontSize: 19,
                  lineHeight: 1.75,
                  color: "#2C2A25",
                  marginBottom: 20,
                }}
              >
                SAFE@HOME is a collaborative research project (2026 — 2029)
                between OsloMet, the University of Oslo, Durham University,
                Comte Bureau, and three municipalities: Alna and S&oslash;ndre
                Nordstrand in Oslo, and Skien in Telemark.
              </p>
              <p
                style={{
                  fontFamily: "var(--font-source-serif)",
                  fontSize: 19,
                  lineHeight: 1.75,
                  color: "#2C2A25",
                  marginBottom: 20,
                }}
              >
                The project investigates how homecare services can be adapted
                for Norway&rsquo;s growing aging immigrant population &mdash; a
                group whose needs, routines, and family structures often sit at
                odds with standardized care technologies and bureaucratic
                pathways.
              </p>
              <p
                style={{
                  fontFamily: "var(--font-source-serif)",
                  fontSize: 19,
                  lineHeight: 1.75,
                  color: "#7A756B",
                }}
              >
                Four work packages move from the home outward to the policy
                frame, and back again.
              </p>
            </div>

            <div
              style={{
                marginTop: 48,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 24,
              }}
            >
              {WORK_PACKAGES.map((wp) => (
                <div
                  key={wp.code}
                  style={{
                    background: "#fff",
                    border: "1px solid #E8E4DB",
                    borderRadius: 10,
                    padding: 24,
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      color: "#C45D3E",
                      marginBottom: 8,
                    }}
                  >
                    {wp.code}
                  </p>
                  <h3
                    style={{
                      fontFamily: "var(--font-source-serif)",
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#2C2A25",
                      marginBottom: 8,
                    }}
                  >
                    {wp.title}
                  </h3>
                  <p style={{ fontSize: 14, lineHeight: 1.55, color: "#7A756B" }}>
                    {wp.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Three scales ─── */}
        <section
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "96px 24px",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "#A09A8E",
              marginBottom: 16,
            }}
          >
            Three scales
          </p>
          <h2
            style={{
              fontFamily: "var(--font-source-serif)",
              fontSize: "clamp(30px, 4.5vw, 44px)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "#2C2A25",
              marginBottom: 16,
              maxWidth: 760,
            }}
          >
            From bedroom to city hall.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-source-serif)",
              fontSize: 19,
              lineHeight: 1.7,
              color: "#7A756B",
              maxWidth: 640,
              marginBottom: 48,
            }}
          >
            The same story plays out at three scales at once. Zoom in to see a
            prayer rug beside a motion sensor. Zoom out to see the budget line
            that quietly removed a bus route.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 24,
            }}
          >
            {SCALES_COPY.map((s) => (
              <div
                key={s.label}
                style={{
                  background: "#fff",
                  border: "1px solid #E8E4DB",
                  borderRadius: 14,
                  padding: 28,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "#C45D3E",
                    marginBottom: 10,
                  }}
                >
                  {s.label}
                </p>
                <h3
                  style={{
                    fontFamily: "var(--font-source-serif)",
                    fontSize: 22,
                    fontWeight: 600,
                    color: "#2C2A25",
                    marginBottom: 12,
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontFamily: "var(--font-source-serif)",
                    fontSize: 16,
                    lineHeight: 1.65,
                    color: "#2C2A25",
                  }}
                >
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Care frictions ─── */}
        <section
          style={{
            background: "#EDE9E0",
            borderTop: "1px solid #E8E4DB",
            borderBottom: "1px solid #E8E4DB",
          }}
        >
          <div
            style={{
              maxWidth: 1120,
              margin: "0 auto",
              padding: "96px 24px",
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "#A09A8E",
                marginBottom: 16,
              }}
            >
              Care frictions
            </p>
            <h2
              style={{
                fontFamily: "var(--font-source-serif)",
                fontSize: "clamp(30px, 4.5vw, 44px)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                color: "#2C2A25",
                marginBottom: 16,
                maxWidth: 760,
              }}
            >
              Seven ways the system collides with reality.
            </h2>
            <p
              style={{
                fontFamily: "var(--font-source-serif)",
                fontSize: 19,
                lineHeight: 1.7,
                color: "#7A756B",
                maxWidth: 640,
                marginBottom: 48,
              }}
            >
              Recurring patterns where well-intentioned care produces friction
              for the people it&rsquo;s meant to serve.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 12,
              }}
            >
              {(Object.entries(FRICTIONS) as [CareFriction, (typeof FRICTIONS)[CareFriction]][]).map(
                ([key, val]) => (
                  <Link
                    key={key}
                    href={`/frictions?friction=${key}`}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                      padding: 18,
                      background: "#fff",
                      border: "1px solid #E8E4DB",
                      borderRadius: 10,
                      textDecoration: "none",
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        marginTop: 6,
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: val.color,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <p
                        style={{
                          fontFamily: "var(--font-source-serif)",
                          fontSize: 18,
                          fontWeight: 600,
                          color: "#2C2A25",
                          marginBottom: 4,
                        }}
                      >
                        {val.label}
                      </p>
                      <p style={{ fontSize: 14, lineHeight: 1.5, color: "#7A756B" }}>
                        {FRICTION_COPY[key]}
                      </p>
                    </div>
                  </Link>
                ),
              )}
            </div>
          </div>
        </section>

        {/* ─── Care qualities ─── */}
        <section
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "96px 24px",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "#A09A8E",
              marginBottom: 16,
            }}
          >
            Care qualities
          </p>
          <h2
            style={{
              fontFamily: "var(--font-source-serif)",
              fontSize: "clamp(30px, 4.5vw, 44px)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "#2C2A25",
              marginBottom: 16,
              maxWidth: 760,
            }}
          >
            How people actually live and cope.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-source-serif)",
              fontSize: 19,
              lineHeight: 1.7,
              color: "#7A756B",
              maxWidth: 640,
              marginBottom: 48,
            }}
          >
            These describe the realities, strategies, and strengths of aging
            immigrants and their families &mdash; the parts of care that rarely
            make it into service logs.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
            }}
          >
            {(Object.entries(QUALITIES) as [CareQuality, (typeof QUALITIES)[CareQuality]][]).map(
              ([key, val]) => (
                <div
                  key={key}
                  style={{
                    padding: 18,
                    background: "#fff",
                    border: "1px solid #E8E4DB",
                    borderRadius: 10,
                    borderLeft: `4px solid ${val.color}`,
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-source-serif)",
                      fontSize: 17,
                      fontWeight: 600,
                      color: "#2C2A25",
                      marginBottom: 4,
                    }}
                  >
                    {val.label}
                  </p>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: "#7A756B" }}>
                    {QUALITY_COPY[key]}
                  </p>
                </div>
              ),
            )}
          </div>
        </section>

        {/* ─── Final CTA ─── */}
        <section
          style={{
            background: "#2C2A25",
            color: "#F7F5F0",
          }}
        >
          <div
            style={{
              maxWidth: 960,
              margin: "0 auto",
              padding: "96px 24px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-source-serif)",
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                marginBottom: 24,
              }}
            >
              Ready to explore?
            </h2>
            <p
              style={{
                fontFamily: "var(--font-source-serif)",
                fontSize: 19,
                lineHeight: 1.65,
                color: "#A09A8E",
                maxWidth: 560,
                margin: "0 auto 36px",
              }}
            >
              Start at the city scale and zoom in until you&rsquo;re standing in
              a living room. Or follow a friction across all seven stories it
              touches.
            </p>
            <Link
              href="/explore"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "16px 28px",
                background: "#C45D3E",
                color: "#fff",
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Open the map
              <span aria-hidden>→</span>
            </Link>

            <div
              style={{
                marginTop: 48,
                display: "flex",
                gap: 24,
                flexWrap: "wrap",
                justifyContent: "center",
                fontSize: 14,
              }}
            >
              <Link
                href="/about"
                style={{ color: "#F7F5F0", textDecoration: "none", opacity: 0.75 }}
              >
                About
              </Link>
              <Link
                href="/reading-room"
                style={{ color: "#F7F5F0", textDecoration: "none", opacity: 0.75 }}
              >
                Reading Room
              </Link>
              <Link
                href="/for-municipalities"
                style={{ color: "#F7F5F0", textDecoration: "none", opacity: 0.75 }}
              >
                For Municipalities
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer
          style={{
            background: "#F7F5F0",
            borderTop: "1px solid #E8E4DB",
            padding: "48px 24px",
          }}
        >
          <div
            style={{
              maxWidth: 960,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 32,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: "#A09A8E",
                  marginBottom: 10,
                }}
              >
                Research partners
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#2C2A25" }}>
                OsloMet
                <br />
                University of Oslo
                <br />
                Durham University
                <br />
                Comte Bureau
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: "#A09A8E",
                  marginBottom: 10,
                }}
              >
                Municipalities
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#2C2A25" }}>
                Alna District
                <br />
                S&oslash;ndre Nordstrand
                <br />
                Skien Municipality
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: "#A09A8E",
                  marginBottom: 10,
                }}
              >
                Project
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#7A756B" }}>
                safe@home · 2026 — 2029
                <br />
                Part of the Bo Trygt Hjemme reform.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
