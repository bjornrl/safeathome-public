import type { Metadata } from "next";
import Nav from "@/components/Nav";

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

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
          fontFamily: FONT_STACK,
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: "#808080",
            marginBottom: 16,
          }}
        >
          About
        </p>
        <h1
          style={{
            fontSize: 44,
            fontWeight: 700,
            lineHeight: 1.1,
            color: "#2a2859",
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
            color: "#2c2c2c",
            marginBottom: 24,
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
            color: "#666666",
            marginBottom: 24,
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
