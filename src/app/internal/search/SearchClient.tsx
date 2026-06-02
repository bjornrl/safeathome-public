"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { colors, motion, radius, space, typography } from "@/lib/design-tokens";
import { semanticSearch } from "@/app/actions/search";
import {
  sourceLabel,
  type EmbeddableSourceType,
  type SearchHit,
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
                transition: `border-color ${motion.fast}`,
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
                    transition: `all ${motion.fast}`,
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </form>

        <Results response={response} pending={pending} />
      </div>
    </main>
  );
}

function Results({ response, pending }: { response: SearchResponse | null; pending: boolean }) {
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
            <HitRow hit={h} />
          </li>
        ))}
      </ul>
    </>
  );
}

function HitRow({ hit }: { hit: SearchHit }) {
  const inner = (
    <div style={{ padding: `${space.s16} 0` }}>
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
    </div>
  );

  if (hit.href) {
    const external = hit.href.startsWith("http");
    return external ? (
      <a href={hit.href} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: colors.textBody, display: "block" }}>
        {inner}
      </a>
    ) : (
      <Link href={hit.href} style={{ textDecoration: "none", color: colors.textBody, display: "block" }}>
        {inner}
      </Link>
    );
  }
  return inner;
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ padding: `${space.s24} 0`, ...typography.sizes.t16, color: colors.textMuted, fontStyle: "italic" }}>
      {children}
    </p>
  );
}
