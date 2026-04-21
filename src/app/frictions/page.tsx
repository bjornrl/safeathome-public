"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { chord as d3chord, arc as d3arc, ribbon as d3ribbon } from "d3";
import Nav from "@/components/Nav";
import { FRICTIONS } from "@/lib/constants";
import type { CareFriction, PublicStory } from "@/lib/types";
import { getMapStories } from "@/lib/queries";

const FRICTION_KEYS = Object.keys(FRICTIONS) as CareFriction[];

type Selection =
  | { kind: "none" }
  | { kind: "friction"; friction: CareFriction }
  | { kind: "pair"; a: CareFriction; b: CareFriction };

function buildMatrix(stories: PublicStory[]): number[][] {
  const n = FRICTION_KEYS.length;
  const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

  for (const story of stories) {
    const frictions = (story.frictions ?? []).filter((f) => FRICTION_KEYS.includes(f));
    if (frictions.length === 0) continue;
    if (frictions.length === 1) {
      const i = FRICTION_KEYS.indexOf(frictions[0]);
      matrix[i][i] += 1;
      continue;
    }
    for (let i = 0; i < frictions.length; i++) {
      for (let j = i + 1; j < frictions.length; j++) {
        const a = FRICTION_KEYS.indexOf(frictions[i]);
        const b = FRICTION_KEYS.indexOf(frictions[j]);
        matrix[a][b] += 1;
        matrix[b][a] += 1;
      }
    }
  }

  return matrix;
}

function storiesMatchingSelection(stories: PublicStory[], sel: Selection): PublicStory[] {
  if (sel.kind === "none") return stories;
  if (sel.kind === "friction") {
    return stories.filter((s) => s.frictions?.includes(sel.friction));
  }
  return stories.filter(
    (s) => s.frictions?.includes(sel.a) && s.frictions?.includes(sel.b),
  );
}

export default function FrictionsPage() {
  const [stories, setStories] = useState<PublicStory[]>([]);
  const [selection, setSelection] = useState<Selection>({ kind: "none" });

  useEffect(() => {
    getMapStories().then(setStories);
  }, []);

  const matrix = useMemo(() => buildMatrix(stories), [stories]);

  const results = useMemo(
    () => storiesMatchingSelection(stories, selection),
    [stories, selection],
  );

  return (
    <>
      <Nav />
      <main
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "72px 24px 96px",
          fontFamily: "var(--font-dm-sans)",
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
          Care frictions
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
          Seven ways the system collides with reality.
        </h1>
        <p
          style={{
            fontFamily: "var(--font-source-serif)",
            fontSize: 19,
            lineHeight: 1.7,
            color: "#7A756B",
            maxWidth: 680,
            marginBottom: 48,
          }}
        >
          Frictions name the recurring mechanisms by which well-intentioned care
          produces harm. This chord diagram shows how they braid together across
          stories &mdash; the thicker the ribbon, the more lives share that
          particular collision.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 1fr) minmax(260px, 320px)",
            gap: 48,
            alignItems: "start",
          }}
        >
          <ChordDiagram
            matrix={matrix}
            selection={selection}
            onSelect={setSelection}
          />

          <aside>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "#A09A8E",
                marginBottom: 12,
              }}
            >
              Legend
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {FRICTION_KEYS.map((k) => (
                <li key={k} style={{ marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() =>
                      setSelection((prev) =>
                        prev.kind === "friction" && prev.friction === k
                          ? { kind: "none" }
                          : { kind: "friction", friction: k },
                      )
                    }
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: 8,
                      width: "100%",
                      background:
                        selection.kind === "friction" && selection.friction === k
                          ? FRICTIONS[k].color + "14"
                          : "transparent",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        marginTop: 5,
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: FRICTIONS[k].color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ display: "block" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-source-serif)",
                          fontSize: 16,
                          fontWeight: 600,
                          color: "#2C2A25",
                        }}
                      >
                        {FRICTIONS[k].label}
                      </span>
                      <span
                        style={{
                          display: "block",
                          fontSize: 13,
                          lineHeight: 1.45,
                          color: "#7A756B",
                          marginTop: 2,
                        }}
                      >
                        {FRICTIONS[k].description}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <section style={{ marginTop: 64 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-source-serif)",
                fontSize: 26,
                fontWeight: 700,
                color: "#2C2A25",
              }}
            >
              <SelectionHeading selection={selection} count={results.length} />
            </h2>
            {selection.kind !== "none" && (
              <button
                type="button"
                onClick={() => setSelection({ kind: "none" })}
                style={{
                  fontSize: 13,
                  color: "#C45D3E",
                  fontWeight: 600,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Clear selection
              </button>
            )}
          </div>

          {selection.kind === "none" ? (
            <GroupedByFriction stories={stories} />
          ) : (
            <StoryGrid stories={results} />
          )}
        </section>
      </main>
    </>
  );
}

// ─── Chord diagram ───

function ChordDiagram({
  matrix,
  selection,
  onSelect,
}: {
  matrix: number[][];
  selection: Selection;
  onSelect: (s: Selection) => void;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const size = 520;
  const outerRadius = size / 2 - 40;
  const innerRadius = outerRadius - 14;

  const chords = useMemo(() => {
    const layout = d3chord().padAngle(0.05).sortSubgroups((a, b) => b - a);
    return layout(matrix);
  }, [matrix]);

  const arcGen = useMemo(
    () => d3arc<d3.ChordGroup>().innerRadius(innerRadius).outerRadius(outerRadius),
    [innerRadius, outerRadius],
  );
  const ribbonGen = useMemo(
    () => d3ribbon<d3.Chord, d3.ChordSubgroup>().radius(innerRadius),
    [innerRadius],
  );

  // Build once; let React render.
  useEffect(() => {
    // No d3 rendering side effect needed; we use JSX below. The ref exists for
    // potential downstream tooltip positioning.
    return;
  }, [chords]);

  const isFrictionSelected = (k: CareFriction) => {
    if (selection.kind === "friction") return selection.friction === k;
    if (selection.kind === "pair") return selection.a === k || selection.b === k;
    return false;
  };

  const isPairSelected = (a: CareFriction, b: CareFriction) => {
    if (selection.kind === "friction")
      return selection.friction === a || selection.friction === b;
    if (selection.kind === "pair")
      return (
        (selection.a === a && selection.b === b) ||
        (selection.a === b && selection.b === a)
      );
    return false;
  };

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <svg
        ref={ref}
        viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {/* Ribbons */}
        <g>
          {chords.map((c, i) => {
            const a = FRICTION_KEYS[c.source.index];
            const b = FRICTION_KEYS[c.target.index];
            const selectedPair = isPairSelected(a, b);
            const anyActive = selection.kind !== "none";
            const opacity = anyActive ? (selectedPair ? 0.85 : 0.05) : 0.45;
            const color = FRICTIONS[a].color;
            const d = ribbonGen(c);
            return (
              <path
                key={`r-${i}`}
                d={d ?? ""}
                fill={color}
                fillOpacity={opacity}
                stroke={color}
                strokeOpacity={selectedPair ? 0.9 : 0.15}
                style={{ cursor: "pointer", transition: "fill-opacity .15s, stroke-opacity .15s" }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (a === b) {
                    onSelect({ kind: "friction", friction: a });
                  } else {
                    onSelect({ kind: "pair", a, b });
                  }
                }}
              >
                <title>
                  {a === b
                    ? `${FRICTIONS[a].label} — ${c.source.value} stories`
                    : `${FRICTIONS[a].label} + ${FRICTIONS[b].label} — ${c.source.value} stories share both`}
                </title>
              </path>
            );
          })}
        </g>

        {/* Arc segments + labels */}
        <g>
          {chords.groups.map((g) => {
            const k = FRICTION_KEYS[g.index];
            const selected = isFrictionSelected(k);
            const anyActive = selection.kind !== "none";
            const color = FRICTIONS[k].color;
            const d = arcGen(g);

            // Label position along the arc midpoint
            const angle = (g.startAngle + g.endAngle) / 2;
            const labelRadius = outerRadius + 18;
            const x = Math.sin(angle) * labelRadius;
            const y = -Math.cos(angle) * labelRadius;
            const anchor = angle > Math.PI ? "end" : "start";
            const labelRotation = ((angle * 180) / Math.PI) - 90;
            const flipped = angle > Math.PI;

            return (
              <g key={`g-${g.index}`}>
                <path
                  d={d ?? ""}
                  fill={color}
                  fillOpacity={anyActive ? (selected ? 1 : 0.25) : 0.9}
                  stroke="#fff"
                  strokeWidth={1.5}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(
                      selection.kind === "friction" && selection.friction === k
                        ? { kind: "none" }
                        : { kind: "friction", friction: k },
                    );
                  }}
                  onMouseEnter={() => {
                    if (selection.kind === "none") {
                      onSelect({ kind: "friction", friction: k });
                    }
                  }}
                  onMouseLeave={() => {
                    if (selection.kind === "friction" && selection.friction === k) {
                      onSelect({ kind: "none" });
                    }
                  }}
                  style={{ cursor: "pointer", transition: "fill-opacity .15s" }}
                >
                  <title>{FRICTIONS[k].label}</title>
                </path>
                <text
                  x={x}
                  y={y}
                  fontSize={13}
                  fontWeight={selected ? 700 : 500}
                  textAnchor={anchor}
                  fill={selected ? color : "#2C2A25"}
                  transform={`rotate(${flipped ? labelRotation + 180 : labelRotation}, ${x}, ${y})`}
                  style={{
                    fontFamily: "var(--font-dm-sans)",
                    pointerEvents: "none",
                    dominantBaseline: "middle",
                  }}
                >
                  {FRICTIONS[k].label}
                </text>
              </g>
            );
          })}
        </g>

        {/* Background click — clear selection */}
        <rect
          x={-size / 2}
          y={-size / 2}
          width={size}
          height={size}
          fill="transparent"
          onClick={() => onSelect({ kind: "none" })}
          style={{ pointerEvents: selection.kind === "none" ? "none" : "auto" }}
        />
      </svg>

      <p
        style={{
          fontSize: 12,
          color: "#A09A8E",
          textAlign: "center",
          marginTop: 8,
        }}
      >
        Hover a segment to highlight. Click to lock. Click a ribbon for the
        pair.
      </p>
    </div>
  );
}

// ─── Selection heading ───

function SelectionHeading({
  selection,
  count,
}: {
  selection: Selection;
  count: number;
}) {
  if (selection.kind === "none") {
    return <>All stories grouped by friction</>;
  }
  if (selection.kind === "friction") {
    return (
      <>
        <span style={{ color: FRICTIONS[selection.friction].color }}>
          {FRICTIONS[selection.friction].label}
        </span>{" "}
        &middot;{" "}
        <span style={{ color: "#7A756B", fontWeight: 400, fontSize: 18 }}>
          {count} {count === 1 ? "story" : "stories"}
        </span>
      </>
    );
  }
  return (
    <>
      <span style={{ color: FRICTIONS[selection.a].color }}>
        {FRICTIONS[selection.a].label}
      </span>{" "}
      +{" "}
      <span style={{ color: FRICTIONS[selection.b].color }}>
        {FRICTIONS[selection.b].label}
      </span>{" "}
      &middot;{" "}
      <span style={{ color: "#7A756B", fontWeight: 400, fontSize: 18 }}>
        {count} {count === 1 ? "story shares both" : "stories share both"}
      </span>
    </>
  );
}

// ─── Story list layouts ───

function StoryGrid({ stories }: { stories: PublicStory[] }) {
  if (stories.length === 0) {
    return (
      <p
        style={{
          fontFamily: "var(--font-source-serif)",
          fontStyle: "italic",
          fontSize: 17,
          color: "#7A756B",
          padding: "24px 0",
        }}
      >
        No stories share this combination yet.
      </p>
    );
  }
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 16,
      }}
    >
      {stories.map((s) => (
        <StoryCard key={s.id} story={s} />
      ))}
    </div>
  );
}

function GroupedByFriction({ stories }: { stories: PublicStory[] }) {
  return (
    <div>
      {FRICTION_KEYS.map((k) => {
        const bucket = stories.filter((s) => s.frictions?.includes(k));
        if (bucket.length === 0) return null;
        return (
          <div key={k} style={{ marginBottom: 40 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: `2px solid ${FRICTIONS[k].color}`,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: FRICTIONS[k].color,
                }}
              />
              <h3
                style={{
                  fontFamily: "var(--font-source-serif)",
                  fontSize: 20,
                  fontWeight: 600,
                  color: "#2C2A25",
                }}
              >
                {FRICTIONS[k].label}
              </h3>
              <span style={{ fontSize: 13, color: "#A09A8E" }}>
                {bucket.length} {bucket.length === 1 ? "story" : "stories"}
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 16,
              }}
            >
              {bucket.map((s) => (
                <StoryCard key={s.id} story={s} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StoryCard({ story }: { story: PublicStory }) {
  const preview = story.body.split("\n\n")[0].slice(0, 140);
  return (
    <Link
      href={`/story/${story.id}`}
      style={{
        display: "block",
        padding: 20,
        background: "#fff",
        border: "1px solid #E8E4DB",
        borderRadius: 10,
        textDecoration: "none",
        color: "#2C2A25",
      }}
    >
      <h4
        style={{
          fontFamily: "var(--font-source-serif)",
          fontSize: 17,
          fontWeight: 600,
          lineHeight: 1.3,
          marginBottom: 8,
        }}
      >
        {story.title}
      </h4>
      <p style={{ fontSize: 13, lineHeight: 1.55, color: "#7A756B", marginBottom: 10 }}>
        {preview}
        {story.body.length > 140 ? "…" : ""}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {story.frictions?.map((f) => (
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
