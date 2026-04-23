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
  const byStage = (stage: SolutionStage) => solutions.filter(s => s.stage === stage).length;
  const filtered = activeStage ? solutions.filter(s => s.stage === activeStage) : solutions;
  const storyById = (id: string) => stories.find(s => s.id === id);
  return <>
      <Nav />
      <main style={{
      fontFamily: FONT_STACK
    }} className="[max-width:1120px] [margin:0_auto] [padding:72px_24px_96px]">
        <p className="[font-size:12px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.18em] [color:#808080] [margin-bottom:16px]">
          Design responses
        </p>
        <h1 className="[font-size:clamp(38px,_6vw,_60px)] [font-weight:700] [line-height:1.05] [letter-spacing:-0.02em] [color:#2a2859] [margin-bottom:24px]">
          From observation to intervention.
        </h1>
        <p className="[font-size:19px] [line-height:1.7] [color:#666666] [max-width:680px] [margin-bottom:48px]">
          When the research reveals a friction, the design team responds. These
          are the interventions being developed, tested, and refined &mdash;
          tracing the journey from field observation to practical solution.
        </p>

        {/* Pipeline */}
        <section className="[background:#ffffff] [border:1px_solid_#e6e6e6] [border-radius:8px] [padding:24px] [margin-bottom:48px]">
          <p className="[font-size:11px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.14em] [color:#808080] [margin-bottom:16px]">
            Pipeline
          </p>
          <div className="[display:grid] [grid-template-columns:repeat(auto-fit,_minmax(140px,_1fr))] [gap:8px] [align-items:stretch]">
            {STAGES.map((stage, i) => {
            const count = byStage(stage.key);
            const active = activeStage === stage.key;
            return <button key={stage.key} type="button" onClick={() => setActiveStage(prev => prev === stage.key ? null : stage.key)} style={{
              background: active ? stage.color + "12" : "#f9f9f9",
              border: `1px solid ${active ? stage.color : "#e6e6e6"}`,
              fontFamily: FONT_STACK
            }} className="[display:flex] [flex-direction:column] [align-items:flex-start] [gap:8px] [padding:16px] [border-radius:8px] [cursor:pointer] [text-align:left] [position:relative]">
                  <span className="[display:flex] [align-items:center] [gap:8px] [font-size:11px] [font-weight:600] [color:#808080] [letter-spacing:0.08em]">
                    <span aria-hidden style={{
                  background: stage.color
                }} className="[width:10px] [height:10px] [border-radius:50%]" />
                    {`0${i + 1}`.slice(-2)}
                  </span>
                  <span className="[font-size:18px] [font-weight:600] [color:#2a2859]">
                    {stage.label}
                  </span>
                  <span className="[font-size:13px] [color:#666666]">
                    {count} {count === 1 ? "response" : "responses"}
                  </span>
                </button>;
          })}
          </div>
          {activeStage && <button type="button" onClick={() => setActiveStage(null)} style={{
          fontFamily: FONT_STACK
        }} className="[margin-top:16px] [font-size:12px] [color:#1f42aa] [font-weight:600] [background:none] [border:none] [cursor:pointer] [padding:0px]">
              Clear stage filter
            </button>}
        </section>

        {/* Cards */}
        <section>
          <h2 className="[font-size:26px] [font-weight:700] [color:#2a2859] [margin-bottom:24px] [letter-spacing:-0.01em]">
            {activeStage ? STAGES.find(s => s.key === activeStage)?.label + " responses" : "All responses"}
          </h2>

          {filtered.length === 0 ? <p className="[color:#808080]">
              No responses in this stage yet.
            </p> : <div className="[display:grid] [grid-template-columns:repeat(auto-fill,_minmax(320px,_1fr))] [gap:16px]">
              {filtered.map(sol => <SolutionCard key={sol.id} solution={sol} sourceStories={sol.source_stories.map(id => storyById(id)).filter((s): s is PublicStory => Boolean(s))} />)}
            </div>}
        </section>
      </main>
    </>;
}
function SolutionCard({
  solution,
  sourceStories
}: {
  solution: SolutionItem;
  sourceStories: PublicStory[];
}) {
  const stage = STAGES.find(s => s.key === solution.stage);
  return <article className="[background:#ffffff] [border:1px_solid_#e6e6e6] [border-radius:8px] [padding:24px] [display:flex] [flex-direction:column] [gap:16px]">
      <div className="[display:flex] [justify-content:space-between] [align-items:center] [gap:12px]">
        <span style={{
        color: stage?.color ?? "#808080",
        background: (stage?.color ?? "#808080") + "15"
      }} className="[font-size:11px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.12em] [padding:3px_10px] [border-radius:4px]">
          {stage?.label ?? solution.stage}
        </span>
      </div>

      <h3 className="[font-size:22px] [font-weight:700] [line-height:1.25] [color:#2a2859] [letter-spacing:-0.01em]">
        {solution.title}
      </h3>

      <p className="[font-size:15px] [line-height:1.6] [color:#2c2c2c]">
        {solution.description}
      </p>

      {solution.frictions.length > 0 && <div>
          <p className="[font-size:11px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.12em] [color:#808080] [margin-bottom:8px]">
            Addresses
          </p>
          <div className="[display:flex] [flex-wrap:wrap] [gap:5px]">
            {solution.frictions.map(f => <span key={f} style={{
          background: FRICTIONS[f]?.color + "18",
          color: FRICTIONS[f]?.color
        }} className="[font-size:11px] [padding:2px_8px] [border-radius:4px] [font-weight:500]">
                {FRICTIONS[f]?.label}
              </span>)}
          </div>
        </div>}

      {solution.outcome && <p className="[font-size:14px] [color:#666666] [line-height:1.6] [padding-left:16px] [border-left:2px_solid_#e6e6e6]">
          {solution.outcome}
        </p>}

      {sourceStories.length > 0 && <div className="[margin-top:auto] [padding-top:16px] [border-top:1px_solid_#e6e6e6]">
          <p className="[font-size:11px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.12em] [color:#808080] [margin-bottom:8px]">
            Based on
          </p>
          {sourceStories.map(s => <Link key={s.id} href={`/story/${s.id}`} className="[display:block] [font-size:14px] [color:#1f42aa] [text-decoration:none] [padding:4px_0] [font-weight:500]">
              {s.title} →
            </Link>)}
        </div>}
    </article>;
}
