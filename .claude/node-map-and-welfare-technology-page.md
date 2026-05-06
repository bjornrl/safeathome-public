# SAFE@HOME — Prompt 3: Node Map + Welfare Technology Page

## Context
Read the existing codebase before building. The platform already has insights (internal), quick_notes (added in Prompt 2), and a MapLibre map on /explore. This prompt adds two new pages.

## Part A: Connected Node Map (`/internal/map` or `/nodes`)

This is an internal-only page (requires auth). It shows all quick notes and insights as a force-directed node graph. Nodes connect when they share one or more categories (frictions, qualities, WP, field site, house theme).

### Tech stack
Use D3.js force simulation (d3-force). The project already uses D3 for the chord diagram — reuse the same import.

### Data
Fetch all quick_notes and insights from Supabase (authenticated). Build connections client-side: two nodes are connected if they share at least one tag value across frictions, care_qualities, work_package, field_site, or house_themes.

### Node appearance
- Circle nodes, radius ~10–16px depending on connection count
- Color by content type: insights = terracotta (#C45D3E), quick notes = indigo (#5B6AAF)
- On hover: show tooltip with title/headline + type + tag count
- On click: open a slide-in panel (same pattern as the story panel on /explore) showing the full note/insight with its tags and connections

### Edge appearance
- Lines between connected nodes
- Line color = the shared category's friction color if the connection is via a friction; neutral gray (#A09A8E) for other shared tags
- Line opacity = 0.4 default, 0.9 on hover of either endpoint

### Controls
- Filter sidebar (collapsible): filter by friction, quality, WP, content type (notes / insights / both)
- "Zoom to fit" button
- Node search: type to highlight matching nodes

### Force simulation settings
- d3.forceLink with distance ~80
- d3.forceManyBody with strength ~-200
- d3.forceCenter at canvas center
- d3.forceCollide radius ~20 to prevent overlap
- Drag enabled on nodes

### No geographic dimension
There is no map here — placement is purely relational/organic based on the force simulation. This is distinct from /explore which is geographic.

## Part B: Welfare Technology page (`/welfare-tech`)

This is a **public** page, but content is **admin-curated** (only admin users can add/edit entries via the internal platform).

### Database migration

```sql
CREATE TABLE welfare_technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT, -- e.g. 'Communication', 'Safety', 'Medication', 'Mobility', 'Monitoring'
  tags TEXT[], -- free-form tags
  url TEXT, -- link to product/resource
  image_url TEXT, -- optional illustration/screenshot
  manufacturer TEXT,
  country_availability TEXT[], -- e.g. ['Norway', 'Denmark']
  notes TEXT, -- curator notes, context for the project
  published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE welfare_technologies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads published" ON welfare_technologies FOR SELECT TO anon USING (published = true);
CREATE POLICY "Auth reads all" ON welfare_technologies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin full access" ON welfare_technologies FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
```

### Public page UI (`/welfare-tech`)

- Page heading: "Velferdsteknologi" / "Welfare Technology"
- Intro paragraph: "A curated overview of welfare technologies relevant to homecare for aging immigrants. Use this as inspiration and reference. To suggest an addition, use the Quick Notes section."
- Filter bar: filter by category (pills)
- Grid of technology cards, each showing:
  - Title
  - Category badge
  - Short description (2–3 sentences)
  - Manufacturer + country availability
  - Curator notes (if any) in a subtle aside style
  - "Learn more" link (if url exists)
  - Optional image/illustration
- No user-generated content on this page — participants are directed to Quick Notes for suggestions

### Internal admin UI

Accessible from the internal platform nav (visible only to admin role). Simple CRUD:
- List of all welfare technologies (published + draft)
- Create / Edit form: all fields above
- Publish toggle
- This does NOT need to be elaborate — a simple form is fine

## Design notes
- The node map should feel like an exploration tool, not a dashboard widget
- Use the existing design tokens throughout
- Welfare tech page should feel curated and editorial — not a product catalog. Warm, sparse, contextual.