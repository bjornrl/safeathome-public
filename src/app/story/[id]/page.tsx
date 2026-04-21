import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import { FRICTIONS, QUALITIES, SCALES } from "@/lib/constants";
import {
  getAllStories,
  getConnections,
  getDesignResponses,
  type SolutionItem,
} from "@/lib/queries";
import { STAGES } from "@/lib/seed-solutions";
import type { PublicStory } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const stories = await getAllStories();
  const story = stories.find((s) => s.id === id);
  if (!story) {
    return { title: "Story not found — safe@home" };
  }
  return {
    title: `${story.title} — safe@home`,
    description: story.body.split("\n\n")[0].slice(0, 160),
  };
}

function findLinkedResponses(
  story: PublicStory,
  responses: SolutionItem[],
): SolutionItem[] {
  const explicit = responses.filter((r) => r.source_stories.includes(story.id));
  const explicitIds = new Set(explicit.map((r) => r.id));
  const storyFrictions = new Set(story.frictions ?? []);
  const byFriction = responses.filter(
    (r) =>
      !explicitIds.has(r.id) &&
      r.frictions.some((f) => storyFrictions.has(f)),
  );
  return [...explicit, ...byFriction];
}

export default async function StoryPage({ params }: PageProps) {
  const { id } = await params;
  const [stories, connections, responses] = await Promise.all([
    getAllStories(),
    getConnections(),
    getDesignResponses(),
  ]);

  const story = stories.find((s) => s.id === id);
  if (!story) notFound();

  const related = connections.filter(
    (c) => c.from_story_id === story.id || c.to_story_id === story.id,
  );
  const linkedResponses = findLinkedResponses(story, responses);

  return (
    <>
      <Nav />
      <main
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "56px 24px 96px",
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        <Link
          href="/explore"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "#7A756B",
            textDecoration: "none",
            marginBottom: 32,
          }}
        >
          ← Back to the map
        </Link>

        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: "#A09A8E",
            marginBottom: 12,
          }}
        >
          {SCALES[story.map_scale]?.label ?? story.map_scale}
          {story.field_site && <> · {story.field_site}</>}
        </p>

        <h1
          style={{
            fontFamily: "var(--font-source-serif)",
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "#2C2A25",
            marginBottom: 24,
          }}
        >
          {story.title}
        </h1>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 36 }}>
          {story.frictions?.map((f) => (
            <Link
              key={f}
              href={`/frictions?friction=${f}`}
              style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 99,
                background: FRICTIONS[f]?.color + "18",
                color: FRICTIONS[f]?.color,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              {FRICTIONS[f]?.label}
            </Link>
          ))}
          {story.qualities?.map((q) => (
            <Link
              key={q}
              href="/qualities"
              style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 99,
                background: QUALITIES[q]?.color + "18",
                color: QUALITIES[q]?.color,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              {QUALITIES[q]?.label}
            </Link>
          ))}
        </div>

        <article>
          {story.body.split("\n\n").map((p, i) => (
            <p
              key={i}
              style={{
                fontFamily: "var(--font-source-serif)",
                fontSize: 19,
                lineHeight: 1.75,
                color: "#2C2A25",
                marginBottom: 20,
              }}
            >
              {p}
            </p>
          ))}
        </article>

        {story.author_credit && (
          <p style={{ fontSize: 12, color: "#A09A8E", marginTop: 40 }}>
            {story.author_credit}
          </p>
        )}

        {related.length > 0 && (
          <section style={{ marginTop: 56, paddingTop: 32, borderTop: "1px solid #E8E4DB" }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "#A09A8E",
                marginBottom: 14,
              }}
            >
              Connected stories
            </p>
            <div style={{ display: "grid", gap: 10 }}>
              {related.map((conn) => {
                const otherId =
                  conn.from_story_id === story.id ? conn.to_story_id : conn.from_story_id;
                const other = stories.find((s) => s.id === otherId);
                if (!other) return null;
                return (
                  <Link
                    key={conn.id}
                    href={`/story/${other.id}`}
                    style={{
                      display: "block",
                      padding: 14,
                      background: "#fff",
                      border: "1px solid #E8E4DB",
                      borderRadius: 10,
                      textDecoration: "none",
                      color: "#2C2A25",
                    }}
                  >
                    <span style={{ fontSize: 11, color: FRICTIONS[conn.friction]?.color }}>
                      {FRICTIONS[conn.friction]?.label} ({conn.connection_type})
                    </span>
                    <br />
                    <span
                      style={{
                        fontFamily: "var(--font-source-serif)",
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#2C2A25",
                      }}
                    >
                      {other.title}
                    </span>
                    {conn.description && (
                      <p style={{ fontSize: 13, color: "#7A756B", marginTop: 4 }}>
                        {conn.description}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {linkedResponses.length > 0 && (
          <section
            style={{
              marginTop: 56,
              padding: 28,
              background: "#EDE9E0",
              borderRadius: 14,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "#A09A8E",
                marginBottom: 10,
              }}
            >
              Design response
            </p>
            <h2
              style={{
                fontFamily: "var(--font-source-serif)",
                fontSize: 22,
                fontWeight: 700,
                color: "#2C2A25",
                marginBottom: 18,
              }}
            >
              How the design team is responding
            </h2>
            <div style={{ display: "grid", gap: 12 }}>
              {linkedResponses.map((r) => {
                const stage = STAGES.find((s) => s.key === r.stage);
                return (
                  <Link
                    key={r.id}
                    href="/solutions"
                    style={{
                      display: "block",
                      padding: 16,
                      background: "#fff",
                      border: "1px solid #E8E4DB",
                      borderRadius: 10,
                      textDecoration: "none",
                      color: "#2C2A25",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: stage?.color ?? "#7A756B",
                      }}
                    >
                      {stage?.label ?? r.stage}
                    </span>
                    <h3
                      style={{
                        fontFamily: "var(--font-source-serif)",
                        fontSize: 18,
                        fontWeight: 600,
                        color: "#2C2A25",
                        marginTop: 4,
                        marginBottom: 6,
                      }}
                    >
                      {r.title}
                    </h3>
                    <p style={{ fontSize: 14, lineHeight: 1.55, color: "#7A756B" }}>
                      {r.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
