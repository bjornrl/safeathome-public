import type { Metadata } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "About — safe@home",
  description: "About the safe@home research project.",
};

export default function AboutPage() {
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
          About
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
          About the project
        </h1>
        <p
          style={{
            fontSize: 19,
            lineHeight: 1.7,
            color: "#2C2A25",
            marginBottom: 20,
          }}
        >
          SAFE@HOME is a collaborative research project (2026–2029) investigating
          how homecare services can adapt to Norway&rsquo;s growing aging
          immigrant population. It combines ethnographic fieldwork, policy
          analysis, and co-design with residents, care workers, and municipalities.
        </p>
        <p
          style={{
            fontSize: 19,
            lineHeight: 1.7,
            color: "#7A756B",
            marginBottom: 20,
          }}
        >
          This site is a living research platform — stories, connections, and
          design responses are added as the work unfolds. More documentation
          will appear here soon.
        </p>
      </main>
    </>
  );
}
