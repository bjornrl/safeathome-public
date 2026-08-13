"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { FRICTIONS, QUALITIES, RESOURCE_TYPE_LABELS, SCALES } from "@/lib/constants";
import { loadCorpus, type CorpusKind, type CorpusNode } from "@/lib/corpus";
import { semanticSearch } from "@/app/actions/search";
import { FONT_STACK } from "@/lib/design-tokens";
import type { CareFriction, CareQuality } from "@/lib/types";

const FRICTION_KEYS = Object.keys(FRICTIONS) as CareFriction[];
const QUALITY_KEYS = Object.keys(QUALITIES) as CareQuality[];

const KIND_LABEL: Record<CorpusKind, string> = {
  quick_note: "Notat",
  insight: "Innsikt",
  resource: "Ressurs",
};

const KIND_COLOR: Record<CorpusKind, string> = {
  quick_note: "#0e7c66",
  insight: "#1f42aa",
  resource: "#6b3fa0",
};

const KIND_ORDER: CorpusKind[] = ["quick_note", "insight", "resource"];

/**
 * The Søk tab: the whole corpus, browsable and filterable, with search on top.
 *
 * Resources are treated as content on the same footing as notes and insights
 * rather than living behind their own tab — same material, one surface. The
 * layout is the Lesesal's, which handled filtering well enough to keep.
 *
 * Everything is loaded once from `corpus.ts`; a query narrows the same list
 * instead of replacing it, so a hit always carries its frictions and qualities
 * and the cards look identical whether you searched or not.
 */
export default function ContentBrowser() {
  const [nodes, setNodes] = useState<CorpusNode[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [query, setQuery] = useState("");
  const [matchIds, setMatchIds] = useState<Set<string> | null>(null);
  const [pending, startTransition] = useTransition();

  // Clicking a card opens the detail here rather than navigating to the node
  // map: switching tabs under the reader is disorienting, and the jump to the
  // graph belongs *inside* the detail as an explicit choice (prompt 03, p. 13).
  const [selected, setSelected] = useState<CorpusNode | null>(null);

  const [kinds, setKinds] = useState<CorpusKind[]>([]);
  const [frictions, setFrictions] = useState<CareFriction[]>([]);
  const [qualities, setQualities] = useState<CareQuality[]>([]);

  useEffect(() => {
    let active = true;
    loadCorpus()
      .then((c) => active && setNodes(c.nodes))
      .catch(() => active && setLoadError(true));
    return () => {
      active = false;
    };
  }, []);

  const activeFilters = kinds.length + frictions.length + qualities.length;

  function runSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      setMatchIds(null);
      return;
    }
    startTransition(async () => {
      const res = await semanticSearch(q);
      // Hits carry the bare row id; corpus ids are namespaced.
      setMatchIds(
        res.status === "ok" ? new Set(res.hits.map((h) => h.sourceId)) : new Set(),
      );
    });
  }

  const filtered = useMemo(() => {
    if (!nodes) return [];
    return nodes.filter((n) => {
      if (matchIds && !matchIds.has(n.rawId)) return false;
      if (kinds.length > 0 && !kinds.includes(n.kind)) return false;
      // AND across categories, OR within one — same rule the Lesesal used.
      if (frictions.length > 0 && !frictions.some((f) => n.frictions.includes(f))) return false;
      if (qualities.length > 0 && !qualities.some((q) => n.qualities.includes(q))) return false;
      return true;
    });
  }, [nodes, matchIds, kinds, frictions, qualities]);

  const grouped = useMemo(() => {
    const out = new Map<CorpusKind, CorpusNode[]>();
    for (const k of KIND_ORDER) {
      const bucket = filtered.filter((n) => n.kind === k);
      if (bucket.length > 0) out.set(k, bucket);
    }
    return out;
  }, [filtered]);

  function clearAll() {
    setKinds([]);
    setFrictions([]);
    setQualities([]);
  }

  function toggle<T>(list: T[], set: (v: T[]) => void, key: T) {
    set(list.includes(key) ? list.filter((x) => x !== key) : [...list, key]);
  }

  if (loadError) {
    return <p style={{ fontFamily: FONT_STACK, fontSize: 15, color: "#a83f34" }}>
        Klarte ikke å hente materialet. Last siden på nytt.
      </p>;
  }

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <form onSubmit={runSearch} style={{ display: "flex", gap: 8, marginBottom: 20, maxWidth: 640 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!e.target.value.trim()) setMatchIds(null);
          }}
          placeholder="Søk i alt materialet…"
          aria-label="Søk"
          style={{
            flex: 1,
            fontFamily: FONT_STACK,
            fontSize: 15,
            padding: "12px 16px",
            border: "1px solid #e6e6e6",
            background: "#ffffff",
            color: "#2c2c2c",
          }}
        />
        <button
          type="submit"
          disabled={pending}
          style={{
            fontFamily: FONT_STACK,
            fontSize: 14,
            fontWeight: 600,
            padding: "12px 24px",
            background: pending ? "#808080" : "#1f42aa",
            color: "#ffffff",
            border: "none",
            cursor: pending ? "default" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {pending ? "Søker…" : "Søk"}
        </button>
      </form>

      <section style={{ marginBottom: 32, padding: 20, background: "#f9f9f9", border: "1px solid #e6e6e6", borderRadius: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "#808080" }}>
            Filter
          </p>
          {activeFilters > 0 && (
            <button type="button" onClick={clearAll} style={linkButton}>
              Nullstill filtre ({activeFilters})
            </button>
          )}
        </div>

        <p style={groupLabel}>Type</p>
        <div style={chipRow}>
          {KIND_ORDER.map((k) => (
            <Chip
              key={k}
              label={KIND_LABEL[k]}
              color={KIND_COLOR[k]}
              active={kinds.includes(k)}
              onClick={() => toggle(kinds, setKinds, k)}
            />
          ))}
        </div>

        <p style={groupLabel}>Friksjoner</p>
        <div style={chipRow}>
          {FRICTION_KEYS.map((k) => (
            <Chip
              key={k}
              label={FRICTIONS[k].label}
              color={FRICTIONS[k].color}
              active={frictions.includes(k)}
              onClick={() => toggle(frictions, setFrictions, k)}
            />
          ))}
        </div>

        <p style={groupLabel}>Kvaliteter</p>
        <div style={{ ...chipRow, marginBottom: 0 }}>
          {QUALITY_KEYS.map((k) => (
            <Chip
              key={k}
              label={QUALITIES[k].label}
              color={QUALITIES[k].color}
              active={qualities.includes(k)}
              onClick={() => toggle(qualities, setQualities, k)}
            />
          ))}
        </div>
      </section>

      {nodes === null ? (
        <p style={{ fontSize: 14, color: "#808080" }}>Laster…</p>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 24, background: "#ffffff", border: "1px dashed #e6e6e6", borderRadius: 8 }}>
          <p style={{ fontSize: 15, color: "#666666", marginBottom: activeFilters > 0 || matchIds ? 12 : 0 }}>
            {matchIds
              ? "Ingen treff på dette søket."
              : activeFilters > 0
                ? "Ingenting matcher disse filtrene."
                : "Ingenting her ennå. Det første som legges inn, dukker opp her."}
          </p>
          {activeFilters > 0 && (
            <button type="button" onClick={clearAll} style={{ ...linkButton, padding: 0 }}>
              Nullstill filtre
            </button>
          )}
        </div>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "#808080", marginBottom: 16 }}>
            {filtered.length} {filtered.length === 1 ? "oppføring" : "oppføringer"}
          </p>
          {[...grouped.entries()].map(([kind, bucket]) => (
            <div key={kind} style={{ marginBottom: 40 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                  paddingBottom: 8,
                  borderBottom: `2px solid ${KIND_COLOR[kind]}`,
                }}
              >
                <span aria-hidden style={{ width: 10, height: 10, borderRadius: "50%", background: KIND_COLOR[kind] }} />
                <h3 style={{ fontSize: 20, fontWeight: 600, color: "#2a2859" }}>{KIND_LABEL[kind]}</h3>
                <span style={{ fontSize: 13, color: "#9a9a9a" }}>
                  {bucket.length} {bucket.length === 1 ? "oppføring" : "oppføringer"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {bucket.map((n) => (
                  <NodeCard key={n.id} node={n} onOpen={() => setSelected(n)} />
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {selected && <DetailPanel node={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

/**
 * In-place detail. Deliberately not a route change: the reader stays on the
 * list they were browsing, and the trip to the graph is one explicit click.
 */
function DetailPanel({ node, onClose }: { node: CorpusNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.25)", zIndex: 60 }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={node.title}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(520px, 100%)",
          background: "#ffffff",
          borderLeft: "1px solid #e6e6e6",
          padding: 32,
          overflowY: "auto",
          zIndex: 61,
          fontFamily: FONT_STACK,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: KIND_COLOR[node.kind] }}>
            {KIND_LABEL[node.kind]}
          </span>
          <button type="button" onClick={onClose} style={{ ...linkButton, fontSize: 13 }}>
            Lukk
          </button>
        </div>

        <h3 style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.25, color: "#2a2859", marginBottom: 16 }}>
          {node.title}
        </h3>

        {node.body && (
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#2c2c2c", whiteSpace: "pre-wrap", marginBottom: 24 }}>
            {node.body}
          </p>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
          {node.resourceType && <Tag label={RESOURCE_TYPE_LABELS[node.resourceType]} color="#6b3fa0" />}
          {node.mapScale && <Tag label={SCALES[node.mapScale].label} color="#7a756b" />}
          {node.workPackage && <Tag label={node.workPackage} color="#7a756b" />}
          {node.fieldSite && <Tag label={node.fieldSite} color="#7a756b" />}
          {node.frictions.map((f) => (
            <Tag key={f} label={FRICTIONS[f].label} color={FRICTIONS[f].color} />
          ))}
          {node.qualities.map((q) => (
            <Tag key={q} label={QUALITIES[q].label} color={QUALITIES[q].color} />
          ))}
        </div>

        {node.kind === "resource" && <ResourceAccess node={node} />}

        <Link
          href={`/internal/content?tab=nodes&focus=${encodeURIComponent(node.id)}`}
          style={{ fontSize: 14, fontWeight: 600, color: "#1f42aa" }}
        >
          Vis i nodekart →
        </Link>
      </aside>
    </>
  );
}

function NodeCard({ node, onOpen }: { node: CorpusNode; onOpen: () => void }) {
  const preview = node.body.replace(/\s+/g, " ").trim().slice(0, 140);
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: 24,
        background: "#ffffff",
        border: "1px solid #e6e6e6",
        borderRadius: 8,
        color: "#2c2c2c",
        cursor: "pointer",
        fontFamily: FONT_STACK,
      }}
    >
      <h4 style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.3, marginBottom: 8, color: "#2a2859" }}>
        {node.title}
      </h4>
      {preview && (
        <p style={{ fontSize: 13, lineHeight: 1.55, color: "#666666", marginBottom: 12 }}>
          {preview}
          {node.body.length > 140 ? "…" : ""}
        </p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {node.resourceType && <Tag label={RESOURCE_TYPE_LABELS[node.resourceType]} color="#6b3fa0" />}
        {node.mapScale && <Tag label={SCALES[node.mapScale].label} color="#7a756b" />}
        {node.workPackage && <Tag label={node.workPackage} color="#7a756b" />}
        {node.frictions.map((f) => (
          <Tag key={f} label={FRICTIONS[f].label} color={FRICTIONS[f].color} />
        ))}
        {node.qualities.map((q) => (
          <Tag key={q} label={QUALITIES[q].label} color={QUALITIES[q].color} />
        ))}
      </div>
    </button>
  );
}

/**
 * The resource itself — the point of a resource entry.
 *
 * PDFs preview inline via the browser's own viewer. docx/pptx cannot be
 * previewed without handing the file URL to Google's or Microsoft's online
 * viewer, and these are municipal partners' documents — that is not a call to
 * make silently, so those get a download instead.
 */
function ResourceAccess({ node }: { node: CorpusNode }) {
  const r = node.raw as { url?: string | null; file_url?: string | null; file_name?: string | null };
  const url = r.url ?? null;
  const fileUrl = r.file_url ?? null;
  const fileName = r.file_name ?? null;
  if (!url && !fileUrl) return null;

  const isPdf = Boolean(fileName?.toLowerCase().endsWith(".pdf") || fileUrl?.toLowerCase().endsWith(".pdf"));

  return (
    <div style={{ marginBottom: 24, paddingTop: 20, borderTop: "1px solid #e6e6e6" }}>
      <p style={{ ...groupLabel, marginBottom: 12 }}>Ressursen</p>

      {url && (
        <p style={{ marginBottom: 12 }}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 14, fontWeight: 600, color: "#1f42aa", wordBreak: "break-all" }}
          >
            Åpne lenke ↗
          </a>
        </p>
      )}

      {fileUrl && (
        <>
          {isPdf ? (
            <object
              data={fileUrl}
              type="application/pdf"
              style={{ width: "100%", height: 420, border: "1px solid #e6e6e6", marginBottom: 12 }}
              aria-label={`Forhåndsvisning av ${fileName ?? "PDF"}`}
            >
              <p style={{ fontSize: 13, color: "#666666", padding: 12 }}>
                Nettleseren kan ikke vise PDF-en her. Bruk nedlastingslenken under.
              </p>
            </object>
          ) : (
            <p style={{ fontSize: 13, color: "#666666", marginBottom: 12 }}>
              Formatet kan ikke forhåndsvises i nettleseren. Last ned filen for å åpne den.
            </p>
          )}
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={fileName ?? undefined}
            style={{ fontSize: 14, fontWeight: 600, color: "#1f42aa", wordBreak: "break-all" }}
          >
            Last ned{fileName ? ` — ${fileName}` : ""} ↓
          </a>
        </>
      )}
    </div>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: 4,
        background: color + "15",
        color,
      }}
    >
      {label}
    </span>
  );
}

function Chip({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        fontFamily: FONT_STACK,
        fontSize: 12,
        fontWeight: 500,
        padding: "4px 12px",
        borderRadius: 4,
        border: `1px solid ${active ? color : color + "55"}`,
        background: active ? color : color + "15",
        color: active ? "#ffffff" : color,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

const groupLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#666666",
  marginBottom: 8,
};

const chipRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  marginBottom: 12,
};

const linkButton: React.CSSProperties = {
  fontSize: 12,
  color: "#1f42aa",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
  fontFamily: FONT_STACK,
};
