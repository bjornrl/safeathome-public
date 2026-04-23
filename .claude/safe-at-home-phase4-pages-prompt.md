# Phase 4 — Page-level Logic & Interactions

## Prerequisites

Phases 1–3 complete. The new columns, join tables, and description tables must be populated (or at least query-safe to fetch from — empty results are OK). The admin UI from Phase 2 should let editors fill in long descriptions and link resources to categories.

## Read first

`node_modules/next/dist/docs/01-app/` for anything touching server components, metadata, dynamic params, or caching (`revalidate`, `fetch` cache). Project conventions in `.claude/AGENTS.md`.

## Scope

Six changes, logically grouped. Ship as separate commits.

### 1. Story page — grouped "Connected stories"

File: `src/app/story/[id]/page.tsx`.

Current behavior: reads `public_connections` for this story and shows a flat list of related stories, each tagged with its friction.

New behavior: show stories grouped by **shared category**, styled like the Qualities page columns.

Algorithm:

1. Build the set of this story's frictions and qualities.
2. For every other published story, compute the intersection of categories (frictions + qualities).
3. Also take every row from `public_connections` that touches this story; those become additional shared-category entries (using the connection's `category_kind` + `category_key`).
4. Group the related stories by shared category key. A story can appear in multiple groups if it shares multiple categories.
5. Sort groups by (a) number of stories in the group, descending, then (b) whether the category is a friction (rendered first) vs a quality.

UI:

- Render one section per category, headed by the category label and its color (from `FRICTIONS` / `QUALITIES` in `src/lib/constants.ts`).
- Inside each section, list the related stories as compact cards (similar to `QualityStoryCard` on the Qualities page — consider extracting into a shared component).
- Cap each section at ~6 visible stories with a "Show all N" disclosure for longer groups.
- If no shared categories and no explicit connections, show a small muted "No connected stories yet." message — do not hide the section entirely.

### 2. Story page — "How the design team is responding" shows category chips

Same file.

- For each linked design response, render chips for every category the response addresses (frictions + qualities).
- Each chip is a link — frictions link to `/frictions?friction=<key>`, qualities link to `/qualities#<key>` (or a dedicated `/qualities/[key]` page if you add one; for now the hash is enough).
- Visual treatment: chips matching a category the current story also has should be rendered slightly emphasized (bolder or darker shade) to reinforce "this response addresses something you just read."
- Keep the response title and description as they are.

### 3. Qualities page — smarter dimmer

File: `src/app/qualities/page.tsx`.

Current bug: the dimmer only highlights on exact-match hovers. Desired behavior: when the user hovers a story card, every other card sharing **at least one** category (friction or quality) with the hovered card should be visually highlighted; non-matching cards dim.

Implementation sketch:

- On hover, compute the hovered card's combined category set.
- Every card that shares ≥ 1 category gets a highlight style; the highlight color is the **first shared category's color** from constants. If you want to be fancier, you can gradient across multiple shared categories, but start simple.
- Non-matching cards drop to opacity ~0.35 (current `0.45` is close — tune to taste).
- The hovered card itself gets a slightly stronger border to read as "origin."
- Preserve touch-device behavior: if hover is unavailable, the dimmer is a no-op (no permanent dim state).

### 4. Qualities page — expandable category descriptions

Same file.

- Each column header (the category label + one-line copy currently at the top of each section) becomes clickable / expandable.
- On expand, reveal the `long_description` and `examples[]` from `public_quality_descriptions` (fetched once at page load). Examples render as a bullet list.
- If the description is empty (editor hasn't filled it in yet), the expand control is disabled with a small muted "Coming soon" label.
- Pattern should be reusable — also add it to `src/app/frictions/page.tsx` for frictions later (same data source: `public_friction_descriptions`). Include it in this phase if the friction page's structure makes it cheap; otherwise leave a `// phase4:` comment and move on.

### 5. Resource cards + Reading Room category filters

Files: `src/components/ResourceList.tsx`, `src/app/reading-room/page.tsx`.

- Each resource card shows the categories it's tied to (from the new `public_resource_frictions` / `public_resource_qualities` join tables) as chips. Optional linked stories show as a compact "Linked insights" row with count + expand.
- Above the resource list on `/reading-room`, add a filter bar:
  - Frictions: multi-select chips (click to toggle).
  - Qualities: multi-select chips (click to toggle).
  - A "Clear filters" link when any filter is active.
- Filtering logic: a resource is shown when it matches **every** selected filter (AND across selections; OR within a category is fine if it makes the UI easier — pick one and document it in a comment).
- Empty-state copy updates: if filters produce no matches, show "No resources match these filters" with a one-click clear.

### 6. Investigate `direct` vs `indirect` connections

- Search the codebase for usages of `connection_type`, `direct`, and `indirect`. Current known hit: `src/app/story/[id]/page.tsx` renders `({conn.connection_type})` next to the friction label.
- Check the MapLibre / d3 code on `/explore` and `/frictions` for anything that draws dotted vs. solid lines based on this field.
- Produce a **one-paragraph report** in the final commit message (or as a `// phase4:` comment in the most relevant file) describing where it's used and whether the visual distinction (solid vs. dotted line) carries any meaning.
- Do **not** remove the field in this phase. If the investigation reveals the distinction is unused or meaningless, open a follow-up task to drop it.

## Out of scope

- The Progress section on `/solutions` (Phase 5).
- Any admin form changes.

## Build & verify

1. `npm run build` and `npm run lint` clean.
2. Visit a story page with several frictions/qualities — confirm connected stories group correctly.
3. Hover on the Qualities page — confirm the dimmer highlights by ≥1 shared category.
4. Click a category header on Qualities — confirm long description + examples appear.
5. Apply filters on Reading Room — confirm the list responds.

## Output

Report files changed, the `direct/indirect` investigation paragraph, and any `// phase4:` comments left behind for follow-up.
