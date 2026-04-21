import type { Metadata } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "For Municipalities — safe@home",
  description: "Resources for municipalities and care service providers.",
};

export default function ForMunicipalitiesPage() {
  return (
    <>
      <Nav />
      <main
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "80px 24px 96px",
          fontFamily: "var(--font-source-serif)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-dm-sans)",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: "#A09A8E",
            marginBottom: 12,
          }}
        >
          For municipalities
        </p>
        <h1
          style={{
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.1,
            color: "#2C2A25",
            marginBottom: 24,
            letterSpacing: "-0.02em",
          }}
        >
          Working with us
        </h1>
        <p
          style={{
            fontSize: 19,
            lineHeight: 1.7,
            color: "#2C2A25",
            marginBottom: 20,
          }}
        >
          We partner with Alna District, S&oslash;ndre Nordstrand, and Skien
          Municipality. Practical briefings, toolkits, and co-design invitations
          for municipal staff will live here.
        </p>
        <p
          style={{
            fontSize: 19,
            lineHeight: 1.7,
            color: "#7A756B",
          }}
        >
          If your municipality is interested in adapting these findings to
          local services, get in touch through the project lead.
        </p>
      </main>
    </>
  );
}
