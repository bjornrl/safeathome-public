"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { colors, space, typography } from "@/lib/design-tokens";
import { FRICTIONS, QUALITIES, SCALES } from "@/lib/constants";
import { embedSource } from "@/app/actions/embed";
import type {
  CareFriction,
  CareQuality,
  CommentRow,
  FieldSite,
  HouseTheme,
  LinkableEntity,
  MapScale,
  Profile,
  QuickNote,
  SuggestedCategory,
  WorkPackage,
} from "@/lib/types";
import { CategoryBadge } from "./CategoryBadge";
import { SuggestedCategoryInput } from "./SuggestedCategoryInput";
import {
  FONT_STACK,
  GhostBadge,
  GhostBadgeRow,
  PillGroup,
  SUGGEST_ACCENT,
  SUGGEST_DEBOUNCE_MS,
  SUGGEST_MIN_CHARS,
  SuggestBar,
  inputStyle as sharedInputStyle,
  labelStyle as sharedLabelStyle,
} from "./FormPrimitives";
import { CategoryHelp } from "@/components/ui";
import { ConnectSidebar } from "./ConnectSidebar";
import {
  fetchLinkedEntities,
  ENTITY_KIND_LABELS,
  loadEntityLinks,
  loadNoteConnectionsAsEntityKeys,
  saveEntityLinks,
  suggestionRelatedToKey,
  syncNoteConnectionsFromLinks,
} from "@/lib/entity-links";
import {
  getSuggestionAvailability,
  requestSuggestions,
  type SuggestionRelated,
} from "@/app/actions/suggest";

const FRICTION_KEYS = Object.keys(FRICTIONS) as CareFriction[];
const QUALITY_KEYS = Object.keys(QUALITIES) as CareQuality[];
const SCALE_KEYS = Object.keys(SCALES) as MapScale[];

// DB enum is uppercase WP1..WP4 — distinct from the lowercase wp1..wp4
// used by the legacy public_wp_reports table.
const WORK_PACKAGES: { value: WorkPackage; label: string }[] = [
  { value: "WP1", label: "WP1 · Hjem og fellesskap" },
  { value: "WP2", label: "WP2 · Helse- og omsorgsinstitusjoner" },
  { value: "WP3", label: "WP3 · Transnasjonale kontekster" },
  { value: "WP4", label: "WP4 · Innovasjon og design" },
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

const inputStyle = sharedInputStyle;

type View =
  | { kind: "create" }
  | { kind: "edit"; id: string }
  | { kind: "detail"; id: string };

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
  const [view, setView] = useState<View>({ kind: "create" });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    let active = true;
    getCurrentProfile().then((p) => {
      if (active) setProfile(p);
    });
    return () => {
      active = false;
    };
  }, []);

  const reset = useCallback(() => {
    setFormKey((k) => k + 1);
    setView({ kind: "create" });
  }, []);
  const goEdit = useCallback((id: string) => setView({ kind: "edit", id }), []);

  if (view.kind === "edit") {
    return <NoteForm noteId={view.id} currentProfile={profile} onDone={reset} onCancel={reset} />;
  }
  if (view.kind === "detail") {
    return <NoteDetail noteId={view.id} currentProfile={profile} onEdit={goEdit} onBack={reset} />;
  }
  return <NoteForm key={formKey} currentProfile={profile} onDone={reset} onCancel={reset} />;
}

// ─── Pill toggle ───

// (PillGroup, SuggestBar, Spinner, GhostBadgeRow, GhostBadge are now shared
//  primitives in ./FormPrimitives — imported above.)

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

  // ── AI suggestions ───────────────────────────────────────────
  const [aiAvailability, setAiAvailability] = useState<
    "checking" | "ready" | "limit_reached" | "unavailable"
  >("checking");
  const [aiFrictions, setAiFrictions] = useState<CareFriction[]>([]);
  const [aiQualities, setAiQualities] = useState<CareQuality[]>([]);
  const [aiWorkPackage, setAiWorkPackage] = useState<WorkPackage | null>(null);
  const [aiRelated, setAiRelated] = useState<SuggestionRelated[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCoolingDown, setAiCoolingDown] = useState(false);
  const [aiCleared, setAiCleared] = useState(false);
  const aiHadSuggestionsRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getSuggestionAvailability().then((res) => {
      if (cancelled) return;
      if (res.status === "ready") setAiAvailability("ready");
      else if (res.status === "limit_reached") setAiAvailability("limit_reached");
      else setAiAvailability("unavailable");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const aiHasSuggestions =
    aiFrictions.length > 0 ||
    aiQualities.length > 0 ||
    aiWorkPackage !== null ||
    aiRelated.length > 0;

  // Track when suggestions are emptied after having had some — show a brief
  // "Suggestions cleared" hint, then return to idle.
  useEffect(() => {
    if (aiHasSuggestions) {
      aiHadSuggestionsRef.current = true;
      if (aiCleared) setAiCleared(false);
      return;
    }
    if (!aiHadSuggestionsRef.current) return;
    aiHadSuggestionsRef.current = false;
    setAiCleared(true);
    const t = setTimeout(() => setAiCleared(false), 2000);
    return () => clearTimeout(t);
  }, [aiHasSuggestions, aiCleared]);

  const handleSuggest = useCallback(async () => {
    if (body.length < SUGGEST_MIN_CHARS) return;
    if (aiAvailability !== "ready") return;
    if (aiLoading || aiCoolingDown) return;

    setAiLoading(true);
    setAiCoolingDown(true);
    const cooldownTimer = setTimeout(() => setAiCoolingDown(false), SUGGEST_DEBOUNCE_MS);

    try {
      const res = await requestSuggestions({
        noteHeadline: headline,
        noteBody: body,
        currentFrictions: frictions,
        currentQualities: qualities,
        excludeSourceId: noteId,
      });
      if (res.status === "ok") {
        // Drop anything the user already picked.
        setAiFrictions(res.suggestions.frictions.filter((f) => !frictions.includes(f)));
        setAiQualities(res.suggestions.qualities.filter((q) => !qualities.includes(q)));
        setAiWorkPackage(
          res.suggestions.work_package && res.suggestions.work_package !== workPackage
            ? res.suggestions.work_package
            : null,
        );
        setAiRelated(
          res.suggestions.related.filter(
            (r) => !linked.has(suggestionRelatedToKey(r)),
          ),
        );
        if (res.remaining === 0) setAiAvailability("limit_reached");
      } else if (res.status === "limit_reached") {
        setAiAvailability("limit_reached");
      } else if (res.status === "unavailable" || res.status === "unauthenticated") {
        setAiAvailability("unavailable");
      }
      // "error" is silent — the form continues unchanged.
    } catch (err) {
      console.warn("[suggest] client call failed:", err);
    } finally {
      setAiLoading(false);
      // cooldownTimer keeps the button disabled for the rest of the 3s window.
      void cooldownTimer;
    }
  }, [body, headline, frictions, qualities, workPackage, linked, noteId, aiAvailability, aiLoading, aiCoolingDown]);

  const acceptFrictionSuggestion = useCallback((k: CareFriction) => {
    setFrictions((prev) => (prev.includes(k) ? prev : [...prev, k]));
    setAiFrictions((prev) => prev.filter((x) => x !== k));
  }, []);
  const dismissFrictionSuggestion = useCallback((k: CareFriction) => {
    setAiFrictions((prev) => prev.filter((x) => x !== k));
  }, []);
  const acceptQualitySuggestion = useCallback((k: CareQuality) => {
    setQualities((prev) => (prev.includes(k) ? prev : [...prev, k]));
    setAiQualities((prev) => prev.filter((x) => x !== k));
  }, []);
  const dismissQualitySuggestion = useCallback((k: CareQuality) => {
    setAiQualities((prev) => prev.filter((x) => x !== k));
  }, []);
  const acceptWorkPackageSuggestion = useCallback(() => {
    setWorkPackage((prev) => (aiWorkPackage && prev === "" ? aiWorkPackage : aiWorkPackage ?? prev));
    setAiWorkPackage(null);
  }, [aiWorkPackage]);
  const dismissWorkPackageSuggestion = useCallback(() => {
    setAiWorkPackage(null);
  }, []);
  const acceptRelatedSuggestion = useCallback(
    (key: string) => {
      const next = new Set(linked);
      next.add(key);
      setLinked(next);
      setAiRelated((prev) => prev.filter((r) => suggestionRelatedToKey(r) !== key));
    },
    [linked],
  );
  const dismissRelatedSuggestion = useCallback((key: string) => {
    setAiRelated((prev) => prev.filter((r) => suggestionRelatedToKey(r) !== key));
  }, []);

  const aiRelatedKeys = useMemo(
    () => new Set(aiRelated.map((r) => suggestionRelatedToKey(r))),
    [aiRelated],
  );

  // Hydrate from existing note when editing
  useEffect(() => {
    if (!noteId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [noteRes, sugRes] = await Promise.all([
        supabase.from("quick_notes").select("*").eq("id", noteId).single(),
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

      const linkedSet = await loadEntityLinks("quick_note", noteId);
      if (linkedSet.size === 0) {
        const legacy = await loadNoteConnectionsAsEntityKeys(noteId);
        legacy.forEach((k) => linkedSet.add(k));
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

    // Reconcile cross-corpus links + legacy note_connections for the node map.
    {
      const linkErr = await saveEntityLinks("quick_note", savedId, linked, currentProfile.id);
      if (linkErr) {
        setSubmitting(false);
        setStatus({ kind: "err", msg: linkErr });
        return;
      }
      const legacyErr = await syncNoteConnectionsFromLinks(savedId, linked, currentProfile.id);
      if (legacyErr) {
        setSubmitting(false);
        setStatus({ kind: "err", msg: legacyErr });
        return;
      }
    }

    // Inline (re)embed for semantic search; non-blocking, backfill repairs gaps.
    void embedSource("quick_note", savedId);

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
      <div style={{ display: "flex", flexDirection: "column", gap: space.s24 }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: space.s8,
            paddingBottom: space.s12,
            borderBottom: `1px solid ${colors.borderSubtle}`,
          }}
        >
          <h2
            style={{
              ...typography.sizes.t22,
              fontWeight: typography.weights.bold,
              color: colors.textBody,
              margin: 0,
              paddingRight: space.s16, // add padding to separate from adjacent button
              letterSpacing: "0.01em", // slight spacing for openness
              lineHeight: 1.3, // make title breathe
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

        <div style={{ display: "flex", flexDirection: "column", gap: space.s12 }}>
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
        </div>

        <SuggestBar
          availability={aiAvailability}
          bodyLength={body.length}
          loading={aiLoading}
          coolingDown={aiCoolingDown}
          cleared={aiCleared}
          onClick={handleSuggest}
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
            {aiWorkPackage && (
              <GhostBadgeRow label="✦ AI-forslag — klikk for å godta">
                <GhostBadge
                  color={SUGGEST_ACCENT}
                  onAccept={acceptWorkPackageSuggestion}
                  onDismiss={dismissWorkPackageSuggestion}
                >
                  {aiWorkPackage}
                </GhostBadge>
              </GhostBadgeRow>
            )}
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
          <CategoryHelp kind="friction" compact />
          <PillGroup
            options={FRICTION_KEYS.map((k) => ({ value: k, label: FRICTIONS[k].label, color: FRICTIONS[k].color }))}
            value={frictions}
            onChange={(next) => setFrictions(next as CareFriction[])}
          />
          {aiFrictions.length > 0 && (
            <GhostBadgeRow label="✦ AI-forslag — klikk for å godta">
              {aiFrictions.map((k) => (
                <GhostBadge
                  key={k}
                  color={FRICTIONS[k].color}
                  onAccept={() => acceptFrictionSuggestion(k)}
                  onDismiss={() => dismissFrictionSuggestion(k)}
                >
                  {FRICTIONS[k].label}
                </GhostBadge>
              ))}
            </GhostBadgeRow>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: space.s4 }}>
          <span style={labelStyle}>Kvaliteter</span>
          <CategoryHelp kind="quality" compact />
          <PillGroup
            options={QUALITY_KEYS.map((k) => ({ value: k, label: QUALITIES[k].label, color: QUALITIES[k].color }))}
            value={qualities}
            onChange={(next) => setQualities(next as CareQuality[])}
          />
          {aiQualities.length > 0 && (
            <GhostBadgeRow label="✦ AI-forslag — klikk for å godta">
              {aiQualities.map((k) => (
                <GhostBadge
                  key={k}
                  color={QUALITIES[k].color}
                  onAccept={() => acceptQualitySuggestion(k)}
                  onDismiss={() => dismissQualitySuggestion(k)}
                >
                  {QUALITIES[k].label}
                </GhostBadge>
              ))}
            </GhostBadgeRow>
          )}
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

      <ConnectSidebar
        exclude={noteId ? { kind: "quick_note", id: noteId } : undefined}
        linked={linked}
        setLinked={setLinked}
        suggestedKeys={aiRelatedKeys}
        onAcceptSuggested={acceptRelatedSuggestion}
        onDismissSuggested={dismissRelatedSuggestion}
      />
    </form>
  );
}

const labelStyle = sharedLabelStyle;

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
    const [noteRes, sugJoinRes, commentRes] = await Promise.all([
      supabase.from("quick_notes").select("*").eq("id", noteId).single(),
      supabase.from("note_suggested_categories").select("suggestion_id").eq("note_id", noteId),
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

    setLinkedItems(await fetchLinkedEntities("quick_note", noteId));

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
                  {ENTITY_KIND_LABELS[it.kind]}
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
