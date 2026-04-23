# Design overhaul QA log

Running log of the Punkt-aligned redesign. Updated as pages migrate.

## What landed in the first commit

- `.claude/design-reference.md` — extracted Punkt tokens, fonts, spacing, component rules.
- `src/lib/design-tokens.ts` — typed mirrors of the `--pkt-*` variables.
- `src/app/globals.css` — full Punkt token set, Oslo Sans @font-face (5 weights, loaded from the Punkt CDN), element resets, focus-visible outline, `.pkt-eyebrow` helper, `.pkt-skip-to-content`, `prefers-reduced-motion` reset.
- `src/app/layout.tsx` — `lang="nb-NO"`, body styling moved into globals.
- `src/components/ui/` — Button, Chip, Card, PageHeader, Field/Input/Select/Textarea, Footer, SkipToContent.
- `src/components/Nav.tsx` — utility row + main row, Norwegian nav labels, Button primitive for auth action, mobile toggle scaffolded (CSS query still needed to actually hide/show — Tailwind arbitrary at-media rules TBD).
- `src/app/page.tsx` — migrated fully to new primitives + tokens. Copy translated to Norwegian for nav-adjacent surfaces (hero, CTAs, section intros) while preserving editorial structure.

## Page migration status

| Page | Status | Notes |
| --- | --- | --- |
| `/` (home) | ✅ Migrated | Norwegian copy for CTAs and section leads; friction/quality copy kept English for now. |
| `/explore` | ⏳ Pending | Minimal Nav already used; surrounding chrome still inline-styled. |
| `/frictions` | ⏳ Pending | |
| `/qualities` | ⏳ Pending | |
| `/solutions` | ⏳ Pending | |
| `/reading-room` | ⏳ Pending | |
| `/story/[id]` | ⏳ Pending | |
| `/about` | ⏳ Pending | Visual only; copy rewrite is Phase 3. |
| `/for-municipalities` | ⏳ Pending | |
| `/auth`, `/auth/reset` | ⏳ Pending | |
| `/admin` and sub-panels | ⏳ Pending | Phase 2 forms need to be reskinned against the new `Field` / `Button` / `Chip` primitives. No input/validation/save changes. |

## Top five copy-rewrite candidates (flagged, not executed)

1. **Home hero subhead** — kept English ("Technologies of care for aging migrants") in source metadata but used a Norwegian equivalent ("Teknologier for omsorg til eldre med innvandrerbakgrunn") on the page. Decide a single language convention.
2. **"How people actually live and cope."** — kept in the qualities page as-is on home; softened to "Hvordan folk faktisk lever og mestrer" in the Norwegian body. Still dramatic; a drier institutional phrasing would fit Oslo voice better.
3. **"Seven ways the system collides with reality."** — translated to "Sju måter systemet kolliderer med virkeligheten." Same stylistic concern; consider "Sju gjentagende mønstre i omsorgstjenestene" or similar.
4. **"Explore the map →"** — migrated to `Utforsk kartet` without the trailing arrow character. Punkt buttons don't ship arrow glyphs.
5. **Admin microcopy** — still reads as a draft landing message. After admin reskin, consider trimming to the tab row alone.

## Known gaps / to-dos

- **Mobile nav toggle** — the `.pkt-mobile-toggle` / `.pkt-mobile-menu` CSS needs a media-query swap (show toggle < 768 px, hide link list below 768 px). Add when migrating the full nav layout, or move the query into `globals.css`.
- **Card hover styling** — `Card` declares `variant="interactive"` but the hover shadow lift is not yet applied (CSS custom property shipped but not consumed). Add `:hover` rule when we have a `<style jsx>` or Tailwind hover variant pass.
- **Oslo Sans licensing** — the font is served from Punkt's CDN without documented redistribution rights. Confirm with Oslo kommune before publishing outside dev.
- **Accessibility sweep** — focus-visible works project-wide via globals, but individual inline `<a>` / `<button>` style overrides still need auditing (e.g. hero CTA buttons do inherit, but the dark-CTA at the bottom uses an inverted scheme that needs its own focus outline check).
- **Contrast audit** — default text pair is `#2a2859` on `#ffffff` (13.7:1); muted text (`#666666` on `#ffffff`) passes AA for body but fails for 14 px bold titles. Spot-check when each page lands.
- **Admin styling** — Phase 2 admin forms still use ad-hoc Tailwind arbitrary-class styling. They must be reskinned against `Field/Input/Select/Textarea/Button/Chip` primitives in a follow-up commit.

## Remaining work to finish the overhaul prompt

- Migrate every public page listed as Pending above.
- Reskin the admin page and all 5 panels (Insights + Connections, Challenges, Resources, Descriptions, WP reports).
- Full-page screenshots or annotated descriptions (the prompt asks for visual before/after).
- Lighthouse accessibility run on `/` to confirm ≥ 95.
- Side-by-side comparison with `https://www.oslo.kommune.no/bydeler/bydel-alna/`.
