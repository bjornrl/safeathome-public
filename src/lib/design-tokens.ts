/**
 * Typed access to Punkt design tokens. CSS custom properties are
 * declared in src/app/globals.css — see .claude/design-reference.md
 * for provenance. This file is a mirror for use in inline styles and
 * computed props.
 */

export const colors = {
  // Brand
  brandDarkBlue:   "var(--pkt-color-brand-dark-blue-1000)",   // #2a2859
  brandMutedBlue:  "var(--pkt-color-brand-dark-blue-700)",    // #6a698b
  brandWarmBlue:   "var(--pkt-color-brand-warm-blue-1000)",   // #1f42aa
  brandBlue:       "var(--pkt-color-brand-blue-1000)",        // #6fe9ff
  brandBlueFaded:  "var(--pkt-color-brand-blue-300)",         // #d1f9ff
  brandGreen:      "var(--pkt-color-brand-green-1000)",       // #43f8b6
  brandGreenFaded: "var(--pkt-color-brand-green-400)",        // #c7fde9
  brandDarkGreen:  "var(--pkt-color-brand-dark-green-1000)",  // #034b45
  brandYellow:     "var(--pkt-color-brand-yellow-1000)",      // #f9c66b
  brandYellowFaded:"var(--pkt-color-brand-yellow-500)",       // #ffe7bc
  brandRed:        "var(--pkt-color-brand-red-1000)",         // #ff8274
  brandRedFaded:   "var(--pkt-color-brand-red-400)",          // #ffdfdc
  brandBeige:      "var(--pkt-color-brand-light-beige-1000)", // #f8f0dd
  brandBeigeStrong:"var(--pkt-color-brand-dark-beige-1000)",  // #d0bfae
  brandPurple:     "var(--pkt-color-brand-purple-1000)",      // #e0adff

  // Neutrals
  white: "var(--pkt-color-brand-neutrals-white)",
  n100:  "var(--pkt-color-brand-neutrals-100)",
  n200:  "var(--pkt-color-brand-neutrals-200)",
  ink:   "var(--pkt-color-brand-neutrals-1000)",
  black: "var(--pkt-color-brand-neutrals-black)",

  // Grays
  gray100: "var(--pkt-color-grays-gray-100)",
  gray200: "var(--pkt-color-grays-gray-200)",
  gray300: "var(--pkt-color-grays-gray-300)",
  gray400: "var(--pkt-color-grays-gray-400)",
  gray500: "var(--pkt-color-grays-gray-500)",
  gray600: "var(--pkt-color-grays-gray-600)",
  gray700: "var(--pkt-color-grays-gray-700)",
  gray800: "var(--pkt-color-grays-gray-800)",
  gray900: "var(--pkt-color-grays-gray-900)",

  // Semantic
  bg:              "var(--pkt-color-background-default)",
  bgSubtle:        "var(--pkt-color-background-subtle)",
  bgCard:          "var(--pkt-color-background-card)",
  textBody:        "var(--pkt-color-text-body-default)",
  textLight:       "var(--pkt-color-text-body-light)",
  textMuted:       "var(--pkt-color-text-placeholder)",
  textLink:        "var(--pkt-color-text-action-normal)",
  textLinkHover:   "var(--pkt-color-text-action-hover)",
  borderDefault:   "var(--pkt-color-border-default)",
  borderSubtle:    "var(--pkt-color-border-subtle)",
  borderGray:      "var(--pkt-color-border-gray)",
  borderFocus:     "var(--pkt-color-border-states-focus)",
} as const;

export const space = {
  s0:   "var(--pkt-size-0)",
  s2:   "var(--pkt-size-2)",
  s4:   "var(--pkt-size-4)",
  s8:   "var(--pkt-size-8)",
  s12:  "var(--pkt-size-12)",
  s16:  "var(--pkt-size-16)",
  s24:  "var(--pkt-size-24)",
  s32:  "var(--pkt-size-32)",
  s40:  "var(--pkt-size-40)",
  s64:  "var(--pkt-size-64)",
  s104: "var(--pkt-size-104)",
} as const;

export const radius = {
  none: "var(--pkt-radius-none)",
  sm:   "var(--pkt-radius-sm)",
  md:   "var(--pkt-radius-md)",
} as const;

export const shadow = {
  sm: "var(--pkt-shadow-sm)",
} as const;

export const motion = {
  fast: "var(--pkt-motion-fast)",
} as const;

export const typography = {
  fontFamily: "var(--pkt-font-family)",
  sizes: {
    t12: { fontSize: "12px", lineHeight: "20px" },
    t14: { fontSize: "14px", lineHeight: "22px" },
    t16: { fontSize: "16px", lineHeight: "24px" },
    t18: { fontSize: "18px", lineHeight: "28px" },
    t20: { fontSize: "20px", lineHeight: "32px" },
    t22: { fontSize: "22px", lineHeight: "34px" },
    t24: { fontSize: "24px", lineHeight: "36px" },
    t26: { fontSize: "26px", lineHeight: "40px" },
    t28: { fontSize: "28px", lineHeight: "42px" },
    t30: { fontSize: "30px", lineHeight: "44px" },
    t36: { fontSize: "36px", lineHeight: "54px" },
    t40: { fontSize: "40px", lineHeight: "60px" },
    t54: { fontSize: "54px", lineHeight: "82px" },
  },
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    bold: 700,
  },
} as const;
