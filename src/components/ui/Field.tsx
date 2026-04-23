import type { ReactNode, CSSProperties, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { colors, motion, radius, space, typography } from "@/lib/design-tokens";

const baseInputStyle: CSSProperties = {
  padding: `${space.s12} ${space.s16}`,
  fontFamily: typography.fontFamily,
  fontSize: "16px",
  lineHeight: "24px",
  fontWeight: typography.weights.light,
  color: colors.textBody,
  background: colors.bgCard,
  border: `1px solid ${colors.borderGray}`,
  borderRadius: radius.none,
  width: "100%",
  transition: `border-color ${motion.fast}`,
};

export interface FieldProps {
  label: string;
  helper?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, helper, error, children }: FieldProps) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: space.s8 }}>
      <span style={{ fontSize: "14px", lineHeight: "22px", fontWeight: typography.weights.medium, color: colors.textBody }}>
        {label}
      </span>
      {children}
      {helper && !error && (
        <span style={{ fontSize: "12px", lineHeight: "20px", color: colors.textMuted }}>{helper}</span>
      )}
      {error && (
        <span style={{ fontSize: "12px", lineHeight: "20px", color: colors.brandRed }}>{error}</span>
      )}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...baseInputStyle, ...props.style }} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...baseInputStyle, ...props.style }} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ minHeight: "96px", ...baseInputStyle, ...props.style }} />;
}
