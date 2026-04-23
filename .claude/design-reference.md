# Design reference — Oslo kommune (Punkt) tokens

Extracted from Punkt design system pages on 2026-04-23.
Sources:
- https://punkt.oslo.kommune.no/latest/grunnleggende/ressurser/colors/
- https://punkt.oslo.kommune.no/latest/grunnleggende/ressurser/typografi/
- https://punkt.oslo.kommune.no/latest/grunnleggende/ressurser/font/
- https://punkt.oslo.kommune.no/latest/grunnleggende/ressurser/spacing/
- https://punkt.oslo.kommune.no/latest/komponenter-og-maler/
- https://punkt.oslo.kommune.no/latest/komponenter-og-maler/komponenter/button/
- https://www.oslo.kommune.no/bydeler/bydel-alna/ (structural reference)

Naming convention: Punkt uses `--pkt-color-*`, `--pkt-size-*`, etc. We mirror the token names verbatim so a future upgrade can swap our globals for Punkt's stylesheet without touching components.

## Colors

### Brand

| Token | Hex | Notes |
| --- | --- | --- |
| `--pkt-color-brand-dark-blue-1000` | `#2a2859` | Primary brand blue — headings, default text |
| `--pkt-color-brand-dark-blue-700` | `#6a698b` | Muted variant |
| `--pkt-color-brand-warm-blue-1000` | `#1f42aa` | Interactive / link blue — buttons, links, focus, hover |
| `--pkt-color-brand-blue-1000` | `#6fe9ff` | Accent light blue |
| `--pkt-color-brand-blue-500` | `#b3f5ff` | Faded blue surface |
| `--pkt-color-brand-blue-300` | `#d1f9ff` | Light blue surface |
| `--pkt-color-brand-blue-200` | `#e5fcff` | Subtle light blue |
| `--pkt-color-brand-blue-100` | `#f1fdff` | Pale blue surface |
| `--pkt-color-brand-green-1000` | `#43f8b6` | Success accent |
| `--pkt-color-brand-green-400` | `#c7fde9` | Faded green surface |
| `--pkt-color-brand-dark-green-1000` | `#034b45` | Strong dark green |
| `--pkt-color-brand-light-green-1000` | `#c7f6c9` | Light green surface |
| `--pkt-color-brand-light-green-400` | `#e5ffe6` | Faded green surface |
| `--pkt-color-brand-yellow-1000` | `#f9c66b` | Warning / attention |
| `--pkt-color-brand-yellow-500` | `#ffe7bc` | Light yellow surface |
| `--pkt-color-brand-red-1000` | `#ff8274` | Error |
| `--pkt-color-brand-red-600` | `#ffb4ac` | Strong red surface |
| `--pkt-color-brand-red-400` | `#ffdfdc` | Faded red surface |
| `--pkt-color-brand-red-100` | `#fff2f1` | Subtle red |
| `--pkt-color-brand-light-beige-1000` | `#f8f0dd` | Light beige surface |
| `--pkt-color-brand-dark-beige-1000` | `#d0bfae` | Strong beige surface |
| `--pkt-color-brand-purple-1000` | `#e0adff` | Focus ring accent |

### Neutrals

| Token | Hex |
| --- | --- |
| `--pkt-color-brand-neutrals-white` | `#ffffff` |
| `--pkt-color-brand-neutrals-100` | `#f9f9f9` |
| `--pkt-color-brand-neutrals-200` | `#f2f2f2` |
| `--pkt-color-brand-neutrals-1000` | `#2c2c2c` |
| `--pkt-color-brand-neutrals-black` | `#000000` |

### Grayscale

| Token | Hex |
| --- | --- |
| `--pkt-color-grays-gray-100` | `#e6e6e6` |
| `--pkt-color-grays-gray-200` | `#cccccc` |
| `--pkt-color-grays-gray-300` | `#b3b3b3` |
| `--pkt-color-grays-gray-400` | `#9a9a9a` |
| `--pkt-color-grays-gray-500` | `#808080` |
| `--pkt-color-grays-gray-600` | `#666666` |
| `--pkt-color-grays-gray-700` | `#4d4d4d` |
| `--pkt-color-grays-gray-800` | `#333333` |
| `--pkt-color-grays-gray-900` | `#1a1a1a` |
| `--pkt-color-grays-gray-1000` | `#2c2c2c` |

### Semantic aliases

| Token | Value | Use |
| --- | --- | --- |
| `--pkt-color-background-default` | `#ffffff` | Page background |
| `--pkt-color-background-subtle` | `#f9f9f9` | Sunken / alt sections |
| `--pkt-color-background-card` | `#ffffff` | Card background |
| `--pkt-color-text-body-default` | `#2a2859` | Body text |
| `--pkt-color-text-body-light` | `#ffffff` | On-dark text |
| `--pkt-color-text-placeholder` | `#666666` | Placeholder / muted |
| `--pkt-color-text-action-normal` | `#2a2859` | Idle link |
| `--pkt-color-text-action-hover` | `#1f42aa` | Hovered link |
| `--pkt-color-text-action-active` | `#1f42aa` | Active link |
| `--pkt-color-text-action-disabled` | `#666666` | Disabled link |
| `--pkt-color-border-default` | `#2a2859` | Heavy rule |
| `--pkt-color-border-subtle` | `#f2f2f2` | Light divider |
| `--pkt-color-border-gray` | `#cccccc` | Form border |
| `--pkt-color-border-states-focus` | `#e0adff` | Focus ring outline |
| `--pkt-color-border-states-hover` | `#1f42aa` | Hovered border |
| `--pkt-color-border-states-active` | `#1f42aa` | Active border |

### Research-specific (kept)

Friction and quality colors in `src/lib/constants.ts` encode research meaning, not brand. They're preserved as-is and used only for category chips/signals, never as page accents.

## Typography

**Font family:** `"Oslo Sans", arial, sans-serif` (per Punkt fallback).
**CDN:** `https://punkt-cdn.oslo.kommune.no/latest/fonts/` — served woff2 + woff, `font-display: swap`.
**Default body:** 16 / 24, weight 300 (light), tracking -0.2px.

### Weights
- 300 light
- 400 regular (+ italic)
- 500 medium
- 700 bold

### Scale

| Token | Size / line-height | Usage |
| --- | --- | --- |
| `text-54` | 54 / 82 | Desktop H1 |
| `text-40` | 40 / 60 | — |
| `text-36` | 36 / 54 | Desktop H2 / mobile H1 |
| `text-30` | 30 / 44 | Desktop H3 |
| `text-28` | 28 / 42 | — |
| `text-26` | 26 / 40 | Mobile H2 |
| `text-24` | 24 / 36 | Desktop H4 / ingress |
| `text-22` | 22 / 34 | Mobile H3 |
| `text-20` | 20 / 32 | Mobile ingress |
| `text-18` | 18 / 28 | Mobile H4 / lede body |
| `text-16` | 16 / 24 | Body |
| `text-14` | 14 / 22 | Compact / UI |
| `text-12` | 12 / 20 | Small / eyebrow |

**Letter-spacing:** -0.4px at 54px, -0.2px at every other size.

**Eyebrow label (project-local pattern):** `text-transform: uppercase; letter-spacing: 0.14em; font-size: 12px; font-weight: 600; color: var(--pkt-color-text-placeholder)`. Punkt itself uses sentence case for section kickers (e.g. "Aktuelt"), but the existing site already uses uppercase eyebrows consistently — we keep them to avoid breaking editorial voice across many pages in this pass.

## Spacing

Base unit: **8px**. Token scale (rem values given; px equivalents in parentheses):

| Token | rem | px |
| --- | --- | --- |
| `size-0` | 0 | 0 |
| `size-2` | 0.125 | 2 |
| `size-4` | 0.25 | 4 |
| `size-8` | 0.5 | 8 |
| `size-12` | 0.75 | 12 |
| `size-16` | 1 | 16 |
| `size-24` | 1.5 | 24 |
| `size-32` | 2 | 32 |
| `size-40` | 2.5 | 40 |
| `size-64` | 4 | 64 |
| `size-104` | 6.5 | 104 |

## Radii

Punkt's Button page states explicitly: **"No rounded corners; forms should be clear and simple."** That informs the whole system.

| Token | Value | Use |
| --- | --- | --- |
| `--pkt-radius-none` | `0` | Buttons, chips, inputs, tabs |
| `--pkt-radius-sm` | `4px` | Cards (very subtle) |
| `--pkt-radius-md` | `8px` | Images, hero media |

Drop any previous `border-radius: 14/16/24` usage — it doesn't belong.

## Shadows / borders

Prefer 1 px hairlines (`--pkt-color-border-subtle`) over drop shadows. A single soft shadow is allowed for cards that lift on hover:

```
--pkt-shadow-sm: 0 1px 2px rgba(42, 40, 89, 0.06), 0 2px 4px rgba(42, 40, 89, 0.04);
```

No layered drop-shadow stacks.

## Focus / accessibility

- **Focus ring:** 2px solid `var(--pkt-color-border-states-focus)` (#e0adff) with a 2px offset (`outline-offset: 2px`). Applied via `:focus-visible` on every interactive element.
- **Minimum body text:** 16 px.
- **Touch targets:** ≥ 44×44 px (enforced via button `min-height: 44px`).
- **Skip-to-content link** at the top of `<body>`, visible only on focus.
- **`lang="nb-NO"`** on `<html>` (Norwegian-first site). Swap to `en` only on explicitly English routes — unchanged until Phase 3/4 editorial.
- **WCAG AA** contrast required on every pair. Default body pair (`#2a2859` on `#ffffff`) = 13.7:1, well above AA.

## Motion

Single standard easing: `150ms cubic-bezier(0.4, 0, 0.2, 1)` (ease-out). Used for hover color shifts, subtle lifts, dropdown open. Respect `@media (prefers-reduced-motion: reduce)` by disabling all transitions.

## Components (overview)

Punkt documents 34 components. For this pass we only build primitives that are actually used by our current pages:

- **Button** (primary / secondary / tertiary, sizes sm/md/lg). No radius. Solid blue primary on `#1f42aa`, secondary outlined.
- **Chip / Tag** — pill with category color (frictions + qualities use the category palette; neutral chips use gray border).
- **Card** — `background: var(--pkt-color-background-card)`, `border: 1px solid var(--pkt-color-border-subtle)`, optional `--pkt-radius-sm`.
- **PageHeader** — eyebrow + H1 + intro paragraph with `max-width: 680px`.
- **Field / Select / Textarea** — label above input, `border: 1px solid var(--pkt-color-border-gray)`, focus swap to active.
- **Footer** — institutional partner row, thin top rule, neutral text.
- **SkipToContent** — anchor to `#main-content`, visible only on `:focus`.

Breadcrumbs, Alert, Modal, Tabs etc. are deferred until pages that need them are migrated.

## Bydel Alna structural cues

- Utility header (logo + breadcrumb), main nav row underneath.
- Hero image, 1:1 or 16:9.
- 4-up tile grid of service links with very subtle border.
- Generous vertical spacing (40–60 px) between sections.
- Card internal padding 16–24 px, gap 16–20 px.

## Open questions / risks

- **Oslo Sans licensing.** The Punkt font page doesn't publish a license. The CDN `https://punkt-cdn.oslo.kommune.no/latest/fonts/` is publicly reachable. For a public site this is de-facto the recommended path per the docs ("through Punkt's stylesheet"); for a stricter compliance posture we'd confirm with Oslo kommune. This pass loads the font via the CDN URL and documents this as an open decision.
- **Oslo.kommune.no CSS inspection.** Not performed directly — the WebFetch output was summarized, not raw CSS. If the eventual visual match is off, re-inspect the live site's stylesheets and reconcile against these tokens.
- **Eyebrow casing.** Punkt uses sentence case ("Aktuelt"); the project site uses uppercase eyebrows. Kept uppercase for continuity; worth revisiting in a copy/voice pass.

## Top copy-rewrite candidates (for design-qa.md)

1. "How people actually live and cope." → softer, institutional voice.
2. "Seven ways the system collides with reality" → neutralise the drama.
3. Home hero subhead ("Technologies of care for aging migrants") — is fine but sits in English; either keep English as the project language or translate to Norwegian for the public nav surface.
4. CTA "Explore the map →" — Punkt buttons don't use ASCII arrows; use an icon on the right or plain label.
5. Admin microcopy "Post new insights, design challenges, or reading-room entries." — OK, but redundant next to the tab labels; trim.

These are flags only — do not rewrite in this phase.
