# Phase 2 — Admin / CMS + Dev-mode Public Lock

## Prerequisites

Phase 1 must be complete and the migration applied. That means these tables and columns exist in Supabase:

- `public_stories.home_based`, `public_stories.theme` (nullable)
- `public_connections.category_kind`, `public_connections.category_key`
- `public_design_responses.qualities`
- `public_resource_frictions`, `public_resource_qualities`, `public_resource_stories`
- `public_friction_descriptions`, `public_quality_descriptions`
- `public_wp_reports`

If any of these are missing, stop and surface that instead of improvising.

## Read first

Before writing middleware, consult `node_modules/next/dist/docs/01-app/` in this repo — pay special attention to whatever the current Next 16 docs say about:

- Middleware (location, file name, matcher config, runtime, what's allowed in it).
- Route protection with Supabase SSR.
- Server vs. client component boundaries.

Project conventions live in `.claude/AGENTS.md`.

## Scope

Six things, in this order. Ship them as separate commits so they're easy to revert.

### 1. Dev-mode public lock (middleware)

Goal: while the project is still under active development, visitors who aren't signed in should only be able to see the home page (`/`) and the auth pages (`/auth`, `/auth/reset`). Everything else redirects to `/`.

- Gate the lock on an env flag. Suggested: `NEXT_PUBLIC_DEV_LOCK=1` (read on server). When the flag is off, the middleware becomes a no-op.
- Add `src/middleware.ts` (or whatever the docs say is correct for Next 16). Use a `matcher` config to exclude Next's internal assets (`/_next/*`, `/favicon.ico`, static files under `/public`).
- Allow-list for the lock:
  - `/` (the home page)
  - `/auth` and any sub-route of `/auth` (log-in, password reset)
  - `/admin` and any sub-route of `/admin` — but only if the request has a valid Supabase session cookie. An unauthenticated visitor hitting `/admin` should be redirected to `/auth`.
- For any other path, if there is no Supabase session, redirect to `/`.
- Use Supabase's SSR helpers to read the session from cookies; do not assume client-side auth.
- Document the env flag in `README.md` and in `.env.local.example`.

### 2. Insights admin form — quality-based connections

File: `src/app/admin/page.tsx` (see `StoriesPanel` / the connections sub-form).

- The form currently lets editors pick a friction for a connection. Change it to a two-step picker:
  1. Choose **category kind**: "Friction" or "Quality".
  2. Based on that, show a dropdown of matching keys from `src/lib/constants.ts` (`FRICTIONS` or `QUALITIES`).
- Persist to `public_connections` as `category_kind` + `category_key`. Continue to populate the legacy `friction` column too (mirror the value when `category_kind = 'friction'`; leave null when it's quality) to keep Phase-1 fallbacks working.
- Keep the existing `connection_type` (`direct` / `indirect`) control for now — we'll address its meaning in Phase 4.

### 3. Challenges admin form — qualities first-class, stories optional

Same file, `ChallengesPanel`.

- Add a qualities multi-select (same pattern as the existing frictions multi-select).
- Keep the story-link picker, but mark it clearly as **optional**. The UI label should communicate that challenges link primarily to categories.
- On save, write to `public_design_responses.qualities` (text array) alongside `frictions` and `source_stories`.

### 4. Resources admin form — categories + optional story links

Same file, `ResourcesPanel`.

- Add three selectors:
  - Frictions (multi-select). Writes to `public_resource_frictions`.
  - Qualities (multi-select). Writes to `public_resource_qualities`.
  - Stories (multi-select, **optional**, with a clear "leave empty" affordance). Writes to `public_resource_stories`.
- On save, upsert the resource row first, then reconcile each join table (delete rows not in the new list, insert rows that are new).
- On edit, prefill from the three join tables.

### 5. Qualities & frictions descriptions — new admin tab

Add a new tab `Descriptions` (or `Categories`) next to `Insights` / `Design challenges` / `Resources`.

- Two sub-sections: "Frictions" and "Qualities".
- Each row from `public_friction_descriptions` / `public_quality_descriptions` renders as: read-only `key`, editable `long_description` textarea, editable `examples` list (add / remove rows of plain text), "Save" button per row.
- On save, `UPDATE … WHERE key = $1` with the new `long_description`, `examples`, and bump `updated_at`.
- No create / delete. The rows were seeded in Phase 1 and are keyed off the constants, so the set is closed.

### 6. WP monthly reports — new admin tab

Add a tab `WP progress` (or similar).

- List existing `public_wp_reports` rows, newest first, grouped by `wp_id`.
- "New report" form with fields: `wp_id`, `month` (month picker, stored as the first of that month), `summary` (textarea), `highlights` (list of strings), `next_steps` (textarea), `interviewee` (text), `published` (checkbox). `interviewer` defaults to `"Comte"` and is editable.
- The `wp_id` field is a dropdown with **exactly four** options — the project has four work packages, no more:
  - `wp1` — *WP1: Homes & Communities*
  - `wp2` — *WP2: Health & Care Institutions*
  - `wp3` — *WP3: Transnational Contexts*
  - `wp4` — *WP4: Innovation & Design*
- Add a shared `WP_LABELS` map to `src/lib/constants.ts` exporting these four entries so Phase 5 can reuse them. Shape: `Record<"wp1" | "wp2" | "wp3" | "wp4", { label: string; subtitle: string }>`. Use the full titles above as `label` and the existing one-liner descriptions from `.claude/safe-at-home-rework-prompt.md` as `subtitle`.
- Edit / delete existing rows.
- Respect the unique `(wp_id, month)` constraint — surface a friendly error if an editor tries to create a duplicate.

## Out of scope

- Changing any story-page, qualities-page, reading-room, or solutions-page rendering (Phase 4 / Phase 5).
- Adding the "Progress" section on `/solutions` (Phase 5).
- Navigation changes and About page (Phase 3).

## Build & verify

1. `npm run build` clean.
2. `npm run lint` clean.
3. Manually test each admin form with a dev login: create → edit → delete round-trip for each entity.
4. Toggle `NEXT_PUBLIC_DEV_LOCK` and confirm:
   - With the flag on and no session, `/frictions` redirects to `/`, but `/`, `/auth`, and `/auth/reset` still load.
   - With a signed-in admin session, every route is reachable including `/admin`.
   - With the flag off, nothing is locked.

## Output

Report which files changed, any Next 16 docs consulted for the middleware, and a short GIF-style description of the manual test results.
