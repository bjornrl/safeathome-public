"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { FRICTIONS } from "@/lib/constants";
import { STAGES, type SolutionStage } from "@/lib/seed-solutions";
import { getDesignResponses, getAllStories, type SolutionItem } from "@/lib/queries";
import type { PublicStory } from "@/lib/types";

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

export default function SolutionsPage() {
  const [solutions, setSolutions] = useState<SolutionItem[]>([]);
  const [stories, setStories] = useState<PublicStory[]>([]);
  const [activeStage, setActiveStage] = useState<SolutionStage | null>(null);

  useEffect(() => {
    Promise.all([getDesignResponses(), getAllStories()]).then(([sol, st]) => {
      setSolutions(sol);
      setStories(st);
    });
  }, []);

  const byStage = (stage: SolutionStage) =>
    solutions.filter((s) => s.stage === stage).length;

  const filtered = activeStage
    ? solutions.filter((s) => s.stage === activeStage)
    : solutions;

  const storyById = (id: string) => stories.find((s) => s.id === id);

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
          Design responses
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
          From observation to intervention.
        </h1>
        <p
          style={{
            fontSize: 19,
            lineHeight: 1.7,
            color: "#666666",
            maxWidth: 680,
            marginBottom: 48,
          }}
        >
          When the research reveals a friction, the design team responds. These
          are the interventions being developed, tested, and refined &mdash;
          tracing the journey from field observation to practical solution.
        </p>

        {/* Pipeline */}
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e6e6e6",
            borderRadius: 8,
            padding: 24,
            marginBottom: 48,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "#808080",
              marginBottom: 16,
            }}
          >
            Pipeline
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 8,
              alignItems: "stretch",
            }}
          >
            {STAGES.map((stage, i) => {
              const count = byStage(stage.key);
              const active = activeStage === stage.key;
              return (
                <button
                  key={stage.key}
                  type="button"
                  onClick={() =>
                    setActiveStage((prev) => (prev === stage.key ? null : stage.key))
                  }
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 8,
                    padding: 16,
                    background: active ? stage.color + "12" : "#f9f9f9",
                    border: `1px solid ${active ? stage.color : "#e6e6e6"}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: FONT_STACK,
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#808080",
                      letterSpacing: "0.08em",
                    }}
                  >
                    <span
                      aria-hidden
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        background: stage.color,
                      }}
                    />
                    {`0${i + 1}`.slice(-2)}
                  </span>
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: "#2a2859",
                    }}
                  >
                    {stage.label}
                  </span>
                  <span style={{ fontSize: 13, color: "#666666" }}>
                    {count} {count === 1 ? "response" : "responses"}
                  </span>
                </button>
              );
            })}
          </div>
          {activeStage && (
            <button
              type="button"
              onClick={() => setActiveStage(null)}
              style={{
                marginTop: 16,
                fontSize: 12,
                color: "#1f42aa",
                fontWeight: 600,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                fontFamily: FONT_STACK,
              }}
            >
              Clear stage filter
            </button>
          )}
        </section>

        {/* Cards */}
        <section>
          <h2
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#2a2859",
              marginBottom: 24,
              letterSpacing: "-0.01em",
            }}
          >
            {activeStage
              ? STAGES.find((s) => s.key === activeStage)?.label + " responses"
              : "All responses"}
          </h2>

          {filtered.length === 0 ? (
            <p
              style={{
                color: "#808080",
              }}
            >
              No responses in this stage yet.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 16,
              }}
            >
              {filtered.map((sol) => (
                <SolutionCard
                  key={sol.id}
                  solution={sol}
                  sourceStories={sol.source_stories
                    .map((id) => storyById(id))
                    .filter((s): s is PublicStory => Boolean(s))}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function SolutionCard({
  solution,
  sourceStories,
}: {
  solution: SolutionItem;
  sourceStories: PublicStory[];
}) {
  const stage = STAGES.find((s) => s.key === solution.stage);
  return (
    <article
      style={{
        background: "#ffffff",
        border: "1px solid #e6e6e6",
        borderRadius: 8,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: stage?.color ?? "#808080",
            padding: "3px 10px",
            borderRadius: 4,
            background: (stage?.color ?? "#808080") + "15",
          }}
        >
          {stage?.label ?? solution.stage}
        </span>
      </div>

      <h3
        style={{
          fontSize: 22,
          fontWeight: 700,
          lineHeight: 1.25,
          color: "#2a2859",
          letterSpacing: "-0.01em",
        }}
      >
        {solution.title}
      </h3>

      <p
        style={{
          fontSize: 15,
          lineHeight: 1.6,
          color: "#2c2c2c",
        }}
      >
        {solution.description}
      </p>

      {solution.frictions.length > 0 && (
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#808080",
              marginBottom: 8,
            }}
          >
            Addresses
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {solution.frictions.map((f) => (
              <span
                key={f}
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: FRICTIONS[f]?.color + "18",
                  color: FRICTIONS[f]?.color,
                  fontWeight: 500,
                }}
              >
                {FRICTIONS[f]?.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {solution.outcome && (
        <p
          style={{
            fontSize: 14,
            color: "#666666",
            lineHeight: 1.6,
            paddingLeft: 16,
            borderLeft: "2px solid #e6e6e6",
          }}
        >
          {solution.outcome}
        </p>
      )}

      {sourceStories.length > 0 && (
        <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid #e6e6e6" }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "#808080",
              marginBottom: 8,
            }}
          >
            Based on
          </p>
          {sourceStories.map((s) => (
            <Link
              key={s.id}
              href={`/story/${s.id}`}
              style={{
                display: "block",
                fontSize: 14,
                color: "#1f42aa",
                textDecoration: "none",
                padding: "4px 0",
                fontWeight: 500,
              }}
            >
              {s.title} →
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
