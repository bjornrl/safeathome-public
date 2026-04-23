# Phase 1 — Schema & Types Migration

## Context

This is a Next.js 16 + React 19 + Supabase project. The site shows stories ("insights") collected from three field sites, categorized by **frictions** (what's breaking in care systems) and **qualities** (how people actually live and cope). Stories can be connected to each other, grouped by room of the house, tied to design-team responses (challenges), and referenced from a Reading Room of resources.

We're now rewiring the data model to support several upcoming features:

- Connections that can be based on **either a shared friction or a shared quality** (today they only know about frictions).
- **Challenges linked primarily to categories** (frictions and qualities), with story links optional.
- **Resources linked to many stories and many categories**, not just a single theme.
- **Long-form descriptions + real examples** for each friction and quality, shown on category pages.
- **Monthly work-package (WP) progress reports** — one row per WP per month, written by an interviewer named "Comte".
- A curation flag for "this story happened inside a home": `home_based`. Only when this flag is true may a room (`theme`) be assigned.

None of the UI changes in this phase. This is purely schema + types + query helpers + seed data. After this lands, the app must still build and run without visual regressions.

## Read first

Before writing any code that touches Next.js primitives (routing, middleware, server components, caching), read the relevant file in `node_modules/next/dist/docs/01-app/` in this repo — this is Next 16.2 and much of Claude's training data describes older versions. For Phase 1 specifically this is unlikely to come up, but note it anyway.

Project conventions live in `.claude/AGENTS.md`. Follow them.

## Deliverables

1. A single SQL migration file at `supabase/migrations/0001_phase1_schema.sql`, written so it can be run via the Supabase SQL editor or CLI. It must be idempotent where possible (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DROP POLICY IF EXISTS … CREATE POLICY …`).
2. Updates to `src/lib/types.ts` to mirror the new schema.
3. Updates to `src/lib/queries.ts` with new query helpers for the new tables.
4. Updates to `src/lib/seed-data.ts`, `src/lib/seed-solutions.ts`, `src/lib/seed-resources.ts` so fallback seed data still compiles against the new types and still renders the site when Supabase is unreachable.
5. `npm run build` must succeed with no new TypeScript or lint errors.

## What the migration must do

### 1. `public_stories` — add the home-based flag

- Add `home_based BOOLEAN NOT NULL DEFAULT FALSE`.
- Change `theme` (the `HouseTheme` column) from `NOT NULL` to nullable.
- Add a check constraint: a row may have `theme IS NOT NULL` only if `home_based = TRUE`. If `home_based = FALSE`, `theme` must be `NULL`.
- Backfill: set `home_based = TRUE` for every existing row that currently has a `theme`.

### 2. `public_connections` — generic category, not just friction

- Add `category_kind TEXT NOT NULL DEFAULT 'friction' CHECK (category_kind IN ('friction', 'quality'))`.
- Add `category_key TEXT` (nullable initially, then backfilled, then made `NOT NULL`).
- Backfill `category_key` from the existing `friction` column for every row.
- After backfill, set `category_key` to `NOT NULL`.
- Do **not** drop the old `friction` column yet — leave it for now so older code keeps working. A future phase will remove it.
- Keep the existing `connection_type` column (`direct` / `indirect`) untouched. Its meaning will be investigated in a later phase.

### 3. `public_design_responses` (challenges) — qualities as first-class

- Ensure `qualities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]` exists (add if missing).
- Leave `frictions TEXT[]` and `source_stories` (the story-id array) as-is. Story links stay optional.

### 4. Resource ↔ stories / categories (many-to-many)

Create three join tables, each with `ON DELETE CASCADE` to the owning resource:

- `public_resource_frictions (resource_id UUID, friction_key TEXT, PRIMARY KEY (resource_id, friction_key))`
- `public_resource_qualities (resource_id UUID, quality_key TEXT, PRIMARY KEY (resource_id, quality_key))`
- `public_resource_stories   (resource_id UUID, story_id UUID, PRIMARY KEY (resource_id, story_id))`

Add foreign keys to `public_resources(id)` and `public_stories(id)` as appropriate. Do not migrate any existing data into these tables — they start empty.

### 5. Category description tables (long-form + examples)

- `public_friction_descriptions (key TEXT PRIMARY KEY, long_description TEXT NOT NULL DEFAULT '', examples TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`
- `public_quality_descriptions (key TEXT PRIMARY KEY, long_description TEXT NOT NULL DEFAULT '', examples TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`

Seed one row per known key by reading the key sets from `src/lib/constants.ts` (`FRICTIONS`, `QUALITIES`). Use `INSERT … ON CONFLICT (key) DO NOTHING` so re-running the migration is safe. Set `long_description = ''` and `examples = ARRAY[]::TEXT[]` for now — editors will fill them via the admin UI in a later phase.

### 6. WP monthly reports

```
public_wp_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wp_id TEXT NOT NULL,               -- e.g. "wp1", "wp2"
  month DATE NOT NULL,               -- use the first of the month
  summary TEXT NOT NULL DEFAULT '',
  highlights TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  next_steps TEXT NOT NULL DEFAULT '',
  interviewer TEXT NOT NULL DEFAULT 'Comte',
  interviewee TEXT,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wp_id, month)
)
```

No seed rows.

### 7. Row-level security

Follow the RLS pattern already used on `public_stories`, `public_connections`, `public_resources`. For every new table (and the new columns):

- Anonymous (`anon`) role: `SELECT` allowed. For tables with a `published` column (`public_wp_reports`), restrict to `published = true`. The description tables are always readable.
- Authenticated role: full `SELECT / INSERT / UPDATE / DELETE` (admin).

If the existing tables use a more specific pattern (e.g. a role claim), mirror it exactly. Inspect existing policies before inventing new ones.

## TypeScript changes (`src/lib/types.ts`)

- `PublicStory.theme: HouseTheme | null`
- `PublicStory.home_based: boolean`
- `PublicConnection.category_kind: "friction" | "quality"`
- `PublicConnection.category_key: string`
- Keep `PublicConnection.friction: CareFriction` for now (column still exists). Mark the comment `// deprecated: will be removed after UI migrates to category_key`.
- `PublicDesignResponse.qualities: CareQuality[]` — confirm it's already in the type and referenced consistently.
- Add new types:
  - `CategoryDescription { key: string; long_description: string; examples: string[]; updated_at: string }`
  - `WpReport { id: string; wp_id: string; month: string; summary: string; highlights: string[]; next_steps: string; interviewer: string; interviewee: string | null; published: boolean; created_at: string; updated_at: string }`
  - `ResourceStoryLink { resource_id: string; story_id: string }`, `ResourceFrictionLink { resource_id: string; friction_key: CareFriction }`, `ResourceQualityLink { resource_id: string; quality_key: CareQuality }`

## Query helpers (`src/lib/queries.ts`)

Add, following the seed-fallback pattern of existing helpers:

- `getFrictionDescriptions(): Promise<CategoryDescription[]>`
- `getQualityDescriptions(): Promise<CategoryDescription[]>`
- `getWpReports(): Promise<WpReport[]>` — filtered to `published = true`, sorted by `month` descending, then `wp_id`.
- `getResourceLinks(resourceId: string): Promise<{ stories: string[]; frictions: CareFriction[]; qualities: CareQuality[] }>`

Update `getConnections()`'s return shape to include the new fields. For seed-fallback data, derive `category_kind = "friction"` and `category_key = <existing friction>`.

## Seed data updates

- `SEED_STORIES`: for each story that currently has a `theme`, set `home_based: true`. Any story without a home-specific setting: `home_based: false`, `theme: null`.
- `SEED_CONNECTIONS`: set `category_kind: "friction"` and `category_key: <existing friction value>`.
- `SEED_RESOURCES`, `SEED_SOLUTIONS`: no structural changes required, but confirm they still compile against the updated types.

## Build & verify

1. Run `npm run build`. Fix any TypeScript errors introduced by the type changes.
2. Run `npm run lint`. Fix any new lint errors.
3. Read through `src/app/**/*.tsx` for any place that assumes `theme` is non-null or reads `connection.friction` directly. **Do not change UI behavior** — if a component would break, add a narrow defensive check (e.g. `if (!story.theme) return null` inside a room-only renderer) and note it in a short comment so Phase 2 / Phase 4 know where to follow up. Keep the comments prefixed with `// phase1:` so they're easy to find.
4. Confirm the dev server starts with `npm run dev` and the home page still renders.

## Do NOT apply the migration

Write the SQL migration file, but **do not run it against any Supabase database**. The user will apply it from their Cowork session using the Supabase MCP. Specifically: do not call any Supabase CLI migration commands, do not execute SQL via the Supabase SDK, and do not attempt to use a Supabase MCP if one is present in your environment. Your job ends at "file written + build passes."

## Out of scope for Phase 1

- The dev-mode public lock (Phase 2).
- Admin form changes (Phase 2).
- Navigation and About updates (Phase 3).
- Story-page, Qualities, and Resource page rendering changes (Phase 4).
- The Progress section on `/solutions` (Phase 5).

Do not touch those files unless strictly necessary to keep the build green.

## Output

When done, report:

- Path to the new migration file.
- A short changelog of files touched.
- Any `// phase1:` comments you left behind, and why.
- Whether `npm run build` and `npm run lint` are clean.
