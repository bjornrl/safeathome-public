import type { Metadata } from "next";
import Nav from "@/components/Nav";
import ResourceList from "@/components/ResourceList";
import { getResources } from "@/lib/queries";
import { READING_ROOM_TYPES } from "@/lib/seed-resources";

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

export const metadata: Metadata = {
  title: "Reading Room — safe@home",
  description:
    "Publications, policy briefs, and teaching materials from the safe@home project and allied researchers.",
};

export const revalidate = 60;

export default async function ReadingRoomPage() {
  const resources = await getResources(READING_ROOM_TYPES);

  return (
    <>
      <Nav />
      <main
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "72px 24px 96px",
          fontFamily: FONT_STACK,
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
          Reading room
        </p>
        <h1
          style={{
            fontSize: "clamp(38px, 6vw, 60px)",
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "#2a2859",
            marginBottom: 24,
          }}
        >
          Publications &amp; teaching materials.
        </h1>
        <p
          style={{
            fontSize: 19,
            lineHeight: 1.7,
            color: "#666666",
            maxWidth: 680,
            marginBottom: 56,
          }}
        >
          Papers, policy briefs, and teaching guides &mdash; authored by the
          safe@home group or by researchers whose work helps us see more
          clearly. The collection grows as the project produces new writing and
          as we add the work that shaped ours.
        </p>

        <ResourceList
          resources={resources}
          emptyMessage="No publications yet. Check back once the first working papers are out."
          groupByType
        />
      </main>
    </>
  );
}
