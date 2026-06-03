"use client";

import { useEffect, useState } from "react";

const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';

/**
 * A two-stage destructive button. First click reveals a "Bekreft"-button next
 * to it; second click runs the action. Replaces native `confirm()` so editors
 * don't get hit with browser modals.
 */
export function InlineConfirm({
  label,
  confirmLabel = "Bekreft",
  onConfirm,
  color = "#a83f34",
  disabled = false,
}: {
  label: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  color?: string;
  disabled?: boolean;
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  if (!armed) {
    return (
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => setArmed(true)}
        style={{
          fontFamily: FONT_STACK,
          fontSize: 11,
          color,
          background: "transparent",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          padding: 0,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onConfirm();
          } finally {
            setBusy(false);
            setArmed(false);
          }
        }}
        style={{
          fontFamily: FONT_STACK,
          fontSize: 11,
          fontWeight: 600,
          color: "#ffffff",
          background: color,
          border: `1px solid ${color}`,
          borderRadius: 4,
          padding: "2px 8px",
          cursor: busy ? "wait" : "pointer",
        }}
      >
        {busy ? "…" : confirmLabel}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        style={{
          fontFamily: FONT_STACK,
          fontSize: 11,
          color: "#666666",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
        }}
      >
        Avbryt
      </button>
    </span>
  );
}

/**
 * Inline ephemeral toast — auto-dismisses after a few seconds. Use to confirm
 * a save/publish/delete succeeded without blocking the UI.
 */
export function Toast({
  message,
  kind = "ok",
  onDismiss,
}: {
  message: string;
  kind?: "ok" | "err";
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1000,
        fontFamily: FONT_STACK,
        fontSize: 14,
        padding: "12px 18px",
        borderRadius: 8,
        background: kind === "ok" ? "#034b45" : "#a83f34",
        color: "#ffffff",
        boxShadow: "0 8px 24px rgba(10, 10, 10, 0.18)",
        maxWidth: 360,
        lineHeight: 1.5,
      }}
    >
      {message}
    </div>
  );
}
