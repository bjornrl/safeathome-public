# safe@home — Four Entry Points + Solutions Page

Paste this into Claude Code with `claude --dangerously-skip-permissions`:

---

## CONTEXT

You are working on the safe@home public site — a Next.js app with a MapLibre map at `/explore`, an insights list at `/insights`, and an editorial homepage at `/`. 

The site currently has two ways to explore insights: the map and the flat list. We're adding two more visual entry points — a chord diagram for frictions and narrative columns for qualities — plus a solutions page for design progress. Together, these create four equal entry points into the same content, each revealing different connections.

**Before writing any code, examine the existing codebase.** Look at what routes, components, types, constants, and seed data already exist. Build on what's there.

## THE FOUR ENTRY POINTS

All four entries lead to the same story pages (`/story/[id]`). Each shows the same underlying data through a different lens.

| Route | Vector | Visual | Question |
|-------|--------|--------|----------|
| `/explore` | Spaces (WHERE) | MapLibre map | Where does this happen? |
| `/frictions` | Care Frictions (HOW it fails) | Chord diagram | How do systemic mechanisms interrelate? |
| `/qualities` | Care Qualities (HOW they live) | Narrative columns | How do people actually live and cope? |
| `/insights` | All | Searchable list | What specific story am I looking for? |

## WHAT TO BUILD

### 1. Frictions page (`/frictions`) — Chord Diagram

Build a D3.js chord diagram showing how the 7 care frictions co-occur across stories.

**Visual concept:**
- 7 friction segments arranged in a circle, each in its friction color
- Arcs (chords) connect frictions that co-occur in the same stories
- Arc thickness = number of stories sharing both frictions
- Hovering a friction segment highlights its arcs and dims everything else
- Clicking an arc shows the specific stories that share those two frictions (as a list below the diagram, or in a panel)
- Clicking a friction segment shows all stories tagged with that friction

**Above the diagram:**
- Page title: "Care frictions" in Source Serif 4
- Subtitle: "Seven ways the system collides with reality"
- Brief intro paragraph explaining what frictions are

**Below the diagram:**
- A results section that updates based on hover/click interaction
- When nothing is selected: show all stories grouped by friction
- When a friction is selected: show stories tagged with that friction
- When an arc is clicked: show stories that share both connected frictions
- Each story appears as a clickable card linking to `/story/[id]`

**Friction data (use from existing constants):**
```
rotate:    #C45D3E — Staff turnover breaks relational continuity
script:    #5B6AAF — Technologies embed assumptions that don't fit
isolate:   #3A8A7D — Care plans sever people from support systems
reduce:    #8B6914 — Complex lives flattened to categories
exclude:   #9B59B6 — Barriers prevent access to services
invisible: #D4A017 — Care work the system doesn't see
displace:  #D14343 — Interventions make people feel less at home
```

**Implementation:**
- Use D3.js for the chord diagram. Install `d3` if not present.
- Build the chord matrix from the seed data: for each pair of frictions, count how many stories share both.
- Make it responsive (SVG viewBox, scales with container).
- The page is a client component (`"use client"`).
- Use existing seed data stories. If Supabase has published content, use that instead.

### 2. Qualities page (`/qualities`) — Narrative Columns

Build a horizontally scrollable column view where each care quality is a column, and stories appear as cards in every column where their quality applies.

**Visual concept:**
- 8 columns, each headed by a quality name in its color, with a one-line description
- Stories appear as cards within each column
- The same story appears in multiple columns if it has multiple qualities (this is the point — showing interconnection)
- Dashed lines or a visual indicator connects the same story across columns
- Scrolls horizontally on desktop, stacks vertically on mobile
- Clicking any story card navigates to `/story/[id]`

**Quality columns (use from existing constants):**
```
Transnational flow — Care circulating across borders
Household choreography — Daily orchestration of multi-use spaces
Invisible labor — Unpaid care by relatives and community
Cultural anchoring — Practices sustaining identity
Adaptive resistance — Quietly working around services
Intergenerational exchange — Bidirectional care between old and young
Digital bridging — Technology maintaining connections
Belonging negotiation — Tension between here and there
```

**Page structure:**
- Title: "Care qualities" in Source Serif 4
- Subtitle: "How people actually live and cope"
- Intro paragraph: "These describe the realities, strategies, and strengths of aging immigrants and their families. Stories appear in every column where a quality is present — the repetition reveals how tightly woven these experiences are."
- The column view (horizontally scrollable container)
- Each column: quality name pill (colored), description, then story cards stacked vertically
- Story cards: title, 2-line body preview, friction badges, field site badge

**Implementation:**
- Pure React + CSS (no D3 needed)
- Horizontal scroll container with `overflow-x: auto`, `scroll-snap-type: x mandatory`
- Each column is `min-width: 320px`, `scroll-snap-align: start`
- On mobile (< 768px): stack columns vertically instead
- Pull from seed data / Supabase

### 3. Solutions page (`/solutions`) — Design Progress

Build a page showing the project's design responses and innovation progress.

**Page structure:**

**Hero section:**
- Title: "Design responses" in Source Serif 4
- Subtitle: "From observation to intervention"
- Intro: "When the research reveals a friction, the design team responds. These are the interventions being developed, tested, and refined — tracing the journey from field observation to practical solution."

**Pipeline overview:**
- A horizontal pipeline visualization showing the 5 stages: Mapping → Ideation → Prototyping → Testing → Implementing
- Each stage shows a count of how many design responses are in that stage
- Colored dots per stage (use the existing challenge status colors)

**Design response cards:**
- Grid of cards, each showing:
  - Title
  - Stage badge (Mapping, Ideation, Prototyping, Testing, Implementing)
  - Description (2-3 lines)
  - Frictions addressed (colored pills)
  - "Based on:" — links to the source stories that inspired this response
  - Outcome text if available
- Clicking a card opens a full page or expands to show details

**Connection to stories:**
- On individual story pages (`/story/[id]`), add a "Design response" section at the bottom
- If a design response shares the same frictions or is explicitly linked, show it: "This friction is being addressed → [link to design response]"
- This creates a two-way connection: stories link to solutions, solutions link back to stories

**Data source:**
- Use `public_design_responses` table from Supabase (filtered by `published = true`)
- Fall back to hardcoded seed data if empty:

```typescript
const SEED_SOLUTIONS = [
  {
    id: "sol-1",
    title: "Guest mode for security alarms",
    description: "Prototyping a configurable setting that adjusts motion sensor sensitivity during family visits, without compromising safety protocols.",
    stage: "prototyping",
    frictions: ["script", "displace"],
    outcome: null,
    source_stories: ["story-2"], // "When the alarm doesn't understand family"
  },
  {
    id: "sol-2",
    title: "Extended dietary care profiles",
    description: "Co-designing care profiles with families that go beyond medical categories — capturing cultural food practices, preferred preparations, and family cooking schedules.",
    stage: "ideation",
    frictions: ["reduce", "rotate"],
    outcome: null,
    source_stories: ["story-6"], // "When halal isn't enough"
  },
  {
    id: "sol-3",
    title: "Family care dashboard for transnational relatives",
    description: "A lightweight interface giving remote family members appropriate visibility into care plans and the ability to contribute observations.",
    stage: "mapping",
    frictions: ["invisible", "exclude"],
    outcome: null,
    source_stories: ["story-3"], // "The invisible care coordinator"
  },
];
```

### 4. Update the homepage

Add the four entry points to the homepage as a prominent section. After the hero and project description, add:

**"Four ways to explore" section:**
- A 2×2 grid (or 4-column on wide screens) with cards for each entry:
  1. **Explore the map** → `/explore` — "Navigate from bedroom to city hall" — teal accent
  2. **Care frictions** → `/frictions` — "How systemic mechanisms interrelate" — purple accent  
  3. **Care qualities** → `/qualities` — "How people actually live and cope" — blue accent
  4. **Design solutions** → `/solutions` — "From observation to intervention" — green accent
- Each card has: icon or small visual, title, one-line description, and is fully clickable

### 5. Update story pages (`/story/[id]`)

If story pages already exist, add:
- A "Design response" section at the bottom (before any footer)
- Shows linked design responses based on shared frictions
- Each response shows: title, stage badge, description, link to `/solutions`
- If no responses are linked, show nothing (don't show an empty section)

### 6. Update navigation

The main nav should now include links to all entry points:
- Explore (map) 
- Frictions (chord diagram)
- Qualities (columns)
- Solutions
- About

## DESIGN SYSTEM

```
Background: #F7F5F0
Surface: #FFFFFF
Surface alt: #EDE9E0
Border: #E8E4DB
Text: #2C2A25
Text muted: #7A756B
Text light: #A09A8E
Accent: #C45D3E

Friction colors:
  rotate: #C45D3E, script: #5B6AAF, isolate: #3A8A7D
  reduce: #8B6914, exclude: #9B59B6, invisible: #D4A017, displace: #D14343

Fonts: Source Serif 4 (headings/prose), DM Sans (UI/labels)
Border radius: 6px / 10px / 14px
```

## PACKAGES

Install if not present:
```
d3
```

Already installed (verify): `maplibre-gl`, `framer-motion`, `@supabase/supabase-js`

## RULES

- **Examine existing code first.** Don't duplicate types, constants, seed data, or components that exist.
- **Don't break existing pages.** The map at `/explore`, the list at `/insights`, and the homepage must keep working.
- **The chord diagram must be interactive.** Hover highlights, click filters. A static image is not acceptable.
- **The columns must show the same story in multiple columns.** That's the entire point — showing how qualities overlap in individual lives.
- **Seed data fallback.** Query Supabase first (`published = true`). If empty, use seed data. This must work offline/without data.
- **Run `npm run dev` and verify after each major component.** Fix errors before moving on.
- **Responsive.** All new pages must work on mobile. Chord diagram scales with container. Columns stack on narrow screens.

## SUPABASE

```
NEXT_PUBLIC_SUPABASE_URL=https://ditsssyrzjqdnhqxnffx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdHNzc3lyempxZG5ocXhuZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyODcwMzQsImV4cCI6MjA4ODYzMDM0fQ.BHWcpVrsenHjtTHCUUfGZv_SaDS-RqeGmENBXdVi7V0
```

Tables to read from (all filtered by `published = true`):
- `public_stories` — stories with frictions[], qualities[], map_scale, lat/lng
- `public_design_responses` — design responses with frictions[], stage, outcome
- `public_connections` — friction lines between stories
- `public_resources` — publications, toolkits
