import type { CSSProperties, ReactNode } from "react";
import { colors, motion, space } from "@/lib/design-tokens";

type Variant = "primary" | "secondary" | "tertiary";
type Size = "sm" | "md" | "lg";

const sizeMap: Record<Size, { padding: string; fontSize: string; minHeight: string }> = {
  sm: { padding: `${space.s8} ${space.s16}`,  fontSize: "14px", minHeight: "36px" },
  md: { padding: `${space.s12} ${space.s24}`, fontSize: "16px", minHeight: "44px" },
  lg: { padding: `${space.s16} ${space.s32}`, fontSize: "18px", minHeight: "52px" },
};

function variantStyles(variant: Variant): CSSProperties {
  if (variant === "primary") {
    return {
      background: colors.brandWarmBlue,
      color: colors.textLight,
      border: `1px solid ${colors.brandWarmBlue}`,
    };
  }
  if (variant === "secondary") {
    return {
      background: colors.bgCard,
      color: colors.brandWarmBlue,
      border: `1px solid ${colors.brandWarmBlue}`,
    };
  }
  return {
    background: "transparent",
    color: colors.brandWarmBlue,
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
        fontFamily: "var(--pkt-font-family)",
        fontWeight: 500,
        lineHeight: 1.2,
        borderRadius: "var(--pkt-radius-none)",
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
