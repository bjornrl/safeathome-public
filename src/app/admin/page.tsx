"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FRICTIONS, QUALITIES, SCALES } from "@/lib/constants";
import { RESOURCE_TYPE_LABELS } from "@/lib/seed-resources";
import { STAGES } from "@/lib/seed-solutions";
import type { CareFriction, CareQuality, FieldSite, HouseTheme, MapScale, ResourceType } from "@/lib/types";
const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';
type Tab = "stories" | "challenges" | "resources" | "descriptions";
const FRICTION_KEYS = Object.keys(FRICTIONS) as CareFriction[];
const QUALITY_KEYS = Object.keys(QUALITIES) as CareQuality[];
const THEMES: HouseTheme[] = ["front_door", "living_room", "kitchen", "bedroom", "study", "childrens_room", "garden", "phone", "prayer_space", "bathroom", "hallway"];
const FIELD_SITES: FieldSite[] = ["Alna", "Søndre Nordstrand", "Skien"];
const SCALE_KEYS = Object.keys(SCALES) as MapScale[];
const RESOURCE_TYPES = Object.keys(RESOURCE_TYPE_LABELS) as ResourceType[];

// ─── Page ───

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("stories");
  return <main style={{
    fontFamily: FONT_STACK
  }} className="[max-width:1200px] [margin:0_auto] [padding:40px_24px_96px]">
      <h1 className="[font-size:40px] [font-weight:700] [letter-spacing:-0.02em] [color:#2a2859] [margin-bottom:8px]">
        Content editor
      </h1>
      <p className="[font-size:15px] [color:#666666] [margin-bottom:24px] [line-height:1.6]">
        Post new insights, design challenges, or reading-room entries.
        Everything you create here lands in the matching Supabase table.
      </p>

      <nav className="[display:flex] [gap:8px] [margin-bottom:32px] [flex-wrap:wrap]">
        <TabButton active={tab === "stories"} onClick={() => setTab("stories")}>
          Insights
        </TabButton>
        <TabButton active={tab === "challenges"} onClick={() => setTab("challenges")}>
          Design challenges
        </TabButton>
        <TabButton active={tab === "resources"} onClick={() => setTab("resources")}>
          Resources
        </TabButton>
        <TabButton active={tab === "descriptions"} onClick={() => setTab("descriptions")}>
          Descriptions
        </TabButton>
      </nav>

      {tab === "stories" && <StoriesPanel />}
      {tab === "challenges" && <ChallengesPanel />}
      {tab === "resources" && <ResourcesPanel />}
      {tab === "descriptions" && <DescriptionsPanel />}
    </main>;
}
function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return <button type="button" onClick={onClick} style={{
    border: `1px solid ${active ? "#2a2859" : "#e6e6e6"}`,
    background: active ? "#2a2859" : "#ffffff",
    color: active ? "#ffffff" : "#2c2c2c",
    fontFamily: FONT_STACK
  }} className="[padding:8px_16px] [font-size:14px] [font-weight:600] [border-radius:8px] [cursor:pointer]">
      {children}
    </button>;
}

// ─── Stories (Insights) ───

interface StoryRow {
  id: string;
  title: string;
  body: string;
  theme: HouseTheme;
  field_site: FieldSite | null;
  frictions: CareFriction[];
  qualities: CareQuality[];
  map_scale: MapScale;
  latitude: number | null;
  longitude: number | null;
  author_credit: string | null;
  published: boolean;
  created_at?: string;
  sort_order?: number;
}
function StoriesPanel() {
  const [rows, setRows] = useState<StoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    const {
      data,
      error
    } = await supabase.from("public_stories").select("*").order("created_at", {
      ascending: false
    }).limit(25);
    setLoading(false);
    if (error) {
      console.warn("Load stories:", error.message);
      setRows([]);
    } else {
      setRows(data as StoryRow[] ?? []);
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);
  return <div className="[display:flex] [flex-direction:column] [gap:48px]">
      <div className="[display:grid] [grid-template-columns:minmax(320px,_1fr)_minmax(320px,_1.2fr)] [gap:32px]">
        <section>
          <SectionHeading>New insight</SectionHeading>
          <StoryForm onCreated={load} />
        </section>

        <section>
          <SectionHeading>Recent insights</SectionHeading>
          <ItemList loading={loading} rows={rows.map(r => ({
          id: r.id,
          title: r.title,
          subtitle: `${SCALES[r.map_scale]?.label ?? r.map_scale}${r.field_site ? ` · ${r.field_site}` : ""}`,
          published: r.published,
          tags: r.frictions
        }))} onTogglePublish={async (id, next) => {
          const {
            error
          } = await supabase.from("public_stories").update({
            published: next,
            published_at: next ? new Date().toISOString() : null
          }).eq("id", id);
          if (error) alert(error.message);else load();
        }} onDelete={async id => {
          if (!confirm("Delete this insight?")) return;
          const {
            error
          } = await supabase.from("public_stories").delete().eq("id", id);
          if (error) alert(error.message);else load();
        }} />
        </section>
      </div>

      <ConnectionsSection stories={rows.map(r => ({ id: r.id, title: r.title }))} />
    </div>;
}

// ─── Connections (between insights) ───

interface ConnectionRow {
  id: string;
  from_story_id: string;
  to_story_id: string;
  category_kind: "friction" | "quality";
  category_key: string;
  friction: string | null;
  connection_type: "direct" | "indirect";
  description: string | null;
  published: boolean;
}
function ConnectionsSection({ stories }: { stories: { id: string; title: string }[] }) {
  const [rows, setRows] = useState<ConnectionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("public_connections").select("*").order("created_at", { ascending: false }).limit(50);
    setLoading(false);
    if (error) console.warn("Load connections:", error.message);
    setRows((data as ConnectionRow[]) ?? []);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);
  const titleFor = useCallback((id: string) => stories.find(s => s.id === id)?.title ?? id, [stories]);
  return <div className="[display:grid] [grid-template-columns:minmax(320px,_1fr)_minmax(320px,_1.2fr)] [gap:32px]">
      <section>
        <SectionHeading>New connection</SectionHeading>
        <ConnectionForm stories={stories} onCreated={load} />
      </section>
      <section>
        <SectionHeading>Recent connections</SectionHeading>
        <ItemList loading={loading} rows={rows.map(r => {
          const labelSet = r.category_kind === "friction" ? FRICTIONS : QUALITIES;
          const label = (labelSet as Record<string, { label: string }>)[r.category_key]?.label ?? r.category_key;
          return {
            id: r.id,
            title: `${titleFor(r.from_story_id)} → ${titleFor(r.to_story_id)}`,
            subtitle: `${r.category_kind === "friction" ? "Friction" : "Quality"} · ${label} · ${r.connection_type}`,
            published: r.published,
            tags: r.description ? [r.description.slice(0, 60)] : []
          };
        })} onTogglePublish={async (id, next) => {
          const { error } = await supabase.from("public_connections").update({ published: next }).eq("id", id);
          if (error) alert(error.message);else load();
        }} onDelete={async id => {
          if (!confirm("Delete this connection?")) return;
          const { error } = await supabase.from("public_connections").delete().eq("id", id);
          if (error) alert(error.message);else load();
        }} />
      </section>
    </div>;
}

function ConnectionForm({ stories, onCreated }: { stories: { id: string; title: string }[]; onCreated: () => void }) {
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [categoryKind, setCategoryKind] = useState<"friction" | "quality">("friction");
  const [frictionKey, setFrictionKey] = useState<CareFriction>(FRICTION_KEYS[0]);
  const [qualityKey, setQualityKey] = useState<CareQuality>(QUALITY_KEYS[0]);
  const [connectionType, setConnectionType] = useState<"direct" | "indirect">("direct");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fromId || !toId) {
      setStatus({ kind: "err", msg: "Pick both a from and a to insight." });
      return;
    }
    if (fromId === toId) {
      setStatus({ kind: "err", msg: "From and to must be different insights." });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    const categoryKey = categoryKind === "friction" ? frictionKey : qualityKey;
    const row = {
      id: crypto.randomUUID(),
      from_story_id: fromId,
      to_story_id: toId,
      category_kind: categoryKind,
      category_key: categoryKey,
      friction: categoryKind === "friction" ? frictionKey : null,
      connection_type: connectionType,
      description: description.trim() || null,
      published
    };
    const { error } = await supabase.from("public_connections").insert(row);
    setSubmitting(false);
    if (error) {
      setStatus({ kind: "err", msg: error.message });
      return;
    }
    setStatus({ kind: "ok", msg: "Connection saved." });
    setDescription("");
    onCreated();
  }
  return <Form onSubmit={submit}>
      <FormRow>
        <FormField label="From insight">
          <select style={inputStyle} value={fromId} onChange={e => setFromId(e.target.value)} required>
            <option value="">Select…</option>
            {stories.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </FormField>
        <FormField label="To insight">
          <select style={inputStyle} value={toId} onChange={e => setToId(e.target.value)} required>
            <option value="">Select…</option>
            {stories.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </FormField>
      </FormRow>

      <FormRow>
        <FormField label="Category">
          <select style={inputStyle} value={categoryKind} onChange={e => setCategoryKind(e.target.value as "friction" | "quality")}>
            <option value="friction">Friction</option>
            <option value="quality">Quality</option>
          </select>
        </FormField>
        {categoryKind === "friction" ? <FormField label="Friction">
            <select style={inputStyle} value={frictionKey} onChange={e => setFrictionKey(e.target.value as CareFriction)}>
              {FRICTION_KEYS.map(k => <option key={k} value={k}>{FRICTIONS[k].label}</option>)}
            </select>
          </FormField> : <FormField label="Quality">
            <select style={inputStyle} value={qualityKey} onChange={e => setQualityKey(e.target.value as CareQuality)}>
              {QUALITY_KEYS.map(k => <option key={k} value={k}>{QUALITIES[k].label}</option>)}
            </select>
          </FormField>}
        <FormField label="Line">
          <select style={inputStyle} value={connectionType} onChange={e => setConnectionType(e.target.value as "direct" | "indirect")}>
            <option value="direct">Direct (solid)</option>
            <option value="indirect">Indirect (dashed)</option>
          </select>
        </FormField>
      </FormRow>

      <FormField label="Description (optional)">
        <textarea style={inputStyle} value={description} onChange={e => setDescription(e.target.value)} className="[min-height:80px]" placeholder="One sentence describing why these are connected." />
      </FormField>

      <PublishToggle value={published} onChange={setPublished} />
      <SubmitBar status={status} submitting={submitting} label="Save connection" />
    </Form>;
}
function StoryForm({
  onCreated
}: {
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mapScale, setMapScale] = useState<MapScale>("meso");
  const [theme, setTheme] = useState<HouseTheme>("living_room");
  const [fieldSite, setFieldSite] = useState<FieldSite | "">("Alna");
  const [frictions, setFrictions] = useState<CareFriction[]>([]);
  const [qualities, setQualities] = useState<CareQuality[]>([]);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [author, setAuthor] = useState("safe@home fieldwork team");
  const [published, setPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    kind: "ok" | "err";
    msg: string;
  } | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    setStatus(null);
    const row = {
      id: crypto.randomUUID(),
      title: title.trim(),
      body: body.trim(),
      theme,
      field_site: fieldSite || null,
      frictions,
      qualities,
      map_scale: mapScale,
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      author_credit: author.trim() || null,
      published,
      published_at: published ? new Date().toISOString() : null,
      sort_order: 0,
      media_urls: []
    };
    const {
      error
    } = await supabase.from("public_stories").insert(row);
    setSubmitting(false);
    if (error) {
      setStatus({
        kind: "err",
        msg: error.message
      });
      return;
    }
    setStatus({
      kind: "ok",
      msg: "Insight saved."
    });
    setTitle("");
    setBody("");
    setFrictions([]);
    setQualities([]);
    setLatitude("");
    setLongitude("");
    onCreated();
  }
  return <Form onSubmit={submit}>
      <FormField label="Title">
        <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} required />
      </FormField>
      <FormField label="Body">
        <textarea style={{
        ...inputStyle
      }} value={body} onChange={e => setBody(e.target.value)} placeholder="Use blank lines to separate paragraphs." required className="[min-height:140px]" />
      </FormField>

      <FormRow>
        <FormField label="Scale">
          <select style={inputStyle} value={mapScale} onChange={e => setMapScale(e.target.value as MapScale)}>
            {SCALE_KEYS.map(s => <option key={s} value={s}>
                {SCALES[s].label}
              </option>)}
          </select>
        </FormField>
        <FormField label="Theme / room">
          <select style={inputStyle} value={theme} onChange={e => setTheme(e.target.value as HouseTheme)}>
            {THEMES.map(t => <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>)}
          </select>
        </FormField>
        <FormField label="Field site">
          <select style={inputStyle} value={fieldSite} onChange={e => setFieldSite(e.target.value as FieldSite | "")}>
            <option value="">—</option>
            {FIELD_SITES.map(f => <option key={f} value={f}>
                {f}
              </option>)}
          </select>
        </FormField>
      </FormRow>

      <FormField label="Frictions">
        <CheckboxGroup options={FRICTION_KEYS.map(k => ({
        value: k,
        label: FRICTIONS[k].label,
        color: FRICTIONS[k].color
      }))} value={frictions} onChange={next => setFrictions(next as CareFriction[])} />
      </FormField>

      <FormField label="Qualities">
        <CheckboxGroup options={QUALITY_KEYS.map(k => ({
        value: k,
        label: QUALITIES[k].label,
        color: QUALITIES[k].color
      }))} value={qualities} onChange={next => setQualities(next as CareQuality[])} />
      </FormField>

      <FormRow>
        <FormField label="Latitude">
          <input style={inputStyle} type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="59.8976" />
        </FormField>
        <FormField label="Longitude">
          <input style={inputStyle} type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="10.8155" />
        </FormField>
      </FormRow>

      <FormField label="Author credit">
        <input style={inputStyle} value={author} onChange={e => setAuthor(e.target.value)} />
      </FormField>

      <PublishToggle value={published} onChange={setPublished} />

      <SubmitBar status={status} submitting={submitting} label="Save insight" />
    </Form>;
}

// ─── Design challenges (responses) ───

interface ResponseRow {
  id: string;
  title: string;
  body: string | null;
  theme: HouseTheme;
  stage: string;
  frictions: CareFriction[];
  qualities: CareQuality[];
  source_stories: string[];
  outcome: string | null;
  published: boolean;
  created_at?: string;
}
function ChallengesPanel() {
  const [rows, setRows] = useState<ResponseRow[]>([]);
  const [stories, setStories] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    const [respRes, storyRes] = await Promise.all([
      supabase.from("public_design_responses").select("*").order("created_at", { ascending: false }).limit(25),
      supabase.from("public_stories").select("id,title").order("title", { ascending: true })
    ]);
    setLoading(false);
    if (respRes.error) console.warn("Load responses:", respRes.error.message);
    if (storyRes.error) console.warn("Load stories for picker:", storyRes.error.message);
    setRows((respRes.data as ResponseRow[]) ?? []);
    setStories((storyRes.data as { id: string; title: string }[]) ?? []);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);
  return <div className="[display:grid] [grid-template-columns:minmax(320px,_1fr)_minmax(320px,_1.2fr)] [gap:32px]">
      <section>
        <SectionHeading>New design challenge</SectionHeading>
        <ChallengeForm stories={stories} onCreated={load} />
      </section>

      <section>
        <SectionHeading>Recent challenges</SectionHeading>
        <ItemList loading={loading} rows={rows.map(r => ({
        id: r.id,
        title: r.title,
        subtitle: STAGES.find(s => s.key === r.stage)?.label ?? r.stage,
        published: r.published,
        tags: [...(r.frictions ?? []), ...(r.qualities ?? [])]
      }))} onTogglePublish={async (id, next) => {
        const {
          error
        } = await supabase.from("public_design_responses").update({
          published: next
        }).eq("id", id);
        if (error) alert(error.message);else load();
      }} onDelete={async id => {
        if (!confirm("Delete this challenge?")) return;
        const {
          error
        } = await supabase.from("public_design_responses").delete().eq("id", id);
        if (error) alert(error.message);else load();
      }} />
      </section>
    </div>;
}
function ChallengeForm({
  stories,
  onCreated
}: {
  stories: { id: string; title: string }[];
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [stage, setStage] = useState(STAGES[0].key);
  const [theme, setTheme] = useState<HouseTheme>("living_room");
  const [frictions, setFrictions] = useState<CareFriction[]>([]);
  const [qualities, setQualities] = useState<CareQuality[]>([]);
  const [sourceStories, setSourceStories] = useState<string[]>([]);
  const [outcome, setOutcome] = useState("");
  const [published, setPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    kind: "ok" | "err";
    msg: string;
  } | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    setStatus(null);
    const row = {
      id: crypto.randomUUID(),
      title: title.trim(),
      body: body.trim(),
      theme,
      stage,
      frictions,
      qualities,
      source_stories: sourceStories,
      outcome: outcome.trim() || null,
      published,
      published_at: published ? new Date().toISOString() : null,
      sort_order: 0
    };
    const {
      error
    } = await supabase.from("public_design_responses").insert(row);
    setSubmitting(false);
    if (error) {
      setStatus({
        kind: "err",
        msg: error.message
      });
      return;
    }
    setStatus({
      kind: "ok",
      msg: "Challenge saved."
    });
    setTitle("");
    setBody("");
    setOutcome("");
    setFrictions([]);
    setQualities([]);
    setSourceStories([]);
    onCreated();
  }
  return <Form onSubmit={submit}>
      <FormField label="Title">
        <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} required />
      </FormField>
      <FormField label="Description">
        <textarea style={{
        ...inputStyle
      }} value={body} onChange={e => setBody(e.target.value)} required className="[min-height:120px]" />
      </FormField>
      <FormRow>
        <FormField label="Stage">
          <select style={inputStyle} value={stage} onChange={e => setStage(e.target.value as typeof stage)}>
            {STAGES.map(s => <option key={s.key} value={s.key}>
                {s.label}
              </option>)}
          </select>
        </FormField>
        <FormField label="Theme / room">
          <select style={inputStyle} value={theme} onChange={e => setTheme(e.target.value as HouseTheme)}>
            {THEMES.map(t => <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>)}
          </select>
        </FormField>
      </FormRow>
      <FormField label="Frictions addressed">
        <CheckboxGroup options={FRICTION_KEYS.map(k => ({
        value: k,
        label: FRICTIONS[k].label,
        color: FRICTIONS[k].color
      }))} value={frictions} onChange={next => setFrictions(next as CareFriction[])} />
      </FormField>
      <FormField label="Qualities addressed">
        <CheckboxGroup options={QUALITY_KEYS.map(k => ({
        value: k,
        label: QUALITIES[k].label,
        color: QUALITIES[k].color
      }))} value={qualities} onChange={next => setQualities(next as CareQuality[])} />
      </FormField>
      <FormField label="Source insights (optional — challenges link primarily to categories)">
        <StoryMultiSelect stories={stories} value={sourceStories} onChange={setSourceStories} />
      </FormField>
      <FormField label="Outcome (optional)">
        <textarea style={{
        ...inputStyle
      }} value={outcome} onChange={e => setOutcome(e.target.value)} className="[min-height:80px]" />
      </FormField>

      <PublishToggle value={published} onChange={setPublished} />
      <SubmitBar status={status} submitting={submitting} label="Save challenge" />
    </Form>;
}

function StoryMultiSelect({
  stories,
  value,
  onChange
}: {
  stories: { id: string; title: string }[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  if (stories.length === 0) {
    return <p className="[font-size:12px] [color:#9a9a9a] [font-style:italic]">No insights yet — leave empty to skip.</p>;
  }
  return <div className="[max-height:180px] [overflow-y:auto] [border:1px_solid_#e6e6e6] [border-radius:8px] [padding:8px] [background:#fafafa]">
      {stories.map(s => {
        const on = value.includes(s.id);
        return <label key={s.id} className="[display:flex] [align-items:center] [gap:8px] [padding:4px_8px] [cursor:pointer] [font-size:13px] [color:#2c2c2c]">
            <input type="checkbox" checked={on} onChange={() => onChange(on ? value.filter(x => x !== s.id) : [...value, s.id])} className="[accent-color:#2a2859]" />
            <span className="[line-height:1.3]">{s.title}</span>
          </label>;
      })}
    </div>;
}

// ─── Resources (reading room + municipal) ───

interface ResourceRow {
  id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  url: string | null;
  published: boolean;
  created_at?: string;
}
function ResourcesPanel() {
  const [rows, setRows] = useState<ResourceRow[]>([]);
  const [stories, setStories] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    const [resRes, storyRes] = await Promise.all([
      supabase.from("public_resources").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("public_stories").select("id,title").order("title", { ascending: true })
    ]);
    setLoading(false);
    if (resRes.error) console.warn("Load resources:", resRes.error.message);
    if (storyRes.error) console.warn("Load stories for picker:", storyRes.error.message);
    setRows((resRes.data as ResourceRow[]) ?? []);
    setStories((storyRes.data as { id: string; title: string }[]) ?? []);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);
  return <div className="[display:grid] [grid-template-columns:minmax(320px,_1fr)_minmax(320px,_1.2fr)] [gap:32px]">
      <section>
        <SectionHeading>{editId ? "Edit resource" : "New resource"}</SectionHeading>
        <ResourceForm key={editId ?? "new"} editId={editId} stories={stories} onSaved={() => { setEditId(null); load(); }} onCancel={() => setEditId(null)} />
      </section>

      <section>
        <SectionHeading>Recent resources</SectionHeading>
        <ItemList loading={loading} rows={rows.map(r => ({
        id: r.id,
        title: r.title,
        subtitle: RESOURCE_TYPE_LABELS[r.type],
        published: r.published,
        tags: []
      }))} onTogglePublish={async (id, next) => {
        const {
          error
        } = await supabase.from("public_resources").update({
          published: next
        }).eq("id", id);
        if (error) alert(error.message);else load();
      }} onDelete={async id => {
        if (!confirm("Delete this resource?")) return;
        const {
          error
        } = await supabase.from("public_resources").delete().eq("id", id);
        if (error) alert(error.message);else load();
      }} onEdit={id => setEditId(id)} />
      </section>
    </div>;
}
function ResourceForm({
  editId,
  stories,
  onSaved,
  onCancel
}: {
  editId: string | null;
  stories: { id: string; title: string }[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ResourceType>("publication");
  const [url, setUrl] = useState("");
  const [frictions, setFrictions] = useState<CareFriction[]>([]);
  const [qualities, setQualities] = useState<CareQuality[]>([]);
  const [linkedStories, setLinkedStories] = useState<string[]>([]);
  const [published, setPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    kind: "ok" | "err";
    msg: string;
  } | null>(null);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      const [rRes, fRes, qRes, sRes] = await Promise.all([
        supabase.from("public_resources").select("*").eq("id", editId).single(),
        supabase.from("public_resource_frictions").select("friction_key").eq("resource_id", editId),
        supabase.from("public_resource_qualities").select("quality_key").eq("resource_id", editId),
        supabase.from("public_resource_stories").select("story_id").eq("resource_id", editId)
      ]);
      if (cancelled) return;
      if (rRes.error || !rRes.data) {
        setStatus({ kind: "err", msg: rRes.error?.message ?? "Resource not found." });
        return;
      }
      const r = rRes.data as ResourceRow;
      setTitle(r.title);
      setDescription(r.description ?? "");
      setType(r.type);
      setUrl(r.url ?? "");
      setPublished(r.published);
      setFrictions(((fRes.data ?? []) as { friction_key: CareFriction }[]).map(x => x.friction_key));
      setQualities(((qRes.data ?? []) as { quality_key: CareQuality }[]).map(x => x.quality_key));
      setLinkedStories(((sRes.data ?? []) as { story_id: string }[]).map(x => x.story_id));
    })();
    return () => { cancelled = true; };
  }, [editId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setStatus(null);
    const id = editId ?? crypto.randomUUID();
    const row = {
      id,
      title: title.trim(),
      description: description.trim() || null,
      type,
      url: url.trim() || null,
      theme: null,
      published
    };
    const { error: upsertErr } = await supabase.from("public_resources").upsert(row, { onConflict: "id" });
    if (upsertErr) {
      setSubmitting(false);
      setStatus({ kind: "err", msg: upsertErr.message });
      return;
    }
    // Reconcile join tables by replacing existing rows with the new set.
    const reconcile = async (table: string, col: string, keys: string[]) => {
      const { error: delErr } = await supabase.from(table).delete().eq("resource_id", id);
      if (delErr) return delErr;
      if (keys.length === 0) return null;
      const { error: insErr } = await supabase.from(table).insert(keys.map(k => ({ resource_id: id, [col]: k })));
      return insErr;
    };
    const errors = [
      await reconcile("public_resource_frictions", "friction_key", frictions),
      await reconcile("public_resource_qualities", "quality_key", qualities),
      await reconcile("public_resource_stories", "story_id", linkedStories)
    ].filter(Boolean);
    setSubmitting(false);
    if (errors.length > 0) {
      setStatus({ kind: "err", msg: errors.map(e => e!.message).join(" · ") });
      return;
    }
    setStatus({ kind: "ok", msg: editId ? "Resource updated." : "Resource saved." });
    if (!editId) {
      setTitle("");
      setDescription("");
      setUrl("");
      setFrictions([]);
      setQualities([]);
      setLinkedStories([]);
    }
    onSaved();
  }
  return <Form onSubmit={submit}>
      <FormField label="Title">
        <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} required />
      </FormField>
      <FormField label="Description">
        <textarea style={{
        ...inputStyle
      }} value={description} onChange={e => setDescription(e.target.value)} className="[min-height:110px]" />
      </FormField>
      <FormRow>
        <FormField label="Type">
          <select style={inputStyle} value={type} onChange={e => setType(e.target.value as ResourceType)}>
            {RESOURCE_TYPES.map(t => <option key={t} value={t}>
                {RESOURCE_TYPE_LABELS[t]}
              </option>)}
          </select>
        </FormField>
      </FormRow>
      <FormField label="Link (URL)">
        <input style={inputStyle} type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" />
      </FormField>
      <FormField label="Related frictions">
        <CheckboxGroup options={FRICTION_KEYS.map(k => ({
        value: k,
        label: FRICTIONS[k].label,
        color: FRICTIONS[k].color
      }))} value={frictions} onChange={next => setFrictions(next as CareFriction[])} />
      </FormField>
      <FormField label="Related qualities">
        <CheckboxGroup options={QUALITY_KEYS.map(k => ({
        value: k,
        label: QUALITIES[k].label,
        color: QUALITIES[k].color
      }))} value={qualities} onChange={next => setQualities(next as CareQuality[])} />
      </FormField>
      <FormField label="Related insights (optional — leave empty to skip)">
        <StoryMultiSelect stories={stories} value={linkedStories} onChange={setLinkedStories} />
      </FormField>
      <PublishToggle value={published} onChange={setPublished} />
      <SubmitBar status={status} submitting={submitting} label={editId ? "Update resource" : "Save resource"} />
      {editId && <button type="button" onClick={onCancel} className="[font-size:12px] [color:#666666] [background:transparent] [border:none] [cursor:pointer] [padding:0px] [align-self:flex-start]">Cancel edit</button>}
    </Form>;
}

// ─── Category descriptions (frictions + qualities long-form) ───

interface CategoryDescriptionRow {
  key: string;
  long_description: string;
  examples: string[];
  updated_at: string;
}

function DescriptionsPanel() {
  return <div className="[display:flex] [flex-direction:column] [gap:48px]">
      <section>
        <SectionHeading>Frictions</SectionHeading>
        <DescriptionList table="public_friction_descriptions" labelMap={FRICTIONS as unknown as Record<string, { label: string }>} />
      </section>
      <section>
        <SectionHeading>Qualities</SectionHeading>
        <DescriptionList table="public_quality_descriptions" labelMap={QUALITIES as unknown as Record<string, { label: string }>} />
      </section>
    </div>;
}

function DescriptionList({ table, labelMap }: { table: string; labelMap: Record<string, { label: string }> }) {
  const [rows, setRows] = useState<CategoryDescriptionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from(table).select("*").order("key", { ascending: true });
    setLoading(false);
    if (error) console.warn(`Load ${table}:`, error.message);
    setRows((data as CategoryDescriptionRow[]) ?? []);
  }, [table]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);
  if (loading && rows.length === 0) {
    return <p className="[font-size:14px] [color:#9a9a9a]">Loading…</p>;
  }
  if (rows.length === 0) {
    return <p className="[font-size:14px] [color:#666666] [padding:24px] [background:#ffffff] [border:1px_dashed_#e6e6e6] [border-radius:8px] [line-height:1.6]">
        No rows found. Did the Phase 1 migration seed this table?
      </p>;
  }
  return <div className="[display:flex] [flex-direction:column] [gap:16px]">
      {rows.map(r => <DescriptionRow key={r.key} table={table} row={r} label={labelMap[r.key]?.label ?? r.key} onSaved={load} />)}
    </div>;
}

function DescriptionRow({
  table,
  row,
  label,
  onSaved
}: {
  table: string;
  row: CategoryDescriptionRow;
  label: string;
  onSaved: () => void;
}) {
  const [longDescription, setLongDescription] = useState(row.long_description);
  const [examples, setExamples] = useState<string[]>(row.examples);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  async function save() {
    setSubmitting(true);
    setStatus(null);
    const { error } = await supabase.from(table).update({
      long_description: longDescription,
      examples: examples.map(e => e.trim()).filter(e => e.length > 0),
      updated_at: new Date().toISOString()
    }).eq("key", row.key);
    setSubmitting(false);
    if (error) {
      setStatus({ kind: "err", msg: error.message });
      return;
    }
    setStatus({ kind: "ok", msg: "Saved." });
    onSaved();
  }
  return <div className="[display:flex] [flex-direction:column] [gap:12px] [padding:20px] [background:#ffffff] [border:1px_solid_#e6e6e6] [border-radius:8px]">
      <div className="[display:flex] [align-items:baseline] [justify-content:space-between] [gap:16px]">
        <div>
          <p className="[font-size:16px] [font-weight:600] [color:#2a2859]">{label}</p>
          <p className="[font-size:11px] [color:#9a9a9a] [font-family:monospace]">{row.key}</p>
        </div>
        <p className="[font-size:11px] [color:#9a9a9a]">Updated {new Date(row.updated_at).toLocaleDateString()}</p>
      </div>
      <FormField label="Long description">
        <textarea style={inputStyle} value={longDescription} onChange={e => setLongDescription(e.target.value)} className="[min-height:110px]" />
      </FormField>
      <FormField label="Examples">
        <div className="[display:flex] [flex-direction:column] [gap:8px]">
          {examples.map((ex, i) => <div key={i} className="[display:flex] [gap:8px]">
              <input style={inputStyle} value={ex} onChange={e => setExamples(examples.map((x, j) => j === i ? e.target.value : x))} placeholder="One example…" />
              <button type="button" onClick={() => setExamples(examples.filter((_, j) => j !== i))} className="[padding:8px_12px] [font-size:12px] [color:#a83f34] [background:transparent] [border:1px_solid_#e6e6e6] [border-radius:8px] [cursor:pointer]">Remove</button>
            </div>)}
          <button type="button" onClick={() => setExamples([...examples, ""])} className="[align-self:flex-start] [padding:6px_12px] [font-size:12px] [color:#1f42aa] [background:transparent] [border:1px_dashed_#1f42aa] [border-radius:8px] [cursor:pointer]">+ Add example</button>
        </div>
      </FormField>
      <div className="[display:flex] [gap:12px] [align-items:center]">
        <button type="button" onClick={save} disabled={submitting} style={{
          cursor: submitting ? "wait" : "pointer",
          opacity: submitting ? 0.7 : 1,
          fontFamily: FONT_STACK
        }} className="[padding:10px_16px] [background:#2a2859] [color:#ffffff] [border-radius:8px] [border:1px_solid_#2a2859] [font-size:13px] [font-weight:600]">
          {submitting ? "Saving…" : "Save"}
        </button>
        {status && <p style={{
          color: status.kind === "ok" ? "#034b45" : "#a83f34"
        }} className="[font-size:12px]">
          {status.msg}
        </p>}
      </div>
    </div>;
}

// ─── Shared form pieces ───

function SectionHeading({
  children
}: {
  children: React.ReactNode;
}) {
  return <p className="[font-size:11px] [font-weight:700] [text-transform:uppercase] [letter-spacing:0.14em] [color:#808080] [margin-bottom:16px]">
      {children}
    </p>;
}
function Form({
  children,
  onSubmit
}: {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return <form onSubmit={onSubmit} className="[display:flex] [flex-direction:column] [gap:16px] [padding:24px] [background:#ffffff] [border:1px_solid_#e6e6e6] [border-radius:8px]">
      {children}
    </form>;
}
function FormField({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return <label className="[display:flex] [flex-direction:column] [gap:8px]">
      <span className="[font-size:12px] [font-weight:600] [color:#2c2c2c]">{label}</span>
      {children}
    </label>;
}
function FormRow({
  children
}: {
  children: React.ReactNode;
}) {
  return <div className="[display:grid] [grid-template-columns:repeat(auto-fit,_minmax(120px,_1fr))] [gap:16px]">
      {children}
    </div>;
}
function CheckboxGroup<T extends string>({
  options,
  value,
  onChange
}: {
  options: {
    value: T;
    label: string;
    color: string;
  }[];
  value: T[];
  onChange: (next: T[]) => void;
}) {
  return <div className="[display:flex] [flex-wrap:wrap] [gap:8px]">
      {options.map(opt => {
      const on = value.includes(opt.value);
      return <button key={opt.value} type="button" onClick={() => onChange(on ? value.filter(x => x !== opt.value) : [...value, opt.value])} style={{
        border: `1px solid ${on ? opt.color : opt.color + "40"}`,
        background: on ? opt.color : opt.color + "15",
        color: on ? "#ffffff" : opt.color,
        fontFamily: FONT_STACK
      }} className="[padding:5px_12px] [border-radius:4px] [font-size:12px] [font-weight:500] [cursor:pointer]">
            {opt.label}
          </button>;
    })}
    </div>;
}
function PublishToggle({
  value,
  onChange
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return <label style={{
    background: value ? "#c7fde9" : "#f2f2f2",
    border: `1px solid ${value ? "#43f8b6" : "#e6e6e6"}`
  }} className="[display:flex] [align-items:center] [gap:8px] [padding:8px_16px] [border-radius:8px] [cursor:pointer]">
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="[accent-color:#034b45]" />
      <span className="[font-size:13px] [color:#2c2c2c]">
        Publish immediately{value ? "" : " (save as draft)"}
      </span>
    </label>;
}
function SubmitBar({
  submitting,
  status,
  label
}: {
  submitting: boolean;
  status: {
    kind: "ok" | "err";
    msg: string;
  } | null;
  label: string;
}) {
  return <div className="[display:flex] [flex-direction:column] [gap:10px]">
      {status && <p style={{
      background: status.kind === "ok" ? "#c7fde9" : "#fff2f1",
      border: `1px solid ${status.kind === "ok" ? "#43f8b6" : "#ffdfdc"}`,
      color: status.kind === "ok" ? "#034b45" : "#a83f34"
    }} className="[font-size:13px] [padding:8px_16px] [border-radius:4px]">
          {status.msg}
        </p>}
      <button type="submit" disabled={submitting} style={{
      cursor: submitting ? "wait" : "pointer",
      opacity: submitting ? 0.7 : 1,
      fontFamily: FONT_STACK
    }} className="[padding:12px_16px] [background:#2a2859] [color:#ffffff] [border-radius:8px] [border:1px_solid_#2a2859] [font-size:15px] [font-weight:600] [align-self:flex-start]">
        {submitting ? "Saving…" : label}
      </button>
    </div>;
}

// ─── Shared list ───

function ItemList({
  loading,
  rows,
  onTogglePublish,
  onDelete,
  onEdit
}: {
  loading: boolean;
  rows: {
    id: string;
    title: string;
    subtitle: string;
    published: boolean;
    tags: string[];
  }[];
  onTogglePublish: (id: string, next: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onEdit?: (id: string) => void;
}) {
  const sorted = useMemo(() => rows, [rows]);
  if (loading && rows.length === 0) {
    return <p className="[font-size:14px] [color:#9a9a9a]">Loading…</p>;
  }
  if (rows.length === 0) {
    return <p className="[font-size:14px] [color:#666666] [padding:24px] [background:#ffffff] [border:1px_dashed_#e6e6e6] [border-radius:8px] [line-height:1.6]">
        Nothing here yet. Use the form to create the first entry.
        <br />
        <span className="[font-size:12px] [color:#9a9a9a]">
          If you expected existing rows, check that the Supabase table has row-level-security policies allowing SELECT for authenticated users.
        </span>
      </p>;
  }
  return <ul className="[list-style:none] [padding:0px] [margin:0px] [display:grid] [gap:8px]">
      {sorted.map(r => <li key={r.id} className="[display:flex] [align-items:flex-start] [justify-content:space-between] [gap:16px] [padding:16px] [background:#ffffff] [border:1px_solid_#e6e6e6] [border-radius:8px]">
          <div className="[min-width:0px] [flex:1px]">
            <p className="[font-size:16px] [font-weight:600] [color:#2a2859] [margin-bottom:4px]">
              {r.title}
            </p>
            <p className="[font-size:12px] [color:#666666] [margin-bottom:8px]">{r.subtitle}</p>
            {r.tags.length > 0 && <div className="[display:flex] [flex-wrap:wrap] [gap:4px]">
                {r.tags.slice(0, 4).map(t => <span key={t} className="[font-size:10px] [padding:2px_8px] [border-radius:4px] [background:#f2f2f2] [color:#666666]">
                    {t}
                  </span>)}
              </div>}
          </div>
          <div className="[display:flex] [flex-direction:column] [gap:8px] [align-items:flex-end]">
            <button type="button" onClick={() => onTogglePublish(r.id, !r.published)} style={{
          border: `1px solid ${r.published ? "#034b45" : "#e6e6e6"}`,
          background: r.published ? "#034b45" : "#ffffff",
          color: r.published ? "#ffffff" : "#666666",
          fontFamily: FONT_STACK
        }} className="[font-size:11px] [padding:4px_10px] [border-radius:4px] [cursor:pointer] [font-weight:600]">
              {r.published ? "Published" : "Draft"}
            </button>
            {onEdit && <button type="button" onClick={() => onEdit(r.id)} style={{
          fontFamily: FONT_STACK
        }} className="[font-size:11px] [color:#1f42aa] [background:transparent] [border:none] [cursor:pointer] [padding:0px] [font-weight:500]">
              Edit
            </button>}
            <button type="button" onClick={() => onDelete(r.id)} style={{
          fontFamily: FONT_STACK
        }} className="[font-size:11px] [color:#a83f34] [background:transparent] [border:none] [cursor:pointer] [padding:0px]">
              Delete
            </button>
          </div>
        </li>)}
    </ul>;
}
const inputStyle: React.CSSProperties = {
  padding: "10px 16px",
  border: "1px solid #e6e6e6",
  borderRadius: 8,
  fontSize: 14,
  fontFamily: FONT_STACK,
  background: "#ffffff",
  color: "#2c2c2c",
  width: "100%"
};
