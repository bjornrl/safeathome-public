"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import { FRICTIONS, WP_LABELS, type WpId } from "@/lib/constants";
import { STAGES, type SolutionStage } from "@/lib/seed-solutions";
import { getDesignResponses, getAllStories, getPublishedWpReports, type SolutionItem } from "@/lib/queries";
import type { PublicStory, WpReport } from "@/lib/types";

const WP_ORDER: WpId[] = ["wp1", "wp2", "wp3", "wp4"];
const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';
export default function SolutionsPage() {
  const [solutions, setSolutions] = useState<SolutionItem[]>([]);
  const [stories, setStories] = useState<PublicStory[]>([]);
  const [wpReports, setWpReports] = useState<WpReport[]>([]);
  const [activeStage, setActiveStage] = useState<SolutionStage | null>(null);
  useEffect(() => {
    Promise.all([getDesignResponses(), getAllStories(), getPublishedWpReports()]).then(([sol, st, wp]) => {
      setSolutions(sol);
      setStories(st);
      setWpReports(wp);
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

        <ProgressSection reports={wpReports} />
      </main>
    </>;
}

// ─── Progress section ───

function ProgressSection({ reports }: { reports: WpReport[] }) {
  const [monthFilter, setMonthFilter] = useState<string>("all");

  // Unique month keys ("YYYY-MM-01") present in the published reports, sorted
  // newest first. Used to populate the filter dropdown.
  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of reports) set.add(r.month);
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [reports]);

  // Group by wp_id, only recognising the four known work packages.
  // When a specific month is selected, narrow the set first.
  const byWp = useMemo(() => {
    const groups: Record<WpId, WpReport[]> = { wp1: [], wp2: [], wp3: [], wp4: [] };
    for (const r of reports) {
      if (monthFilter !== "all" && r.month !== monthFilter) continue;
      if ((WP_ORDER as string[]).includes(r.wp_id)) {
        groups[r.wp_id as WpId].push(r);
      }
    }
    // Reports are already month desc + wp_id asc from the query.
    return groups;
  }, [reports, monthFilter]);

  const visibleWps = WP_ORDER.filter((k) => byWp[k].length > 0);
  const hasAnyPublished = reports.length > 0;

  return (
    <section className="[margin-top:96px] [padding-top:48px] [border-top:1px_solid_#e6e6e6]">
      <p className="[font-size:12px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.18em] [color:#808080] [margin-bottom:16px]">
        Progress
      </p>
      <h2 className="[font-size:clamp(28px,_4vw,_40px)] [font-weight:700] [color:#2a2859] [margin-bottom:16px] [letter-spacing:-0.02em]">
        Månedlige rapporter fra arbeidspakkene.
      </h2>
      <p className="[font-size:17px] [line-height:1.7] [color:#666666] [max-width:680px] [margin-bottom:24px]">
        Månedlige intervjuer med hver arbeidspakke, gjennomført av Comte, som
        oppsummerer hvor forskningen står.
      </p>

      {monthOptions.length > 0 && (
        <div className="[display:flex] [align-items:center] [gap:12px] [flex-wrap:wrap] [margin-bottom:32px]">
          <label className="[font-size:11px] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.12em] [color:#808080]" htmlFor="wp-month-filter">
            Måned
          </label>
          <select
            id="wp-month-filter"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            style={{ fontFamily: FONT_STACK }}
            className="[padding:8px_16px] [border:1px_solid_#e6e6e6] [background:#ffffff] [font-size:14px] [color:#2a2859] [cursor:pointer]"
          >
            <option value="all">Alle måneder</option>
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {formatMonthLong(m)}
              </option>
            ))}
          </select>
          {monthFilter !== "all" && (
            <button
              type="button"
              onClick={() => setMonthFilter("all")}
              style={{ fontFamily: FONT_STACK }}
              className="[font-size:12px] [color:#1f42aa] [font-weight:600] [background:transparent] [border:none] [cursor:pointer] [padding:0px]"
            >
              Vis alle måneder
            </button>
          )}
        </div>
      )}

      {!hasAnyPublished ? (
        <p className="[font-size:15px] [line-height:1.7] [color:#808080] [font-style:italic]">
          De første månedsrapportene skrives nå. Kom tilbake snart.
        </p>
      ) : visibleWps.length === 0 ? (
        <p className="[font-size:15px] [line-height:1.7] [color:#808080] [font-style:italic]">
          Ingen rapporter for {formatMonthLong(monthFilter)}.
        </p>
      ) : (
        <div className="[display:grid] [grid-template-columns:repeat(auto-fit,_minmax(320px,_1fr))] [gap:24px]">
          {visibleWps.map((wp) => (
            <WpColumn key={wp} wp={wp} reports={byWp[wp]} />
          ))}
        </div>
      )}
    </section>
  );
}

function WpColumn({ wp, reports }: { wp: WpId; reports: WpReport[] }) {
  const [archiveOpen, setArchiveOpen] = useState(false);
  const label = WP_LABELS[wp];
  const [latest, ...earlier] = reports;

  return (
    <article className="[background:#ffffff] [border:1px_solid_#e6e6e6] [border-radius:8px] [padding:24px] [display:flex] [flex-direction:column] [gap:16px]">
      <header>
        <p className="[font-size:11px] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.12em] [color:#1f42aa] [margin-bottom:4px]">
          {label.label}
        </p>
        <p className="[font-size:13px] [color:#808080] [line-height:1.5]">{label.subtitle}</p>
      </header>

      {!latest ? (
        <p className="[font-size:13px] [color:#9a9a9a] [font-style:italic]">
          Ingen publiserte rapporter ennå.
        </p>
      ) : (
        <>
          <FeaturedReport report={latest} />
          {earlier.length > 0 && (
            <div className="[margin-top:8px] [border-top:1px_solid_#f2f2f2] [padding-top:16px]">
              <button
                type="button"
                onClick={() => setArchiveOpen((v) => !v)}
                aria-expanded={archiveOpen}
                style={{ fontFamily: FONT_STACK }}
                className="[font-size:12px] [font-weight:600] [color:#1f42aa] [background:transparent] [border:none] [cursor:pointer] [padding:0px]"
              >
                {archiveOpen ? "Skjul tidligere måneder" : `Tidligere måneder · ${earlier.length}`}
              </button>
              {archiveOpen && (
                <ul className="[list-style:none] [padding:0px] [margin:12px_0_0] [display:flex] [flex-direction:column] [gap:12px]">
                  {earlier.map((r) => (
                    <li key={r.id}>
                      <ArchiveReport report={r} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </article>
  );
}

function FeaturedReport({ report }: { report: WpReport }) {
  return (
    <div className="[display:flex] [flex-direction:column] [gap:12px]">
      <p className="[font-size:15px] [font-weight:600] [color:#2a2859]">{formatMonthLong(report.month)}</p>
      {report.summary && (
        <p className="[font-size:14px] [line-height:1.65] [color:#2c2c2c]">{report.summary}</p>
      )}
      {(report.highlights ?? []).length > 0 && (
        <ul className="[list-style:disc] [padding-left:20px] [margin:0]">
          {report.highlights.map((h, i) => (
            <li key={i} className="[font-size:13px] [line-height:1.55] [color:#2c2c2c] [margin-bottom:4px]">
              {h}
            </li>
          ))}
        </ul>
      )}
      {report.next_steps && (
        <p className="[font-size:12px] [color:#666666] [line-height:1.6] [padding-left:12px] [border-left:2px_solid_#e6e6e6]">
          <span className="[font-weight:600] [color:#2a2859]">Neste steg:</span> {report.next_steps}
        </p>
      )}
      <p className="[font-size:11px] [color:#9a9a9a]">
        {report.interviewer}
        {report.interviewee && <> · med {report.interviewee}</>}
      </p>
    </div>
  );
}

function ArchiveReport({ report }: { report: WpReport }) {
  return (
    <div className="[padding:12px] [background:#f9f9f9] [border:1px_solid_#f2f2f2] [border-radius:6px] [display:flex] [flex-direction:column] [gap:6px]">
      <p className="[font-size:12px] [font-weight:600] [color:#2a2859]">{formatMonthShort(report.month)}</p>
      {report.summary && (
        <p className="[font-size:12px] [line-height:1.55] [color:#666666]">
          {report.summary.length > 140 ? `${report.summary.slice(0, 140)}…` : report.summary}
        </p>
      )}
      <p className="[font-size:10px] [color:#9a9a9a]">
        {report.interviewer}
        {report.interviewee && <> · med {report.interviewee}</>}
      </p>
    </div>
  );
}

function formatMonthLong(isoDate: string): string {
  const d = new Date(isoDate);
  const formatted = d.toLocaleDateString("nb-NO", { month: "long", year: "numeric" });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatMonthShort(isoDate: string): string {
  const d = new Date(isoDate);
  const formatted = d.toLocaleDateString("nb-NO", { month: "short", year: "numeric" });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
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
