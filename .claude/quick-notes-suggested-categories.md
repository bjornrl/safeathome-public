# SAFE@HOME — Prompt 2: Quick Notes + Suggested Categories

## Context
Read the existing codebase and Supabase schema before building. The platform already has an `insights` table. We're adding a lighter-weight `quick_notes` content type and a `suggested_categories` system.

Supabase config:
- URL: https://ditsssyrzjqdnhqxnffx.supabase.co
- Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdHNzc3lyempxZG5ocXhuZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyODcwMzQsImV4cCI6MjA4ODg2MzAzNH0.BHWcpVrsenHjtTHCUUfGZv_SaDS-RqeGmENBXdVi7V0

## Part A: Quick Notes

### Database migrations (run via Supabase MCP or SQL editor)

```sql
-- Quick notes table
CREATE TABLE quick_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  headline TEXT, -- optional
  body TEXT NOT NULL,
  work_package work_package,
  field_site field_site,
  house_themes house_theme[],
  care_frictions care_friction[],
  care_qualities care_quality[],
  map_scale map_scale,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Connections between quick_notes and insights (and quick_notes to quick_notes)
CREATE TABLE note_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_note_id UUID REFERENCES quick_notes(id) ON DELETE CASCADE,
  from_insight_id UUID REFERENCES insights(id) ON DELETE CASCADE,
  to_note_id UUID REFERENCES quick_notes(id) ON DELETE CASCADE,
  to_insight_id UUID REFERENCES insights(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Exactly one "from" and one "to" must be set
  CONSTRAINT one_from CHECK (
    (from_note_id IS NOT NULL)::int + (from_insight_id IS NOT NULL)::int = 1
  ),
  CONSTRAINT one_to CHECK (
    (to_note_id IS NOT NULL)::int + (to_insight_id IS NOT NULL)::int = 1
  )
);

-- Comments on quick notes (the existing comments table is polymorphic — add quick_note support)
-- Check existing comments table structure and add 'quick_note' to the entity_type enum if it exists,
-- or add a note_id column if comments are per-table. Match existing pattern.

-- RLS
ALTER TABLE quick_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users read all quick_notes" ON quick_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authors manage own quick_notes" ON quick_notes FOR ALL TO authenticated USING (auth.uid() = author_id);

ALTER TABLE note_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users read connections" ON note_connections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users create connections" ON note_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
```

### UI: Quick Notes list page (`/internal/notes` or wherever insights live + `/notes` tab)

- Default landing page of the internal platform (i.e. the first tab the user sees after login)
- List of all quick notes, newest first
- Each card shows: author avatar + name, optional headline (or first 60 chars of body if no headline), body preview, tags (frictions, qualities, WP), timestamp, connection count, comment count
- "New Quick Note" button → opens create form

### UI: Create / Edit Quick Note form

**Layout: two-column**

Left column (2/3 width):
- Optional headline input (large, placeholder: "Headline (optional)")
- Mandatory body textarea (placeholder: "Write your note — an idea, a link, an observation...")
- Tag selectors: WP, field site, frictions (multi-select pills), qualities (multi-select pills), house theme, map scale
- "Suggested categories" input (see Part B below)
- Submit button

Right sidebar (1/3 width):
- Heading: "Connect to other notes & insights"
- Search/filter input
- Scrollable list of all insights and quick notes (show title/headline + type badge)
- Each item has a checkbox/toggle — checking it marks it as connected
- On save, creates entries in `note_connections`

### UI: Quick Note detail page

- Author name + avatar + timestamp
- Optional headline (large, editorial)
- Body text (full, with markdown rendering)
- Friction + quality + WP badges
- Suggested category badges (dotted border — see Part B)
- "Connected notes & insights" section — list of connected items with links
- Comments section (same component as on insights, reused)
- Edit button (only for author or admin)

## Part B: Suggested Categories

### Database migration

```sql
CREATE TABLE suggested_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  description TEXT,
  suggested_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Junction tables linking suggestions to content
CREATE TABLE note_suggested_categories (
  note_id UUID REFERENCES quick_notes(id) ON DELETE CASCADE,
  suggestion_id UUID REFERENCES suggested_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, suggestion_id)
);

CREATE TABLE insight_suggested_categories (
  insight_id UUID REFERENCES insights(id) ON DELETE CASCADE,
  suggestion_id UUID REFERENCES suggested_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (insight_id, suggestion_id)
);

ALTER TABLE suggested_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read suggestions" ON suggested_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create suggestions" ON suggested_categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = suggested_by);
```

### UI behavior

In the Quick Note and Insight create/edit forms:
- Below the existing tag selectors, add a "Suggest a new category" input
- Type-ahead searches existing suggestions to avoid duplicates
- Pressing Enter or clicking "Suggest" creates a new `suggested_categories` entry and immediately attaches it to the current note/insight
- On note/insight cards and detail pages, suggested categories appear as badges with **dotted border** instead of solid border
- A subtle label "Suggested" or a dashed style distinguishes them visually
- Admin users see a "Manage suggestions" panel (simple list with approve/reject — approving a suggestion is just a status change; actual enum changes are done manually in the DB)

## Design notes
- Quick Notes feel lighter than insights — smaller form, faster to fill
- The split-panel create form is the key UX: write on the left, connect on the right
- Dotted badges should use the same color system as regular category badges, just with `border-style: dashed` or `border-2 border-dashed`