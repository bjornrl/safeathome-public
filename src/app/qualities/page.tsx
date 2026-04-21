"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { QUALITIES, FRICTIONS } from "@/lib/constants";
import type { CareQuality, PublicStory } from "@/lib/types";
import { getMapStories } from "@/lib/queries";

const QUALITY_KEYS = Object.keys(QUALITIES) as CareQuality[];

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

export default function QualitiesPage() {
  const [stories, setStories] = useState<PublicStory[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    getMapStories().then(setStories);
  }, []);

  return (
    <>
      <Nav />
      <main
        style={{
          fontFamily: "var(--font-dm-sans)",
          paddingTop: 72,
          paddingBottom: 96,
        }}
      >
        <header
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "0 24px 48px",
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
            Care qualities
          </p>
          <h1
            style={{
              fontFamily: "var(--font-source-serif)",
              fontSize: "clamp(38px, 6vw, 60px)",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#2C2A25",
              marginBottom: 18,
            }}
          >
            How people actually live and cope.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-source-serif)",
              fontSize: 19,
              lineHeight: 1.7,
              color: "#7A756B",
              maxWidth: 680,
            }}
          >
            These describe the realities, strategies, and strengths of aging
            immigrants and their families. Stories appear in every column where
            a quality is present &mdash; the repetition reveals how tightly
            woven these experiences are.
          </p>
        </header>

        <div
          style={{
            paddingLeft: "max(24px, env(safe-area-inset-left))",
          }}
        >
          <div
            className="qualities-scroll"
            style={{
              display: "flex",
              gap: 20,
              overflowX: "auto",
              scrollSnapType: "x mandatory",
              paddingBottom: 32,
              paddingRight: 24,
            }}
          >
            {QUALITY_KEYS.map((k) => {
              const q = QUALITIES[k];
              const bucket = stories.filter((s) => s.qualities?.includes(k));
              return (
                <section
                  key={k}
                  style={{
                    flex: "0 0 320px",
                    scrollSnapAlign: "start",
                    background: "#fff",
                    border: "1px solid #E8E4DB",
                    borderTop: `4px solid ${q.color}`,
                    borderRadius: 14,
                    padding: 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: q.color,
                        marginBottom: 8,
                      }}
                    >
                      {bucket.length} {bucket.length === 1 ? "story" : "stories"}
                    </span>
                    <h2
                      style={{
                        fontFamily: "var(--font-source-serif)",
                        fontSize: 22,
                        fontWeight: 700,
                        lineHeight: 1.2,
                        color: "#2C2A25",
                        marginBottom: 6,
                      }}
                    >
                      {q.label}
                    </h2>
                    <p style={{ fontSize: 14, lineHeight: 1.55, color: "#7A756B" }}>
                      {QUALITY_COPY[k]}
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {bucket.length === 0 ? (
                      <p
                        style={{
                          fontFamily: "var(--font-source-serif)",
                          fontStyle: "italic",
                          fontSize: 14,
                          color: "#A09A8E",
                        }}
                      >
                        No stories yet.
                      </p>
                    ) : (
                      bucket.map((s) => (
                        <QualityStoryCard
                          key={s.id}
                          story={s}
                          accent={q.color}
                          dimmed={hoveredId !== null && hoveredId !== s.id}
                          highlighted={hoveredId === s.id}
                          onEnter={() => setHoveredId(s.id)}
                          onLeave={() => setHoveredId(null)}
                        />
                      ))
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>

      <style>{`
        .qualities-scroll { scrollbar-width: thin; scrollbar-color: #E8E4DB transparent; }
        .qualities-scroll::-webkit-scrollbar { height: 10px; }
        .qualities-scroll::-webkit-scrollbar-track { background: transparent; }
        .qualities-scroll::-webkit-scrollbar-thumb { background: #E8E4DB; border-radius: 4px; }

        @media (max-width: 767px) {
          .qualities-scroll {
            flex-direction: column;
            overflow-x: visible;
            padding-right: 24px;
          }
          .qualities-scroll > section {
            flex: 1 1 auto;
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}

function QualityStoryCard({
  story,
  accent,
  dimmed,
  highlighted,
  onEnter,
  onLeave,
}: {
  story: PublicStory;
  accent: string;
  dimmed: boolean;
  highlighted: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const preview = story.body.split("\n\n")[0].slice(0, 120);
  return (
    <Link
      href={`/story/${story.id}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        display: "block",
        padding: 14,
        background: highlighted ? accent + "10" : "#F7F5F0",
        border: `1px solid ${highlighted ? accent + "88" : "#E8E4DB"}`,
        borderRadius: 10,
        textDecoration: "none",
        color: "#2C2A25",
        opacity: dimmed ? 0.45 : 1,
        transition: "opacity .15s, background .15s, border-color .15s",
      }}
    >
      <h3
        style={{
          fontFamily: "var(--font-source-serif)",
          fontSize: 16,
          fontWeight: 600,
          lineHeight: 1.3,
          marginBottom: 6,
          color: "#2C2A25",
        }}
      >
        {story.title}
      </h3>
      <p style={{ fontSize: 13, lineHeight: 1.5, color: "#7A756B", marginBottom: 8 }}>
        {preview}
        {story.body.length > 120 ? "…" : ""}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {story.field_site && (
          <span
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 99,
              background: "#EDE9E0",
              color: "#7A756B",
              fontWeight: 500,
            }}
          >
            {story.field_site}
          </span>
        )}
        {story.frictions?.slice(0, 2).map((f) => (
          <span
            key={f}
            style={{
              fontSize: 10,
              padding: "2px 8px",
              borderRadius: 99,
              background: FRICTIONS[f]?.color + "18",
              color: FRICTIONS[f]?.color,
              fontWeight: 500,
            }}
          >
            {FRICTIONS[f]?.label}
          </span>
        ))}
      </div>
    </Link>
  );
}
