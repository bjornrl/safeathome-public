"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FRICTIONS, HOUSE_HOTSPOTS, QUALITIES, SCALES, WP_LABELS, type WpId } from "@/lib/constants";
import { RESOURCE_TYPE_LABELS } from "@/lib/seed-resources";
import { STAGES } from "@/lib/seed-solutions";
import type { CareFriction, CareQuality, FieldSite, HouseTheme, MapScale, ResourceType, WorkPackage } from "@/lib/types";
import { QuickNotesPanel } from "@/components/admin/QuickNotesPanel";
import { ConnectSidebar } from "@/components/admin/ConnectSidebar";
import { WelfareTechPanel } from "@/components/admin/WelfareTechPanel";
import { AdminHome } from "@/components/admin/AdminHome";
import { EmbeddingsPanel } from "@/components/admin/EmbeddingsPanel";
import { embedSource, removeEmbedding } from "@/app/actions/embed";
import {
  FormHeader,
  GhostBadge,
  GhostBadgeRow,
  PillGroup,
  PrimarySubmit,
  SUGGEST_DEBOUNCE_MS,
  StatusBanner,
  SuggestBar,
  inputStyle as sharedInputStyle,
  labelStyle as sharedLabelStyle,
} from "@/components/admin/FormPrimitives";
import { CategoryHelp, InlineConfirm, Toast } from "@/components/ui";
import {
  entityLinkKey,
  linkedIdsOfKind,
  loadEntityLinks,
  saveEntityLinks,
  suggestionRelatedToKey,
} from "@/lib/entity-links";
import {
  getSuggestionAvailability,
  requestSuggestions,
  type RelatedSourceType,
  type SuggestionRelated,
} from "@/app/actions/suggest";
const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';
type Tab = "home" | "notes" | "stories" | "challenges" | "resources" | "wp" | "welfare-tech" | "search-index";
const TAB_VALUES: Tab[] = ["home", "notes", "stories", "challenges", "resources", "wp", "welfare-tech", "search-index"];

// "home" carries its own copy (AdminHome), so it has no banner description.
const TAB_DESCRIPTIONS: Record<Exclude<Tab, "home">, string> = {
  notes:
    "Kladdebok for pågående observasjoner, ideer og spørsmål fra feltet. Merk med arbeidspakke, friksjon, kvalitet, tema eller skala slik at notatene dukker opp i nodekartet og i AI-forslagene.",
  stories:
    "Ferdige, publiserte funn — det som blir det offentlige historiekartet. Knytt en innsikt til arbeidspakken den kommer fra, feltstedet og friksjonene/kvalitetene den illustrerer. Bruk koblingsskjemaet under for å trekke typede linjer mellom to publiserte innsikter.",
  challenges:
    "Åpne problemer designteamet jobber med, basert på én eller flere innsikter og merket med friksjonene eller kvalitetene de adresserer. Hver utfordring beveger seg gjennom fasene: rammer inn → utforsker → tester → tatt i bruk.",
  resources:
    "Oppføringer for lesesalen og kommunale ressurser — publikasjoner, verktøykasser, policy-notater, undervisningsguider. Koble til innsiktene de hører sammen med og merk med friksjoner/kvaliteter slik at de dukker opp på de matchende offentlige sidene.",
  wp: "Månedlige statusrapporter, én rad per arbeidspakke per måned. Fanger opp intervjuet, høydepunktene og neste steg. Setter rytmen for WP-framdriftsoversikten.",
  "welfare-tech":
    "Teknologi-oppføringer med produsent, tilgjengelighet per land og beskrivelse. Vises på den offentlige velferdsteknologi-siden når de publiseres.",
  "search-index":
    "Status for den semantiske søkeindeksen. Embeddings lages automatisk ved lagring; her ser du hva som mangler og kan fylle hullene manuelt.",
};
const WP_IDS = Object.keys(WP_LABELS) as WpId[];
const FRICTION_KEYS = Object.keys(FRICTIONS) as CareFriction[];
const QUALITY_KEYS = Object.keys(QUALITIES) as CareQuality[];
const THEMES: HouseTheme[] = ["front_door", "living_room", "kitchen", "bedroom", "study", "childrens_room", "garden", "phone", "prayer_space", "bathroom", "hallway"];
const FIELD_SITES: FieldSite[] = ["Alna", "Søndre Nordstrand"];
const SCALE_KEYS = Object.keys(SCALES) as MapScale[];
const RESOURCE_TYPES = Object.keys(RESOURCE_TYPE_LABELS) as ResourceType[];

// Norwegian labels for the eleven house themes (dropdown shows these instead
// of the raw underscore-separated enum keys). HOUSE_HOTSPOTS already labels
// the eight rooms used on the public house overlay; we extend it here with
// the three admin-only themes (prayer_space, bathroom, hallway).
const HOUSE_HOTSPOT_LABELS = Object.fromEntries(
  HOUSE_HOTSPOTS.map((h) => [h.theme, h.label]),
) as Record<HouseTheme, string>;
const THEME_LABELS: Record<HouseTheme, string> = {
  ...HOUSE_HOTSPOT_LABELS,
  prayer_space: "Bønnerom",
  bathroom: "Bad",
  hallway: "Gang",
};

// ─── Toast context (avoids prop-drilling) ───
type ToastFn = (message: string, kind?: "ok" | "err") => void;
const ToastContext = createContext<ToastFn>(() => { });
function useToast(): ToastFn {
  return useContext(ToastContext);
}

// DB enum is uppercase WP1..WP4 — same shape as quick_notes.work_package.
const WORK_PACKAGES: { value: WorkPackage; label: string }[] = [
  { value: "WP1", label: "WP1 · Hjem og fellesskap" },
  { value: "WP2", label: "WP2 · Helse- og omsorgsinstitusjoner" },
  { value: "WP3", label: "WP3 · Transnasjonale kontekster" },
  { value: "WP4", label: "WP4 · Innovasjon og design" },
];

// ─── Shared form styling (QuickNotes look) ───
const qnForm: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 24,
};
const formWithSidebar: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
  gap: 24,
  alignItems: "flex-start",
};
const qnFieldStack: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
};
const qnHeadlineInput: React.CSSProperties = {
  ...sharedInputStyle,
  fontSize: 20,
  fontWeight: 500,
  padding: "12px 16px",
};

// ─── Shared AI suggestion hook ───
// Mirrors the integration in QuickNotesPanel: availability check, debounce,
// per-category accept/dismiss handlers. Used by StoryForm, ChallengeForm, and
// ResourceForm.
function useAiSuggest({
  title,
  body,
  currentFrictions,
  currentQualities,
  currentWorkPackage,
  excludeSourceId,
  relatedSourceTypes,
  isRelatedExcluded,
}: {
  title: string;
  body: string;
  currentFrictions: CareFriction[];
  currentQualities: CareQuality[];
  currentWorkPackage?: WorkPackage | "";
  excludeSourceId?: string;
  relatedSourceTypes?: RelatedSourceType[];
  isRelatedExcluded?: (item: SuggestionRelated) => boolean;
}) {
  const [availability, setAvailability] = useState<"checking" | "ready" | "limit_reached" | "unavailable">("checking");
  const [loading, setLoading] = useState(false);
  const [coolingDown, setCoolingDown] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [frictions, setFrictions] = useState<CareFriction[]>([]);
  const [qualities, setQualities] = useState<CareQuality[]>([]);
  const [workPackage, setWorkPackage] = useState<WorkPackage | null>(null);
  const [related, setRelated] = useState<SuggestionRelated[]>([]);
  const hadSuggestionsRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getSuggestionAvailability().then((res) => {
      if (cancelled) return;
      if (res.status === "ready") setAvailability("ready");
      else if (res.status === "limit_reached") setAvailability("limit_reached");
      else setAvailability("unavailable");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasSuggestions =
    frictions.length > 0 ||
    qualities.length > 0 ||
    workPackage !== null ||
    related.length > 0;
  useEffect(() => {
    if (hasSuggestions) {
      hadSuggestionsRef.current = true;
      if (cleared) setCleared(false);
      return;
    }
    if (!hadSuggestionsRef.current) return;
    hadSuggestionsRef.current = false;
    setCleared(true);
    const t = setTimeout(() => setCleared(false), 2000);
    return () => clearTimeout(t);
  }, [hasSuggestions, cleared]);

  const run = useCallback(async () => {
    if (availability !== "ready" || loading || coolingDown) return;
    setLoading(true);
    setCoolingDown(true);
    const cooldownTimer = setTimeout(() => setCoolingDown(false), SUGGEST_DEBOUNCE_MS);
    try {
      const res = await requestSuggestions({
        noteHeadline: title,
        noteBody: body,
        currentFrictions,
        currentQualities,
        excludeSourceId,
        relatedSourceTypes,
      });
      if (res.status === "ok") {
        setFrictions(res.suggestions.frictions.filter((f) => !currentFrictions.includes(f)));
        setQualities(res.suggestions.qualities.filter((q) => !currentQualities.includes(q)));
        setWorkPackage(
          res.suggestions.work_package && res.suggestions.work_package !== currentWorkPackage
            ? res.suggestions.work_package
            : null,
        );
        setRelated(
          res.suggestions.related.filter((r) => !isRelatedExcluded?.(r)),
        );
        if (res.remaining === 0) setAvailability("limit_reached");
      } else if (res.status === "limit_reached") {
        setAvailability("limit_reached");
      } else if (res.status === "unavailable" || res.status === "unauthenticated") {
        setAvailability("unavailable");
      }
      // "error" is silent — the form keeps existing state.
    } catch (err) {
      console.warn("[ai-suggest] failed:", err);
    } finally {
      setLoading(false);
      void cooldownTimer;
    }
  }, [
    availability,
    loading,
    coolingDown,
    title,
    body,
    currentFrictions,
    currentQualities,
    currentWorkPackage,
    excludeSourceId,
    relatedSourceTypes,
    isRelatedExcluded,
  ]);

  const dismissRelated = useCallback((item: SuggestionRelated) => {
    setRelated((prev) => prev.filter((r) => !(r.type === item.type && r.id === item.id)));
  }, []);

  const dismissRelatedByKey = useCallback((key: string) => {
    setRelated((prev) => prev.filter((r) => suggestionRelatedToKey(r) !== key));
  }, []);

  return {
    availability,
    loading,
    coolingDown,
    cleared,
    frictions,
    qualities,
    workPackage,
    related,
    run,
    dismissFriction: (k: CareFriction) => setFrictions((prev) => prev.filter((x) => x !== k)),
    dismissQuality: (k: CareQuality) => setQualities((prev) => prev.filter((x) => x !== k)),
    dismissWorkPackage: () => setWorkPackage(null),
    dismissRelated,
    dismissRelatedByKey,
    reset: () => {
      setFrictions([]);
      setQualities([]);
      setWorkPackage(null);
      setRelated([]);
    },
  };
}

// ─── Page ───

export default function AdminPage() {
  const searchParams = useSearchParams();
  const initialTab = (() => {
    const raw = searchParams.get("tab");
    return raw && (TAB_VALUES as string[]).includes(raw) ? (raw as Tab) : "home";
  })();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToastState] = useState<{ message: string; kind: "ok" | "err"; nonce: number } | null>(null);
  const showToast = useCallback<ToastFn>((message, kind = "ok") => {
    setToastState({ message, kind, nonce: Date.now() });
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id ?? null;
      if (!active) return;
      setCurrentUserId(userId);
      if (!userId) {
        setIsAdmin(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();
      if (!active) return;
      setIsAdmin((profile as { role?: string } | null)?.role === "admin");
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const raw = searchParams.get("tab");
    if (raw && (TAB_VALUES as string[]).includes(raw) && raw !== tab) {
      setTab(raw as Tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function selectTab(next: Tab) {
    setTab(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      window.history.replaceState({}, "", url);
    }
  }

  return <ToastContext.Provider value={showToast}>
    <main style={{
      fontFamily: FONT_STACK
    }} className="[max-width:1200px] [margin:0_auto] [padding:40px_24px_96px]">
      <header className="[margin-bottom:40px]">
        <h1 className="[font-size:40px] [font-weight:700] [letter-spacing:-0.02em] [color:#2a2859] [margin:0_0_12px]">
          Innholdsredigering
        </h1>
        <br />
        <p className="[font-size:15px] [color:#666666] [margin:0] [line-height:1.6] [max-width:720px]">
          Hurtignotater, innsikter, designutfordringer og lesesal-oppføringer —
          alt som skrives her havner i den tilsvarende Supabase-tabellen.
        </p>
      </header>

      <nav className="[display:flex] [gap:8px] [margin-bottom:20px] [flex-wrap:wrap]">
        <TabButton active={tab === "home"} onClick={() => selectTab("home")}>
          Start
        </TabButton>
        <TabButton active={tab === "notes"} onClick={() => selectTab("notes")}>
          Hurtignotater
        </TabButton>
        <TabButton active={tab === "stories"} onClick={() => selectTab("stories")}>
          Innsikter
        </TabButton>
        <TabButton active={tab === "challenges"} onClick={() => selectTab("challenges")}>
          Designutfordringer
        </TabButton>
        <TabButton active={tab === "resources"} onClick={() => selectTab("resources")}>
          Ressurser
        </TabButton>
        <TabButton active={tab === "wp"} onClick={() => selectTab("wp")}>
          WP-framdrift
        </TabButton>
        {isAdmin && (
          <TabButton active={tab === "welfare-tech"} onClick={() => selectTab("welfare-tech")}>
            Velferdsteknologi
          </TabButton>
        )}
        {isAdmin && (
          <TabButton active={tab === "search-index"} onClick={() => selectTab("search-index")}>
            Search index
          </TabButton>
        )}
      </nav>

      {tab !== "home" && (
        <p className="[font-size:14px] [color:#4d4d4d] [line-height:1.65] [max-width:760px] [margin:0_0_40px] [padding:14px_18px] [background:#f7f6f0] [border:1px_solid_#e6e6e6] [border-radius:8px]">
          {TAB_DESCRIPTIONS[tab]}
        </p>
      )}

      {tab === "home" && <AdminHome onOpenTab={(t) => selectTab(t as Tab)} />}
      {tab === "notes" && <QuickNotesPanel />}
      {tab === "stories" && <StoriesPanel currentUserId={currentUserId} />}
      {tab === "challenges" && <ChallengesPanel />}
      {tab === "resources" && <ResourcesPanel currentUserId={currentUserId} />}
      {tab === "wp" && <WpPanel />}
      {tab === "welfare-tech" && (isAdmin ? (
        <WelfareTechPanel currentUserId={currentUserId} />
      ) : (
        <p className="[font-size:14px] [color:#a83f34]">
          Du må være administrator for å redigere velferdsteknologi.
        </p>
      ))}
      {tab === "search-index" && (isAdmin ? (
        <EmbeddingsPanel />
      ) : (
        <p className="[font-size:14px] [color:#a83f34]">
          Du må være administrator for å se søkeindeksen.
        </p>
      ))}
    </main>
    {toast && (
      <Toast
        key={toast.nonce}
        message={toast.message}
        kind={toast.kind}
        onDismiss={() => setToastState(null)}
      />
    )}
  </ToastContext.Provider>;
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
  work_package: WorkPackage | null;
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
function StoriesPanel({ currentUserId }: { currentUserId: string | null }) {
  const showToast = useToast();
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
    <div className="[display:grid] [grid-template-columns:repeat(auto-fit,_minmax(320px,_1fr))] [gap:32px]">
      <section>
        <SectionHeading>Ny innsikt</SectionHeading>
        <StoryForm onCreated={load} currentUserId={currentUserId} />
      </section>

      <section>
        <SectionHeading>Siste innsikter</SectionHeading>
        <ItemList loading={loading} rows={rows.map(r => ({
          id: r.id,
          title: r.title,
          subtitle: `${SCALES[r.map_scale]?.label ?? r.map_scale}${r.field_site ? ` · ${r.field_site}` : ""}${r.work_package ? ` · ${r.work_package}` : ""}`,
          published: r.published,
          tags: r.frictions
        }))} onTogglePublish={async (id, next) => {
          const {
            error
          } = await supabase.from("public_stories").update({
            published: next,
            published_at: next ? new Date().toISOString() : null
          }).eq("id", id);
          if (error) {
            showToast(error.message, "err");
          } else {
            showToast(next ? "Innsikt publisert." : "Innsikt satt som utkast.");
            load();
          }
        }} onDelete={async id => {
          const {
            error
          } = await supabase.from("public_stories").delete().eq("id", id);
          if (error) {
            showToast(error.message, "err");
          } else {
            void removeEmbedding("story", id);
            showToast("Innsikt slettet.");
            load();
          }
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
  const showToast = useToast();
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
  return <div className="[display:grid] [grid-template-columns:repeat(auto-fit,_minmax(320px,_1fr))] [gap:32px]">
    <section>
      <SectionHeading>Ny kobling</SectionHeading>
      <ConnectionForm stories={stories} onCreated={load} />
    </section>
    <section>
      <SectionHeading>Siste koblinger</SectionHeading>
      <ItemList loading={loading} rows={rows.map(r => {
        const labelSet = r.category_kind === "friction" ? FRICTIONS : QUALITIES;
        const label = (labelSet as Record<string, { label: string }>)[r.category_key]?.label ?? r.category_key;
        return {
          id: r.id,
          title: `${titleFor(r.from_story_id)} → ${titleFor(r.to_story_id)}`,
          subtitle: `${r.category_kind === "friction" ? "Friksjon" : "Kvalitet"} · ${label} · ${r.connection_type}`,
          published: r.published,
          tags: r.description ? [r.description.slice(0, 60)] : []
        };
      })} onTogglePublish={async (id, next) => {
        const { error } = await supabase.from("public_connections").update({ published: next }).eq("id", id);
        if (error) { showToast(error.message, "err"); } else { showToast(next ? "Kobling publisert." : "Kobling skjult."); load(); }
      }} onDelete={async id => {
        const { error } = await supabase.from("public_connections").delete().eq("id", id);
        if (error) { showToast(error.message, "err"); } else { showToast("Kobling slettet."); load(); }
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
      setStatus({ kind: "err", msg: "Velg både en fra- og til-innsikt." });
      return;
    }
    if (fromId === toId) {
      setStatus({ kind: "err", msg: "Fra og til må være forskjellige innsikter." });
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
    setStatus({ kind: "ok", msg: "Kobling lagret." });
    setDescription("");
    onCreated();
  }
  return <Form onSubmit={submit}>
    <FormRow>
      <FormField label="Fra innsikt">
        <select style={inputStyle} value={fromId} onChange={e => setFromId(e.target.value)} required>
          <option value="">Velg…</option>
          {stories.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </FormField>
      <FormField label="Til innsikt">
        <select style={inputStyle} value={toId} onChange={e => setToId(e.target.value)} required>
          <option value="">Velg…</option>
          {stories.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </FormField>
    </FormRow>

    <FormRow>
      <FormField label="Kategori">
        <select style={inputStyle} value={categoryKind} onChange={e => setCategoryKind(e.target.value as "friction" | "quality")}>
          <option value="friction">Friksjon</option>
          <option value="quality">Kvalitet</option>
        </select>
      </FormField>
      {categoryKind === "friction" ? <FormField label="Friksjon">
        <select style={inputStyle} value={frictionKey} onChange={e => setFrictionKey(e.target.value as CareFriction)}>
          {FRICTION_KEYS.map(k => <option key={k} value={k}>{FRICTIONS[k].label}</option>)}
        </select>
      </FormField> : <FormField label="Kvalitet">
        <select style={inputStyle} value={qualityKey} onChange={e => setQualityKey(e.target.value as CareQuality)}>
          {QUALITY_KEYS.map(k => <option key={k} value={k}>{QUALITIES[k].label}</option>)}
        </select>
      </FormField>}
      <FormField label="Linje">
        <select style={inputStyle} value={connectionType} onChange={e => setConnectionType(e.target.value as "direct" | "indirect")}>
          <option value="direct">Direkte (heltrukken)</option>
          <option value="indirect">Indirekte (stiplet)</option>
        </select>
      </FormField>
    </FormRow>

    <FormField label="Beskrivelse (valgfritt)">
      <textarea style={inputStyle} value={description} onChange={e => setDescription(e.target.value)} className="[min-height:80px]" placeholder="Én setning som beskriver hvorfor disse er koblet." />
    </FormField>

    <PublishToggle value={published} onChange={setPublished} />
    <SubmitBar status={status} submitting={submitting} label="Lagre kobling" />
  </Form>;
}
function StoryForm({
  onCreated,
  currentUserId,
}: {
  onCreated: () => void;
  currentUserId: string | null;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mapScale, setMapScale] = useState<MapScale>("meso");
  const [theme, setTheme] = useState<HouseTheme>("living_room");
  const [fieldSite, setFieldSite] = useState<FieldSite | "">("Alna");
  const [workPackage, setWorkPackage] = useState<WorkPackage | "">("");
  const [frictions, setFrictions] = useState<CareFriction[]>([]);
  const [qualities, setQualities] = useState<CareQuality[]>([]);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [author, setAuthor] = useState("safe@home fieldwork team");
  const [published, setPublished] = useState(true);
  const [linked, setLinked] = useState<Set<string>>(() => new Set());
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const isRelatedExcluded = useCallback(
    (item: SuggestionRelated) => linked.has(suggestionRelatedToKey(item)),
    [linked],
  );

  const ai = useAiSuggest({
    title,
    body,
    currentFrictions: frictions,
    currentQualities: qualities,
    currentWorkPackage: workPackage,
    isRelatedExcluded,
  });

  const aiRelatedKeys = useMemo(
    () => new Set(ai.related.map((r) => suggestionRelatedToKey(r))),
    [ai.related],
  );

  const acceptRelatedSuggestion = useCallback(
    (key: string) => {
      setLinked((prev) => new Set(prev).add(key));
      ai.dismissRelatedByKey(key);
    },
    [ai],
  );

  const dismissRelatedSuggestion = useCallback(
    (key: string) => {
      ai.dismissRelatedByKey(key);
    },
    [ai],
  );

  function acceptFriction(k: CareFriction) {
    setFrictions((prev) => (prev.includes(k) ? prev : [...prev, k]));
    ai.dismissFriction(k);
  }
  function acceptQuality(k: CareQuality) {
    setQualities((prev) => (prev.includes(k) ? prev : [...prev, k]));
    ai.dismissQuality(k);
  }
  function acceptWorkPackage() {
    if (ai.workPackage) {
      setWorkPackage(ai.workPackage);
      ai.dismissWorkPackage();
    }
  }

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
      // theme is always set by this form (dropdown defaults to a room), and the
      // `public_stories_theme_home_based_chk` constraint requires home_based=TRUE
      // whenever theme is non-null. Keep them in lockstep.
      home_based: true,
      field_site: fieldSite || null,
      work_package: workPackage || null,
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
    if (error) {
      setSubmitting(false);
      setStatus({ kind: "err", msg: error.message });
      return;
    }

    const linkErr = await saveEntityLinks("story", row.id, linked, currentUserId);
    if (linkErr) {
      setSubmitting(false);
      setStatus({ kind: "err", msg: linkErr });
      return;
    }

    setSubmitting(false);
    // Inline (re)embed; failures leave a null vector that the admin
    // "missing embeddings" panel / backfill repairs. Don't block the UI.
    void embedSource("story", row.id);
    setStatus({ kind: "ok", msg: "Innsikt lagret." });
    setTitle("");
    setBody("");
    setFrictions([]);
    setQualities([]);
    setLatitude("");
    setLongitude("");
    setWorkPackage("");
    setLinked(new Set());
    ai.reset();
    onCreated();
  }

  return (
    <form onSubmit={submit} style={formWithSidebar}>
      <div style={qnForm}>
      <FormHeader title="Ny innsikt" />

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tittel"
          required
          style={qnHeadlineInput}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Skriv innsikten — bakgrunn, observasjon, hva som står på spill. Bruk blanke linjer for å skille avsnitt."
          required
          style={{ ...sharedInputStyle, minHeight: 220, lineHeight: 1.55 }}
        />
      </div>

      <SuggestBar
        availability={ai.availability}
        bodyLength={body.length}
        loading={ai.loading}
        coolingDown={ai.coolingDown}
        cleared={ai.cleared}
        onClick={ai.run}
      />

      {/* Tag selectors */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <label style={qnFieldStack}>
          <span style={sharedLabelStyle}>Arbeidspakke</span>
          <select
            value={workPackage}
            onChange={(e) => setWorkPackage(e.target.value as WorkPackage | "")}
            style={sharedInputStyle}
          >
            <option value="">—</option>
            {WORK_PACKAGES.map((wp) => (
              <option key={wp.value} value={wp.value}>
                {wp.label}
              </option>
            ))}
          </select>
          {ai.workPackage && (
            <GhostBadgeRow label="✦ AI-forslag — klikk for å godta">
              <GhostBadge
                color="#C45D3E"
                onAccept={acceptWorkPackage}
                onDismiss={ai.dismissWorkPackage}
              >
                {ai.workPackage}
              </GhostBadge>
            </GhostBadgeRow>
          )}
        </label>

        <label style={qnFieldStack}>
          <span style={sharedLabelStyle}>Feltsted</span>
          <select
            value={fieldSite}
            onChange={(e) => setFieldSite(e.target.value as FieldSite | "")}
            style={sharedInputStyle}
          >
            <option value="">—</option>
            {FIELD_SITES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label style={qnFieldStack}>
          <span style={sharedLabelStyle}>Skala</span>
          <select
            value={mapScale}
            onChange={(e) => setMapScale(e.target.value as MapScale)}
            style={sharedInputStyle}
          >
            {SCALE_KEYS.map((s) => (
              <option key={s} value={s}>
                {SCALES[s].label}
              </option>
            ))}
          </select>
        </label>

        <label style={qnFieldStack}>
          <span style={sharedLabelStyle}>Tema / rom</span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as HouseTheme)}
            style={sharedInputStyle}
          >
            {THEMES.map((t) => (
              <option key={t} value={t}>
                {THEME_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={qnFieldStack}>
        <span style={sharedLabelStyle}>Friksjoner</span>
        <CategoryHelp kind="friction" compact />
        <PillGroup
          options={FRICTION_KEYS.map((k) => ({
            value: k,
            label: FRICTIONS[k].label,
            color: FRICTIONS[k].color,
          }))}
          value={frictions}
          onChange={(next) => setFrictions(next as CareFriction[])}
        />
        {ai.frictions.length > 0 && (
          <GhostBadgeRow label="✦ AI-forslag — klikk for å godta">
            {ai.frictions.map((k) => (
              <GhostBadge
                key={k}
                color={FRICTIONS[k].color}
                onAccept={() => acceptFriction(k)}
                onDismiss={() => ai.dismissFriction(k)}
              >
                {FRICTIONS[k].label}
              </GhostBadge>
            ))}
          </GhostBadgeRow>
        )}
      </div>

      <div style={qnFieldStack}>
        <span style={sharedLabelStyle}>Kvaliteter</span>
        <CategoryHelp kind="quality" compact />
        <PillGroup
          options={QUALITY_KEYS.map((k) => ({
            value: k,
            label: QUALITIES[k].label,
            color: QUALITIES[k].color,
          }))}
          value={qualities}
          onChange={(next) => setQualities(next as CareQuality[])}
        />
        {ai.qualities.length > 0 && (
          <GhostBadgeRow label="✦ AI-forslag — klikk for å godta">
            {ai.qualities.map((k) => (
              <GhostBadge
                key={k}
                color={QUALITIES[k].color}
                onAccept={() => acceptQuality(k)}
                onDismiss={() => ai.dismissQuality(k)}
              >
                {QUALITIES[k].label}
              </GhostBadge>
            ))}
          </GhostBadgeRow>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <label style={qnFieldStack}>
          <span style={sharedLabelStyle}>Breddegrad</span>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="59.8976"
            style={sharedInputStyle}
          />
        </label>
        <label style={qnFieldStack}>
          <span style={sharedLabelStyle}>Lengdegrad</span>
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="10.8155"
            style={sharedInputStyle}
          />
        </label>
      </div>

      <label style={qnFieldStack}>
        <span style={sharedLabelStyle}>Forfatterkreditering</span>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          style={sharedInputStyle}
        />
      </label>

      <PublishToggle value={published} onChange={setPublished} />
      <StatusBanner status={status} />
      <PrimarySubmit submitting={submitting} label="Publiser innsikt" />
      </div>

      <ConnectSidebar
        linked={linked}
        setLinked={setLinked}
        suggestedKeys={aiRelatedKeys}
        onAcceptSuggested={acceptRelatedSuggestion}
        onDismissSuggested={dismissRelatedSuggestion}
      />
    </form>
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
  qualities: CareQuality[];
  source_stories: string[];
  outcome: string | null;
  published: boolean;
  created_at?: string;
}
function ChallengesPanel() {
  const showToast = useToast();
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
  return <div className="[display:grid] [grid-template-columns:repeat(auto-fit,_minmax(320px,_1fr))] [gap:32px]">
    <section>
      <SectionHeading>Ny designutfordring</SectionHeading>
      <ChallengeForm stories={stories} onCreated={load} />
    </section>

    <section>
      <SectionHeading>Siste utfordringer</SectionHeading>
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
        if (error) { showToast(error.message, "err"); } else { showToast(next ? "Utfordring publisert." : "Utfordring satt som utkast."); load(); }
      }} onDelete={async id => {
        const {
          error
        } = await supabase.from("public_design_responses").delete().eq("id", id);
        if (error) { showToast(error.message, "err"); } else { showToast("Utfordring slettet."); load(); }
      }} />
    </section>
  </div>;
}
function ChallengeForm({
  stories,
  onCreated,
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
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  // Design challenges don't carry a work_package, so we don't pass one to
  // the suggest hook. AI still proposes friction + quality tags.
  const ai = useAiSuggest({
    title,
    body,
    currentFrictions: frictions,
    currentQualities: qualities,
  });

  function acceptFriction(k: CareFriction) {
    setFrictions((prev) => (prev.includes(k) ? prev : [...prev, k]));
    ai.dismissFriction(k);
  }
  function acceptQuality(k: CareQuality) {
    setQualities((prev) => (prev.includes(k) ? prev : [...prev, k]));
    ai.dismissQuality(k);
  }

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
      sort_order: 0,
    };
    const { error } = await supabase.from("public_design_responses").insert(row);
    setSubmitting(false);
    if (error) {
      setStatus({ kind: "err", msg: error.message });
      return;
    }
    setStatus({ kind: "ok", msg: "Utfordring lagret." });
    setTitle("");
    setBody("");
    setOutcome("");
    setFrictions([]);
    setQualities([]);
    setSourceStories([]);
    ai.reset();
    onCreated();
  }

  return (
    <form onSubmit={submit} style={qnForm}>
      <FormHeader title="Ny designutfordring" />

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tittel"
          required
          style={qnHeadlineInput}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Beskriv utfordringen — hva er problemet, hvem rammes, hvilken vri trengs?"
          required
          style={{ ...sharedInputStyle, minHeight: 180, lineHeight: 1.55 }}
        />
      </div>

      <SuggestBar
        availability={ai.availability}
        bodyLength={body.length}
        loading={ai.loading}
        coolingDown={ai.coolingDown}
        cleared={ai.cleared}
        onClick={ai.run}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <label style={qnFieldStack}>
          <span style={sharedLabelStyle}>Fase</span>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as typeof stage)}
            style={sharedInputStyle}
          >
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label style={qnFieldStack}>
          <span style={sharedLabelStyle}>Tema / rom</span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as HouseTheme)}
            style={sharedInputStyle}
          >
            {THEMES.map((t) => (
              <option key={t} value={t}>
                {THEME_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={qnFieldStack}>
        <span style={sharedLabelStyle}>Friksjoner som adresseres</span>
        <CategoryHelp kind="friction" compact />
        <PillGroup
          options={FRICTION_KEYS.map((k) => ({
            value: k,
            label: FRICTIONS[k].label,
            color: FRICTIONS[k].color,
          }))}
          value={frictions}
          onChange={(next) => setFrictions(next as CareFriction[])}
        />
        {ai.frictions.length > 0 && (
          <GhostBadgeRow label="✦ AI-forslag — klikk for å godta">
            {ai.frictions.map((k) => (
              <GhostBadge
                key={k}
                color={FRICTIONS[k].color}
                onAccept={() => acceptFriction(k)}
                onDismiss={() => ai.dismissFriction(k)}
              >
                {FRICTIONS[k].label}
              </GhostBadge>
            ))}
          </GhostBadgeRow>
        )}
      </div>

      <div style={qnFieldStack}>
        <span style={sharedLabelStyle}>Kvaliteter som adresseres</span>
        <CategoryHelp kind="quality" compact />
        <PillGroup
          options={QUALITY_KEYS.map((k) => ({
            value: k,
            label: QUALITIES[k].label,
            color: QUALITIES[k].color,
          }))}
          value={qualities}
          onChange={(next) => setQualities(next as CareQuality[])}
        />
        {ai.qualities.length > 0 && (
          <GhostBadgeRow label="✦ AI-forslag — klikk for å godta">
            {ai.qualities.map((k) => (
              <GhostBadge
                key={k}
                color={QUALITIES[k].color}
                onAccept={() => acceptQuality(k)}
                onDismiss={() => ai.dismissQuality(k)}
              >
                {QUALITIES[k].label}
              </GhostBadge>
            ))}
          </GhostBadgeRow>
        )}
      </div>

      <label style={qnFieldStack}>
        <span style={sharedLabelStyle}>
          Kilde-innsikter (valgfritt — utfordringer kobles primært til kategorier)
        </span>
        <StoryMultiSelect stories={stories} value={sourceStories} onChange={setSourceStories} />
      </label>

      <label style={qnFieldStack}>
        <span style={sharedLabelStyle}>Resultat (valgfritt)</span>
        <textarea
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          style={{ ...sharedInputStyle, minHeight: 80, lineHeight: 1.55 }}
        />
      </label>

      <PublishToggle value={published} onChange={setPublished} />
      <StatusBanner status={status} />
      <PrimarySubmit submitting={submitting} label="Publiser utfordring" />
    </form>
  );
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
    return <p className="[font-size:12px] [color:#9a9a9a] [font-style:italic]">Ingen innsikter ennå — la stå tom for å hoppe over.</p>;
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
  map_scale: MapScale | null;
  published: boolean;
  created_at?: string;
}
function ResourcesPanel({ currentUserId }: { currentUserId: string | null }) {
  const showToast = useToast();
  const [rows, setRows] = useState<ResourceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    const resRes = await supabase.from("public_resources").select("*").order("created_at", { ascending: false }).limit(50);
    setLoading(false);
    if (resRes.error) console.warn("Load resources:", resRes.error.message);
    setRows((resRes.data as ResourceRow[]) ?? []);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);
  return <div className="[display:grid] [grid-template-columns:repeat(auto-fit,_minmax(320px,_1fr))] [gap:32px]">
    <section>
      <SectionHeading>{editId ? "Rediger ressurs" : "Ny ressurs"}</SectionHeading>
      <ResourceForm key={editId ?? "new"} editId={editId} onSaved={() => { setEditId(null); load(); }} onCancel={() => setEditId(null)} currentUserId={currentUserId} />
    </section>

    <section>
      <SectionHeading>Siste ressurser</SectionHeading>
      <ItemList loading={loading} rows={rows.map(r => ({
        id: r.id,
        title: r.title,
        subtitle: [
          RESOURCE_TYPE_LABELS[r.type],
          r.map_scale ? SCALES[r.map_scale]?.label : null,
        ].filter(Boolean).join(" · "),
        published: r.published,
        tags: []
      }))} onTogglePublish={async (id, next) => {
        const {
          error
        } = await supabase.from("public_resources").update({
          published: next
        }).eq("id", id);
        if (error) { showToast(error.message, "err"); } else { showToast(next ? "Ressurs publisert." : "Ressurs satt som utkast."); load(); }
      }} onDelete={async id => {
        const {
          error
        } = await supabase.from("public_resources").delete().eq("id", id);
        if (error) { showToast(error.message, "err"); } else { void removeEmbedding("resource", id); showToast("Ressurs slettet."); load(); }
      }} onEdit={id => setEditId(id)} />
    </section>
  </div>;
}
function ResourceForm({
  editId,
  onSaved,
  onCancel,
  currentUserId,
}: {
  editId: string | null;
  onSaved: () => void;
  onCancel: () => void;
  currentUserId: string | null;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ResourceType>("publication");
  const [url, setUrl] = useState("");
  const [mapScale, setMapScale] = useState<MapScale | "">("");
  const [frictions, setFrictions] = useState<CareFriction[]>([]);
  const [qualities, setQualities] = useState<CareQuality[]>([]);
  const [linked, setLinked] = useState<Set<string>>(() => new Set());
  const [published, setPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{
    kind: "ok" | "err";
    msg: string;
  } | null>(null);

  const isRelatedExcluded = useCallback(
    (item: SuggestionRelated) => linked.has(suggestionRelatedToKey(item)),
    [linked],
  );

  const ai = useAiSuggest({
    title,
    body: description,
    currentFrictions: frictions,
    currentQualities: qualities,
    excludeSourceId: editId ?? undefined,
    isRelatedExcluded,
  });

  const aiRelatedKeys = useMemo(
    () => new Set(ai.related.map((r) => suggestionRelatedToKey(r))),
    [ai.related],
  );

  const acceptRelatedSuggestion = useCallback(
    (key: string) => {
      setLinked((prev) => new Set(prev).add(key));
      ai.dismissRelatedByKey(key);
    },
    [ai],
  );

  const dismissRelatedSuggestion = useCallback(
    (key: string) => {
      ai.dismissRelatedByKey(key);
    },
    [ai],
  );

  function acceptFrictionSuggestion(k: CareFriction) {
    setFrictions((prev) => (prev.includes(k) ? prev : [...prev, k]));
    ai.dismissFriction(k);
  }
  function acceptQualitySuggestion(k: CareQuality) {
    setQualities((prev) => (prev.includes(k) ? prev : [...prev, k]));
    ai.dismissQuality(k);
  }

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
        setStatus({ kind: "err", msg: rRes.error?.message ?? "Ressursen ble ikke funnet." });
        return;
      }
      const r = rRes.data as ResourceRow;
      setTitle(r.title);
      setDescription(r.description ?? "");
      setType(r.type);
      setUrl(r.url ?? "");
      setMapScale(r.map_scale ?? "");
      setPublished(r.published);
      setFrictions(((fRes.data ?? []) as { friction_key: CareFriction }[]).map(x => x.friction_key));
      setQualities(((qRes.data ?? []) as { quality_key: CareQuality }[]).map(x => x.quality_key));

      const linkedSet = await loadEntityLinks("resource", editId);
      for (const storyId of ((sRes.data ?? []) as { story_id: string }[]).map(x => x.story_id)) {
        linkedSet.add(entityLinkKey("story", storyId));
      }
      setLinked(linkedSet);
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
      map_scale: mapScale || null,
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
    const storyIds = linkedIdsOfKind(linked, "story");
    const errors = [
      await reconcile("public_resource_frictions", "friction_key", frictions),
      await reconcile("public_resource_qualities", "quality_key", qualities),
      await reconcile("public_resource_stories", "story_id", storyIds),
    ].filter(Boolean);

    const linkErr = await saveEntityLinks("resource", id, linked, currentUserId);
    if (linkErr) {
      setSubmitting(false);
      setStatus({ kind: "err", msg: linkErr });
      return;
    }

    setSubmitting(false);
    if (errors.length > 0) {
      setStatus({ kind: "err", msg: errors.map(e => e!.message).join(" · ") });
      return;
    }
    void embedSource("resource", id);
    setStatus({ kind: "ok", msg: editId ? "Ressurs oppdatert." : "Ressurs lagret." });
    if (!editId) {
      setTitle("");
      setDescription("");
      setUrl("");
      setMapScale("");
      setFrictions([]);
      setQualities([]);
      setLinked(new Set());
      ai.reset();
    }
    onSaved();
  }
  const suggestTextLength = `${title}\n${description}`.trim().length;

  return (
    <div style={formWithSidebar}>
      <Form onSubmit={submit}>
    <FormField label="Tittel">
      <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} required />
    </FormField>
    <FormField label="Beskrivelse">
      <textarea style={{
        ...inputStyle
      }} value={description} onChange={e => setDescription(e.target.value)} className="[min-height:110px]" />
    </FormField>

    <SuggestBar
      availability={ai.availability}
      bodyLength={suggestTextLength}
      loading={ai.loading}
      coolingDown={ai.coolingDown}
      cleared={ai.cleared}
      onClick={ai.run}
    />

    <FormRow>
      <FormField label="Type">
        <select style={inputStyle} value={type} onChange={e => setType(e.target.value as ResourceType)}>
          {RESOURCE_TYPES.map(t => <option key={t} value={t}>
            {RESOURCE_TYPE_LABELS[t]}
          </option>)}
        </select>
      </FormField>
    </FormRow>
    <FormField label="Lenke (URL)">
      <input style={inputStyle} type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" />
    </FormField>
    <FormField label="Skala">
      <CategoryHelp kind="scale" compact />
      <select
        style={inputStyle}
        value={mapScale}
        onChange={(e) => setMapScale(e.target.value as MapScale | "")}
      >
        <option value="">—</option>
        {SCALE_KEYS.map((s) => (
          <option key={s} value={s}>
            {SCALES[s].label}
          </option>
        ))}
      </select>
    </FormField>
    <FormField label="Relaterte friksjoner">
      <CategoryHelp kind="friction" compact />
      <CheckboxGroup options={FRICTION_KEYS.map(k => ({
        value: k,
        label: FRICTIONS[k].label,
        color: FRICTIONS[k].color
      }))} value={frictions} onChange={next => setFrictions(next as CareFriction[])} />
      {ai.frictions.length > 0 && (
        <GhostBadgeRow label="✦ AI-forslag — klikk for å godta">
          {ai.frictions.map((k) => (
            <GhostBadge
              key={k}
              color={FRICTIONS[k].color}
              onAccept={() => acceptFrictionSuggestion(k)}
              onDismiss={() => ai.dismissFriction(k)}
            >
              {FRICTIONS[k].label}
            </GhostBadge>
          ))}
        </GhostBadgeRow>
      )}
    </FormField>
    <FormField label="Relaterte kvaliteter">
      <CategoryHelp kind="quality" compact />
      <CheckboxGroup options={QUALITY_KEYS.map(k => ({
        value: k,
        label: QUALITIES[k].label,
        color: QUALITIES[k].color
      }))} value={qualities} onChange={next => setQualities(next as CareQuality[])} />
      {ai.qualities.length > 0 && (
        <GhostBadgeRow label="✦ AI-forslag — klikk for å godta">
          {ai.qualities.map((k) => (
            <GhostBadge
              key={k}
              color={QUALITIES[k].color}
              onAccept={() => acceptQualitySuggestion(k)}
              onDismiss={() => ai.dismissQuality(k)}
            >
              {QUALITIES[k].label}
            </GhostBadge>
          ))}
        </GhostBadgeRow>
      )}
    </FormField>
    <PublishToggle value={published} onChange={setPublished} />
    <SubmitBar status={status} submitting={submitting} label={editId ? "Oppdater ressurs" : "Lagre ressurs"} />
    {editId && <button type="button" onClick={onCancel} className="[font-size:12px] [color:#666666] [background:transparent] [border:none] [cursor:pointer] [padding:0px] [align-self:flex-start]">Avbryt redigering</button>}
      </Form>

      <ConnectSidebar
        exclude={editId ? { kind: "resource", id: editId } : undefined}
        linked={linked}
        setLinked={setLinked}
        suggestedKeys={aiRelatedKeys}
        onAcceptSuggested={acceptRelatedSuggestion}
        onDismissSuggested={dismissRelatedSuggestion}
      />
    </div>
  );
}

// ─── WP monthly reports ───

interface WpReportRow {
  id: string;
  wp_id: string;
  month: string; // ISO date like "2026-04-01"
  summary: string;
  highlights: string[];
  next_steps: string;
  interviewer: string;
  interviewee: string | null;
  published: boolean;
  created_at?: string;
  updated_at?: string;
}

function WpPanel() {
  const showToast = useToast();
  const [rows, setRows] = useState<WpReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("public_wp_reports").select("*").order("month", { ascending: false });
    setLoading(false);
    if (error) console.warn("Load wp_reports:", error.message);
    setRows((data as WpReportRow[]) ?? []);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);
  const byWp = useMemo(() => {
    const groups: Record<WpId, WpReportRow[]> = { wp1: [], wp2: [], wp3: [], wp4: [] };
    rows.forEach(r => {
      if (WP_IDS.includes(r.wp_id as WpId)) groups[r.wp_id as WpId].push(r);
    });
    return groups;
  }, [rows]);
  return <div className="[display:grid] [grid-template-columns:repeat(auto-fit,_minmax(320px,_1fr))] [gap:32px]">
    <section>
      <SectionHeading>{editId ? "Rediger rapport" : "Ny rapport"}</SectionHeading>
      <WpReportForm key={editId ?? "new"} editId={editId} onSaved={() => { setEditId(null); load(); }} onCancel={() => setEditId(null)} />
    </section>
    <section>
      <SectionHeading>Eksisterende rapporter</SectionHeading>
      {loading && rows.length === 0 && <p className="[font-size:14px] [color:#9a9a9a]">Laster…</p>}
      <div className="[display:flex] [flex-direction:column] [gap:24px]">
        {WP_IDS.map(wp => <div key={wp}>
          <p className="[font-size:13px] [font-weight:700] [color:#2a2859] [margin-bottom:4px]">{WP_LABELS[wp].label}</p>
          <p className="[font-size:12px] [color:#9a9a9a] [margin-bottom:10px]">{WP_LABELS[wp].subtitle}</p>
          {byWp[wp].length === 0 ? <p className="[font-size:12px] [color:#9a9a9a] [font-style:italic]">Ingen rapporter ennå.</p> : <ul className="[list-style:none] [padding:0px] [margin:0px] [display:grid] [gap:8px]">
            {byWp[wp].map(r => <li key={r.id} className="[display:flex] [align-items:flex-start] [justify-content:space-between] [gap:16px] [padding:12px_16px] [background:#ffffff] [border:1px_solid_#e6e6e6] [border-radius:8px]">
              <div>
                <p className="[font-size:14px] [font-weight:600] [color:#2a2859]">{formatMonth(r.month)}</p>
                <p className="[font-size:12px] [color:#666666] [margin-top:2px]">{r.interviewee ? `med ${r.interviewee}` : "—"} · {r.interviewer}</p>
                {r.summary && <p className="[font-size:12px] [color:#2c2c2c] [margin-top:6px] [line-height:1.5]">{r.summary.slice(0, 140)}{r.summary.length > 140 ? "…" : ""}</p>}
              </div>
              <div className="[display:flex] [flex-direction:column] [gap:6px] [align-items:flex-end]">
                <button type="button" onClick={async () => {
                  const next = !r.published;
                  const { error } = await supabase.from("public_wp_reports").update({ published: next, updated_at: new Date().toISOString() }).eq("id", r.id);
                  if (error) { showToast(error.message, "err"); } else { showToast(next ? "Rapport publisert." : "Rapport satt som utkast."); load(); }
                }} style={{
                  border: `1px solid ${r.published ? "#034b45" : "#e6e6e6"}`,
                  background: r.published ? "#034b45" : "#ffffff",
                  color: r.published ? "#ffffff" : "#666666",
                  fontFamily: FONT_STACK
                }} className="[font-size:11px] [padding:4px_10px] [border-radius:4px] [cursor:pointer] [font-weight:600]">
                  {r.published ? "Publisert" : "Utkast"}
                </button>
                <button type="button" onClick={() => setEditId(r.id)} className="[font-size:11px] [color:#1f42aa] [background:transparent] [border:none] [cursor:pointer] [padding:0px] [font-weight:500]">Rediger</button>
                <InlineConfirm
                  label="Slett"
                  confirmLabel="Bekreft sletting"
                  onConfirm={async () => {
                    const { error } = await supabase.from("public_wp_reports").delete().eq("id", r.id);
                    if (error) { showToast(error.message, "err"); } else { showToast("Rapport slettet."); load(); }
                  }}
                />
              </div>
            </li>)}
          </ul>}
        </div>)}
      </div>
    </section>
  </div>;
}

function formatMonth(isoDate: string): string {
  // "2026-04-01" -> "april 2026"
  const d = new Date(isoDate);
  return d.toLocaleDateString("nb-NO", { month: "long", year: "numeric" });
}

function WpReportForm({
  editId,
  onSaved,
  onCancel
}: {
  editId: string | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [wpId, setWpId] = useState<WpId>("wp1");
  const [monthStr, setMonthStr] = useState(""); // HTML month input: "YYYY-MM"
  const [summary, setSummary] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [nextSteps, setNextSteps] = useState("");
  const [interviewer, setInterviewer] = useState("Comte");
  const [interviewee, setInterviewee] = useState("");
  const [published, setPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("public_wp_reports").select("*").eq("id", editId).single();
      if (cancelled) return;
      if (error || !data) {
        setStatus({ kind: "err", msg: error?.message ?? "Rapporten ble ikke funnet." });
        return;
      }
      const r = data as WpReportRow;
      setWpId((WP_IDS.includes(r.wp_id as WpId) ? (r.wp_id as WpId) : "wp1"));
      setMonthStr(r.month.slice(0, 7)); // "YYYY-MM-01" -> "YYYY-MM"
      setSummary(r.summary);
      setHighlights(r.highlights ?? []);
      setNextSteps(r.next_steps);
      setInterviewer(r.interviewer);
      setInterviewee(r.interviewee ?? "");
      setPublished(r.published);
    })();
    return () => { cancelled = true; };
  }, [editId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!monthStr) {
      setStatus({ kind: "err", msg: "Velg en måned." });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    const row = {
      id: editId ?? crypto.randomUUID(),
      wp_id: wpId,
      month: `${monthStr}-01`,
      summary: summary.trim(),
      highlights: highlights.map(h => h.trim()).filter(h => h.length > 0),
      next_steps: nextSteps.trim(),
      interviewer: interviewer.trim() || "Comte",
      interviewee: interviewee.trim() || null,
      published,
      updated_at: new Date().toISOString()
    };
    const { error } = await supabase.from("public_wp_reports").upsert(row, { onConflict: "id" });
    setSubmitting(false);
    if (error) {
      const friendly = /duplicate key|unique/i.test(error.message)
        ? `En rapport for ${WP_LABELS[wpId].label} i ${formatMonth(row.month)} finnes allerede. Rediger den i stedet.`
        : error.message;
      setStatus({ kind: "err", msg: friendly });
      return;
    }
    setStatus({ kind: "ok", msg: editId ? "Rapport oppdatert." : "Rapport lagret." });
    if (!editId) {
      setSummary("");
      setHighlights([]);
      setNextSteps("");
      setInterviewee("");
      setMonthStr("");
    }
    onSaved();
  }

  return <Form onSubmit={submit}>
    <FormRow>
      <FormField label="Arbeidspakke">
        <select style={inputStyle} value={wpId} onChange={e => setWpId(e.target.value as WpId)}>
          {WP_IDS.map(k => <option key={k} value={k}>{WP_LABELS[k].label}</option>)}
        </select>
      </FormField>
      <FormField label="Måned">
        <input style={inputStyle} type="month" value={monthStr} onChange={e => setMonthStr(e.target.value)} required />
      </FormField>
    </FormRow>
    <FormField label="Sammendrag">
      <textarea style={inputStyle} value={summary} onChange={e => setSummary(e.target.value)} className="[min-height:110px]" />
    </FormField>
    <FormField label="Høydepunkter">
      <div className="[display:flex] [flex-direction:column] [gap:8px]">
        {highlights.map((h, i) => <div key={i} className="[display:flex] [gap:8px]">
          <input style={inputStyle} value={h} onChange={e => setHighlights(highlights.map((x, j) => j === i ? e.target.value : x))} placeholder="Ett høydepunkt…" />
          <button type="button" onClick={() => setHighlights(highlights.filter((_, j) => j !== i))} className="[padding:8px_12px] [font-size:12px] [color:#a83f34] [background:transparent] [border:1px_solid_#e6e6e6] [border-radius:8px] [cursor:pointer]">Fjern</button>
        </div>)}
        <button type="button" onClick={() => setHighlights([...highlights, ""])} className="[align-self:flex-start] [padding:6px_12px] [font-size:12px] [color:#1f42aa] [background:transparent] [border:1px_dashed_#1f42aa] [border-radius:8px] [cursor:pointer]">+ Legg til høydepunkt</button>
      </div>
    </FormField>
    <FormField label="Neste steg">
      <textarea style={inputStyle} value={nextSteps} onChange={e => setNextSteps(e.target.value)} className="[min-height:80px]" />
    </FormField>
    <FormRow>
      <FormField label="Intervjuer">
        <input style={inputStyle} value={interviewer} onChange={e => setInterviewer(e.target.value)} />
      </FormField>
      <FormField label="Intervjuobjekt">
        <input style={inputStyle} value={interviewee} onChange={e => setInterviewee(e.target.value)} placeholder="Navn (valgfritt)" />
      </FormField>
    </FormRow>
    <PublishToggle value={published} onChange={setPublished} />
    <SubmitBar status={status} submitting={submitting} label={editId ? "Oppdater rapport" : "Lagre rapport"} />
    {editId && <button type="button" onClick={onCancel} className="[font-size:12px] [color:#666666] [background:transparent] [border:none] [cursor:pointer] [padding:0px] [align-self:flex-start]">Avbryt redigering</button>}
  </Form>;
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
      Publiser umiddelbart{value ? "" : " (lagre som utkast)"}
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
      {submitting ? "Lagrer…" : label}
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
    return <p className="[font-size:14px] [color:#9a9a9a]">Laster…</p>;
  }
  if (rows.length === 0) {
    return <p className="[font-size:14px] [color:#666666] [padding:24px] [background:#ffffff] [border:1px_dashed_#e6e6e6] [border-radius:8px] [line-height:1.6]">
      Ingenting her ennå. Bruk skjemaet for å opprette den første oppføringen.
      <br />
      <span className="[font-size:12px] [color:#9a9a9a]">
        Hvis du forventet eksisterende rader, sjekk at Supabase-tabellen har row-level-security-policies som tillater SELECT for innloggede brukere.
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
          {r.published ? "Publisert" : "Utkast"}
        </button>
        {onEdit && <button type="button" onClick={() => onEdit(r.id)} style={{
          fontFamily: FONT_STACK
        }} className="[font-size:11px] [color:#1f42aa] [background:transparent] [border:none] [cursor:pointer] [padding:0px] [font-weight:500]">
          Rediger
        </button>}
        <InlineConfirm
          label="Slett"
          confirmLabel="Bekreft sletting"
          onConfirm={() => onDelete(r.id)}
        />
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
