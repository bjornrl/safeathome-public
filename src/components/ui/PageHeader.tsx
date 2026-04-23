import type { ReactNode } from "react";
import { colors, space, typography } from "@/lib/design-tokens";

export interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  intro?: ReactNode;
  align?: "left" | "center";
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, intro, align = "left", actions }: PageHeaderProps) {
  return (
    <header
      style={{
        display: "flex",
        flexDirection: "column",
        gap: space.s16,
        padding: `${space.s40} 0 ${space.s32}`,
        textAlign: align,
        alignItems: align === "center" ? "center" : "flex-start",
      }}
    >
      {eyebrow && <span className="pkt-eyebrow">{eyebrow}</span>}
      <h1
        style={{
          maxWidth: "16ch",
          color: colors.textBody,
        }}
      >
        {title}
      </h1>
      {intro && (
        <p
          style={{
            ...typography.sizes.t18,
            color: colors.textMuted,
            maxWidth: "680px",
            fontWeight: typography.weights.light,
          }}
        >
          {intro}
        </p>
      )}
      {actions && (
        <div style={{ display: "flex", gap: space.s12, flexWrap: "wrap", marginTop: space.s8 }}>
          {actions}
        </div>
      )}
    </header>
  );
}
