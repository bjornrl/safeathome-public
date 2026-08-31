"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { chord as d3chord, arc as d3arc, ribbon as d3ribbon } from "d3";
import { FRICTIONS } from "@/lib/constants";
import type { CareFriction } from "@/lib/types";
import { loadCorpus, type CorpusNode } from "@/lib/corpus";
import { FONT_STACK } from "@/lib/design-tokens";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { fill } from "@/lib/i18n/dictionary";
const FRICTION_KEYS = Object.keys(FRICTIONS) as CareFriction[];
type Selection = {
  kind: "none";
} | {
  kind: "friction";
  friction: CareFriction;
} | {
  kind: "pair";
  a: CareFriction;
  b: CareFriction;
};
function buildMatrix(stories: CorpusNode[]): number[][] {
  const n = FRICTION_KEYS.length;
  const matrix: number[][] = Array.from({
    length: n
  }, () => new Array(n).fill(0));
  for (const story of stories) {
    const frictions = (story.frictions ?? []).filter(f => FRICTION_KEYS.includes(f));
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
function storiesMatchingSelection(stories: CorpusNode[], sel: Selection): CorpusNode[] {
  if (sel.kind === "none") return stories;
  if (sel.kind === "friction") {
    return stories.filter(s => s.frictions?.includes(sel.friction));
  }
  return stories.filter(s => s.frictions?.includes(sel.a) && s.frictions?.includes(sel.b));
}
// phase4: expandable long descriptions + examples (from
// public_friction_descriptions) not wired here yet. The legend
// buttons already own a click action (select/deselect a friction),
// so adding an inline expand would conflict with that UX. A better
// surface would be a dedicated `/frictions/[key]` page per friction
// or a side drawer opened from the legend. Deferred for a later pass.
export default function FrictionsPanel() {
  const { t, tax } = useI18n();
  const [stories, setStories] = useState<CorpusNode[]>([]);
  const [selection, setSelection] = useState<Selection>({
    kind: "none"
  });
  useEffect(() => {
    loadCorpus().then((c) => setStories(c.nodes)).catch(() => setStories([]));
  }, []);
  const matrix = useMemo(() => buildMatrix(stories), [stories]);
  const represented = useMemo(() => representedFrictions(stories), [stories]);
  const results = useMemo(() => storiesMatchingSelection(stories, selection), [stories, selection]);
  return <div style={{ fontFamily: FONT_STACK }}>
        {represented.length >= MIN_FRICTIONS_FOR_CHORD ? (
          <p className="[font-size:15px] [line-height:1.6] [color:#666666] [max-width:680px] [margin-bottom:32px]">
            {t.frictions.chordIntro}
          </p>
        ) : stories.length > 0 ? (
          <p className="[font-size:15px] [line-height:1.6] [color:#666666] [max-width:680px] [margin-bottom:32px]">
            {t.frictions.chordPending}
          </p>
        ) : null}

        <div className="[display:grid] [grid-template-columns:minmax(280px,_1fr)_minmax(260px,_320px)] [gap:48px] [align-items:start]">
          {/* Tre tilstander, ikke to: tomt korpus forklares, tynt korpus telles,
              og akkord-diagrammet tegnes først når det har noe å si. */}
          {stories.length === 0
            ? <CorpusEmpty text={t.frictions.corpusEmpty} />
            : represented.length < MIN_FRICTIONS_FOR_CHORD
              ? <FrictionCounts stories={stories} selection={selection} onSelect={setSelection} />
              : <ChordDiagram matrix={matrix} selection={selection} onSelect={setSelection} />}

          <aside>
            <p className="[font-size:11px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.14em] [color:#808080] [margin-bottom:16px]">
              {t.frictions.legend}
            </p>
            <ul className="[list-style:none] [padding:0px] [margin:0px]">
              {FRICTION_KEYS.map(k => <li key={k} className="[margin-bottom:8px]">
                  <button type="button" onClick={() => setSelection(prev => prev.kind === "friction" && prev.friction === k ? {
                kind: "none"
              } : {
                kind: "friction",
                friction: k
              })} style={{
                background: selection.kind === "friction" && selection.friction === k ? tax.frictions[k].color + "14" : "transparent",
                fontFamily: FONT_STACK
              }} className="[display:flex] [align-items:flex-start] [gap:10px] [padding:8px] [width:100%] [border:none] [border-radius:8px] [cursor:pointer] [text-align:left]">
                    <span style={{
                  background: tax.frictions[k].color
                }} className="[margin-top:5px] [width:12px] [height:12px] [border-radius:50%] [flex-shrink:0]" />
                    <span className="[display:block]">
                      <span className="[font-size:16px] [font-weight:600] [color:#2a2859]">
                        {tax.frictions[k].label}
                      </span>
                      <span className="[display:block] [font-size:13px] [line-height:1.5] [color:#666666] [margin-top:2px]">
                        {tax.frictions[k].description}
                      </span>
                    </span>
                  </button>
                </li>)}
            </ul>
          </aside>
        </div>

        <section className="[margin-top:64px]">
          <div className="[display:flex] [align-items:center] [justify-content:space-between] [gap:16px] [margin-bottom:24px] [flex-wrap:wrap]">
            <h2 className="[font-size:26px] [font-weight:700] [color:#2a2859] [letter-spacing:-0.01em]">
              <SelectionHeading selection={selection} count={results.length} />
            </h2>
            {selection.kind !== "none" && <button type="button" onClick={() => setSelection({
            kind: "none"
          })} style={{
            fontFamily: FONT_STACK
          }} className="[font-size:13px] [color:#1f42aa] [font-weight:600] [background:none] [border:none] [cursor:pointer] [padding:0px]">
                {t.frictions.clearSelection}
              </button>}
          </div>

          {/* Tomtilstanden står allerede der diagrammet skulle vært; å gjenta den
              her ville sagt det samme to ganger på én skjerm. */}
          {stories.length === 0 ? null : selection.kind === "none" ? <GroupedByFriction stories={stories} /> : <StoryGrid stories={results} />}
        </section>
      </div>;
}

// ─── Chord diagram ───

function ChordDiagram({
  matrix,
  selection,
  onSelect
}: {
  matrix: number[][];
  selection: Selection;
  onSelect: (s: Selection) => void;
}) {
  const { t, tax } = useI18n();
  const ref = useRef<SVGSVGElement>(null);
  const size = 520;
  const outerRadius = size / 2 - 40;
  const innerRadius = outerRadius - 14;
  const chords = useMemo(() => {
    const layout = d3chord().padAngle(0.05).sortSubgroups((a, b) => b - a);
    return layout(matrix);
  }, [matrix]);
  const arcGen = useMemo(() => d3arc<d3.ChordGroup>().innerRadius(innerRadius).outerRadius(outerRadius), [innerRadius, outerRadius]);
  const ribbonGen = useMemo(() => d3ribbon<d3.Chord, d3.ChordSubgroup>().radius(innerRadius), [innerRadius]);

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
    if (selection.kind === "friction") return selection.friction === a || selection.friction === b;
    if (selection.kind === "pair") return selection.a === a && selection.b === b || selection.a === b && selection.b === a;
    return false;
  };
  return <div className="[width:100%] [position:relative]">
      <svg ref={ref} viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`} className="[width:100%] [height:auto] [display:block]">
        {/* Ribbons */}
        <g>
          {chords.map((c, i) => {
          const a = FRICTION_KEYS[c.source.index];
          const b = FRICTION_KEYS[c.target.index];
          const selectedPair = isPairSelected(a, b);
          const anyActive = selection.kind !== "none";
          const opacity = anyActive ? selectedPair ? 0.85 : 0.05 : 0.45;
          const color = tax.frictions[a].color;
          const d = ribbonGen(c);
          return <path key={`r-${i}`} d={d ?? ""} fill={color} fillOpacity={opacity} stroke={color} strokeOpacity={selectedPair ? 0.9 : 0.15} onClick={e => {
            e.stopPropagation();
            if (a === b) {
              onSelect({
                kind: "friction",
                friction: a
              });
            } else {
              onSelect({
                kind: "pair",
                a,
                b
              });
            }
          }} className="[cursor:pointer] [transition:fill-opacity_.15s,_stroke-opacity_.15s]">
                <title>
                  {a === b
                    ? fill(t.frictions.singleTooltip, { a: tax.frictions[a].label, n: c.source.value })
                    : fill(t.frictions.pairTooltip, {
                        a: tax.frictions[a].label,
                        b: tax.frictions[b].label,
                        n: c.source.value,
                      })}
                </title>
              </path>;
        })}
        </g>

        {/* Arc segments + labels */}
        <g>
          {chords.groups.map(g => {
          const k = FRICTION_KEYS[g.index];
          const selected = isFrictionSelected(k);
          const anyActive = selection.kind !== "none";
          const color = tax.frictions[k].color;
          const d = arcGen(g);

          // Label position along the arc midpoint
          const angle = (g.startAngle + g.endAngle) / 2;
          const labelRadius = outerRadius + 18;
          const x = Math.sin(angle) * labelRadius;
          const y = -Math.cos(angle) * labelRadius;
          const anchor = angle > Math.PI ? "end" : "start";
          const labelRotation = angle * 180 / Math.PI - 90;
          const flipped = angle > Math.PI;
          return <g key={`g-${g.index}`}>
                <path d={d ?? ""} fill={color} fillOpacity={anyActive ? selected ? 1 : 0.25 : 0.9} stroke="#ffffff" strokeWidth={1.5} onClick={e => {
              e.stopPropagation();
              onSelect(selection.kind === "friction" && selection.friction === k ? {
                kind: "none"
              } : {
                kind: "friction",
                friction: k
              });
            }} onMouseEnter={() => {
              if (selection.kind === "none") {
                onSelect({
                  kind: "friction",
                  friction: k
                });
              }
            }} onMouseLeave={() => {
              if (selection.kind === "friction" && selection.friction === k) {
                onSelect({
                  kind: "none"
                });
              }
            }} className="[cursor:pointer] [transition:fill-opacity_.15s]">
                  <title>{tax.frictions[k].label}</title>
                </path>
                <text x={x} y={y} fontSize={13} fontWeight={selected ? 700 : 500} textAnchor={anchor} fill={selected ? color : "#2c2c2c"} transform={`rotate(${flipped ? labelRotation + 180 : labelRotation}, ${x}, ${y})`} style={{
              fontFamily: FONT_STACK
            }} className="[pointer-events:none] [dominant-baseline:middle]">
                  {tax.frictions[k].label}
                </text>
              </g>;
        })}
        </g>

        {/* Background click — clear selection */}
        <rect x={-size / 2} y={-size / 2} width={size} height={size} fill="transparent" onClick={() => onSelect({
        kind: "none"
      })} style={{
        pointerEvents: selection.kind === "none" ? "none" : "auto"
      }} />
      </svg>

      <p className="[font-size:12px] [color:#9a9a9a] [text-align:center] [margin-top:8px]">
        {t.frictions.chordHint}
      </p>
    </div>;
}

// ─── Selection heading ───

function SelectionHeading({
  selection,
  count
}: {
  selection: Selection;
  count: number;
}) {
  const { t, tax } = useI18n();
  if (selection.kind === "none") {
    return <>{t.frictions.allGrouped}</>;
  }
  if (selection.kind === "friction") {
    return <>
        <span style={{
        color: tax.frictions[selection.friction].color
      }}>
          {tax.frictions[selection.friction].label}
        </span>{" "}
        &middot;{" "}
        <span className="[color:#808080] [font-weight:400] [font-size:18px]">
          {count} {count === 1 ? t.common.storyOne : t.common.storyOther}
        </span>
      </>;
  }
  return <>
      <span style={{
      color: tax.frictions[selection.a].color
    }}>
        {tax.frictions[selection.a].label}
      </span>{" "}
      +{" "}
      <span style={{
      color: tax.frictions[selection.b].color
    }}>
        {tax.frictions[selection.b].label}
      </span>{" "}
      &middot;{" "}
      <span className="[color:#808080] [font-weight:400] [font-size:18px]">
        {count} {count === 1 ? t.frictions.sharedBothOne : t.frictions.sharedBothOther}
      </span>
    </>;
}

// ─── Story list layouts ───

// Skilles fra StoryGrids tomtilstand med vilje: der betyr tomt «filteret traff
// ingenting», her betyr det «korpuset er tomt ennå». De to krever ulikt svar.
/**
 * How many distinct frictions the corpus actually touches. The chord diagram
 * draws each friction with an arc proportional to its weight, so anything at
 * zero collapses to a hairline and its label stacks on top of its neighbours'.
 * Below this threshold the circle stops reading as "sparse" and starts reading
 * as "broken", so we show counts instead.
 */
const MIN_FRICTIONS_FOR_CHORD = 3;

function representedFrictions(stories: CorpusNode[]): CareFriction[] {
  const seen = new Set<CareFriction>();
  for (const s of stories) {
    for (const f of s.frictions ?? []) {
      if (FRICTION_KEYS.includes(f)) seen.add(f);
    }
  }
  return FRICTION_KEYS.filter((k) => seen.has(k));
}

/**
 * The thin-corpus stand-in for the chord diagram: every friction with its real
 * count, nothing implied that the material does not support. Clicking a row
 * filters exactly like clicking an arc does.
 */
function FrictionCounts({
  stories,
  selection,
  onSelect,
}: {
  stories: CorpusNode[];
  selection: Selection;
  onSelect: (s: Selection) => void;
}) {
  const { t, tax } = useI18n();
  const counts = FRICTION_KEYS.map((k) => ({
    key: k,
    count: stories.filter((s) => s.frictions?.includes(k)).length,
  }));
  const max = Math.max(1, ...counts.map((c) => c.count));

  return <div className="[padding:8px_0]">
      <p className="[font-size:15px] [line-height:1.7] [color:#666666] [margin-bottom:24px] [max-width:620px]">
        {t.frictions.countsIntro}
      </p>
      <ul className="[list-style:none] [padding:0px] [margin:0px]">
        {counts.map(({ key, count }) => {
          const active = selection.kind === "friction" && selection.friction === key;
          return <li key={key} className="[margin-bottom:12px]">
              <button
                type="button"
                onClick={() => onSelect(active ? { kind: "none" } : { kind: "friction", friction: key })}
                aria-pressed={active}
                style={{ fontFamily: FONT_STACK, background: "transparent" }}
                className="[display:flex] [align-items:center] [gap:12px] [width:100%] [border:none] [padding:4px_0] [cursor:pointer] [text-align:left]"
              >
                <span style={{ color: tax.frictions[key].color, fontWeight: active ? 700 : 600 }} className="[font-size:15px] [flex:0_0_150px]">
                  {tax.frictions[key].label}
                </span>
                <span
                  aria-hidden
                  style={{ background: tax.frictions[key].color, width: `${(count / max) * 100}%`, opacity: count === 0 ? 0.15 : 1 }}
                  className="[height:10px] [min-width:10px] [border-radius:5px]"
                />
                <span className="[font-size:13px] [color:#808080] [flex:0_0_90px]">
                  {count} {count === 1 ? t.common.storyOne : t.common.storyOther}
                </span>
              </button>
            </li>;
        })}
      </ul>
    </div>;
}

function CorpusEmpty({ text }: { text: string }) {
  return <p className="[font-size:17px] [line-height:1.7] [color:#666666] [padding:24px_0] [max-width:620px]">
      {text}
    </p>;
}

function StoryGrid({
  stories
}: {
  stories: CorpusNode[];
}) {
  const { t } = useI18n();
  if (stories.length === 0) {
    return <p className="[font-size:17px] [color:#808080] [padding:24px_0]">
        {t.frictions.noCombination}
      </p>;
  }
  return <div className="[display:grid] [grid-template-columns:repeat(auto-fill,_minmax(300px,_1fr))] [gap:16px]">
      {stories.map(s => <StoryCard key={s.id} story={s} />)}
    </div>;
}
function GroupedByFriction({
  stories
}: {
  stories: CorpusNode[];
}) {
  const { t, tax } = useI18n();
  return <div>
      {FRICTION_KEYS.map(k => {
      const bucket = stories.filter(s => s.frictions?.includes(k));
      if (bucket.length === 0) return null;
      return <div key={k} className="[margin-bottom:48px]">
            <div style={{
          borderBottom: `2px solid ${tax.frictions[k].color}`
        }} className="[display:flex] [align-items:center] [gap:10px] [margin-bottom:16px] [padding-bottom:8px]">
              <span aria-hidden style={{
            background: tax.frictions[k].color
          }} className="[width:12px] [height:12px] [border-radius:50%]" />
              <h3 className="[font-size:20px] [font-weight:600] [color:#2a2859]">
                {tax.frictions[k].label}
              </h3>
              <span className="[font-size:13px] [color:#9a9a9a]">
                {bucket.length} {bucket.length === 1 ? t.common.storyOne : t.common.storyOther}
              </span>
            </div>
            <div className="[display:grid] [grid-template-columns:repeat(auto-fill,_minmax(300px,_1fr))] [gap:16px]">
              {bucket.map(s => <StoryCard key={s.id} story={s} />)}
            </div>
          </div>;
    })}
    </div>;
}
function StoryCard({
  story
}: {
  story: CorpusNode;
}) {
  const { tax, href } = useI18n();
  const preview = story.body.split("\n\n")[0].slice(0, 140);
  return <Link href={href(`/internal/content?tab=nodes&focus=${encodeURIComponent(story.id)}`)} className="[display:block] [padding:24px] [background:#ffffff] [border:1px_solid_#e6e6e6] [border-radius:8px] [text-decoration:none] [color:#2c2c2c]">
      <h4 className="[font-size:17px] [font-weight:600] [line-height:1.3] [margin-bottom:8px] [color:#2a2859]">
        {story.title}
      </h4>
      <p className="[font-size:13px] [line-height:1.55] [color:#666666] [margin-bottom:16px]">
        {preview}
        {story.body.length > 140 ? "…" : ""}
      </p>
      <div className="[display:flex] [flex-wrap:wrap] [gap:4px]">
        {story.frictions?.map(f => <span key={f} style={{
        background: tax.frictions[f]?.color + "18",
        color: tax.frictions[f]?.color
      }} className="[font-size:10px] [padding:2px_8px] [border-radius:4px] [font-weight:500]">
            {tax.frictions[f]?.label}
          </span>)}
      </div>
    </Link>;
}
