import Link from "next/link";
import type { Metadata } from "next";
import { EXPLORE_MAP_ENABLED } from "@/lib/feature-flags";
import ExplorePageClient from "./ExplorePageClient";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Utforsk · SAFE@HOME",
  description: "Interaktivt kart over innsikter fra feltarbeidet.",
};

function ExploreDisabled() {
  return (
    <>
      <Nav variant="minimal" />
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "96px 24px",
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#fffaf0",
        }}
      >
        <div style={{ maxWidth: "42ch", textAlign: "center" }}>
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "#6a6a6a",
              marginBottom: "16px",
            }}
          >
            Midlertidig utilgjengelig
          </p>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 600,
              letterSpacing: "-0.5px",
              color: "#0a0a0a",
              margin: "0 0 16px",
              lineHeight: 1.15,
            }}
          >
            Kartvisningen er deaktivert
          </h1>
          <p style={{ fontSize: "16px", lineHeight: 1.6, color: "#3a3a3a", margin: "0 0 24px" }}>
            Utforsk-kartet er skjult fra admin-menyen inntil videre. Innholdet ligger fortsatt
            lagret — du kan jobbe videre i innholdsredigering og søk.
          </p>
          <Link
            href="/admin"
            style={{
              display: "inline-block",
              fontSize: "14px",
              fontWeight: 600,
              color: "#0a0a0a",
              textDecoration: "underline",
              textUnderlineOffset: "4px",
            }}
          >
            Gå til innholdsredigering
          </Link>
        </div>
      </main>
    </>
  );
}

export default function ExplorePage() {
  if (!EXPLORE_MAP_ENABLED) {
    return <ExploreDisabled />;
  }

  return <ExplorePageClient />;
}
