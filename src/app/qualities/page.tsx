"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { QUALITIES, FRICTIONS, QUALITY_COPY } from "@/lib/constants";
import type { CareFriction, CareQuality, CategoryDescription, PublicStory } from "@/lib/types";
import { getMapStories, getQualityDescriptions } from "@/lib/queries";
const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';
const QUALITY_KEYS = Object.keys(QUALITIES) as CareQuality[];

/**
 * Returns the first shared category (friction or quality) between two stories
 * plus its color, or null if they share nothing. Frictions are checked first
 * so friction ribbons dominate the hover signal — match the chord diagram on
 * /frictions rather than the quality column that contains the hovered card.
 */
function firstSharedCategory(a: PublicStory, b: PublicStory): { key: string; color: string } | null {
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

export default function QualitiesPage() {
  const [stories, setStories] = useState<PublicStory[]>([]);
  const [descriptions, setDescriptions] = useState<Record<string, CategoryDescription>>({});
  const [expandedKey, setExpandedKey] = useState<CareQuality | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoverCapable, setHoverCapable] = useState(false);

  useEffect(() => {
    getMapStories().then(setStories);
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
      <Nav />
      <main style={{
      fontFamily: FONT_STACK
    }} className="[padding-top:72px] [padding-bottom:96px]">
        <header className="[max-width:1120px] [margin:0_auto] [padding:0_24px_48px]">
          <p className="[font-size:12px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.18em] [color:#808080] [margin-bottom:16px]">
            Care qualities
          </p>
          <h1 className="[font-size:clamp(38px,_6vw,_60px)] [font-weight:700] [line-height:1.05] [letter-spacing:-0.02em] [color:#2a2859] [margin-bottom:24px]">
            How people actually live and cope.
          </h1>
          <p className="[font-size:19px] [line-height:1.7] [color:#666666] [max-width:680px]">
            These describe the realities, strategies, and strengths of aging
            immigrants and their families. Stories appear in every column where
            a quality is present &mdash; the repetition reveals how tightly
            woven these experiences are.
          </p>
        </header>

        <div className="[padding-left:max(24px,_env(safe-area-inset-left))]">
          <div className="qualities-scroll [display:flex] [gap:16px] [overflow-x:auto] [scroll-snap-type:x_mandatory] [padding-bottom:32px] [padding-right:24px]">
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
                      {bucket.length} {bucket.length === 1 ? "story" : "stories"}
                    </span>
                    <button
                      type="button"
                      onClick={() => hasDescription && setExpandedKey(isExpanded ? null : k)}
                      aria-expanded={isExpanded}
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
                      <h2 className="[font-size:22px] [font-weight:700] [line-height:1.2] [color:#2a2859] [margin-bottom:8px]">
                        {q.label}
                        {hasDescription && <span aria-hidden style={{ fontSize: 14, marginLeft: 8, color: "#9a9a9a", fontWeight: 500 }}>{isExpanded ? "−" : "+"}</span>}
                      </h2>
                    </button>
                    <p className="[font-size:14px] [line-height:1.55] [color:#666666]">
                      {QUALITY_COPY[k]}
                    </p>
                    {!hasDescription && (
                      <p className="[font-size:11px] [color:#9a9a9a] [font-style:italic] [margin-top:8px]">
                        Longer description coming soon.
                      </p>
                    )}
                    {isExpanded && hasDescription && (
                      <div style={{
                        marginTop: 16,
                        padding: 16,
                        background: "#f9f9f9",
                        borderLeft: `3px solid ${q.color}`,
                      }}>
                        {desc.long_description.trim().length > 0 && (
                          <p className="[font-size:14px] [line-height:1.6] [color:#2c2c2c] [margin-bottom:12px]">
                            {desc.long_description}
                          </p>
                        )}
                        {(desc.examples?.length ?? 0) > 0 && (
                          <>
                            <p className="[font-size:11px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.12em] [color:#808080] [margin-bottom:6px]">
                              Examples
                            </p>
                            <ul className="[list-style:disc] [padding-left:20px] [margin:0]">
                              {desc.examples.map((ex, i) => (
                                <li key={i} className="[font-size:13px] [line-height:1.55] [color:#2c2c2c] [margin-bottom:4px]">
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
                        No stories yet.
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
      </main>

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
  story: PublicStory;
  highlightColor: string;
  dimmed: boolean;
  highlighted: boolean;
  isOrigin: boolean;
  onEnter?: () => void;
  onLeave?: () => void;
}) {
  const preview = story.body.split("\n\n")[0].slice(0, 120);
  return <Link href={`/story/${story.id}`} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{
    background: highlighted ? highlightColor + "10" : "#f9f9f9",
    border: `1px solid ${isOrigin ? highlightColor : highlighted ? highlightColor + "88" : "#e6e6e6"}`,
    boxShadow: isOrigin ? `0 0 0 1px ${highlightColor}` : undefined,
    opacity: dimmed ? 0.35 : 1
  }} className="[display:block] [padding:16px] [border-radius:8px] [text-decoration:none] [color:#2c2c2c] [transition:opacity_.15s,_background_.15s,_border-color_.15s,_box-shadow_.15s]">
      <h3 className="[font-size:16px] [font-weight:600] [line-height:1.3] [margin-bottom:8px] [color:#2a2859]">
        {story.title}
      </h3>
      <p className="[font-size:13px] [line-height:1.5] [color:#666666] [margin-bottom:8px]">
        {preview}
        {story.body.length > 120 ? "…" : ""}
      </p>
      <div className="[display:flex] [flex-wrap:wrap] [gap:4px]">
        {story.field_site && <span className="[font-size:10px] [padding:2px_8px] [border-radius:4px] [background:#f2f2f2] [color:#666666] [font-weight:500]">
            {story.field_site}
          </span>}
        {story.frictions?.slice(0, 2).map(f => <span key={f} style={{
        background: FRICTIONS[f]?.color + "18",
        color: FRICTIONS[f]?.color
      }} className="[font-size:10px] [padding:2px_8px] [border-radius:4px] [font-weight:500]">
            {FRICTIONS[f]?.label}
          </span>)}
      </div>
    </Link>;
}
