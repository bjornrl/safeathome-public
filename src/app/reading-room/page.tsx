import type { Metadata } from "next";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Reading Room — safe@home",
  description: "Publications, policy briefs, and toolkits from the safe@home project.",
};

export default function ReadingRoomPage() {
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
          Reading room
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
          Publications &amp; resources
        </h1>
        <p
          style={{
            fontSize: 19,
            lineHeight: 1.7,
            color: "#7A756B",
          }}
        >
          Research papers, policy briefs, teaching materials, and practice
          guides will be collected here as the project produces them.
        </p>
      </main>
    </>
  );
}
