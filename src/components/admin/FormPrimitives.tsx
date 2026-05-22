"use client";

import { colors, space, typography } from "@/lib/design-tokens";

/**
 * Shared form building blocks used by every admin editor (Quick Notes,
 * Insights, Design Challenges). Keep this file purely presentational —
 * no data fetching, no state beyond what's needed for the visual control.
 */

export const FONT_STACK = '"Oslo Sans", "Helvetica Neue", Arial, sans-serif';
export const SUGGEST_ACCENT = "#C45D3E";
export const SUGGEST_MIN_CHARS = 80;
export const SUGGEST_DEBOUNCE_MS = 3000;

export const inputStyle: React.CSSProperties = {
  padding: `${space.s8} ${space.s12}`,
  border: `1px solid ${colors.borderSubtle}`,
  fontSize: 14,
  fontFamily: FONT_STACK,
  background: colors.bgCard,
  color: colors.textBody,
  width: "100%",
};

export const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: colors.textMuted,
};

// ─── Pill toggle ───

export function PillGroup<T extends string>({
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
            onClick={() =>
              onChange(on ? value.filter((x) => x !== opt.value) : [...value, opt.value])
            }
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

// ─── AI suggestion UI helpers ───

export function SuggestBar({
  availability,
  bodyLength,
  loading,
  coolingDown,
  cleared,
  onClick,
}: {
  availability: "checking" | "ready" | "limit_reached" | "unavailable";
  bodyLength: number;
  loading: boolean;
  coolingDown: boolean;
  cleared: boolean;
  onClick: () => void;
}) {
  if (availability === "unavailable") return null;

  if (availability === "limit_reached") {
    return (
      <p
        style={{
          ...typography.sizes.t12,
          color: colors.textMuted,
          fontStyle: "italic",
        }}
      >
        Forslagskvoten er brukt opp for i dag.
      </p>
    );
  }

  const tooShort = bodyLength < SUGGEST_MIN_CHARS;
  const disabled = availability !== "ready" || tooShort || loading || coolingDown;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: space.s4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: space.s12, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          style={{
            ...typography.sizes.t14,
            padding: `${space.s8} ${space.s16}`,
            background: disabled ? colors.bgSubtle : SUGGEST_ACCENT,
            color: disabled ? colors.textMuted : colors.textLight,
            border: `1px solid ${disabled ? colors.borderSubtle : SUGGEST_ACCENT}`,
            cursor: disabled ? "not-allowed" : "pointer",
            fontFamily: FONT_STACK,
            fontWeight: typography.weights.medium,
            opacity: disabled ? 0.7 : 1,
          }}
        >
          {loading ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: space.s8 }}>
              <Spinner /> Tenker…
            </span>
          ) : (
            "✦ Foreslå kategorier"
          )}
        </button>
        {cleared && (
          <span style={{ ...typography.sizes.t12, color: colors.textMuted, fontStyle: "italic" }}>
            Forslag tømt
          </span>
        )}
      </div>
      {tooShort && availability === "ready" && (
        <span style={{ ...typography.sizes.t12, color: colors.textMuted }}>
          Skriv minst {SUGGEST_MIN_CHARS} tegn for å aktivere forslag ({bodyLength}/
          {SUGGEST_MIN_CHARS}).
        </span>
      )}
    </div>
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 12,
        height: 12,
        border: "2px solid currentColor",
        borderRightColor: "transparent",
        borderRadius: "50%",
        animation: "qn-spin 0.7s linear infinite",
      }}
    >
      <style jsx>{`
        @keyframes qn-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </span>
  );
}

export function GhostBadgeRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: space.s8, display: "flex", flexDirection: "column", gap: space.s4 }}>
      <span
        style={{
          ...typography.sizes.t12,
          color: SUGGEST_ACCENT,
          fontWeight: typography.weights.medium,
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: space.s4 }}>{children}</div>
    </div>
  );
}

export function GhostBadge({
  color,
  onAccept,
  onDismiss,
  children,
}: {
  color: string;
  onAccept: () => void;
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        ...typography.sizes.t12,
        padding: `2px ${space.s4} 2px ${space.s8}`,
        background: `${color}10`,
        color: color,
        border: `1px dashed ${color}`,
        borderRadius: 4,
        fontWeight: typography.weights.medium,
        opacity: 0.85,
      }}
    >
      <button
        type="button"
        onClick={onAccept}
        title="Godta forslag"
        aria-label="Godta forslag"
        style={{
          background: "transparent",
          border: "none",
          color,
          cursor: "pointer",
          padding: 0,
          fontFamily: FONT_STACK,
          fontSize: "inherit",
          fontWeight: typography.weights.medium,
        }}
      >
        ✓ {children}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        title="Avvis forslag"
        aria-label="Avvis forslag"
        style={{
          background: "transparent",
          border: "none",
          color,
          cursor: "pointer",
          padding: `0 ${space.s4}`,
          fontFamily: FONT_STACK,
          fontSize: "inherit",
          opacity: 0.7,
        }}
      >
        ×
      </button>
    </span>
  );
}

// ─── Form header (title + back link) ───

export function FormHeader({
  title,
  onBack,
  backLabel = "← Tilbake",
}: {
  title: string;
  onBack?: () => void;
  backLabel?: string;
}) {
  return (
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
          paddingRight: space.s16,
          letterSpacing: "0.01em",
          lineHeight: 1.3,
        }}
      >
        {title}
      </h2>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          style={{
            ...typography.sizes.t12,
            background: "transparent",
            border: "none",
            color: colors.textMuted,
            cursor: "pointer",
            fontFamily: FONT_STACK,
          }}
        >
          {backLabel}
        </button>
      )}
    </header>
  );
}

// ─── Status banner ───

export function StatusBanner({
  status,
}: {
  status: { kind: "ok" | "err"; msg: string } | null;
}) {
  if (!status) return null;
  return (
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
  );
}

// ─── Primary submit button ───

export function PrimarySubmit({
  label,
  loadingLabel = "Lagrer…",
  submitting,
  disabled,
}: {
  label: string;
  loadingLabel?: string;
  submitting: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={submitting || disabled}
      style={{
        ...typography.sizes.t14,
        padding: `${space.s12} ${space.s24}`,
        background: colors.brandWarmBlue,
        color: colors.textLight,
        border: `1px solid ${colors.brandWarmBlue}`,
        cursor: submitting ? "wait" : "pointer",
        opacity: submitting || disabled ? 0.7 : 1,
        fontFamily: FONT_STACK,
        fontWeight: typography.weights.medium,
      }}
    >
      {submitting ? loadingLabel : label}
    </button>
  );
}
