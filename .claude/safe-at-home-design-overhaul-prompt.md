# Design Overhaul — Resemble oslo.kommune.no

## Why now

The previous redesign pulled Oslo colors and referenced Oslo Sans in the font stack, but the site still reads as a generic editorial template rather than something that belongs to the Oslo municipality family. This pass realigns the visual language — tokens, typography, components, layout rhythm — with Oslo kommune's public design system so a visitor feels the same institutional credibility they'd feel on a real bydel page.

## Status context

- **Phase 1 (schema migration) — complete.**
- **Phase 2 (admin forms + dev-mode public lock) — complete.** This means `src/app/admin/*` now contains expanded forms for Insights, Challenges, Resources, Descriptions, and WP reports, and `src/middleware.ts` exists for the dev lock. The design overhaul must migrate the admin surface to the new primitives in this pass, and must not modify the middleware's behavior.
- **Phases 3–5 — not yet run.** They will inherit whatever tokens and primitives you establish here.

## Read first

1. **Next 16 docs.** `node_modules/next/dist/docs/01-app/` — specifically anything about CSS strategy, fonts, and global styles. This version differs from older Next.
2. **`.claude/AGENTS.md`** — project conventions.
3. **Oslo references (fetch these live — you have internet where I don't).**
   - https://designmanual.oslo.kommune.no/ — brand manual, principles, voice.
   - https://styleguide.oslo.kommune.no/ — visual system overview.
   - https://punkt.oslo.kommune.no/ — **Punkt**, the developer-facing design system. This is the most useful URL for us: it should contain concrete CSS custom properties, component markup, spacing tokens, and documented patterns. Look at the `/ressurser/colors/`, typography, and component pages. Inspect the served CSS for variable names.
   - https://www.oslo.kommune.no/ — live homepage, reference for rhythm and layout.
   - https://www.oslo.kommune.no/bydeler/bydel-alna/ — live bydel page, the closest structural analogue to what we're building (local area, public-facing, content-heavy). Use this as the primary structural reference.

Before writing any code, spend real time in the browser / via curl inspecting the Punkt CSS. Produce a short summary file at `.claude/design-reference.md` capturing the exact hex values, CSS variable names, fonts, spacing scale, and component patterns you extracted. Every later decision in this prompt should cite that file. If Punkt is not publicly reachable, document what you tried and fall back to extracting tokens from the live `oslo.kommune.no` homepage (inspect `<style>` blocks and linked stylesheets).

## Deliverables

1. `.claude/design-reference.md` — extracted tokens and pattern notes.
2. `src/lib/design-tokens.ts` — all colors, typography, spacing, radii, shadows exported as semantic constants.
3. Global CSS in `src/app/globals.css` — CSS custom properties mirroring the TS tokens, Oslo Sans `@font-face` (or a documented fallback), resets, focus styles.
4. A small primitives library in `src/components/ui/`:
   - `Button.tsx` (primary / secondary / tertiary, sizes, disabled, loading).
   - `Chip.tsx` (category chips for frictions / qualities, with color prop).
   - `Card.tsx` (content card + optional image variant).
   - `PageHeader.tsx` (breadcrumbs + eyebrow label + title + intro).
   - `Field.tsx` (label + input + helper / error) and matching `Select`, `Textarea`.
   - `Footer.tsx` (replaces inline footers on individual pages).
   - `SkipToContent.tsx` (accessibility).
5. Refactor `src/components/Nav.tsx` to the new system.
6. Migrate every page to the new tokens and primitives, **without changing behavior, data, or middleware**:
   - Public pages: `page.tsx` (home), `qualities`, `frictions`, `solutions`, `reading-room`, `story/[id]`, `explore`, `about`, `for-municipalities`, `auth` (and `auth/reset`).
   - Admin pages: `admin` and every sub-view inside it (Insights, Challenges, Resources, Descriptions, WP reports). Any shared admin-form helpers Phase 2 introduced must be refactored to reuse the new `src/components/ui/` primitives — do not keep a parallel styling track for admin.
   - Do **not** edit `src/middleware.ts` or the dev-lock logic. If you need to test pages locally, temporarily set `NEXT_PUBLIC_DEV_LOCK=0` in `.env.local` or sign in.
7. A Figma-style "design QA" doc at `.claude/design-qa.md` with before/after screenshots (if you can capture them) or annotated descriptions of each page, so we can spot-check the migration.

## Design direction

### Feel

Think **public-institution clarity**, not editorial magazine. The Bydel Alna page is the reference: dense but scannable, generous white space, minimal decoration, trustworthy. Typography does most of the work. Color is used sparingly, as signal, not decoration.

### Color

Use Punkt's tokens verbatim. Expected categories (confirm and replace these names with whatever Punkt actually uses):

- **Brand primary** — the Oslo tram / fjord blue. Used for primary buttons, link underlines, focused states.
- **Brand secondary** — a forest / park green for accent and success.
- **Warm neutrals** — 4–6 steps from near-white to near-black, derived from the city's facade palette. These are the workhorses: backgrounds, body text, dividers, muted copy.
- **Semantic colors** — error red, warning amber, info blue, success green.
- **Surface tokens** — `surface-default`, `surface-muted`, `surface-sunken`, `surface-inverse`.

Keep the existing **friction** and **quality** category colors in `src/lib/constants.ts` — those encode research meaning, not brand style, and must not change. But render them against the Oslo neutrals; don't let them dominate pages where they're not the point.

### Typography

- Body font: **Oslo Sans**. Self-host if the license permits — check Punkt for a webfont URL. If self-hosting isn't possible, fall back to `"Inter", "Helvetica Neue", Arial, sans-serif` and document the decision in `.claude/design-reference.md`. Never ship `Oslo Sans` as a bare reference without a matching `@font-face` and without confirmed licensing.
- Type scale: mirror Punkt's scale. A typical institutional scale is roughly 12 / 14 / 16 / 18 / 20 / 24 / 32 / 40 / 48 / 60 px — adjust to whatever Punkt says.
- Weights: 400 / 500 / 600 / 700 — Oslo Sans ships four weights, use them deliberately.
- Headings: `h1` display-size with tight tracking, `h2` clearly smaller, hierarchy visible at a glance. Avoid the current `clamp(38px, 6vw, 60px)` for H1 unless Punkt does the same; prefer fixed sizes at defined breakpoints.
- Uppercase eyebrow labels (small caps–like) are a signature Oslo pattern — keep using them, but sourced from a single `.eyebrow` token (`text-transform: uppercase; letter-spacing: 0.14em; font-size: 12px; font-weight: 600; color: var(--color-text-muted)`).

### Spacing

One scale, token-named: `space-0` through `space-12` on a 4 or 8 px base. Document it in `design-reference.md`. Replace all hard-coded `px` paddings and margins currently in the pages with token references.

### Radii

Oslo skews utilitarian. Expect `radius-sm = 4px`, `radius-md = 8px`, maybe `radius-lg = 16px` for images, and **no** pill / fully-rounded chips unless Punkt specifies them. Drop any generous border-radius we inherited from the previous redesign.

### Shadows & borders

Prefer 1px hairlines over shadows. Keep shadows to a single, soft `shadow-sm` for cards that lift on hover. No drop-shadow stacks.

### Iconography

Whatever Punkt uses. If it documents an icon set, adopt it. If not, pick one open-license set (e.g. Phosphor, Lucide) and use it uniformly. No mixing icon styles across pages.

### Motion

Oslo's public sites are conservative: 150–200 ms ease-out for hovers, no complex entry animations. Respect `prefers-reduced-motion`.

### Accessibility

- Every text / background pair must meet WCAG AA.
- Visible focus ring on every interactive element — 2 px outline in brand primary with a 2 px offset. No `outline: none` without a replacement.
- Minimum 16 px body text, 44 × 44 px touch targets, labels on every form control.
- Skip-to-content link at the top of every page.
- `lang="nb-NO"` on `<html>` (the site is Norwegian-first; swap to `"en"` only on explicitly English routes). Confirm what's in `src/app/layout.tsx` now.

### Voice & tone

Oslo's voice (per the design manual) is warm, plain, direct — civil service clarity without stuffiness. Review existing copy for:

- Overwrought headlines (e.g. "How people actually live and cope.") — trim to something an Oslo page would actually say.
- Mix of English / Norwegian — decide which is primary per page. Research-project content can stay English; anything that reads as "official site" copy (navigation labels, footer, calls to action) should be Norwegian.
- Em dashes and decorative punctuation — Oslo prefers simple sentences.

Do not rewrite copy wholesale as part of this phase. Flag the top five copy rewrites needed in `design-qa.md` so we can discuss them.

## Page-by-page migration notes

For each page, keep existing data flow and logic untouched. Only change markup and styling.

### Nav (`src/components/Nav.tsx`)

- Logo on the left, nav links center-right, auth action right. Match the spacing and weight of the Bydel Alna header.
- Replace the current "sticky white bar with sibling pill button" with a more institutional header: thin top utility row (language, search, skip to content) if Oslo uses one, then a main nav row beneath.
- Links are text, underlined on hover, with a subtle active-state underline.
- Mobile: a proper burger menu driven by a `<details>` or controlled state, not the current wrap.

### Home (`src/app/page.tsx`)

- Hero: breadcrumb-less, bold title with short intro paragraph and a couple of clear CTAs (primary + secondary button).
- Below the hero, a tiled "quick access" grid that mirrors the bydel homepage's service tiles — same card size, same typography hierarchy.
- Section dividers are thin rules, not large color bands.
- Keep whatever imagery currently ships, but crop to consistent aspect ratios and apply `radius-md`.

### Qualities / Frictions / Solutions / Reading Room

- Standardize the `PageHeader` pattern: eyebrow label, H1, intro paragraph, max-width 680 px.
- Content below in a consistent container with top/bottom spacing sourced from tokens.
- Category cards use the new `Chip` and `Card` primitives.

### Story page (`src/app/story/[id]/page.tsx`)

- Tighter reading width (already roughly correct at 760 px).
- Prominent breadcrumbs: `Insights / <category> / <title>`.
- Metadata chips above the title, not inline with body.
- "Connected stories" and "How the design team is responding" sections re-skinned with the new card primitive — Phase 4 will restructure them further, so don't fight that work.

### Explore (`src/app/explore/page.tsx`)

- The MapLibre canvas stays. Around it: update the house overlay panel, the scale legend, and any floating UI chrome to the new tokens. Keep behavior identical.

### About

- Use the new `PageHeader`. Leave the actual copy rewrite for Phase 3 — this pass is purely visual.

### For municipalities

- Same treatment. No behavior change.

## Explicit non-goals

- Do not refactor data fetching or change any admin form's inputs, validation, or save behavior — only restyle the admin UI.
- Do not touch `src/middleware.ts` (the dev-mode public lock from Phase 2).
- Do not remove existing pages or features.
- Do not redesign the MapLibre map itself.
- Do not translate existing copy beyond what the voice / tone review flags.
- Do not invent new brand colors — only use what Punkt actually publishes.
- Do not alter any Phase 3–5 scope (Index page, About copy rewrite, story-page logic, Progress section).

## Risks / open questions for me to raise in chat if you hit them

- **Oslo Sans license.** If you can't find a legal self-hosting path, stop and tell me before shipping a fallback — this is worth a direct conversation with Oslo kommune rather than guessing.
- **Egress / fetching Punkt.** If the Punkt site structure has changed or requires auth, document what you see and fall back to inspecting `oslo.kommune.no`'s served CSS directly.
- **Translation strategy.** If you find the site is a mix of languages that makes the Oslo aesthetic land poorly, flag it — we may need a small `i18n` pass.

## Build & verify

1. `npm run build` and `npm run lint` clean.
2. Every page renders without layout breakage at 360 px, 768 px, 1280 px widths.
3. Keyboard-only: Tab through the nav, home page, and a story page. Focus rings are visible everywhere.
4. Lighthouse accessibility score ≥ 95 on the home page.
5. Spot-check: open `/` in a second tab next to `https://www.oslo.kommune.no/bydeler/bydel-alna/`. The two should feel like siblings, not strangers.

## Output

- `.claude/design-reference.md` with extracted tokens.
- `.claude/design-qa.md` with per-page before/after notes and the top five copy-rewrite candidates.
- Summary commit message listing each file touched.
- Any Oslo design-system questions you weren't able to resolve from the public sources.
