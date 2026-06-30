"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { colors, motion as motionTokens, radius, space, typography } from "@/lib/design-tokens";
import { FRICTIONS, QUALITIES } from "@/lib/constants";
import { getSearchHitDetail, semanticSearch } from "@/app/actions/search";
import {
  sourceLabel,
  type EmbeddableSourceType,
  type SearchHit,
  type SearchHitDetail,
  type SearchResponse,
} from "@/lib/search-types";

const SOURCE_FILTERS: { key: EmbeddableSourceType; label: string }[] = [
  { key: "insight", label: "Innsikter" },
  { key: "quick_note", label: "Notater" },
  { key: "story", label: "Historier" },
  { key: "resource", label: "Ressurser" },
];

const BADGE_COLOR: Record<EmbeddableSourceType, string> = {
  insight: "#1f42aa",
  quick_note: "#0e7c66",
  story: "#8a4b1f",
  resource: "#6b3fa0",
};

export default function SearchClient() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<EmbeddableSourceType[]>([]);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [pending, startTransition] = useTransition();

  // Slide-in detail. `activeHit` opens the panel instantly with what we already
  // have; `detail` arrives from the server fetch and fills in the full body.
  const [activeHit, setActiveHit] = useState<SearchHit | null>(null);
  const [detail, setDetail] = useState<SearchHitDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  // Monotonic token so a slow fetch from a previous click can't overwrite the
  // detail of the hit that's open now.
  const reqRef = useRef(0);

  function toggle(key: EmbeddableSourceType) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function run(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setResponse({ status: "empty" });
      return;
    }
    startTransition(async () => {
      const res = await semanticSearch(q, selected);
      setResponse(res);
    });
  }

  const openHit = useCallback((hit: SearchHit) => {
    const token = ++reqRef.current;
    setActiveHit(hit);
    setDetail(null);
    setDetailLoading(true);
    getSearchHitDetail(hit.sourceType, hit.sourceId)
      .then((d) => {
        if (reqRef.current !== token) return; // a newer click (or close) won
        setDetail(d);
        setDetailLoading(false);
      })
      .catch(() => {
        if (reqRef.current !== token) return;
        setDetail(null);
        setDetailLoading(false);
      });
  }, []);

  const closeHit = useCallback(() => {
    reqRef.current++; // invalidate any in-flight fetch
    setActiveHit(null);
    setDetail(null);
    setDetailLoading(false);
  }, []);

  return (
    <main
      id="main-content"
      style={{ background: colors.bg, color: colors.textBody, minHeight: "70vh" }}
    >
      <div style={{ maxWidth: "880px", margin: "0 auto", padding: `${space.s64} ${space.s24} ${space.s32}` }}>
        <p className="pkt-eyebrow" style={{ marginBottom: space.s16 }}>Søk</p>
        <h1 style={{ marginBottom: space.s16, maxWidth: "18ch" }}>
          Semantisk søk i materialet.
        </h1>
        <p style={{ ...typography.sizes.t18, color: colors.textMuted, maxWidth: "640px", marginBottom: space.s32 }}>
          Søk på mening, ikke bare ord. Skriv på norsk eller engelsk — treffene
          dekker innsikter, notater, historier og ressurser.
        </p>

        <form onSubmit={run} style={{ marginBottom: space.s24 }}>
          <div style={{ display: "flex", gap: space.s8, maxWidth: "640px" }}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="f.eks. isolasjon og digitalt utenforskap i Alna"
              aria-label="Søk"
              style={{
                flex: 1,
                padding: `${space.s12} ${space.s16}`,
                fontFamily: typography.fontFamily,
                fontSize: "16px",
                lineHeight: "24px",
                fontWeight: typography.weights.light,
                color: colors.textBody,
                background: colors.bgCard,
                border: `1px solid ${colors.borderGray}`,
                borderRadius: radius.none,
                transition: `border-color ${motionTokens.fast}`,
              }}
            />
            <button
              type="submit"
              disabled={pending}
              style={{
                padding: `${space.s12} ${space.s24}`,
                fontFamily: typography.fontFamily,
                ...typography.sizes.t14,
                fontWeight: typography.weights.medium,
                color: "#ffffff",
                background: pending ? colors.textMuted : "#1f42aa",
                border: "none",
                borderRadius: radius.none,
                cursor: pending ? "default" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {pending ? "Søker…" : "Søk"}
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: space.s8, marginTop: space.s16 }}>
            {SOURCE_FILTERS.map((f) => {
              const active = selected.includes(f.key);
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => toggle(f.key)}
                  aria-pressed={active}
                  style={{
                    padding: `${space.s4} ${space.s12}`,
                    ...typography.sizes.t14,
                    fontFamily: typography.fontFamily,
                    color: active ? "#ffffff" : colors.textBody,
                    background: active ? BADGE_COLOR[f.key] : colors.bgCard,
                    border: `1px solid ${active ? BADGE_COLOR[f.key] : colors.borderGray}`,
                    borderRadius: "999px",
                    cursor: "pointer",
                    transition: `all ${motionTokens.fast}`,
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </form>

        <Results response={response} pending={pending} onOpen={openHit} activeId={activeHit?.sourceId ?? null} />
      </div>

      <AnimatePresence>
        {activeHit && (
          <DetailPanel
            hit={activeHit}
            detail={detail}
            loading={detailLoading}
            onClose={closeHit}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

function Results({
  response,
  pending,
  onOpen,
  activeId,
}: {
  response: SearchResponse | null;
  pending: boolean;
  onOpen: (hit: SearchHit) => void;
  activeId: string | null;
}) {
  if (pending) {
    return <p style={{ ...typography.sizes.t14, color: colors.textMuted }}>Søker…</p>;
  }
  if (!response) {
    return null;
  }
  if (response.status === "unauthenticated") {
    return <Note>Du må være innlogget for å søke.</Note>;
  }
  if (response.status === "empty") {
    return <Note>Skriv et søk for å starte.</Note>;
  }
  if (response.status === "error") {
    return <Note>Søket feilet. Prøv igjen.</Note>;
  }
  if (response.hits.length === 0) {
    return <Note>Ingen treff.</Note>;
  }

  return (
    <>
      <p style={{ ...typography.sizes.t14, color: colors.textMuted, marginBottom: space.s16 }}>
        {response.hits.length} treff
        {response.mode === "keyword" ? " · nøkkelordsøk (semantikk utilgjengelig)" : ""}
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, borderTop: `1px solid ${colors.borderSubtle}` }}>
        {response.hits.map((h) => (
          <li key={`${h.sourceType}:${h.sourceId}`} style={{ borderBottom: `1px solid ${colors.borderSubtle}` }}>
            <HitRow hit={h} onOpen={onOpen} active={activeId === h.sourceId} />
          </li>
        ))}
      </ul>
    </>
  );
}

function HitRow({
  hit,
  onOpen,
  active,
}: {
  hit: SearchHit;
  onOpen: (hit: SearchHit) => void;
  active: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(hit)}
      aria-label={`Åpne ${hit.title}`}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: `${space.s16} ${space.s12}`,
        margin: 0,
        border: "none",
        cursor: "pointer",
        fontFamily: typography.fontFamily,
        color: colors.textBody,
        background: active ? colors.bgSubtle : "transparent",
        transition: `background ${motionTokens.fast}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: space.s8, marginBottom: space.s4 }}>
        <span
          style={{
            ...typography.sizes.t14,
            fontWeight: typography.weights.medium,
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "#ffffff",
            background: BADGE_COLOR[hit.sourceType],
            padding: "2px 8px",
            borderRadius: "999px",
          }}
        >
          {sourceLabel(hit.sourceType)}
        </span>
        <span style={{ ...typography.sizes.t18, fontWeight: typography.weights.medium }}>
          {hit.title}
        </span>
      </div>
      {hit.snippet && (
        <p style={{ ...typography.sizes.t14, color: colors.textMuted, lineHeight: 1.5 }}>
          {hit.snippet}…
        </p>
      )}
    </button>
  );
}

// ─── Slide-in detail panel (mirrors the node map's DetailPanel) ───

function DetailPanel({
  hit,
  detail,
  loading,
  onClose,
}: {
  hit: SearchHit;
  detail: SearchHitDetail | null;
  loading: boolean;
  onClose: () => void;
}) {
  // Internal Nav is ~120px tall and sticky; push the panel below it (same
  // offset the node map uses) so the header isn't hidden behind the nav.
  const NAV_OFFSET = 120;

  // Close on Escape — expected for an overlay panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock background scroll while the panel is open. Unlike the node map (whose
  // backdrop sits over a non-scrolling SVG), the search page is a scrollable
  // document — without this the results list scrolls up behind the navbar.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const body = detail?.body ?? (hit.snippet ? `${hit.snippet}…` : "");
  const hasTags =
    !!detail &&
    (detail.frictions.length > 0 ||
      detail.qualities.length > 0 ||
      detail.tags.length > 0 ||
      detail.workPackage !== null ||
      detail.fieldSite !== null);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          top: NAV_OFFSET,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(42, 40, 89, 0.2)",
          zIndex: 30,
        }}
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        role="dialog"
        aria-label={hit.title}
        style={{
          position: "fixed",
          top: NAV_OFFSET,
          right: 0,
          height: `calc(100vh - ${NAV_OFFSET}px)`,
          width: 480,
          maxWidth: "90vw",
          background: colors.bgCard,
          borderLeft: `1px solid ${colors.borderSubtle}`,
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          fontFamily: typography.fontFamily,
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: `${space.s16} ${space.s24}`,
            borderBottom: `1px solid ${colors.borderSubtle}`,
          }}
        >
          <span
            style={{
              ...typography.sizes.t12,
              padding: `2px ${space.s8}`,
              background: `${BADGE_COLOR[hit.sourceType]}22`,
              color: BADGE_COLOR[hit.sourceType],
              fontWeight: typography.weights.bold,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              borderRadius: 4,
            }}
          >
            {sourceLabel(hit.sourceType)}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Lukk"
            style={{
              background: "transparent",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: colors.textMuted,
              lineHeight: 1,
              fontFamily: typography.fontFamily,
            }}
          >
            ×
          </button>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: space.s24 }}>
          <h2
            style={{
              ...typography.sizes.t26,
              fontWeight: typography.weights.bold,
              color: colors.textBody,
              letterSpacing: "-0.01em",
              marginBottom: space.s16,
            }}
          >
            {detail?.title ?? hit.title}
          </h2>

          {hasTags && detail && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: space.s4, marginBottom: space.s24 }}>
              {detail.workPackage && <Tag color={colors.brandDarkBlue}>{detail.workPackage}</Tag>}
              {detail.fieldSite && <Tag color={colors.brandWarmBlue}>{detail.fieldSite}</Tag>}
              {detail.frictions.map((f) => (
                <Tag key={`f-${f}`} color={FRICTIONS[f]?.color}>
                  {FRICTIONS[f]?.label ?? f}
                </Tag>
              ))}
              {detail.qualities.map((q) => (
                <Tag key={`q-${q}`} color={QUALITIES[q]?.color}>
                  {QUALITIES[q]?.label ?? q}
                </Tag>
              ))}
              {detail.tags.map((t) => (
                <Tag key={`t-${t}`}>{t}</Tag>
              ))}
            </div>
          )}

          <div
            style={{
              ...typography.sizes.t16,
              color: colors.textBody,
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {body}
          </div>

          {loading && (
            <p style={{ ...typography.sizes.t14, color: colors.textMuted, marginTop: space.s16, fontStyle: "italic" }}>
              Laster…
            </p>
          )}

          {detail?.href && (
            <p style={{ marginTop: space.s24, paddingTop: space.s12, borderTop: `1px solid ${colors.borderSubtle}` }}>
              {detail.external ? (
                <a
                  href={detail.href}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...typography.sizes.t14, color: BADGE_COLOR[hit.sourceType], fontWeight: typography.weights.medium }}
                >
                  {detail.isFile ? "Last ned ↓" : "Åpne lenke ↗"}
                </a>
              ) : (
                <Link
                  href={detail.href}
                  style={{ ...typography.sizes.t14, color: BADGE_COLOR[hit.sourceType], fontWeight: typography.weights.medium }}
                >
                  Åpne hele siden →
                </Link>
              )}
            </p>
          )}
        </div>
      </motion.aside>
    </>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color?: string }) {
  const accent = color ?? colors.brandWarmBlue;
  return (
    <span
      style={{
        ...typography.sizes.t12,
        padding: `2px ${space.s8}`,
        background: `${accent}22`,
        color: accent,
        border: `1px solid ${accent}`,
        borderRadius: 4,
        fontWeight: typography.weights.medium,
      }}
    >
      {children}
    </span>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ padding: `${space.s24} 0`, ...typography.sizes.t16, color: colors.textMuted, fontStyle: "italic" }}>
      {children}
    </p>
  );
}
