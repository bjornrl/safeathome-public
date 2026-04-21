"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FRICTIONS, QUALITIES, SCALES } from "@/lib/constants";
import { RESOURCE_TYPE_LABELS } from "@/lib/seed-resources";
import { STAGES } from "@/lib/seed-solutions";
import type {
  CareFriction,
  CareQuality,
  FieldSite,
  HouseTheme,
  MapScale,
  ResourceType,
} from "@/lib/types";

type Tab = "stories" | "challenges" | "resources";

const FRICTION_KEYS = Object.keys(FRICTIONS) as CareFriction[];
const QUALITY_KEYS = Object.keys(QUALITIES) as CareQuality[];

const THEMES: HouseTheme[] = [
  "front_door",
  "living_room",
  "kitchen",
  "bedroom",
  "study",
  "childrens_room",
  "garden",
  "phone",
  "prayer_space",
  "bathroom",
  "hallway",
];

const FIELD_SITES: FieldSite[] = ["Alna", "Søndre Nordstrand", "Skien"];
const SCALE_KEYS = Object.keys(SCALES) as MapScale[];
const RESOURCE_TYPES = Object.keys(RESOURCE_TYPE_LABELS) as ResourceType[];

// ─── Page ───

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("stories");

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "40px 24px 96px",
        fontFamily: "var(--font-dm-sans)",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-source-serif)",
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "#2C2A25",
          marginBottom: 8,
        }}
      >
        Content editor
      </h1>
      <p style={{ fontSize: 15, color: "#7A756B", marginBottom: 24 }}>
        Post new insights, design challenges, or reading-room entries.
        Everything you create here lands in the matching Supabase table.
      </p>

      <nav style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
        <TabButton active={tab === "stories"} onClick={() => setTab("stories")}>
          Insights
        </TabButton>
        <TabButton active={tab === "challenges"} onClick={() => setTab("challenges")}>
          Design challenges
        </TabButton>
        <TabButton active={tab === "resources"} onClick={() => setTab("resources")}>
          Resources
        </TabButton>
      </nav>

      {tab === "stories" && <StoriesPanel />}
      {tab === "challenges" && <ChallengesPanel />}
      {tab === "resources" && <ResourcesPanel />}
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "8px 14px",
        fontSize: 14,
        fontWeight: 600,
        borderRadius: 8,
        border: `1px solid ${active ? "#2C2A25" : "#E8E4DB"}`,
        background: active ? "#2C2A25" : "#fff",
        color: active ? "#fff" : "#2C2A25",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
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
    const { data, error } = await supabase
      .from("public_stories")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);
    setLoading(false);
    if (error) {
      console.warn("Load stories:", error.message);
      setRows([]);
    } else {
      setRows((data as StoryRow[]) ?? []);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1fr) minmax(320px, 1.2fr)", gap: 32 }}>
      <section>
        <SectionHeading>New insight</SectionHeading>
        <StoryForm onCreated={load} />
      </section>

      <section>
        <SectionHeading>Recent insights</SectionHeading>
        <ItemList
          loading={loading}
          rows={rows.map((r) => ({
            id: r.id,
            title: r.title,
            subtitle: `${SCALES[r.map_scale]?.label ?? r.map_scale}${r.field_site ? ` · ${r.field_site}` : ""}`,
            published: r.published,
            tags: r.frictions,
          }))}
          onTogglePublish={async (id, next) => {
            const { error } = await supabase
              .from("public_stories")
              .update({ published: next, published_at: next ? new Date().toISOString() : null })
              .eq("id", id);
            if (error) alert(error.message);
            else load();
          }}
          onDelete={async (id) => {
            if (!confirm("Delete this insight?")) return;
            const { error } = await supabase.from("public_stories").delete().eq("id", id);
            if (error) alert(error.message);
            else load();
          }}
        />
      </section>
    </div>
  );
}

function StoryForm({ onCreated }: { onCreated: () => void }) {
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
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

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
      media_urls: [],
    };

    const { error } = await supabase.from("public_stories").insert(row);
    setSubmitting(false);

    if (error) {
      setStatus({ kind: "err", msg: error.message });
      return;
    }

    setStatus({ kind: "ok", msg: "Insight saved." });
    setTitle("");
    setBody("");
    setFrictions([]);
    setQualities([]);
    setLatitude("");
    setLongitude("");
    onCreated();
  }

  return (
    <Form onSubmit={submit}>
      <FormField label="Title">
        <input
          style={inputStyle}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </FormField>
      <FormField label="Body">
        <textarea
          style={{ ...inputStyle, minHeight: 140, fontFamily: "var(--font-source-serif)" }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Use blank lines to separate paragraphs."
          required
        />
      </FormField>

      <FormRow>
        <FormField label="Scale">
          <select
            style={inputStyle}
            value={mapScale}
            onChange={(e) => setMapScale(e.target.value as MapScale)}
          >
            {SCALE_KEYS.map((s) => (
              <option key={s} value={s}>
                {SCALES[s].label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Theme / room">
          <select
            style={inputStyle}
            value={theme}
            onChange={(e) => setTheme(e.target.value as HouseTheme)}
          >
            {THEMES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Field site">
          <select
            style={inputStyle}
            value={fieldSite}
            onChange={(e) => setFieldSite(e.target.value as FieldSite | "")}
          >
            <option value="">—</option>
            {FIELD_SITES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </FormField>
      </FormRow>

      <FormField label="Frictions">
        <CheckboxGroup
          options={FRICTION_KEYS.map((k) => ({
            value: k,
            label: FRICTIONS[k].label,
            color: FRICTIONS[k].color,
          }))}
          value={frictions}
          onChange={(next) => setFrictions(next as CareFriction[])}
        />
      </FormField>

      <FormField label="Qualities">
        <CheckboxGroup
          options={QUALITY_KEYS.map((k) => ({
            value: k,
            label: QUALITIES[k].label,
            color: QUALITIES[k].color,
          }))}
          value={qualities}
          onChange={(next) => setQualities(next as CareQuality[])}
        />
      </FormField>

      <FormRow>
        <FormField label="Latitude">
          <input
            style={inputStyle}
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="59.8976"
          />
        </FormField>
        <FormField label="Longitude">
          <input
            style={inputStyle}
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="10.8155"
          />
        </FormField>
      </FormRow>

      <FormField label="Author credit">
        <input
          style={inputStyle}
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
      </FormField>

      <PublishToggle value={published} onChange={setPublished} />

      <SubmitBar status={status} submitting={submitting} label="Save insight" />
    </Form>
  );
}

// ─── Design challenges (responses) ───

interface ResponseRow {
  id: string;
  title: string;
  body: string | null;
  theme: HouseTheme;
  stage: string;
  frictions: CareFriction[];
  outcome: string | null;
  published: boolean;
  created_at?: string;
}

function ChallengesPanel() {
  const [rows, setRows] = useState<ResponseRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("public_design_responses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(25);
    setLoading(false);
    if (error) console.warn("Load responses:", error.message);
    setRows((data as ResponseRow[]) ?? []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1fr) minmax(320px, 1.2fr)", gap: 32 }}>
      <section>
        <SectionHeading>New design challenge</SectionHeading>
        <ChallengeForm onCreated={load} />
      </section>

      <section>
        <SectionHeading>Recent challenges</SectionHeading>
        <ItemList
          loading={loading}
          rows={rows.map((r) => ({
            id: r.id,
            title: r.title,
            subtitle: STAGES.find((s) => s.key === r.stage)?.label ?? r.stage,
            published: r.published,
            tags: r.frictions ?? [],
          }))}
          onTogglePublish={async (id, next) => {
            const { error } = await supabase
              .from("public_design_responses")
              .update({ published: next })
              .eq("id", id);
            if (error) alert(error.message);
            else load();
          }}
          onDelete={async (id) => {
            if (!confirm("Delete this challenge?")) return;
            const { error } = await supabase
              .from("public_design_responses")
              .delete()
              .eq("id", id);
            if (error) alert(error.message);
            else load();
          }}
        />
      </section>
    </div>
  );
}

function ChallengeForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [stage, setStage] = useState(STAGES[0].key);
  const [theme, setTheme] = useState<HouseTheme>("living_room");
  const [frictions, setFrictions] = useState<CareFriction[]>([]);
  const [outcome, setOutcome] = useState("");
  const [published, setPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

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
      outcome: outcome.trim() || null,
      published,
      published_at: published ? new Date().toISOString() : null,
      sort_order: 0,
    };

    const { error } = await supabase.from("public_design_responses").insert(row);
    setSubmitting(false);

    if (error) {
      setStatus({ kind: "err", msg: error.message });
      return;
    }

    setStatus({ kind: "ok", msg: "Challenge saved." });
    setTitle("");
    setBody("");
    setOutcome("");
    setFrictions([]);
    onCreated();
  }

  return (
    <Form onSubmit={submit}>
      <FormField label="Title">
        <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </FormField>
      <FormField label="Description">
        <textarea
          style={{ ...inputStyle, minHeight: 120, fontFamily: "var(--font-source-serif)" }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
      </FormField>
      <FormRow>
        <FormField label="Stage">
          <select style={inputStyle} value={stage} onChange={(e) => setStage(e.target.value as typeof stage)}>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Theme / room">
          <select
            style={inputStyle}
            value={theme}
            onChange={(e) => setTheme(e.target.value as HouseTheme)}
          >
            {THEMES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </FormField>
      </FormRow>
      <FormField label="Frictions addressed">
        <CheckboxGroup
          options={FRICTION_KEYS.map((k) => ({
            value: k,
            label: FRICTIONS[k].label,
            color: FRICTIONS[k].color,
          }))}
          value={frictions}
          onChange={(next) => setFrictions(next as CareFriction[])}
        />
      </FormField>
      <FormField label="Outcome (optional)">
        <textarea
          style={{ ...inputStyle, minHeight: 80, fontFamily: "var(--font-source-serif)" }}
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
        />
      </FormField>

      <PublishToggle value={published} onChange={setPublished} />
      <SubmitBar status={status} submitting={submitting} label="Save challenge" />
    </Form>
  );
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
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("public_resources")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setLoading(false);
    if (error) console.warn("Load resources:", error.message);
    setRows((data as ResourceRow[]) ?? []);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1fr) minmax(320px, 1.2fr)", gap: 32 }}>
      <section>
        <SectionHeading>New resource</SectionHeading>
        <ResourceForm onCreated={load} />
      </section>

      <section>
        <SectionHeading>Recent resources</SectionHeading>
        <ItemList
          loading={loading}
          rows={rows.map((r) => ({
            id: r.id,
            title: r.title,
            subtitle: RESOURCE_TYPE_LABELS[r.type],
            published: r.published,
            tags: [],
          }))}
          onTogglePublish={async (id, next) => {
            const { error } = await supabase
              .from("public_resources")
              .update({ published: next })
              .eq("id", id);
            if (error) alert(error.message);
            else load();
          }}
          onDelete={async (id) => {
            if (!confirm("Delete this resource?")) return;
            const { error } = await supabase.from("public_resources").delete().eq("id", id);
            if (error) alert(error.message);
            else load();
          }}
        />
      </section>
    </div>
  );
}

function ResourceForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ResourceType>("publication");
  const [url, setUrl] = useState("");
  const [published, setPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setStatus(null);

    const row = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim() || null,
      type,
      url: url.trim() || null,
      theme: null,
      published,
    };

    const { error } = await supabase.from("public_resources").insert(row);
    setSubmitting(false);

    if (error) {
      setStatus({ kind: "err", msg: error.message });
      return;
    }

    setStatus({ kind: "ok", msg: "Resource saved." });
    setTitle("");
    setDescription("");
    setUrl("");
    onCreated();
  }

  return (
    <Form onSubmit={submit}>
      <FormField label="Title">
        <input style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </FormField>
      <FormField label="Description">
        <textarea
          style={{ ...inputStyle, minHeight: 110, fontFamily: "var(--font-source-serif)" }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </FormField>
      <FormRow>
        <FormField label="Type">
          <select
            style={inputStyle}
            value={type}
            onChange={(e) => setType(e.target.value as ResourceType)}
          >
            {RESOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {RESOURCE_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </FormField>
      </FormRow>
      <FormField label="Link (URL)">
        <input
          style={inputStyle}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
        />
      </FormField>
      <PublishToggle value={published} onChange={setPublished} />
      <SubmitBar status={status} submitting={submitting} label="Save resource" />
    </Form>
  );
}

// ─── Shared form pieces ───

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        color: "#A09A8E",
        marginBottom: 14,
      }}
    >
      {children}
    </p>
  );
}

function Form({ children, onSubmit }: { children: React.ReactNode; onSubmit: (e: React.FormEvent) => void }) {
  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: 20,
        background: "#fff",
        border: "1px solid #E8E4DB",
        borderRadius: 14,
      }}
    >
      {children}
    </form>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#7A756B" }}>{label}</span>
      {children}
    </label>
  );
}

function FormRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

function CheckboxGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; color: string }[];
  value: T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((opt) => {
        const on = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() =>
              onChange(on ? value.filter((x) => x !== opt.value) : [...value, opt.value])
            }
            style={{
              padding: "5px 12px",
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              border: `1px solid ${on ? opt.color : opt.color + "40"}`,
              background: on ? opt.color : opt.color + "15",
              color: on ? "#fff" : opt.color,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function PublishToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        borderRadius: 8,
        background: value ? "#3A8A7D10" : "#EDE9E0",
        border: `1px solid ${value ? "#3A8A7D40" : "#E8E4DB"}`,
        cursor: "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: "#3A8A7D" }}
      />
      <span style={{ fontSize: 13, color: "#2C2A25" }}>
        Publish immediately{value ? "" : " (save as draft)"}
      </span>
    </label>
  );
}

function SubmitBar({
  submitting,
  status,
  label,
}: {
  submitting: boolean;
  status: { kind: "ok" | "err"; msg: string } | null;
  label: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {status && (
        <p
          style={{
            fontSize: 13,
            padding: "8px 12px",
            borderRadius: 8,
            background: status.kind === "ok" ? "#3A8A7D12" : "#D1434312",
            color: status.kind === "ok" ? "#3A8A7D" : "#D14343",
          }}
        >
          {status.msg}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: "12px 16px",
          background: "#C45D3E",
          color: "#fff",
          borderRadius: 10,
          border: "none",
          fontSize: 15,
          fontWeight: 600,
          cursor: submitting ? "wait" : "pointer",
          opacity: submitting ? 0.7 : 1,
          alignSelf: "flex-start",
        }}
      >
        {submitting ? "Saving…" : label}
      </button>
    </div>
  );
}

// ─── Shared list ───

function ItemList({
  loading,
  rows,
  onTogglePublish,
  onDelete,
}: {
  loading: boolean;
  rows: { id: string; title: string; subtitle: string; published: boolean; tags: string[] }[];
  onTogglePublish: (id: string, next: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const sorted = useMemo(() => rows, [rows]);

  if (loading && rows.length === 0) {
    return <p style={{ fontSize: 14, color: "#A09A8E" }}>Loading…</p>;
  }

  if (rows.length === 0) {
    return (
      <p
        style={{
          fontSize: 14,
          color: "#7A756B",
          padding: 18,
          background: "#fff",
          border: "1px dashed #E8E4DB",
          borderRadius: 10,
        }}
      >
        Nothing here yet. Use the form to create the first entry.
        <br />
        <span style={{ fontSize: 12, color: "#A09A8E" }}>
          If you expected existing rows, check that the Supabase table has row-level-security policies allowing SELECT for authenticated users.
        </span>
      </p>
    );
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
      {sorted.map((r) => (
        <li
          key={r.id}
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            padding: 16,
            background: "#fff",
            border: "1px solid #E8E4DB",
            borderRadius: 10,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              style={{
                fontFamily: "var(--font-source-serif)",
                fontSize: 16,
                fontWeight: 600,
                color: "#2C2A25",
                marginBottom: 4,
              }}
            >
              {r.title}
            </p>
            <p style={{ fontSize: 12, color: "#7A756B", marginBottom: 6 }}>{r.subtitle}</p>
            {r.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {r.tags.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: "#EDE9E0",
                      color: "#7A756B",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
            <button
              type="button"
              onClick={() => onTogglePublish(r.id, !r.published)}
              style={{
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 99,
                border: `1px solid ${r.published ? "#3A8A7D" : "#E8E4DB"}`,
                background: r.published ? "#3A8A7D" : "#fff",
                color: r.published ? "#fff" : "#7A756B",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {r.published ? "Published" : "Draft"}
            </button>
            <button
              type="button"
              onClick={() => onDelete(r.id)}
              style={{
                fontSize: 11,
                color: "#D14343",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #E8E4DB",
  borderRadius: 8,
  fontSize: 14,
  fontFamily: "var(--font-dm-sans)",
  background: "#F7F5F0",
  color: "#2C2A25",
  width: "100%",
};
