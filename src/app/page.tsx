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

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

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
    hint: "WHERE",
  },
  {
    href: "/frictions",
    title: "Care frictions",
    line: "How systemic mechanisms interrelate",
    hint: "HOW IT FAILS",
  },
  {
    href: "/qualities",
    title: "Care qualities",
    line: "How people actually live and cope",
    hint: "HOW THEY LIVE",
  },
  {
    href: "/solutions",
    title: "Design solutions",
    line: "From observation to intervention",
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
          background: "#f9f9f9",
          color: "#2c2c2c",
          fontFamily: FONT_STACK,
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
              color: "#808080",
              marginBottom: 24,
            }}
          >
            A research platform · 2026 — 2029
          </p>
          <h1
            style={{
              fontSize: "clamp(48px, 8vw, 96px)",
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              marginBottom: 24,
              color: "#2a2859",
            }}
          >
            safe@home
          </h1>
          <p
            style={{
              fontSize: "clamp(22px, 3vw, 30px)",
              fontWeight: 500,
              lineHeight: 1.3,
              color: "#2a2859",
              marginBottom: 32,
              maxWidth: 680,
            }}
          >
            Technologies of care for aging migrants.
          </p>
          <p
            style={{
              fontSize: 20,
              lineHeight: 1.7,
              color: "#2c2c2c",
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
              gap: 8,
              padding: "16px 24px",
              background: "#2a2859",
              color: "#ffffff",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Explore the map
            <span aria-hidden>→</span>
          </Link>
        </section>

        {/* ─── Four ways to explore ─── */}
        <section
          style={{
            background: "#ffffff",
            borderTop: "1px solid #e6e6e6",
            borderBottom: "1px solid #e6e6e6",
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
                color: "#808080",
                marginBottom: 16,
              }}
            >
              Four ways to explore
            </p>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                color: "#2a2859",
                marginBottom: 48,
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
                    background: "#f9f9f9",
                    border: "1px solid #e6e6e6",
                    borderRadius: 8,
                    padding: 32,
                    textDecoration: "none",
                    color: "#2c2c2c",
                    position: "relative",
                    overflow: "hidden",
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
                      background: "#2a2859",
                    }}
                  />
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      color: "#1f42aa",
                      marginBottom: 16,
                    }}
                  >
                    {entry.hint}
                  </p>
                  <h3
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      lineHeight: 1.2,
                      marginBottom: 8,
                      color: "#2a2859",
                    }}
                  >
                    {entry.title}
                  </h3>
                  <p style={{ fontSize: 14, lineHeight: 1.5, color: "#666666" }}>
                    {entry.line}
                  </p>
                  <span
                    aria-hidden
                    style={{
                      display: "inline-block",
                      marginTop: 24,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#1f42aa",
                    }}
                  >
                    Open →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─── About the project ─── */}
        <section
          style={{
            background: "#f9f9f9",
            borderBottom: "1px solid #e6e6e6",
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
                color: "#808080",
                marginBottom: 16,
              }}
            >
              About the project
            </p>
            <h2
              style={{
                fontSize: "clamp(30px, 4.5vw, 44px)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                color: "#2a2859",
                marginBottom: 32,
                maxWidth: 760,
              }}
            >
              A research platform for the Bo Trygt Hjemme reform.
            </h2>

            <div style={{ maxWidth: 680 }}>
              <p
                style={{
                  fontSize: 19,
                  lineHeight: 1.7,
                  color: "#2c2c2c",
                  marginBottom: 24,
                }}
              >
                SAFE@HOME is a collaborative research project (2026 — 2029)
                between OsloMet, the University of Oslo, Durham University,
                Comte Bureau, and three municipalities: Alna and S&oslash;ndre
                Nordstrand in Oslo, and Skien in Telemark.
              </p>
              <p
                style={{
                  fontSize: 19,
                  lineHeight: 1.7,
                  color: "#2c2c2c",
                  marginBottom: 24,
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
                  fontSize: 19,
                  lineHeight: 1.7,
                  color: "#666666",
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
                gap: 16,
              }}
            >
              {WORK_PACKAGES.map((wp) => (
                <div
                  key={wp.code}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e6e6e6",
                    borderRadius: 8,
                    padding: 24,
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.12em",
                      color: "#1f42aa",
                      marginBottom: 8,
                    }}
                  >
                    {wp.code}
                  </p>
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#2a2859",
                      marginBottom: 8,
                    }}
                  >
                    {wp.title}
                  </h3>
                  <p style={{ fontSize: 14, lineHeight: 1.55, color: "#666666" }}>
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
            background: "#ffffff",
            borderBottom: "1px solid #e6e6e6",
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
                color: "#808080",
                marginBottom: 16,
              }}
            >
              Three scales
            </p>
            <h2
              style={{
                fontSize: "clamp(30px, 4.5vw, 44px)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                color: "#2a2859",
                marginBottom: 16,
                maxWidth: 760,
              }}
            >
              From bedroom to city hall.
            </h2>
            <p
              style={{
                fontSize: 19,
                lineHeight: 1.7,
                color: "#666666",
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
                    background: "#f9f9f9",
                    border: "1px solid #e6e6e6",
                    borderRadius: 8,
                    padding: 32,
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      color: "#1f42aa",
                      marginBottom: 8,
                    }}
                  >
                    {s.label}
                  </p>
                  <h3
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      color: "#2a2859",
                      marginBottom: 16,
                    }}
                  >
                    {s.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 16,
                      lineHeight: 1.65,
                      color: "#2c2c2c",
                    }}
                  >
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Care frictions ─── */}
        <section
          style={{
            background: "#f9f9f9",
            borderBottom: "1px solid #e6e6e6",
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
                color: "#808080",
                marginBottom: 16,
              }}
            >
              Care frictions
            </p>
            <h2
              style={{
                fontSize: "clamp(30px, 4.5vw, 44px)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                color: "#2a2859",
                marginBottom: 16,
                maxWidth: 760,
              }}
            >
              Seven ways the system collides with reality.
            </h2>
            <p
              style={{
                fontSize: 19,
                lineHeight: 1.7,
                color: "#666666",
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
                gap: 16,
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
                      gap: 16,
                      padding: 24,
                      background: "#ffffff",
                      border: "1px solid #e6e6e6",
                      borderRadius: 8,
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
                          fontSize: 18,
                          fontWeight: 600,
                          color: "#2a2859",
                          marginBottom: 4,
                        }}
                      >
                        {val.label}
                      </p>
                      <p style={{ fontSize: 14, lineHeight: 1.5, color: "#666666" }}>
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
            background: "#ffffff",
            borderBottom: "1px solid #e6e6e6",
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
                color: "#808080",
                marginBottom: 16,
              }}
            >
              Care qualities
            </p>
            <h2
              style={{
                fontSize: "clamp(30px, 4.5vw, 44px)",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.02em",
                color: "#2a2859",
                marginBottom: 16,
                maxWidth: 760,
              }}
            >
              How people actually live and cope.
            </h2>
            <p
              style={{
                fontSize: 19,
                lineHeight: 1.7,
                color: "#666666",
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
                gap: 16,
              }}
            >
              {(Object.entries(QUALITIES) as [CareQuality, (typeof QUALITIES)[CareQuality]][]).map(
                ([key, val]) => (
                  <div
                    key={key}
                    style={{
                      padding: 24,
                      background: "#f9f9f9",
                      border: "1px solid #e6e6e6",
                      borderRadius: 8,
                      borderLeft: `4px solid ${val.color}`,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 17,
                        fontWeight: 600,
                        color: "#2a2859",
                        marginBottom: 4,
                      }}
                    >
                      {val.label}
                    </p>
                    <p style={{ fontSize: 13, lineHeight: 1.5, color: "#666666" }}>
                      {QUALITY_COPY[key]}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        {/* ─── Final CTA ─── */}
        <section
          style={{
            background: "#2a2859",
            color: "#ffffff",
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
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                marginBottom: 24,
                color: "#ffffff",
              }}
            >
              Ready to explore?
            </h2>
            <p
              style={{
                fontSize: 19,
                lineHeight: 1.65,
                color: "#b3f5ff",
                maxWidth: 560,
                margin: "0 auto 40px",
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
                gap: 8,
                padding: "16px 24px",
                background: "#ffffff",
                color: "#2a2859",
                borderRadius: 8,
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
                style={{ color: "#ffffff", textDecoration: "underline", opacity: 0.9 }}
              >
                About
              </Link>
              <Link
                href="/reading-room"
                style={{ color: "#ffffff", textDecoration: "underline", opacity: 0.9 }}
              >
                Reading Room
              </Link>
              <Link
                href="/for-municipalities"
                style={{ color: "#ffffff", textDecoration: "underline", opacity: 0.9 }}
              >
                For Municipalities
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Footer ─── */}
        <footer
          style={{
            background: "#f2f2f2",
            borderTop: "1px solid #e6e6e6",
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
                  color: "#808080",
                  marginBottom: 8,
                }}
              >
                Research partners
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#2c2c2c" }}>
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
                  color: "#808080",
                  marginBottom: 8,
                }}
              >
                Municipalities
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#2c2c2c" }}>
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
                  color: "#808080",
                  marginBottom: 8,
                }}
              >
                Project
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "#666666" }}>
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
