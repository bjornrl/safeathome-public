import type { CSSProperties, ReactNode } from "react";
import { clay, motion, space } from "@/lib/design-tokens";

type Variant = "primary" | "secondary" | "tertiary";
type Size = "sm" | "md" | "lg";

const sizeMap: Record<Size, { padding: string; fontSize: string; minHeight: string }> = {
  sm: { padding: `${space.s8} ${space.s16}`,  fontSize: "14px", minHeight: "36px" },
  md: { padding: `${space.s12} ${space.s24}`, fontSize: "14px", minHeight: "44px" },
  lg: { padding: `${space.s16} ${space.s32}`, fontSize: "16px", minHeight: "52px" },
};

function variantStyles(variant: Variant): CSSProperties {
  if (variant === "primary") {
    // Clay primary: near-black ink on cream canvas page.
    return {
      background: clay.colors.ink,
      color: clay.colors.onPrimary,
      border: `1px solid ${clay.colors.ink}`,
    };
  }
  if (variant === "secondary") {
    return {
      background: clay.colors.canvas,
      color: clay.colors.ink,
      border: `1px solid ${clay.colors.hairline}`,
    };
  }
  return {
    background: "transparent",
    color: clay.colors.ink,
    border: `1px solid transparent`,
  };
}

export interface ButtonProps {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: CSSProperties;
  className?: string;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled,
  loading,
  onClick,
  style,
  className,
  fullWidth,
}: ButtonProps) {
  const sz = sizeMap[size];
  const isBlocked = disabled || loading;
  return (
    <button
      type={type}
      disabled={isBlocked}
      onClick={onClick}
      className={className}
      style={{
        ...variantStyles(variant),
        ...sz,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: space.s8,
        fontFamily: clay.font.body,
        fontWeight: 600,
        lineHeight: 1.0,
        letterSpacing: "-0.1px",
        borderRadius: "var(--clay-radius-md)",
        cursor: isBlocked ? "not-allowed" : "pointer",
        opacity: isBlocked ? 0.6 : 1,
        transition: `background ${motion.fast}, color ${motion.fast}, border-color ${motion.fast}`,
        width: fullWidth ? "100%" : undefined,
        textDecoration: "none",
        ...style,
      }}
    >
      {loading ? "…" : children}
    </button>
  );
}
