"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import type { CorpusKind, CorpusNode } from "@/lib/corpus";
import { FONT_STACK } from "@/lib/design-tokens";
import ThreadMembership from "@/components/threads/ThreadMembership";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { fill } from "@/lib/i18n/dictionary";

const KIND_COLOR: Record<CorpusKind, string> = {
  quick_note: "#0e7c66",
  insight: "#1f42aa",
  resource: "#6b3fa0",
};

const SLIDE = { duration: 0.3, ease: [0.32, 0.72, 0, 1] as const };
const FADE = { duration: 0.2 };

/**
 * Shared slide-in detail for corpus cards on /internal and /internal/content.
 * Pass `node={null}` (or omit mounting) to close — AnimatePresence handles exit.
 */
export default function CorpusDetailPanel({
  node,
  onClose,
}: {
  node: CorpusNode | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {node && <Panel key={node.id} node={node} onClose={onClose} />}
    </AnimatePresence>
  );
}

function Panel({ node, onClose }: { node: CorpusNode; onClose: () => void }) {
  const { t, tax, href } = useI18n();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={FADE}
        onClick={onClose}
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.25)",
          zIndex: 60,
        }}
      />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={node.title}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={SLIDE}
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
          boxShadow: "-12px 0 32px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: KIND_COLOR[node.kind],
            }}
          >
            {t.browser.kinds[node.kind]}
          </span>
          <button type="button" onClick={onClose} style={linkButton}>
            {t.common.close}
          </button>
        </div>

        <h3
          style={{
            fontSize: 24,
            fontWeight: 700,
            lineHeight: 1.25,
            color: "#2a2859",
            marginBottom: node.authors ? 8 : 16,
          }}
        >
          {node.title}
        </h3>
        {node.authors && (
          <p style={{ fontSize: 15, lineHeight: 1.45, color: "#666666", marginBottom: 16 }}>
            {node.authors}
          </p>
        )}

        {node.body && (
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "#2c2c2c",
              whiteSpace: "pre-wrap",
              marginBottom: 24,
            }}
          >
            {node.body}
          </p>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
          {node.resourceType && <Tag label={tax.resourceTypeLabels[node.resourceType]} color="#6b3fa0" />}
          {node.mapScale && <Tag label={tax.scales[node.mapScale].label} color="#7a756b" />}
          {node.workPackage && <Tag label={node.workPackage} color="#7a756b" />}
          {node.fieldSite && <Tag label={node.fieldSite} color="#7a756b" />}
          {node.frictions.map((f) => (
            <Tag key={f} label={tax.frictions[f].label} color={tax.frictions[f].color} />
          ))}
          {node.qualities.map((q) => (
            <Tag key={q} label={tax.qualities[q].label} color={tax.qualities[q].color} />
          ))}
        </div>

        {node.kind === "resource" && <ResourceAccess node={node} />}

        <div style={{ marginBottom: 24 }}>
          <ThreadMembership sourceType={node.kind} sourceId={node.rawId} />
        </div>

        <Link
          href={href(`/internal/content?tab=nodes&focus=${encodeURIComponent(node.id)}`)}
          style={{ fontSize: 14, fontWeight: 600, color: "#1f42aa" }}
        >
          {t.browser.showInNodeMap}
        </Link>
      </motion.aside>
    </>
  );
}

function ResourceAccess({ node }: { node: CorpusNode }) {
  const { t } = useI18n();
  const r = node.raw as { url?: string | null; file_url?: string | null; file_name?: string | null };
  const url = r.url ?? null;
  const fileUrl = r.file_url ?? null;
  const fileName = r.file_name ?? null;
  if (!url && !fileUrl) return null;

  const isPdf = Boolean(
    fileName?.toLowerCase().endsWith(".pdf") || fileUrl?.toLowerCase().endsWith(".pdf"),
  );

  return (
    <div style={{ marginBottom: 24, paddingTop: 20, borderTop: "1px solid #e6e6e6" }}>
      <p style={{ ...groupLabel, marginBottom: 12 }}>{t.browser.resourceSection}</p>

      {url && (
        <p style={{ marginBottom: 12 }}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 14, fontWeight: 600, color: "#1f42aa", wordBreak: "break-all" }}
          >
            {t.browser.openLink}
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
              aria-label={fill(t.browser.previewOf, { name: fileName ?? "PDF" })}
            >
              <p style={{ fontSize: 13, color: "#666666", padding: 12 }}>
                {t.browser.pdfPreviewFallback}
              </p>
            </object>
          ) : (
            <p style={{ fontSize: 13, color: "#666666", marginBottom: 12 }}>
              {t.browser.noPreview}
            </p>
          )}
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={fileName ?? undefined}
            style={{ fontSize: 14, fontWeight: 600, color: "#1f42aa", wordBreak: "break-all" }}
          >
            {t.browser.download}
            {fileName ? ` — ${fileName}` : ""} ↓
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

const groupLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#666666",
  marginBottom: 8,
};

const linkButton: React.CSSProperties = {
  fontSize: 13,
  color: "#1f42aa",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
  fontFamily: FONT_STACK,
};
