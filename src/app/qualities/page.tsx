"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { QUALITIES, FRICTIONS, QUALITY_COPY } from "@/lib/constants";
import type { CareQuality, PublicStory } from "@/lib/types";
import { getMapStories } from "@/lib/queries";
const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';
const QUALITY_KEYS = Object.keys(QUALITIES) as CareQuality[];
export default function QualitiesPage() {
  const [stories, setStories] = useState<PublicStory[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  useEffect(() => {
    getMapStories().then(setStories);
  }, []);
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
            return <section key={k} style={{
              borderTop: `4px solid ${q.color}`
            }} className="[flex:0_0_320px] [scroll-snap-align:start] [background:#ffffff] [border:1px_solid_#e6e6e6] [border-radius:8px] [padding:24px] [display:flex] [flex-direction:column] [gap:16px]">
                  <div>
                    <span style={{
                  color: q.color
                }} className="[display:inline-block] [font-size:11px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.12em] [margin-bottom:8px]">
                      {bucket.length} {bucket.length === 1 ? "story" : "stories"}
                    </span>
                    <h2 className="[font-size:22px] [font-weight:700] [line-height:1.2] [color:#2a2859] [margin-bottom:8px]">
                      {q.label}
                    </h2>
                    <p className="[font-size:14px] [line-height:1.55] [color:#666666]">
                      {QUALITY_COPY[k]}
                    </p>
                  </div>

                  <div className="[display:flex] [flex-direction:column] [gap:8px]">
                    {bucket.length === 0 ? <p className="[font-size:14px] [color:#9a9a9a]">
                        No stories yet.
                      </p> : bucket.map(s => <QualityStoryCard key={s.id} story={s} accent={q.color} dimmed={hoveredId !== null && hoveredId !== s.id} highlighted={hoveredId === s.id} onEnter={() => setHoveredId(s.id)} onLeave={() => setHoveredId(null)} />)}
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
  accent,
  dimmed,
  highlighted,
  onEnter,
  onLeave
}: {
  story: PublicStory;
  accent: string;
  dimmed: boolean;
  highlighted: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const preview = story.body.split("\n\n")[0].slice(0, 120);
  return <Link href={`/story/${story.id}`} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{
    background: highlighted ? accent + "10" : "#f9f9f9",
    border: `1px solid ${highlighted ? accent + "88" : "#e6e6e6"}`,
    opacity: dimmed ? 0.45 : 1
  }} className="[display:block] [padding:16px] [border-radius:8px] [text-decoration:none] [color:#2c2c2c] [transition:opacity_.15s,_background_.15s,_border-color_.15s]">
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
