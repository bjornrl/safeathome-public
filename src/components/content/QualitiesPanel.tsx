"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QUALITIES, FRICTIONS, QUALITY_COPY } from "@/lib/constants";
import type { CareFriction, CareQuality, CategoryDescription } from "@/lib/types";
import { getQualityDescriptions } from "@/lib/queries";
import { loadCorpus, type CorpusNode } from "@/lib/corpus";
import { FONT_STACK } from "@/lib/design-tokens";
const QUALITY_KEYS = Object.keys(QUALITIES) as CareQuality[];

/**
 * Returns the first shared category (friction or quality) between two stories
 * plus its color, or null if they share nothing. Frictions are checked first
 * so friction ribbons dominate the hover signal — match the chord diagram on
 * /frictions rather than the quality column that contains the hovered card.
 */
function firstSharedCategory(a: CorpusNode, b: CorpusNode): { key: string; color: string } | null {
  const bFrictions = new Set<CareFriction>(b.frictions ?? []);
  for (const f of a.frictions ?? []) {
    if (bFrictions.has(f)) {
      const c = FRICTIONS[f]?.color;
      if (c) return { key: f, color: c };
    }
  }
  const bQualities = new Set<CareQuality>(b.qualities ?? []);
  for (const q of a.qualities ?? []) {
    if (bQualities.has(q)) {
      const c = QUALITIES[q]?.color;
      if (c) return { key: q, color: c };
    }
  }
  return null;
}

export default function QualitiesPanel() {
  const [stories, setStories] = useState<CorpusNode[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, CategoryDescription>>({});
  const [expandedKey, setExpandedKey] = useState<CareQuality | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverCapable, setHoverCapable] = useState(false);

  useEffect(() => {
    loadCorpus().then((c) => setStories(c.nodes)).catch(() => setStories([]));
    getQualityDescriptions().then((rows) => {
      const map: Record<string, CategoryDescription> = {};
      for (const r of rows) map[r.key] = r;
      setDescriptions(map);
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(hover: hover)");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHoverCapable(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setHoverCapable(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const hoveredStory = useMemo(
    () => (hoveredId ? stories.find((s) => s.id === hoveredId) ?? null : null),
    [hoveredId, stories],
  );

  return <>
      <div style={{ fontFamily: FONT_STACK }}>
        {stories.length === 0 && (
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "#666666", maxWidth: 620, marginBottom: 24 }}>
            Her kommer feltmaterialet. Datainnsamlingen i Alna og Søndre Nordstrand
            starter høsten 2026 — etter hvert som notater tagges med kvaliteter,
            dukker de opp her.
          </p>
        )}

        <div>
          <div className="qualities-scroll [display:flex] [gap:16px] [overflow-x:auto] [scroll-snap-type:x_mandatory] [padding-bottom:32px]">
            {QUALITY_KEYS.map(k => {
            const q = QUALITIES[k];
            const bucket = stories.filter(s => s.qualities?.includes(k));
            const desc = descriptions[k];
            const hasDescription = Boolean(desc && (desc.long_description.trim().length > 0 || (desc.examples?.length ?? 0) > 0));
            const isExpanded = expandedKey === k;
            return <section key={k} id={k} style={{
              borderTop: `4px solid ${q.color}`
            }} className="[flex:0_0_320px] [scroll-snap-align:start] [background:#ffffff] [border:1px_solid_#e6e6e6] [border-radius:8px] [padding:24px] [display:flex] [flex-direction:column] [gap:16px]">
                  <div>
                    <span style={{
                  color: q.color
                }} className="[display:inline-block] [font-size:11px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.12em] [margin-bottom:8px]">
                      {bucket.length} {bucket.length === 1 ? "historie" : "historier"}
                    </span>
                    <button
                      type="button"
                      onClick={() => hasDescription && setExpandedKey(isExpanded ? null : k)}
                      aria-expanded={isExpanded}
                      aria-label={
                        hasDescription
                          ? isExpanded
                            ? `Skjul beskrivelse for ${q.label}`
                            : `Vis beskrivelse for ${q.label}`
                          : `${q.label} — beskrivelse kommer snart`
                      }
                      disabled={!hasDescription}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: 0,
                        textAlign: "left",
                        cursor: hasDescription ? "pointer" : "default",
                        display: "block",
                        width: "100%",
                        fontFamily: FONT_STACK,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 17,
                          fontWeight: 600,
                          lineHeight: 1.3,
                          letterSpacing: 0,
                          color: "#2a2859",
                          marginBottom: 6,
                        }}
                      >
                        {q.label}
                        {hasDescription && (
                          <span
                            aria-hidden
                            style={{
                              fontSize: 13,
                              marginLeft: 6,
                              color: q.color,
                              fontWeight: 600,
                            }}
                          >
                            {isExpanded ? "−" : "+"}
                          </span>
                        )}
                      </h3>
                      <p
                        style={{
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: "#666666",
                          margin: 0,
                        }}
                      >
                        {QUALITY_COPY[k]}
                      </p>
                    </button>
                    {!hasDescription && (
                      <p style={{ fontSize: 11, color: "#9a9a9a", fontStyle: "italic", marginTop: 8 }}>
                        Lengre beskrivelse kommer snart.
                      </p>
                    )}
                    {isExpanded && hasDescription && (
                      <div style={{
                        marginTop: 12,
                        padding: 12,
                        background: "#f9f9f9",
                        borderLeft: `3px solid ${q.color}`,
                      }}>
                        {desc.long_description.trim().length > 0 && (
                          <p style={{ fontSize: 13, lineHeight: 1.55, color: "#2c2c2c", marginBottom: 10 }}>
                            {desc.long_description}
                          </p>
                        )}
                        {(desc.examples?.length ?? 0) > 0 && (
                          <>
                            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#808080", marginBottom: 6 }}>
                              Eksempler
                            </p>
                            <ul style={{ listStyle: "disc", paddingLeft: 18, margin: 0 }}>
                              {desc.examples.map((ex, i) => (
                                <li key={i} style={{ fontSize: 12, lineHeight: 1.5, color: "#2c2c2c", marginBottom: 4 }}>
                                  {ex}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="[display:flex] [flex-direction:column] [gap:8px]">
                    {bucket.length === 0 ? <p className="[font-size:14px] [color:#9a9a9a]">
                        Ingen historier ennå.
                      </p> : bucket.map(s => {
                        const isHovered = hoveredStory?.id === s.id;
                        const shared = hoveredStory && !isHovered ? firstSharedCategory(hoveredStory, s) : null;
                        const highlighted = isHovered || Boolean(shared);
                        const dimmed = hoveredStory !== null && !highlighted;
                        const highlightColor = shared?.color ?? q.color;
                        return <QualityStoryCard
                          key={s.id}
                          story={s}
                          highlightColor={highlightColor}
                          dimmed={dimmed}
                          highlighted={highlighted}
                          isOrigin={isHovered}
                          onEnter={hoverCapable ? () => setHoveredId(s.id) : undefined}
                          onLeave={hoverCapable ? () => setHoveredId(null) : undefined}
                        />;
                      })}
                  </div>
                </section>;
          })}
          </div>
        </div>
      </div>

      <style>{`
        .qualities-scroll { scrollbar-width: thin; scrollbar-color: #e6e6e6 transparent; }
        .qualities-scroll::-webkit-scrollbar { height: 10px; }
        .qualities-scroll::-webkit-scrollbar-track { background: transparent; }
        .qualities-scroll::-webkit-scrollbar-thumb { background: #e6e6e6; border-radius: 4px; }

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
    </>;
}
function QualityStoryCard({
  story,
  highlightColor,
  dimmed,
  highlighted,
  isOrigin,
  onEnter,
  onLeave
}: {
  story: CorpusNode;
  highlightColor: string;
  dimmed: boolean;
  highlighted: boolean;
  isOrigin: boolean;
  onEnter?: () => void;
  onLeave?: () => void;
}) {
  const preview = story.body.split("\n\n")[0].slice(0, 120);
  return <Link href={`/internal/content?tab=nodes&focus=${encodeURIComponent(story.id)}`} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{
    background: highlighted ? highlightColor + "10" : "#f9f9f9",
    border: `1px solid ${isOrigin ? highlightColor : highlighted ? highlightColor + "88" : "#e6e6e6"}`,
    boxShadow: isOrigin ? `0 0 0 1px ${highlightColor}` : undefined,
    opacity: dimmed ? 0.35 : 1,
    display: "block",
    padding: 12,
    borderRadius: 8,
    textDecoration: "none",
    color: "#2c2c2c",
    transition: "opacity .15s, background .15s, border-color .15s, box-shadow .15s",
  }}>
      <h4 style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, letterSpacing: 0, marginBottom: 6, color: "#2a2859" }}>
        {story.title}
      </h4>
      <p style={{ fontSize: 12, lineHeight: 1.5, color: "#666666", marginBottom: 8 }}>
        {preview}
        {story.body.length > 120 ? "…" : ""}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {story.fieldSite && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#f2f2f2", color: "#666666", fontWeight: 500 }}>
            {story.fieldSite}
          </span>}
        {story.frictions?.slice(0, 2).map(f => <span key={f} style={{
        background: FRICTIONS[f]?.color + "18",
        color: FRICTIONS[f]?.color,
        fontSize: 10,
        padding: "2px 8px",
        borderRadius: 4,
        fontWeight: 500,
      }}>
            {FRICTIONS[f]?.label}
          </span>)}
      </div>
    </Link>;
}
