# safe@home — Fix admin page so it can publish to Supabase

You are working in the `safeathome-public` repo. The admin page at `/admin` has forms for creating Insights, Design challenges, and Resources that write to Supabase tables. Several of the forms are currently broken because they reference columns that don't exist or skip NOT NULL columns.

I've verified the Supabase schema directly. Use this document as ground truth — do **not** re-query the schema via MCP, trust what's written here.

## Ground truth: database schema

These are the columns that actually exist in Supabase right now. Every INSERT must match these exactly.

### `public_stories`
```
id                uuid       NOT NULL   default gen_random_uuid()
title             text       NOT NULL
body              text       NOT NULL
source_insight_id uuid
theme             house_theme NOT NULL   (enum)
field_site        field_site              (enum, nullable)
media_urls        text[]                   default '{}'
author_credit     text
published         bool       NOT NULL   default false
published_at      timestamptz
sort_order        int                      default 0
created_by        uuid
created_at        timestamptz NOT NULL
updated_at        timestamptz NOT NULL
frictions         care_friction[]         default '{}'
qualities         care_quality[]          default '{}'
map_scale         map_scale               (enum, nullable)
latitude          float8
longitude         float8
```

### `public_design_responses`
```
id                   uuid       NOT NULL   default gen_random_uuid()
title                text       NOT NULL
body                 text       NOT NULL
source_challenge_id  uuid
theme                house_theme NOT NULL   (enum) ← REQUIRED, no default
stage                text
outcome              text
media_urls           text[]                   default '{}'
published            bool       NOT NULL   default false
published_at         timestamptz
sort_order           int                      default 0
created_by           uuid
created_at           timestamptz NOT NULL
updated_at           timestamptz NOT NULL
frictions            care_friction[]         default '{}'
qualities            care_quality[]          default '{}'
map_scale            map_scale               (enum, nullable)
latitude             float8
longitude            float8
```

**Note: there is no `source_stories` column.** The current ChallengeForm tries to write to it and will fail.

### `public_resources`
```
id           uuid       NOT NULL   default gen_random_uuid()
title        text       NOT NULL
description  text
type         resource_type NOT NULL   (enum)
url          text
theme        house_theme             (enum, nullable)
published    bool       NOT NULL   default false
created_at   timestamptz NOT NULL
```

**Note: there are no `authors`, `year`, or `field_site` columns.** The current ResourceForm tries to write all three and will fail.

## What to do

All changes are in `src/app/admin/page.tsx` and `src/app/auth/page.tsx`.

### Fix 1 — StoryForm (Insights tab)

Already works. **Leave it alone.** Do not change this form.

### Fix 2 — ChallengeForm (Design challenges tab)

The INSERT is around line ~491. Two problems to fix:

**a) Add a `theme` selector to the form.** The field is required by the DB. Use the same `THEMES` array the StoryForm uses. Default to `"living_room"`. Add it as a `<FormField label="Theme / room">` inside the existing `<FormRow>` where Stage lives, so Stage and Theme sit side-by-side.

**b) Remove `source_stories` from the insert payload.** That column does not exist. Also remove the state (`sourceStories`, `setSourceStories`) and the UI element that lets users pick source stories — the whole "Source stories" multi-select. The `stories` prop passed into `ChallengeForm` is only used for that picker, so remove the prop too, and simplify the call in `ChallengesPanel` from `<ChallengeForm stories={stories} onCreated={load} />` to `<ChallengeForm onCreated={load} />`. Also remove the `stories` state and the second Supabase call in `ChallengesPanel.load()` that fetches them.

After fix, the ChallengeForm INSERT row should look like:
```ts
const row = {
  id: crypto.randomUUID(),
  title: title.trim(),
  body: body.trim(),
  theme,                     // NEW — from the added selector
  stage,
  frictions,
  outcome: outcome.trim() || null,
  published,
  published_at: published ? new Date().toISOString() : null,
  sort_order: 0,
};
```

### Fix 3 — ResourceForm (Resources tab)

The INSERT is around line ~720. Remove three fields that don't exist in the DB:

- Remove `authors` state, the input field for it, and `authors` from the insert row.
- Remove `year` state, the input field for it, and `year` from the insert row.
- Remove `fieldSite` state, the select field for it, and `field_site` from the insert row.

After fix, the ResourceForm INSERT row should look like:
```ts
const row = {
  id: crypto.randomUUID(),
  title: title.trim(),
  description: description.trim() || null,
  type,
  url: url.trim() || null,
  theme: null,
  published,
};
```

### Fix 4 — Add "Forgot password" flow to `/auth`

The `/auth` page currently has password login and a magic-link button but no way to reset a forgotten password. Team members need this because they were invited with a temporary password (`temp_safe_home_2026`) and some of them will need to reset it.

Add a third button below the magic-link button labeled "Forgot password?" that:

1. Takes the email from the `email` state (show the existing "Enter your email first" error if empty).
2. Calls:
   ```ts
   await supabase.auth.resetPasswordForEmail(email, {
     redirectTo: `${window.location.origin}/auth/reset`,
   });
   ```
3. Sets a notice like "Check your email for a password reset link."
4. Handles errors the same way the existing buttons do.

Then create a new page at `src/app/auth/reset/page.tsx` that:

1. Is a client component.
2. Detects the Supabase recovery session (when user clicks the email link, Supabase sets a temporary session and fires a `PASSWORD_RECOVERY` auth event).
3. Shows two password fields (new password + confirm) and a submit button.
4. On submit, calls `supabase.auth.updateUser({ password: newPassword })` and on success redirects to `/admin`.
5. Uses the same visual style as `/auth` (same `Nav`, same max-width, same font stack, same inputStyle).

Style reference: match `/auth/page.tsx` exactly for padding, typography, button styles.

### Fix 5 — Update static wording

In the admin layout at `src/app/admin/layout.tsx`, the top bar currently just says "Admin". Since the tabs are called "Insights / Design challenges / Resources", change the `<h1>` in `src/app/admin/page.tsx` from "Dashboard" to something more specific. Keep it short — "Content editor" works well. The subtitle below it is fine.

## Testing after the fixes

Do not write automated tests. Instead, leave the repo in a state where these manual tests pass:

1. `npm run dev` starts without TypeScript errors.
2. `npm run build` completes without errors.
3. `npm run lint` passes (or only has pre-existing warnings).

Do not try to test the flow against real Supabase — I will do that myself after merge.

## Do not touch

- Do not modify `src/lib/queries.ts`, `src/lib/supabase.ts`, `src/lib/seed-data.ts`, `src/lib/constants.ts`, or `src/lib/types.ts`.
- Do not modify the map page `src/app/explore/page.tsx`.
- Do not modify the frictions, qualities, solutions, or story pages.
- Do not change the Supabase schema. The form must match the DB, not the other way around.
- Do not add new dependencies.
- Do not refactor file structure.

## Commit

When done, stage all changes and create a single commit with message:

```
Fix admin forms to match Supabase schema, add password reset

- ChallengeForm: add required theme selector, remove source_stories
- ResourceForm: remove authors, year, field_site (columns don't exist)
- Auth: add "Forgot password" button and /auth/reset page
- Rename admin heading from "Dashboard" to "Content editor"
```

Do not push. I will review and push manually.
