import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import { FRICTIONS, QUALITIES, SCALES } from "@/lib/constants";
import { getAllStories, getConnections, getDesignResponses, type SolutionItem } from "@/lib/queries";
import { STAGES } from "@/lib/seed-solutions";
import type { PublicStory } from "@/lib/types";
import ConnectedStories from "./ConnectedStories";
const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';
interface PageProps {
  params: Promise<{
    id: string;
  }>;
}
export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const {
    id
  } = await params;
  const stories = await getAllStories();
  const story = stories.find(s => s.id === id);
  if (!story) {
    return {
      title: "Story not found — safe@home"
    };
  }
  return {
    title: `${story.title} — safe@home`,
    description: story.body.split("\n\n")[0].slice(0, 160)
  };
}
function findLinkedResponses(story: PublicStory, responses: SolutionItem[]): SolutionItem[] {
  const explicit = responses.filter(r => r.source_stories.includes(story.id));
  const explicitIds = new Set(explicit.map(r => r.id));
  const storyFrictions = new Set(story.frictions ?? []);
  const storyQualities = new Set(story.qualities ?? []);
  const byCategory = responses.filter(r =>
    !explicitIds.has(r.id) &&
    (r.frictions.some(f => storyFrictions.has(f)) || r.qualities.some(q => storyQualities.has(q)))
  );
  return [...explicit, ...byCategory];
}
export default async function StoryPage({
  params
}: PageProps) {
  const {
    id
  } = await params;
  const [stories, connections, responses] = await Promise.all([getAllStories(), getConnections(), getDesignResponses()]);
  const story = stories.find(s => s.id === id);
  if (!story) notFound();
  const linkedResponses = findLinkedResponses(story, responses);
  return <>
      <Nav />
      <main style={{
      fontFamily: FONT_STACK
    }} className="[max-width:760px] [margin:0_auto] [padding:56px_24px_96px]">
        <Link href="/explore" className="[display:inline-flex] [align-items:center] [gap:6px] [font-size:13px] [color:#1f42aa] [text-decoration:none] [margin-bottom:32px] [font-weight:500]">
          ← Back to the map
        </Link>

        <p className="[font-size:12px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.14em] [color:#808080] [margin-bottom:16px]">
          {SCALES[story.map_scale]?.label ?? story.map_scale}
          {story.field_site && <> · {story.field_site}</>}
        </p>

        <h1 className="[font-size:clamp(32px,_5vw,_48px)] [font-weight:700] [line-height:1.1] [letter-spacing:-0.02em] [color:#2a2859] [margin-bottom:24px]">
          {story.title}
        </h1>

        <div className="[display:flex] [flex-wrap:wrap] [gap:6px] [margin-bottom:40px]">
          {story.frictions?.map(f => <Link key={f} href={`/frictions?friction=${f}`} style={{
          background: FRICTIONS[f]?.color + "18",
          color: FRICTIONS[f]?.color
        }} className="[font-size:11px] [padding:3px_10px] [border-radius:4px] [font-weight:500] [text-decoration:none]">
              {FRICTIONS[f]?.label}
            </Link>)}
          {story.qualities?.map(q => <Link key={q} href="/qualities" style={{
          background: QUALITIES[q]?.color + "18",
          color: QUALITIES[q]?.color
        }} className="[font-size:11px] [padding:3px_10px] [border-radius:4px] [font-weight:500] [text-decoration:none]">
              {QUALITIES[q]?.label}
            </Link>)}
        </div>

        <article>
          {story.body.split("\n\n").map((p, i) => <p key={i} className="[font-size:19px] [line-height:1.7] [color:#2c2c2c] [margin-bottom:24px]">
              {p}
            </p>)}
        </article>

        {story.author_credit && <p className="[font-size:12px] [color:#9a9a9a] [margin-top:40px]">
            {story.author_credit}
          </p>}

        <ConnectedStories story={story} allStories={stories} connections={connections} />

        {linkedResponses.length > 0 && <section className="[margin-top:56px] [padding:32px] [background:#f2f2f2] [border-radius:8px] [border:1px_solid_#e6e6e6]">
            <p className="[font-size:11px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.14em] [color:#808080] [margin-bottom:8px]">
              Design response
            </p>
            <h2 className="[font-size:24px] [font-weight:700] [color:#2a2859] [margin-bottom:24px] [letter-spacing:-0.01em]">
              How the design team is responding
            </h2>
            <div className="[display:grid] [gap:8px]">
              {linkedResponses.map(r => {
            const stage = STAGES.find(s => s.key === r.stage);
            const storyFrictions = new Set(story.frictions ?? []);
            const storyQualities = new Set(story.qualities ?? []);
            return <article key={r.id} className="[display:block] [padding:16px] [background:#ffffff] [border:1px_solid_#e6e6e6] [border-radius:8px] [color:#2c2c2c]">
                    <span style={{
                color: stage?.color ?? "#808080"
              }} className="[font-size:11px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.12em]">
                      {stage?.label ?? r.stage}
                    </span>
                    <h3 className="[font-size:18px] [font-weight:600] [color:#2a2859] [margin-top:4px] [margin-bottom:8px]">
                      {r.title}
                    </h3>
                    <p className="[font-size:14px] [line-height:1.55] [color:#666666] [margin-bottom:12px]">
                      {r.description}
                    </p>
                    {(r.frictions.length > 0 || r.qualities.length > 0) && (
                      <div className="[display:flex] [flex-wrap:wrap] [gap:4px]">
                        {r.frictions.map(f => {
                          const emphasized = storyFrictions.has(f);
                          const color = FRICTIONS[f]?.color ?? "#808080";
                          return <Link key={f} href={`/frictions?friction=${f}`} style={{
                            background: emphasized ? color : color + "18",
                            color: emphasized ? "#ffffff" : color,
                            fontWeight: emphasized ? 600 : 500,
                          }} className="[font-size:11px] [padding:3px_10px] [border-radius:4px] [text-decoration:none]">
                            {FRICTIONS[f]?.label ?? f}
                          </Link>;
                        })}
                        {r.qualities.map(q => {
                          const emphasized = storyQualities.has(q);
                          const color = QUALITIES[q]?.color ?? "#808080";
                          return <Link key={q} href={`/qualities#${q}`} style={{
                            background: emphasized ? color : color + "18",
                            color: emphasized ? "#ffffff" : color,
                            fontWeight: emphasized ? 600 : 500,
                          }} className="[font-size:11px] [padding:3px_10px] [border-radius:4px] [text-decoration:none]">
                            {QUALITIES[q]?.label ?? q}
                          </Link>;
                        })}
                      </div>
                    )}
                  </article>;
          })}
            </div>
          </section>}
      </main>
    </>;
}
