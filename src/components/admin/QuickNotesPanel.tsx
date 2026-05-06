"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { colors, space, typography } from "@/lib/design-tokens";
import { FRICTIONS, QUALITIES, SCALES } from "@/lib/constants";
import type {
  CareFriction,
  CareQuality,
  CommentRow,
  FieldSite,
  HouseTheme,
  LinkableEntity,
  MapScale,
  NoteConnection,
  Profile,
  QuickNote,
  SuggestedCategory,
  WorkPackage,
} from "@/lib/types";
import { CategoryBadge } from "./CategoryBadge";
import { SuggestedCategoryInput } from "./SuggestedCategoryInput";

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

const FRICTION_KEYS = Object.keys(FRICTIONS) as CareFriction[];
const QUALITY_KEYS = Object.keys(QUALITIES) as CareQuality[];
const SCALE_KEYS = Object.keys(SCALES) as MapScale[];

// DB enum is uppercase WP1..WP4 — distinct from the lowercase wp1..wp4
// used by the legacy public_wp_reports table.
const WORK_PACKAGES: { value: WorkPackage; label: string }[] = [
  { value: "WP1", label: "WP1 · Homes & Communities" },
  { value: "WP2", label: "WP2 · Health & Care Institutions" },
  { value: "WP3", label: "WP3 · Transnational Contexts" },
  { value: "WP4", label: "WP4 · Innovation & Design" },
];

// Skien lives in the DB enum but is no longer a project partner; only
// surface the active sites in the form.
const FIELD_SITES: FieldSite[] = ["Alna", "Søndre Nordstrand"];

const HOUSE_THEMES: HouseTheme[] = [
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

const inputStyle: React.CSSProperties = {
  padding: `${space.s8} ${space.s12}`,
  border: `1px solid ${colors.borderSubtle}`,
  fontSize: 14,
  fontFamily: FONT_STACK,
  background: colors.bgCard,
  color: colors.textBody,
  width: "100%",
};

type View =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "edit"; id: string }
  | { kind: "detail"; id: string };

interface AggregatedCounts {
  connections: number;
  comments: number;
  suggestions: SuggestedCategory[];
}

interface NotesIndex {
  notes: QuickNote[];
  authors: Record<string, Profile>;
  counts: Record<string, AggregatedCounts>;
}

const EMPTY_INDEX: NotesIndex = { notes: [], authors: {}, counts: {} };

async function getCurrentProfile(): Promise<Profile | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Profile;
}

async function loadNotesIndex(): Promise<NotesIndex> {
  const { data: notesData, error: notesErr } = await supabase
    .from("quick_notes")
    .select("*")
    .order("created_at", { ascending: false });
  if (notesErr || !notesData) return EMPTY_INDEX;
  const notes = notesData as QuickNote[];
  if (notes.length === 0) return { notes, authors: {}, counts: {} };

  const noteIds = notes.map((n) => n.id);
  const authorIds = Array.from(new Set(notes.map((n) => n.author_id).filter((x): x is string => Boolean(x))));

  const [authorsRes, connectionsRes, commentsRes, joinRes] = await Promise.all([
    authorIds.length > 0
      ? supabase.from("profiles").select("*").in("id", authorIds)
      : Promise.resolve({ data: [] as Profile[], error: null }),
    supabase
      .from("note_connections")
      .select("from_note_id,to_note_id")
      .or(`from_note_id.in.(${noteIds.join(",")}),to_note_id.in.(${noteIds.join(",")})`),
    supabase.from("comments").select("quick_note_id").in("quick_note_id", noteIds),
    supabase.from("note_suggested_categories").select("note_id,suggestion_id").in("note_id", noteIds),
  ]);

  const authors: Record<string, Profile> = {};
  for (const p of (authorsRes.data as Profile[] | null) ?? []) authors[p.id] = p;

  const counts: Record<string, AggregatedCounts> = {};
  const ensure = (id: string) => {
    if (!counts[id]) counts[id] = { connections: 0, comments: 0, suggestions: [] };
    return counts[id];
  };

  for (const c of (connectionsRes.data as { from_note_id: string | null; to_note_id: string | null }[] | null) ?? []) {
    if (c.from_note_id && noteIds.includes(c.from_note_id)) ensure(c.from_note_id).connections += 1;
    if (c.to_note_id && noteIds.includes(c.to_note_id)) ensure(c.to_note_id).connections += 1;
  }

  for (const c of (commentsRes.data as { quick_note_id: string | null }[] | null) ?? []) {
    if (c.quick_note_id) ensure(c.quick_note_id).comments += 1;
  }

  const suggestionIds = Array.from(
    new Set(
      ((joinRes.data as { note_id: string; suggestion_id: string }[] | null) ?? []).map((j) => j.suggestion_id),
    ),
  );
  if (suggestionIds.length > 0) {
    const { data: sugRows } = await supabase
      .from("suggested_categories")
      .select("*")
      .in("id", suggestionIds);
    const sugMap: Record<string, SuggestedCategory> = {};
    for (const s of (sugRows as SuggestedCategory[] | null) ?? []) sugMap[s.id] = s;
    for (const j of (joinRes.data as { note_id: string; suggestion_id: string }[] | null) ?? []) {
      const sug = sugMap[j.suggestion_id];
      if (sug) ensure(j.note_id).suggestions.push(sug);
    }
  }

  return { notes, authors, counts };
}

function formatTimestamp(ts: string | null | undefined): string {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString("nb-NO", { dateStyle: "medium", timeStyle: "short" });
}

function authorInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function previewBody(body: string, headline: string | null | undefined, max = 180): string {
  if (headline && headline.trim()) return body.length > max ? `${body.slice(0, max).trim()}…` : body;
  return body.length > max ? `${body.slice(0, max).trim()}…` : body;
}

// ─── Avatar ───

function Avatar({ profile, size = 36 }: { profile: Profile | null; size?: number }) {
  if (profile?.avatar_url) {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `${colors.bgSubtle} center/cover no-repeat url(${JSON.stringify(profile.avatar_url)})`,
          flexShrink: 0,
          display: "inline-block",
          border: `1px solid ${colors.borderSubtle}`,
        }}
        aria-label={profile.full_name}
      />
    );
  }
  const initials = profile ? authorInitials(profile.full_name) : "?";
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: colors.brandDarkBlue,
        color: colors.textLight,
        fontSize: size <= 28 ? 11 : 13,
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}

// ─── Panel root ───

export function QuickNotesPanel() {
  const [view, setView] = useState<View>({ kind: "list" });
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentProfile().then((p) => {
      if (active) setProfile(p);
    });
    return () => {
      active = false;
    };
  }, []);

  const goList = useCallback(() => setView({ kind: "list" }), []);
  const goCreate = useCallback(() => setView({ kind: "create" }), []);
  const goEdit = useCallback((id: string) => setView({ kind: "edit", id }), []);
  const goDetail = useCallback((id: string) => setView({ kind: "detail", id }), []);

  if (view.kind === "create") {
    return <NoteForm currentProfile={profile} onDone={goList} onCancel={goList} />;
  }
  if (view.kind === "edit") {
    return <NoteForm noteId={view.id} currentProfile={profile} onDone={goList} onCancel={goDetail.bind(null, view.id)} />;
  }
  if (view.kind === "detail") {
    return <NoteDetail noteId={view.id} currentProfile={profile} onEdit={goEdit} onBack={goList} />;
  }
  return <NotesList currentProfile={profile} onOpen={goDetail} onCreate={goCreate} />;
}

// ─── List view ───

function NotesList({
  currentProfile,
  onOpen,
  onCreate,
}: {
  currentProfile: Profile | null;
  onOpen: (id: string) => void;
  onCreate: () => void;
}) {
  const [index, setIndex] = useState<NotesIndex>(EMPTY_INDEX);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await loadNotesIndex();
    setIndex(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: space.s24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: space.s16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <p
            style={{
              ...typography.sizes.t12,
              fontWeight: typography.weights.bold,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: colors.textMuted,
              marginBottom: space.s4,
            }}
          >
            Quick notes
          </p>
          <p
            style={{
              ...typography.sizes.t14,
              color: colors.textMuted,
              maxWidth: "60ch",
            }}
          >
            Lette notater fra felt og samtaler. Skriv en idé, en lenke eller en observasjon —
            koble den til relaterte innsikter eller andre notater.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreate}
          disabled={!currentProfile}
          title={!currentProfile ? "Profil mangler — kan ikke opprette notater." : undefined}
          style={{
            ...typography.sizes.t14,
            padding: `${space.s8} ${space.s16}`,
            background: currentProfile ? colors.brandWarmBlue : colors.bgSubtle,
            color: currentProfile ? colors.textLight : colors.textMuted,
            border: `1px solid ${currentProfile ? colors.brandWarmBlue : colors.borderSubtle}`,
            cursor: currentProfile ? "pointer" : "not-allowed",
            fontFamily: FONT_STACK,
            fontWeight: typography.weights.medium,
          }}
        >
          + Nytt notat
        </button>
      </div>

      {loading && index.notes.length === 0 ? (
        <p style={{ ...typography.sizes.t14, color: colors.textMuted }}>Laster…</p>
      ) : index.notes.length === 0 ? (
        <p
          style={{
            ...typography.sizes.t14,
            color: colors.textMuted,
            padding: space.s24,
            background: colors.bgCard,
            border: `1px dashed ${colors.borderSubtle}`,
            lineHeight: 1.6,
          }}
        >
          Ingen notater ennå. Lag det første ved å klikke <strong>+ Nytt notat</strong>.
        </p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: space.s12 }}>
          {index.notes.map((n) => (
            <NoteCard
              key={n.id}
              note={n}
              author={n.author_id ? index.authors[n.author_id] ?? null : null}
              counts={index.counts[n.id] ?? { connections: 0, comments: 0, suggestions: [] }}
              onOpen={() => onOpen(n.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function NoteCard({
  note,
  author,
  counts,
  onOpen,
}: {
  note: QuickNote;
  author: Profile | null;
  counts: AggregatedCounts;
  onOpen: () => void;
}) {
  const headline = note.headline?.trim();
  const wpLabel = note.work_package
    ? WORK_PACKAGES.find((w) => w.value === note.work_package)?.label.split(" · ")[0]
    : null;
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        style={{
          width: "100%",
          textAlign: "left",
          display: "flex",
          gap: space.s16,
          padding: space.s16,
          background: colors.bgCard,
          border: `1px solid ${colors.borderSubtle}`,
          cursor: "pointer",
          fontFamily: FONT_STACK,
          color: colors.textBody,
        }}
      >
        <Avatar profile={author} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: space.s8,
              marginBottom: space.s4,
            }}
          >
            <p
              style={{
                ...typography.sizes.t14,
                fontWeight: typography.weights.medium,
                color: colors.textBody,
              }}
            >
              {author?.full_name ?? "Ukjent forfatter"}
            </p>
            <p style={{ ...typography.sizes.t12, color: colors.textMuted }}>
              {formatTimestamp(note.created_at)}
            </p>
          </div>
          {headline ? (
            <p
              style={{
                ...typography.sizes.t18,
                fontWeight: typography.weights.medium,
                color: colors.textBody,
                marginBottom: space.s4,
              }}
            >
              {headline}
            </p>
          ) : null}
          <p
            style={{
              ...typography.sizes.t14,
              color: headline ? colors.textMuted : colors.textBody,
              marginBottom: space.s8,
              lineHeight: 1.55,
            }}
          >
            {previewBody(note.body, headline)}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: space.s4, marginBottom: space.s8 }}>
            {wpLabel && (
              <CategoryBadge color={colors.brandDarkBlue}>{wpLabel}</CategoryBadge>
            )}
            {note.field_site && (
              <CategoryBadge color={colors.brandWarmBlue}>{note.field_site}</CategoryBadge>
            )}
            {(note.care_frictions ?? []).map((k) => (
              <CategoryBadge key={`f-${k}`} color={FRICTIONS[k].color}>
                {FRICTIONS[k].label}
              </CategoryBadge>
            ))}
            {(note.care_qualities ?? []).map((k) => (
              <CategoryBadge key={`q-${k}`} color={QUALITIES[k].color}>
                {QUALITIES[k].label}
              </CategoryBadge>
            ))}
            {counts.suggestions.map((s) => (
              <CategoryBadge key={`s-${s.id}`} kind="dashed">
                {s.label}
              </CategoryBadge>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: space.s12,
              ...typography.sizes.t12,
              color: colors.textMuted,
            }}
          >
            <span>🔗 {counts.connections} {counts.connections === 1 ? "kobling" : "koblinger"}</span>
            <span>💬 {counts.comments} {counts.comments === 1 ? "kommentar" : "kommentarer"}</span>
            {note.map_scale && <span>{SCALES[note.map_scale].label}</span>}
          </div>
        </div>
      </button>
    </li>
  );
}

// ─── Pill toggle ───

function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; color?: string }[];
  value: T[];
  onChange: (next: T[]) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: space.s4 }}>
      {options.map((opt) => {
        const on = value.includes(opt.value);
        const accent = opt.color ?? colors.brandWarmBlue;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(on ? value.filter((x) => x !== opt.value) : [...value, opt.value])}
            style={{
              ...typography.sizes.t12,
              padding: `2px ${space.s8}`,
              background: on ? accent : "transparent",
              color: on ? colors.textLight : accent,
              border: `1px solid ${accent}`,
              cursor: "pointer",
              fontFamily: FONT_STACK,
              fontWeight: typography.weights.medium,
              borderRadius: 4,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Form (create + edit) ───

function NoteForm({
  noteId,
  currentProfile,
  onDone,
  onCancel,
}: {
  noteId?: string;
  currentProfile: Profile | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const editing = Boolean(noteId);
  const [headline, setHeadline] = useState("");
  const [body, setBody] = useState("");
  const [workPackage, setWorkPackage] = useState<WorkPackage | "">("");
  const [fieldSite, setFieldSite] = useState<FieldSite | "">("");
  const [houseThemes, setHouseThemes] = useState<HouseTheme[]>([]);
  const [frictions, setFrictions] = useState<CareFriction[]>([]);
  const [qualities, setQualities] = useState<CareQuality[]>([]);
  const [mapScale, setMapScale] = useState<MapScale | "">("");
  const [suggestions, setSuggestions] = useState<SuggestedCategory[]>([]);
  const [linked, setLinked] = useState<Set<string>>(new Set()); // composite "kind:id"
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [loading, setLoading] = useState(editing);

  // Hydrate from existing note when editing
  useEffect(() => {
    if (!noteId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [noteRes, connRes, sugRes] = await Promise.all([
        supabase.from("quick_notes").select("*").eq("id", noteId).single(),
        supabase
          .from("note_connections")
          .select("from_note_id,from_insight_id,to_note_id,to_insight_id")
          .or(`from_note_id.eq.${noteId},to_note_id.eq.${noteId}`),
        supabase.from("note_suggested_categories").select("suggestion_id").eq("note_id", noteId),
      ]);
      if (cancelled) return;
      if (noteRes.error || !noteRes.data) {
        setStatus({ kind: "err", msg: noteRes.error?.message ?? "Note not found." });
        setLoading(false);
        return;
      }
      const n = noteRes.data as QuickNote;
      setHeadline(n.headline ?? "");
      setBody(n.body);
      setWorkPackage(n.work_package ?? "");
      setFieldSite(n.field_site ?? "");
      setHouseThemes(n.house_themes ?? []);
      setFrictions(n.care_frictions ?? []);
      setQualities(n.care_qualities ?? []);
      setMapScale(n.map_scale ?? "");

      const linkedSet = new Set<string>();
      for (const c of (connRes.data as Pick<NoteConnection, "from_note_id" | "from_insight_id" | "to_note_id" | "to_insight_id">[] | null) ?? []) {
        const otherNote = c.from_note_id === noteId ? c.to_note_id : c.from_note_id;
        const otherInsight = c.from_note_id === noteId ? c.to_insight_id : c.from_insight_id;
        if (otherNote) linkedSet.add(`quick_note:${otherNote}`);
        if (otherInsight) linkedSet.add(`insight:${otherInsight}`);
      }
      setLinked(linkedSet);

      const sugIds = ((sugRes.data as { suggestion_id: string }[] | null) ?? []).map((r) => r.suggestion_id);
      if (sugIds.length > 0) {
        const { data: sugRows } = await supabase
          .from("suggested_categories")
          .select("*")
          .in("id", sugIds);
        setSuggestions(((sugRows as SuggestedCategory[] | null) ?? []));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [noteId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) {
      setStatus({ kind: "err", msg: "Skriv noe i selve notatet før du lagrer." });
      return;
    }
    if (!currentProfile) {
      setStatus({ kind: "err", msg: "Du må være logget inn med en profil for å lagre." });
      return;
    }
    setSubmitting(true);
    setStatus(null);

    const row = {
      author_id: currentProfile.id,
      headline: headline.trim() || null,
      body: body.trim(),
      work_package: workPackage || null,
      field_site: fieldSite || null,
      house_themes: houseThemes.length > 0 ? houseThemes : null,
      care_frictions: frictions.length > 0 ? frictions : null,
      care_qualities: qualities.length > 0 ? qualities : null,
      map_scale: mapScale || null,
      updated_at: new Date().toISOString(),
    };

    let savedId = noteId;
    if (editing && noteId) {
      const { error } = await supabase.from("quick_notes").update(row).eq("id", noteId);
      if (error) {
        setSubmitting(false);
        setStatus({ kind: "err", msg: error.message });
        return;
      }
    } else {
      const { data, error } = await supabase.from("quick_notes").insert(row).select("id").single();
      if (error || !data) {
        setSubmitting(false);
        setStatus({ kind: "err", msg: error?.message ?? "Klarte ikke å lagre notatet." });
        return;
      }
      savedId = (data as { id: string }).id;
    }

    if (!savedId) {
      setSubmitting(false);
      setStatus({ kind: "err", msg: "Mistet referanse til lagret notat." });
      return;
    }

    // Reconcile suggested categories
    {
      const { error: delErr } = await supabase
        .from("note_suggested_categories")
        .delete()
        .eq("note_id", savedId);
      if (delErr) {
        setSubmitting(false);
        setStatus({ kind: "err", msg: delErr.message });
        return;
      }
      if (suggestions.length > 0) {
        const { error: insErr } = await supabase
          .from("note_suggested_categories")
          .insert(suggestions.map((s) => ({ note_id: savedId, suggestion_id: s.id })));
        if (insErr) {
          setSubmitting(false);
          setStatus({ kind: "err", msg: insErr.message });
          return;
        }
      }
    }

    // Reconcile connections — delete existing edges that touch this note,
    // then re-insert from `linked`.
    {
      const { error: delErr } = await supabase
        .from("note_connections")
        .delete()
        .or(`from_note_id.eq.${savedId},to_note_id.eq.${savedId}`);
      if (delErr) {
        setSubmitting(false);
        setStatus({ kind: "err", msg: delErr.message });
        return;
      }
      if (linked.size > 0) {
        const rows = Array.from(linked).map((key) => {
          const [kind, id] = key.split(":");
          return {
            from_note_id: savedId,
            from_insight_id: null,
            to_note_id: kind === "quick_note" ? id : null,
            to_insight_id: kind === "insight" ? id : null,
            created_by: currentProfile.id,
          };
        });
        const { error: insErr } = await supabase.from("note_connections").insert(rows);
        if (insErr) {
          setSubmitting(false);
          setStatus({ kind: "err", msg: insErr.message });
          return;
        }
      }
    }

    setSubmitting(false);
    onDone();
  }

  if (loading) {
    return (
      <p style={{ ...typography.sizes.t14, color: colors.textMuted }}>Laster notat…</p>
    );
  }

  return (
    <form
      onSubmit={submit}
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
        gap: space.s24,
        alignItems: "flex-start",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: space.s16 }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: space.s8,
          }}
        >
          <h2
            style={{
              ...typography.sizes.t22,
              fontWeight: typography.weights.bold,
              color: colors.textBody,
            }}
          >
            {editing ? "Rediger notat" : "Nytt notat"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            style={{
              ...typography.sizes.t12,
              background: "transparent",
              border: "none",
              color: colors.textMuted,
              cursor: "pointer",
              fontFamily: FONT_STACK,
            }}
          >
            ← Tilbake
          </button>
        </header>

        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="Headline (valgfri)"
          style={{
            ...inputStyle,
            ...typography.sizes.t20,
            fontWeight: typography.weights.medium,
            padding: `${space.s12} ${space.s16}`,
          }}
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Skriv notatet — en idé, en lenke, en observasjon…"
          required
          style={{ ...inputStyle, minHeight: 220, lineHeight: 1.55 }}
        />

        {/* Tag selectors */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space.s12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: space.s4 }}>
            <span style={labelStyle}>Arbeidspakke</span>
            <select
              value={workPackage}
              onChange={(e) => setWorkPackage(e.target.value as WorkPackage | "")}
              style={inputStyle}
            >
              <option value="">—</option>
              {WORK_PACKAGES.map((wp) => (
                <option key={wp.value} value={wp.value}>
                  {wp.label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: space.s4 }}>
            <span style={labelStyle}>Feltsted</span>
            <select
              value={fieldSite}
              onChange={(e) => setFieldSite(e.target.value as FieldSite | "")}
              style={inputStyle}
            >
              <option value="">—</option>
              {FIELD_SITES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: space.s4 }}>
            <span style={labelStyle}>Skala</span>
            <select
              value={mapScale}
              onChange={(e) => setMapScale(e.target.value as MapScale | "")}
              style={inputStyle}
            >
              <option value="">—</option>
              {SCALE_KEYS.map((s) => (
                <option key={s} value={s}>
                  {SCALES[s].label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: space.s4 }}>
          <span style={labelStyle}>Friksjoner</span>
          <PillGroup
            options={FRICTION_KEYS.map((k) => ({ value: k, label: FRICTIONS[k].label, color: FRICTIONS[k].color }))}
            value={frictions}
            onChange={(next) => setFrictions(next as CareFriction[])}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: space.s4 }}>
          <span style={labelStyle}>Kvaliteter</span>
          <PillGroup
            options={QUALITY_KEYS.map((k) => ({ value: k, label: QUALITIES[k].label, color: QUALITIES[k].color }))}
            value={qualities}
            onChange={(next) => setQualities(next as CareQuality[])}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: space.s4 }}>
          <span style={labelStyle}>Hjem-tema</span>
          <PillGroup
            options={HOUSE_THEMES.map((k) => ({ value: k, label: k.replace(/_/g, " ") }))}
            value={houseThemes}
            onChange={(next) => setHouseThemes(next as HouseTheme[])}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: space.s4 }}>
          <span style={labelStyle}>Foreslåtte kategorier</span>
          <SuggestedCategoryInput
            selected={suggestions}
            onChange={setSuggestions}
            authorId={currentProfile?.id ?? null}
          />
        </div>

        {status && (
          <p
            style={{
              ...typography.sizes.t14,
              padding: `${space.s8} ${space.s16}`,
              background: status.kind === "ok" ? "#c7fde9" : "#fff2f1",
              border: `1px solid ${status.kind === "ok" ? "#43f8b6" : "#ffdfdc"}`,
              color: status.kind === "ok" ? "#034b45" : "#a83f34",
            }}
          >
            {status.msg}
          </p>
        )}

        <div style={{ display: "flex", gap: space.s8 }}>
          <button
            type="submit"
            disabled={submitting || !currentProfile}
            style={{
              ...typography.sizes.t14,
              padding: `${space.s12} ${space.s24}`,
              background: colors.brandWarmBlue,
              color: colors.textLight,
              border: `1px solid ${colors.brandWarmBlue}`,
              cursor: submitting ? "wait" : "pointer",
              opacity: submitting ? 0.7 : 1,
              fontFamily: FONT_STACK,
              fontWeight: typography.weights.medium,
            }}
          >
            {submitting ? "Lagrer…" : editing ? "Lagre endringer" : "Publiser notat"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              ...typography.sizes.t14,
              padding: `${space.s12} ${space.s24}`,
              background: colors.bgCard,
              color: colors.brandWarmBlue,
              border: `1px solid ${colors.brandWarmBlue}`,
              cursor: "pointer",
              fontFamily: FONT_STACK,
              fontWeight: typography.weights.medium,
            }}
          >
            Avbryt
          </button>
        </div>
      </div>

      <ConnectSidebar currentNoteId={noteId} linked={linked} setLinked={setLinked} />
    </form>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: colors.textMuted,
};

// ─── Connect sidebar ───

function ConnectSidebar({
  currentNoteId,
  linked,
  setLinked,
}: {
  currentNoteId?: string;
  linked: Set<string>;
  setLinked: (next: Set<string>) => void;
}) {
  const [items, setItems] = useState<LinkableEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const [notesRes, insightsRes] = await Promise.all([
        supabase
          .from("quick_notes")
          .select("id, headline, body, updated_at")
          .order("updated_at", { ascending: false })
          .limit(200),
        supabase
          .from("insights")
          .select("id, title, body, updated_at")
          .order("updated_at", { ascending: false })
          .limit(200),
      ]);
      if (!active) return;
      const noteItems: LinkableEntity[] = ((notesRes.data as { id: string; headline: string | null; body: string; updated_at: string }[] | null) ?? [])
        .filter((n) => n.id !== currentNoteId)
        .map((n) => ({
          kind: "quick_note",
          id: n.id,
          title: n.headline?.trim() || (n.body.length > 60 ? `${n.body.slice(0, 60)}…` : n.body),
          subtitle: null,
          updated_at: n.updated_at,
        }));
      const insightItems: LinkableEntity[] = ((insightsRes.data as { id: string; title: string; body: string; updated_at: string }[] | null) ?? []).map((i) => ({
        kind: "insight",
        id: i.id,
        title: i.title,
        subtitle: i.body.length > 80 ? `${i.body.slice(0, 80)}…` : i.body,
        updated_at: i.updated_at,
      }));
      setItems(
        [...noteItems, ...insightItems].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1)),
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [currentNoteId]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.title.toLowerCase().includes(q) || (it.subtitle ?? "").toLowerCase().includes(q));
  }, [items, filter]);

  function toggle(it: LinkableEntity) {
    const key = `${it.kind}:${it.id}`;
    const next = new Set(linked);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setLinked(next);
  }

  return (
    <aside
      style={{
        position: "sticky",
        top: space.s24,
        background: colors.bgCard,
        border: `1px solid ${colors.borderSubtle}`,
        padding: space.s16,
        display: "flex",
        flexDirection: "column",
        gap: space.s12,
        maxHeight: "80vh",
      }}
    >
      <div>
        <p style={labelStyle}>Koble til andre</p>
        <p
          style={{
            ...typography.sizes.t12,
            color: colors.textMuted,
            marginTop: space.s4,
          }}
        >
          Innsikter og notater {currentNoteId ? "(unntatt dette notatet)" : ""}
        </p>
      </div>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Søk…"
        style={inputStyle}
      />
      <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
        {loading ? (
          <p style={{ ...typography.sizes.t12, color: colors.textMuted }}>Laster…</p>
        ) : visible.length === 0 ? (
          <p style={{ ...typography.sizes.t12, color: colors.textMuted }}>
            Ingen treff.
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: space.s4 }}>
            {visible.map((it) => {
              const key = `${it.kind}:${it.id}`;
              const on = linked.has(key);
              return (
                <li key={key}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: space.s8,
                      padding: `${space.s8} ${space.s12}`,
                      cursor: "pointer",
                      background: on ? `${colors.brandBlueFaded}` : "transparent",
                      border: `1px solid ${on ? colors.brandWarmBlue : "transparent"}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(it)}
                      style={{ marginTop: 3, accentColor: colors.brandWarmBlue }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          ...typography.sizes.t12,
                          color: it.kind === "insight" ? colors.brandWarmBlue : colors.textMuted,
                          fontWeight: typography.weights.bold,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          marginBottom: 2,
                        }}
                      >
                        {it.kind === "insight" ? "Innsikt" : "Notat"}
                      </p>
                      <p
                        style={{
                          ...typography.sizes.t14,
                          color: colors.textBody,
                          fontWeight: typography.weights.medium,
                          marginBottom: 2,
                        }}
                      >
                        {it.title || "(Uten tittel)"}
                      </p>
                      {it.subtitle && (
                        <p
                          style={{
                            ...typography.sizes.t12,
                            color: colors.textMuted,
                            lineHeight: 1.45,
                          }}
                        >
                          {it.subtitle}
                        </p>
                      )}
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

// ─── Detail view ───

function NoteDetail({
  noteId,
  currentProfile,
  onEdit,
  onBack,
}: {
  noteId: string;
  currentProfile: Profile | null;
  onEdit: (id: string) => void;
  onBack: () => void;
}) {
  const [note, setNote] = useState<QuickNote | null>(null);
  const [author, setAuthor] = useState<Profile | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedCategory[]>([]);
  const [linkedItems, setLinkedItems] = useState<LinkableEntity[]>([]);
  const [comments, setComments] = useState<{ comment: CommentRow; author: Profile | null }[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [noteRes, sugJoinRes, connRes, commentRes] = await Promise.all([
      supabase.from("quick_notes").select("*").eq("id", noteId).single(),
      supabase.from("note_suggested_categories").select("suggestion_id").eq("note_id", noteId),
      supabase
        .from("note_connections")
        .select("from_note_id,from_insight_id,to_note_id,to_insight_id")
        .or(`from_note_id.eq.${noteId},to_note_id.eq.${noteId}`),
      supabase.from("comments").select("*").eq("quick_note_id", noteId).order("created_at", { ascending: true }),
    ]);

    if (noteRes.error || !noteRes.data) {
      setError(noteRes.error?.message ?? "Notat ikke funnet.");
      return;
    }
    const n = noteRes.data as QuickNote;
    setNote(n);

    // Author
    if (n.author_id) {
      const { data: a } = await supabase.from("profiles").select("*").eq("id", n.author_id).maybeSingle();
      setAuthor((a as Profile | null) ?? null);
    }

    // Suggestions
    const sugIds = ((sugJoinRes.data as { suggestion_id: string }[] | null) ?? []).map((r) => r.suggestion_id);
    if (sugIds.length > 0) {
      const { data: sugRows } = await supabase.from("suggested_categories").select("*").in("id", sugIds);
      setSuggestions(((sugRows as SuggestedCategory[] | null) ?? []));
    } else {
      setSuggestions([]);
    }

    // Linked items
    const conns = (connRes.data as Pick<NoteConnection, "from_note_id" | "from_insight_id" | "to_note_id" | "to_insight_id">[] | null) ?? [];
    const otherNoteIds: string[] = [];
    const otherInsightIds: string[] = [];
    for (const c of conns) {
      const otherNote = c.from_note_id === noteId ? c.to_note_id : c.from_note_id;
      const otherInsight = c.from_note_id === noteId ? c.to_insight_id : c.from_insight_id;
      if (otherNote) otherNoteIds.push(otherNote);
      if (otherInsight) otherInsightIds.push(otherInsight);
    }
    const [otherNotesRes, otherInsightsRes] = await Promise.all([
      otherNoteIds.length > 0
        ? supabase
            .from("quick_notes")
            .select("id, headline, body, updated_at")
            .in("id", otherNoteIds)
        : Promise.resolve({ data: [], error: null }),
      otherInsightIds.length > 0
        ? supabase
            .from("insights")
            .select("id, title, body, updated_at")
            .in("id", otherInsightIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    const linked: LinkableEntity[] = [
      ...((otherNotesRes.data as { id: string; headline: string | null; body: string; updated_at: string }[] | null) ?? []).map<LinkableEntity>((n2) => ({
        kind: "quick_note",
        id: n2.id,
        title: n2.headline?.trim() || (n2.body.length > 60 ? `${n2.body.slice(0, 60)}…` : n2.body),
        subtitle: null,
        updated_at: n2.updated_at,
      })),
      ...((otherInsightsRes.data as { id: string; title: string; body: string; updated_at: string }[] | null) ?? []).map<LinkableEntity>((i) => ({
        kind: "insight",
        id: i.id,
        title: i.title,
        subtitle: i.body.length > 80 ? `${i.body.slice(0, 80)}…` : i.body,
        updated_at: i.updated_at,
      })),
    ];
    setLinkedItems(linked);

    // Comments + their authors
    const cmts = (commentRes.data as CommentRow[] | null) ?? [];
    const commentAuthorIds = Array.from(new Set(cmts.map((c) => c.author_id)));
    const authorMap: Record<string, Profile> = {};
    if (commentAuthorIds.length > 0) {
      const { data: authorRows } = await supabase.from("profiles").select("*").in("id", commentAuthorIds);
      for (const p of (authorRows as Profile[] | null) ?? []) authorMap[p.id] = p;
    }
    setComments(cmts.map((c) => ({ comment: c, author: authorMap[c.author_id] ?? null })));
  }, [noteId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);

  async function postComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentBody.trim() || !currentProfile) return;
    setPosting(true);
    const { error: insErr } = await supabase.from("comments").insert({
      body: commentBody.trim(),
      author_id: currentProfile.id,
      quick_note_id: noteId,
    });
    setPosting(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setCommentBody("");
    await reload();
  }

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: space.s12 }}>
        <button type="button" onClick={onBack} style={backLinkStyle}>← Tilbake til alle notater</button>
        <p style={{ ...typography.sizes.t14, color: "#a83f34" }}>{error}</p>
      </div>
    );
  }
  if (!note) {
    return <p style={{ ...typography.sizes.t14, color: colors.textMuted }}>Laster…</p>;
  }

  const canEdit = currentProfile && (currentProfile.id === note.author_id || currentProfile.role === "admin");
  const wpLabel = note.work_package
    ? WORK_PACKAGES.find((w) => w.value === note.work_package)?.label
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: space.s24, maxWidth: 760 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: space.s8 }}>
        <button type="button" onClick={onBack} style={backLinkStyle}>← Tilbake til alle notater</button>
        {canEdit && (
          <button
            type="button"
            onClick={() => onEdit(noteId)}
            style={{
              ...typography.sizes.t12,
              padding: `${space.s4} ${space.s12}`,
              background: colors.bgCard,
              color: colors.brandWarmBlue,
              border: `1px solid ${colors.brandWarmBlue}`,
              cursor: "pointer",
              fontFamily: FONT_STACK,
              fontWeight: typography.weights.medium,
            }}
          >
            Rediger
          </button>
        )}
      </div>

      <header style={{ display: "flex", alignItems: "center", gap: space.s12 }}>
        <Avatar profile={author} size={44} />
        <div>
          <p style={{ ...typography.sizes.t14, fontWeight: typography.weights.medium, color: colors.textBody }}>
            {author?.full_name ?? "Ukjent forfatter"}
          </p>
          <p style={{ ...typography.sizes.t12, color: colors.textMuted }}>
            {formatTimestamp(note.created_at)}
            {note.updated_at && note.updated_at !== note.created_at ? ` · oppdatert ${formatTimestamp(note.updated_at)}` : ""}
          </p>
        </div>
      </header>

      {note.headline && (
        <h1
          style={{
            ...typography.sizes.t30,
            fontWeight: typography.weights.bold,
            color: colors.textBody,
            letterSpacing: "-0.01em",
          }}
        >
          {note.headline}
        </h1>
      )}

      <div
        style={{
          ...typography.sizes.t18,
          color: colors.textBody,
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
        }}
      >
        {note.body}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: space.s4 }}>
        {wpLabel && <CategoryBadge color={colors.brandDarkBlue}>{wpLabel}</CategoryBadge>}
        {note.field_site && <CategoryBadge color={colors.brandWarmBlue}>{note.field_site}</CategoryBadge>}
        {note.map_scale && <CategoryBadge color={colors.brandMutedBlue}>{SCALES[note.map_scale].label}</CategoryBadge>}
        {(note.care_frictions ?? []).map((k) => (
          <CategoryBadge key={`f-${k}`} color={FRICTIONS[k].color}>
            {FRICTIONS[k].label}
          </CategoryBadge>
        ))}
        {(note.care_qualities ?? []).map((k) => (
          <CategoryBadge key={`q-${k}`} color={QUALITIES[k].color}>
            {QUALITIES[k].label}
          </CategoryBadge>
        ))}
        {(note.house_themes ?? []).map((t) => (
          <CategoryBadge key={`t-${t}`}>{t.replace(/_/g, " ")}</CategoryBadge>
        ))}
        {suggestions.map((s) => (
          <CategoryBadge key={`s-${s.id}`} kind="dashed" title="Foreslått kategori">
            {s.label}
          </CategoryBadge>
        ))}
      </div>

      {/* Connected items */}
      <section
        style={{
          background: colors.bgSubtle,
          border: `1px solid ${colors.borderSubtle}`,
          padding: space.s16,
        }}
      >
        <p style={labelStyle}>Koblet til</p>
        {linkedItems.length === 0 ? (
          <p style={{ ...typography.sizes.t14, color: colors.textMuted, marginTop: space.s8 }}>
            Ingen koblinger ennå.
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: space.s8, marginTop: space.s8 }}>
            {linkedItems.map((it) => (
              <li
                key={`${it.kind}:${it.id}`}
                style={{
                  background: colors.bgCard,
                  border: `1px solid ${colors.borderSubtle}`,
                  padding: `${space.s8} ${space.s12}`,
                }}
              >
                <p
                  style={{
                    ...typography.sizes.t12,
                    color: it.kind === "insight" ? colors.brandWarmBlue : colors.textMuted,
                    fontWeight: typography.weights.bold,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 2,
                  }}
                >
                  {it.kind === "insight" ? "Innsikt" : "Notat"}
                </p>
                <p
                  style={{
                    ...typography.sizes.t14,
                    color: colors.textBody,
                    fontWeight: typography.weights.medium,
                  }}
                >
                  {it.title || "(Uten tittel)"}
                </p>
                {it.subtitle && (
                  <p style={{ ...typography.sizes.t12, color: colors.textMuted }}>{it.subtitle}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Comments */}
      <section style={{ display: "flex", flexDirection: "column", gap: space.s12 }}>
        <p style={labelStyle}>Kommentarer ({comments.length})</p>

        {comments.length === 0 && (
          <p style={{ ...typography.sizes.t14, color: colors.textMuted }}>
            Ingen kommentarer ennå.
          </p>
        )}

        {comments.map(({ comment, author: cAuthor }) => (
          <div
            key={comment.id}
            style={{
              display: "flex",
              gap: space.s8,
              padding: space.s12,
              background: colors.bgCard,
              border: `1px solid ${colors.borderSubtle}`,
            }}
          >
            <Avatar profile={cAuthor} size={28} />
            <div>
              <p style={{ ...typography.sizes.t12, color: colors.textMuted, marginBottom: 2 }}>
                <span style={{ color: colors.textBody, fontWeight: typography.weights.medium }}>
                  {cAuthor?.full_name ?? "Ukjent"}
                </span>{" "}
                · {formatTimestamp(comment.created_at)}
              </p>
              <p style={{ ...typography.sizes.t14, color: colors.textBody, whiteSpace: "pre-wrap" }}>
                {comment.body}
              </p>
            </div>
          </div>
        ))}

        {currentProfile && (
          <form onSubmit={postComment} style={{ display: "flex", flexDirection: "column", gap: space.s8 }}>
            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              placeholder="Legg til en kommentar…"
              style={{ ...inputStyle, minHeight: 80 }}
            />
            <button
              type="submit"
              disabled={posting || !commentBody.trim()}
              style={{
                alignSelf: "flex-start",
                ...typography.sizes.t14,
                padding: `${space.s8} ${space.s16}`,
                background: commentBody.trim() ? colors.brandWarmBlue : colors.bgSubtle,
                color: commentBody.trim() ? colors.textLight : colors.textMuted,
                border: `1px solid ${commentBody.trim() ? colors.brandWarmBlue : colors.borderSubtle}`,
                cursor: commentBody.trim() ? "pointer" : "not-allowed",
                fontFamily: FONT_STACK,
                fontWeight: typography.weights.medium,
              }}
            >
              {posting ? "Sender…" : "Send kommentar"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

const backLinkStyle: React.CSSProperties = {
  fontSize: 12,
  background: "transparent",
  border: "none",
  color: colors.textMuted,
  cursor: "pointer",
  fontFamily: FONT_STACK,
  textAlign: "left",
  padding: 0,
};
