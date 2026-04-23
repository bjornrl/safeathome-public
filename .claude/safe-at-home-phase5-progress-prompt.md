# Phase 5 — "Progress" Section on `/solutions`

## Prerequisites

- Phase 1 schema: `public_wp_reports` table exists.
- Phase 2 admin: Comte has a way to write WP reports into the table (WP progress admin tab).
- Without some seed WP report data, the section will render an empty state — that's fine.

## Read first

`node_modules/next/dist/docs/01-app/` for anything metadata- or caching-related on the solutions page. Project conventions in `.claude/AGENTS.md`.

## Scope

One page change, with a new query helper.

### 1. Query helper

File: `src/lib/queries.ts`.

Add `getPublishedWpReports(): Promise<WpReport[]>`:
- Selects from `public_wp_reports` where `published = true`.
- Sorted by `month` descending, then `wp_id` ascending.
- Follows the seed-fallback pattern other helpers use — if Supabase errors or returns empty, return `[]` (no seed data for this table).

### 2. `/solutions` — add a "Progress" section below existing content

File: `src/app/solutions/page.tsx`.

Preserve everything that's already on the page. Append a new section, clearly separated (top border, generous vertical spacing) with the heading **"Progress"**.

Structure:

- Short intro sentence under the heading: something like *"Monthly interviews with each work package, conducted by Comte, summarizing where the research stands."*
- Group reports by `wp_id`, one column or card per WP.
- Within each group:
  - The **latest month** is featured at the top — month label, summary text, highlights as a bulleted list, next-steps as a small footer.
  - Prior months collapse into an "Earlier months" disclosure; clicking reveals them as smaller cards in reverse-chronological order.
- Each report shows its `interviewer` (defaults to "Comte") and `interviewee` as a subtle byline.
- Month formatting: long form for the feature month (e.g. `"April 2026"`), compact for archives (`"Mar 2026"`). Use Norwegian locale if the site is Norwegian-first; otherwise English.

### 3. Empty state

If there are zero published reports at all, render a single muted paragraph: *"The first monthly progress reports are being written. Check back soon."* Do not hide the section heading.

### 4. WP id presentation

The `wp_id` is a raw string (e.g. `wp1`). Phase 2 already added a shared `WP_LABELS` map to `src/lib/constants.ts` with these exact entries — reuse it everywhere on this page (featured month, archive cards, section headers):

- `wp1` — *WP1: Homes & Communities* — how material spaces and social dynamics shape homecare
- `wp2` — *WP2: Health & Care Institutions* — what barriers and enablers shape service access
- `wp3` — *WP3: Transnational Contexts* — how cross-border ties affect aging in place
- `wp4` — *WP4: Innovation & Design* — co-creating practical solutions with users and municipalities

If Phase 2 didn't run yet (or skipped creating the map), create it here with the four entries above. There are **exactly four** work packages — never render a fifth group even if the table somehow contains other `wp_id` values (surface those as a warning in the admin instead of rendering them publicly).

### 5. Caching

If the solutions page is a server component, add `export const revalidate = 300;` (5 minutes) so new reports show up reasonably quickly without refetching on every request. Follow whatever the Next 16 docs recommend for ISR-style revalidation.

## Out of scope

- Touching the rest of the solutions page content.
- Any admin changes (already covered in Phase 2).
- Any home-page surface — the WP overview lives **only** on `/solutions`.

## Build & verify

1. `npm run build` and `npm run lint` clean.
2. With the table empty, `/solutions` should render the existing content plus the Progress section with the empty-state copy.
3. Insert a test row via the admin UI (or directly in Supabase) for `wp1` with the current month and `published = true`. Reload `/solutions` — the section should feature it at the top of its group.
4. Insert a second earlier-month row for the same `wp1`. Confirm it appears under "Earlier months" as a disclosure.

## Output

Files changed, whether `WP_LABELS` was added (and the labels used), and any `// phase5:` comments left behind.
