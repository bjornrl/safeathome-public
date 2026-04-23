"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FRICTIONS, QUALITIES } from "@/lib/constants";
import type { CareFriction, CareQuality, PublicConnection, PublicStory } from "@/lib/types";

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';
const SECTION_CAP = 6;

interface Group {
  kind: "friction" | "quality";
  key: string;
  label: string;
  color: string;
  stories: PublicStory[];
}

function buildGroups(
  current: PublicStory,
  allStories: PublicStory[],
  connections: PublicConnection[],
): Group[] {
  const currentFrictions = new Set<CareFriction>(current.frictions ?? []);
  const currentQualities = new Set<CareQuality>(current.qualities ?? []);
  const others = allStories.filter((s) => s.id !== current.id);

  // Map of compound key "friction:rotate" / "quality:cultural_anchoring" -> group
  const groups = new Map<string, Group>();
  const addToGroup = (kind: Group["kind"], key: string, other: PublicStory) => {
    const compound = `${kind}:${key}`;
    const meta =
      kind === "friction"
        ? FRICTIONS[key as CareFriction]
        : QUALITIES[key as CareQuality];
    if (!meta) return; // unknown key — skip
    let g = groups.get(compound);
    if (!g) {
      g = { kind, key, label: meta.label, color: meta.color, stories: [] };
      groups.set(compound, g);
    }
    if (!g.stories.some((s) => s.id === other.id)) {
      g.stories.push(other);
    }
  };

  // 1. Shared categories
  for (const other of others) {
    for (const f of other.frictions ?? []) {
      if (currentFrictions.has(f)) addToGroup("friction", f, other);
    }
    for (const q of other.qualities ?? []) {
      if (currentQualities.has(q)) addToGroup("quality", q, other);
    }
  }

  // 2. Explicit connections
  for (const conn of connections) {
    if (conn.from_story_id !== current.id && conn.to_story_id !== current.id) continue;
    const otherId = conn.from_story_id === current.id ? conn.to_story_id : conn.from_story_id;
    const other = allStories.find((s) => s.id === otherId);
    if (!other) continue;
    const kind: Group["kind"] = conn.category_kind === "quality" ? "quality" : "friction";
    const key = conn.category_key ?? conn.friction;
    if (!key) continue;
    addToGroup(kind, key, other);
  }

  return [...groups.values()].sort((a, b) => {
    if (a.stories.length !== b.stories.length) return b.stories.length - a.stories.length;
    if (a.kind === "friction" && b.kind !== "friction") return -1;
    if (b.kind === "friction" && a.kind !== "friction") return 1;
    return a.label.localeCompare(b.label);
  });
}

export default function ConnectedStories({
  story,
  allStories,
  connections,
}: {
  story: PublicStory;
  allStories: PublicStory[];
  connections: PublicConnection[];
}) {
  const groups = useMemo(
    () => buildGroups(story, allStories, connections),
    [story, allStories, connections],
  );

  return (
    <section className="[margin-top:56px] [padding-top:32px] [border-top:1px_solid_#e6e6e6]" style={{ fontFamily: FONT_STACK }}>
      <p className="[font-size:11px] [font-weight:600] [text-transform:uppercase] [letter-spacing:0.14em] [color:#808080] [margin-bottom:24px]">
        Connected stories
      </p>

      {groups.length === 0 ? (
        <p className="[font-size:14px] [color:#9a9a9a] [font-style:italic]">
          No connected stories yet.
        </p>
      ) : (
        <div className="[display:flex] [flex-direction:column] [gap:32px]">
          {groups.map((g) => (
            <GroupSection key={`${g.kind}:${g.key}`} group={g} />
          ))}
        </div>
      )}
    </section>
  );
}

function GroupSection({ group }: { group: Group }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? group.stories : group.stories.slice(0, SECTION_CAP);
  const hiddenCount = group.stories.length - SECTION_CAP;

  return (
    <div style={{ borderLeft: `3px solid ${group.color}`, paddingLeft: 16 }}>
      <div className="[display:flex] [align-items:baseline] [gap:10px] [margin-bottom:12px]">
        <span
          aria-hidden
          style={{ width: 10, height: 10, borderRadius: "50%", background: group.color }}
        />
        <h3 className="[font-size:16px] [font-weight:600] [color:#2a2859]">{group.label}</h3>
        <span className="[font-size:12px] [color:#9a9a9a]">
          {group.stories.length} {group.stories.length === 1 ? "story" : "stories"}
        </span>
      </div>
      <div className="[display:grid] [grid-template-columns:repeat(auto-fill,_minmax(220px,_1fr))] [gap:8px]">
        {visible.map((s) => (
          <CompactStoryCard key={s.id} story={s} accent={group.color} />
        ))}
      </div>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{ fontFamily: FONT_STACK }}
          className="[margin-top:12px] [font-size:12px] [font-weight:600] [color:#1f42aa] [background:transparent] [border:none] [cursor:pointer] [padding:0px]"
        >
          {expanded ? "Show fewer" : `Show all ${group.stories.length}`}
        </button>
      )}
    </div>
  );
}

function CompactStoryCard({ story, accent }: { story: PublicStory; accent: string }) {
  const preview = story.body.split("\n\n")[0].slice(0, 90);
  return (
    <Link
      href={`/story/${story.id}`}
      className="[display:block] [padding:12px] [background:#ffffff] [border:1px_solid_#e6e6e6] [border-radius:8px] [text-decoration:none] [color:#2c2c2c]"
      style={{ borderTop: `2px solid ${accent}` }}
    >
      <h4 className="[font-size:14px] [font-weight:600] [line-height:1.3] [color:#2a2859] [margin-bottom:4px]">
        {story.title}
      </h4>
      <p className="[font-size:12px] [line-height:1.45] [color:#666666]">
        {preview}
        {story.body.length > 90 ? "…" : ""}
      </p>
    </Link>
  );
}
