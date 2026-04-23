import type { CSSProperties, ReactNode } from "react";
import { colors, motion, space } from "@/lib/design-tokens";

export interface ChipProps {
  children: ReactNode;
  /** Optional category color (e.g. a friction or quality color).
      When set, the chip is tinted with a 15% bg + full color text/border. */
  color?: string;
  active?: boolean;
  size?: "sm" | "md";
  onClick?: () => void;
  as?: "span" | "button";
  style?: CSSProperties;
}

export function Chip({
  children,
  color,
  active,
  size = "sm",
  onClick,
  as,
  style,
}: ChipProps) {
  const Tag = (as ?? (onClick ? "button" : "span")) as "span" | "button";
  const paddingY = size === "sm" ? space.s4 : space.s8;
  const paddingX = size === "sm" ? space.s12 : space.s16;
  const fontSize = size === "sm" ? "12px" : "14px";

  const tintedBg = color ? (active ? color : `${color}22`) : colors.n200;
  const borderColor = color ?? colors.borderGray;
  const textColor = color ? (active ? colors.textLight : color) : colors.textBody;

  return (
    <Tag
      type={Tag === "button" ? "button" : undefined}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: space.s4,
        padding: `${paddingY} ${paddingX}`,
        fontFamily: "var(--pkt-font-family)",
        fontSize,
        fontWeight: 500,
        lineHeight: 1.2,
        background: tintedBg,
        border: `1px solid ${borderColor}`,
        color: textColor,
        borderRadius: "var(--pkt-radius-none)",
        cursor: onClick ? "pointer" : "default",
        transition: `background ${motion.fast}, color ${motion.fast}`,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
