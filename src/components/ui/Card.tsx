import type { CSSProperties, ReactNode } from "react";
import { clay, motion, shadow, space } from "@/lib/design-tokens";

export interface CardProps {
  children: ReactNode;
  variant?: "default" | "interactive";
  padding?: keyof typeof paddingMap;
  as?: "div" | "article" | "section" | "a";
  href?: string;
  style?: CSSProperties;
}

const paddingMap = {
  sm: space.s16,
  md: space.s24,
  lg: space.s32,
} as const;

export function Card({
  children,
  variant = "default",
  padding = "md",
  as,
  href,
  style,
}: CardProps) {
  const isLink = href != null;
  const Tag = (as ?? (isLink ? "a" : "div")) as "div" | "article" | "section" | "a";
  const isInteractive = variant === "interactive" || isLink;

  return (
    <Tag
      href={isLink ? href : undefined}
      style={{
        display: "block",
        padding: paddingMap[padding],
        background: clay.colors.canvas,
        border: `1px solid ${clay.colors.hairline}`,
        borderRadius: "var(--clay-radius-lg)",
        color: clay.colors.body,
        textDecoration: "none",
        transition: `border-color ${motion.fast}, box-shadow ${motion.fast}, transform ${motion.fast}`,
        ...(isInteractive
          ? ({
            cursor: "pointer",
            "--card-hover-shadow": shadow.sm,
          } as CSSProperties)
          : {}),
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
