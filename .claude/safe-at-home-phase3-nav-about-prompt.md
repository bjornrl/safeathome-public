# Phase 3 — Navigation (Index) + About Rewrite

## Prerequisites

Phase 1 schema + types are applied. Phase 2 helps but isn't strictly required for this phase.

## Read first

`node_modules/next/dist/docs/01-app/` for anything routing-, metadata-, or params-related. Project conventions in `.claude/AGENTS.md`.

## Scope

Two things. They're independent — ship as two commits.

### 1. Bring back `Index` in the nav

Goal: one flat, alphabetical list of every published insight, with instant client-side search. No category grouping, no filters beyond the search box — this is the "I know the title, let me find it fast" page.

- New route: `src/app/index/page.tsx` (server component fetching via `getAllStories()`, or client component if easier — the list is small enough that either works).
- List all `public_stories` where `published = true`, sorted alphabetically by `title` (case-insensitive, locale-aware — use `localeCompare` with Norwegian as the target locale).
- Above the list, a text input labeled "Search" that filters the visible rows by title substring (case-insensitive). Filtering is client-side and instant — no submit button.
- Each row: story title as a link to `/story/[id]`, plus a muted byline with field site and a comma-separated list of categories (frictions and qualities merged, no color chips on this page — keep it dense and readable).
- Add a nav link labeled **`Index`** to `src/components/Nav.tsx`, placed between `Explore` and `Frictions`. Mirror the styling of the other nav items.
- The page's `<title>` (metadata) should be `"Index — safe@home"`.

### 2. About page rewrite

File: `src/app/about/page.tsx` (currently ~33 lines, placeholder-ish).

Structure the page as two clearly separated sections with the same typography scale used on other content pages (Qualities / Reading Room):

**Section A — The project.**
- One or two paragraphs: what safe@home is, who's involved, the three field sites (Alna, Søndre Nordstrand, Skien), the time frame, and the kind of questions the project investigates.
- Leave the actual body copy editable from a central place — either (a) hard-code reasonable placeholder prose that the user can replace later, or (b) load it from the existing `public_pages` table if there's a row with `slug = 'about-project'`. Pick (b) if it's a small lift; otherwise do (a) and note it with a `// phase3:` comment for later.

**Section B — How the categorizations work.**
- Explain **Frictions** and **Qualities** — what they are, why the project uses both, and how they map to the research. One paragraph each.
- Below each explanation, render the list of categories from `src/lib/constants.ts` (`FRICTIONS`, `QUALITIES`) as small cards, each showing: the category label, its color swatch, and its one-line description (frictions already have this; qualities get the copy from the existing `QUALITY_COPY` map in `src/app/qualities/page.tsx` — move that map into `src/lib/constants.ts` so it's shared).

The goal of Section B is that a visitor who lands on `/about` without prior context walks away understanding what categories the site uses and why.

Keep the styling consistent with the rest of the site (same `FONT_STACK`, same `#2a2859` heading color, same muted gray for secondary text).

## Out of scope

- Loading the long-form category descriptions from `public_quality_descriptions` / `public_friction_descriptions` — that's Phase 4. The About page gets one-liners only.
- Any changes to the actual category pages.
- The Progress section.

## Build & verify

1. `npm run build` and `npm run lint` clean.
2. Manually check:
   - `Index` appears in the nav and links to `/index`.
   - Typing in the search box filters the list live.
   - Clicking a row takes you to the correct story.
   - The About page renders both sections, with category cards showing the right colors.

## Output

List of files changed, and a note on whether `QUALITY_COPY` was moved into constants (yes / no).
