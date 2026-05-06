import type { CSSProperties, ReactNode } from "react";
import { colors, space, typography } from "@/lib/design-tokens";

export type CategoryBadgeKind = "solid" | "dashed";

export interface CategoryBadgeProps {
  children: ReactNode;
  kind?: CategoryBadgeKind;
  color?: string;
  title?: string;
  style?: CSSProperties;
}

export function CategoryBadge({
  children,
  kind = "solid",
  color,
  title,
  style,
}: CategoryBadgeProps) {
  const accent = color ?? colors.brandWarmBlue;
  const isDashed = kind === "dashed";
  return (
    <span
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: space.s4,
        padding: `2px ${space.s8}`,
        ...typography.sizes.t12,
        fontWeight: typography.weights.medium,
        color: isDashed ? accent : colors.textLight,
        background: isDashed ? "transparent" : accent,
        border: `1px ${isDashed ? "dashed" : "solid"} ${accent}`,
        borderRadius: 4,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
