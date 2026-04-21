# safe@home Public Map Experience — Claude Code Prompt

Paste the following into Claude Code in the safe-at-home-public repo:

---

## PROMPT

Build an interactive, map-based exploration experience for the safe@home research project. The site lets visitors zoom seamlessly from inside a house (micro scale) through the surrounding neighborhood (meso scale) to the city level (macro scale), discovering stories about aging immigrants' experiences with homecare in Norway.

This is a major evolution of the earlier floor-plan concept. The house is now one zoom level in a continuous spatial experience. Connection lines between story nodes — colored by "care friction" type — trace how policy decisions ripple through neighborhoods into bedrooms.

### Stack
- **Framework**: Next.js 14+ with App Router, TypeScript
- **Map engine**: MapLibre GL JS (open-source, no API key needed)
- **3D house**: Three.js with GLB/glTF model loading (placeholder for now, will be replaced)
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion (UI transitions), MapLibre native (map animations)
- **Database**: Supabase (shared backend, unauthenticated read access)
- **Deployment**: Netlify

### Supabase (shared with internal platform — DO NOT modify schema)
```
NEXT_PUBLIC_SUPABASE_URL=https://ditsssyrzjqdnhqxnffx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdHNzc3lyempxZG5ocXhuZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyODcwMzQsImV4cCI6MjA4ODg2MzAzNH0.BHWcpVrsenHjtTHCUUfGZv_SaDS-RqeGmENBXdVi7V0
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

No authentication. All queries filter by `published = true` (enforced by RLS).

---

### THE THREE-VECTOR CONTENT SYSTEM

Every story node is tagged with three dimensions:

**1. Map Scale (WHERE in the zoom) — `map_scale` enum:**
- `micro` — inside the home (objects, rooms, devices)
- `meso` — neighborhood (service points, community spaces, infrastructure)
- `macro` — city (districts, policy institutions, systemic decisions)

**2. Care Frictions (HOW the system fails) — `care_friction` enum, array on each story:**
These are the CONNECTION LINES between nodes. Each friction has a color.
- `rotate` — staff turnover breaks relational continuity → color: #C45D3E (coral)
- `script` — technology/protocols embed wrong assumptions → color: #5B6AAF (indigo)
- `isolate` — care plans sever people from support → color: #3A8A7D (teal)
- `reduce` — complex lives flattened to categories → color: #8B6914 (amber)
- `exclude` — barriers prevent access entirely → color: #9B59B6 (purple)
- `invisible` — care work the system doesn't see → color: #D4A017 (gold)
- `displace` — interventions make people feel less at home → color: #D14343 (red)

**3. Care Qualities (HOW people actually live) — `care_quality` enum, array on each story:**
These are PROPERTIES on nodes (secondary badges/indicators).
- `transnational_flow` — care circulating across borders
- `household_choreography` — daily orchestration of multi-use spaces
- `invisible_labor` — unpaid care by relatives/community
- `cultural_anchoring` — practices sustaining identity
- `adaptive_resistance` — quietly working around services
- `intergenerational_exchange` — bidirectional care old↔young
- `digital_bridging` — technology maintaining connections
- `belonging_negotiation` — tension between here and there

**Connection lines** (`public_connections` table) link two story nodes via a friction. They have a `connection_type`: 'direct' (solid line) or 'indirect' (dashed line).

---

### DATABASE TABLES (already exist — DO NOT create or modify)

**`public_stories`** — story nodes on the map
```
id, title, body, theme (house_theme enum), field_site, 
frictions (care_friction[]), qualities (care_quality[]),
map_scale (map_scale enum), latitude, longitude,
media_urls, author_credit, published, sort_order,
created_at, updated_at
```

**`public_design_responses`** — design intervention nodes
```
id, title, body, theme (house_theme enum),
frictions (care_friction[]), qualities (care_quality[]),
map_scale (map_scale enum), latitude, longitude,
stage, outcome, media_urls, published, sort_order,
created_at, updated_at
```

**`public_connections`** — friction lines between story nodes
```
id, from_story_id, to_story_id, friction (care_friction),
connection_type ('direct' or 'indirect'), description,
published, created_at
```

**`public_resources`** — publications, toolkits, briefs
```
id, title, description, type (resource_type), url, theme, published
```

**`public_pages`** — static editorial pages
```
id, slug (unique), title, body, published
```

---

### THE EXPERIENCE: FOUR STAGES

#### Stage 0: The Door (landing page `/`)

The landing page is a single illustrated door. Slightly ajar, warm light coming from behind it. Minimal text:

- Project title: "safe@home" in Source Serif 4
- Subtitle: "What does it mean to feel safe at home?"
- A single interaction: click the door (or scroll down) to enter

The door opens (CSS/Framer Motion animation — the door swings or the camera pushes forward) and the map experience loads behind it.

**Implementation:** This is a regular Next.js page with Framer Motion. The door is an image or SVG. On click/scroll, animate it out and reveal the map underneath. Use `router.push('/explore')` or a smooth transition to the map page.

#### Stage 1: Micro — Inside the Home (`/explore` at max zoom)

When the map first loads, the user is at the closest zoom level. The map itself is dimmed/hidden, and a **house interior view** fills the center of the screen.

**For v1 (illustrated 2D):**
Place the house illustration (the isometric cutaway image) as a custom MapLibre overlay or a positioned HTML element over the map at the home's geographic coordinates. Story nodes appear as pulsing dots on specific rooms/objects, identical to the earlier prototype. Clicking a node opens the story panel.

**For v2 (3D, future):**
Replace the illustration with a Three.js canvas rendering a GLB model. Use `three-globe` or a custom implementation where the Three.js scene is overlaid at the map coordinates. The camera would orbit the house slightly as the user scrolls.

**Key behavior at this scale:**
- Only `map_scale = 'micro'` nodes are visible
- Nodes are positioned relative to the house (use the `theme` field: bedroom, kitchen, etc.) rather than lat/lng
- The house_theme determines node position within the house layout
- Connection lines from micro nodes going "upward" to meso/macro show as faint lines extending toward the edges of the view, hinting that there's more context above

#### Stage 2: Meso — The Neighborhood (scroll/pinch zoom out)

As the user zooms out, the house shrinks and the neighborhood emerges on the MapLibre map. The illustrated house becomes a small marker or building footprint. New nodes appear:

- GP's office, homecare provider hub, community center, mosque, pharmacy, bus stops
- These are `map_scale = 'meso'` stories positioned at real geographic coordinates
- Connection lines between meso nodes and the home become visible as colored arcs

**Map style at this scale:**
Use a custom MapLibre style that feels warm, not clinical. Mute the standard map colors. Consider a light, parchment-toned basemap (Positron or a custom style). Building footprints visible. Street names legible.

**Key behavior:**
- Micro nodes fade/collapse into the house marker
- Meso nodes appear with entrance animations (Framer Motion or MapLibre's built-in)
- Connection lines render between nodes that are both visible
- Lines are colored by friction type
- The house marker should still be clickable — clicking it zooms back to micro

#### Stage 3: Macro — The City (zoom out further)

At the widest zoom, the full geography is visible. For Oslo: both Alna and Søndre Nordstrand districts. Skien appears if the map extent is wide enough (it's in a different county).

- District boundaries highlighted as polygon overlays
- `map_scale = 'macro'` nodes appear: policy institutions, municipal buildings, reform-related locations
- Connection lines from macro nodes cascade down through meso to micro, showing ripple effects
- Each district contains a cluster indicator showing how many stories/nodes it holds

**Key behavior:**
- Meso nodes cluster or fade
- Macro nodes appear
- Cross-scale connection lines are now fully visible — a line from "Bo Trygt Hjemme reform" (macro) through "Homecare provider deploys new tech" (meso) to "Alarm conflict in bedroom" (micro)
- Clicking a district zooms into that neighborhood

---

### INTERACTIVE FEATURES

#### Friction/Quality Filter Panel

A persistent sidebar or bottom drawer (collapsed by default, expandable) with two sections:

**Frictions** — 7 colored pills. Clicking one:
1. Highlights all connection lines of that friction color (thicker, brighter)
2. Highlights all nodes connected by that friction
3. Dims everything else
4. Shows a brief description of the friction below the pills
5. Multiple frictions can be selected simultaneously

**Qualities** — 8 pills. Clicking one:
1. Highlights all nodes tagged with that quality
2. Dims everything else
3. Shows description

Clicking a friction AND a quality shows the intersection — nodes that have both.

**Clear filter** button resets to showing everything.

#### Story Panel

Clicking any node opens a **slide-in panel** from the right (or bottom on mobile):

- Story title (Source Serif 4, large)
- Map scale badge (micro/meso/macro)
- Friction badges (colored pills)
- Quality badges
- Full body text
- Media gallery if media_urls exist
- Author credit and field site
- **Connected nodes** section: other stories linked via the `public_connections` table, with their friction type. Clicking one pans the map to that node and opens its panel.
- **Design response** section: if a design response shares the same theme and frictions, show it here
- Close button returns to map

#### Map Controls

- Standard MapLibre zoom/pan (scroll wheel, pinch, drag)
- A **zoom level indicator** showing current scale: "Inside the home" / "Neighborhood" / "City" with a subtle vertical bar
- **Home button** — always visible, returns to the house at max zoom
- **Districts dropdown** — jump to Alna, Søndre Nordstrand, or Skien

---

### APP STRUCTURE

```
src/
├── app/
│   ├── layout.tsx                    # Root layout: fonts, metadata
│   ├── page.tsx                      # The Door (landing page)
│   ├── explore/
│   │   └── page.tsx                  # The Map Experience (main page)
│   ├── story/
│   │   └── [id]/
│   │       └── page.tsx              # Direct link to a story (opens map + panel)
│   ├── frictions/
│   │   └── page.tsx                  # Friction index (non-map, editorial)
│   ├── qualities/
│   │   └── page.tsx                  # Quality index (non-map, editorial)
│   ├── reading-room/
│   │   └── page.tsx                  # Publications, papers, briefs
│   ├── for-municipalities/
│   │   └── page.tsx                  # Toolkits and implementation guides
│   ├── about/
│   │   └── page.tsx                  # Project, team, partners
│   └── [slug]/
│       └── page.tsx                  # Dynamic pages from public_pages
├── components/
│   ├── door/
│   │   └── DoorEntry.tsx             # The door animation + transition
│   ├── map/
│   │   ├── MapExplorer.tsx           # Main MapLibre component
│   │   ├── MapControls.tsx           # Zoom indicator, home button, districts
│   │   ├── StoryMarker.tsx           # Individual node on the map
│   │   ├── ConnectionLine.tsx        # Friction-colored line between nodes
│   │   ├── HouseOverlay.tsx          # The house interior at micro zoom
│   │   ├── DistrictBoundary.tsx      # Polygon overlay for districts
│   │   └── ScaleTransition.tsx       # Manages node visibility by zoom level
│   ├── panels/
│   │   ├── StoryPanel.tsx            # Slide-in story detail
│   │   ├── FilterPanel.tsx           # Friction + quality filter sidebar
│   │   └── ZoomIndicator.tsx         # "Inside the home" / "Neighborhood" / "City"
│   ├── content/
│   │   ├── StoryCard.tsx             # Card for listing views
│   │   ├── FrictionBadge.tsx         # Colored friction pill
│   │   ├── QualityBadge.tsx          # Quality pill
│   │   └── ResourceCard.tsx          # Publication/toolkit card
│   ├── layout/
│   │   ├── Header.tsx                # Minimal nav (only visible outside map)
│   │   └── Footer.tsx                # Project info, partners
│   └── ui/
│       ├── Badge.tsx
│       └── MarkdownRenderer.tsx
├── lib/
│   ├── supabase.ts                   # Browser-only client, no auth
│   ├── types.ts                      # TypeScript types for all tables + enums
│   ├── constants.ts                  # See detailed constants below
│   ├── queries.ts                    # Supabase query functions
│   └── map/
│       ├── style.ts                  # Custom MapLibre style configuration
│       ├── layers.ts                 # GeoJSON layer definitions for nodes + lines
│       └── coordinates.ts            # Geographic coords for known locations
└── middleware.ts                      # NOT NEEDED — skip
```

---

### CONSTANTS FILE (lib/constants.ts)

This is critical — all the configuration lives here:

```typescript
// ─── Map Configuration ───
export const MAP_CONFIG = {
  center: [10.8155, 59.8976] as [number, number], // Alna, Oslo
  initialZoom: 19, // Start at micro (house) level
  minZoom: 9,      // City level
  maxZoom: 20,
  // Zoom thresholds for scale transitions
  microToMesoZoom: 17,   // Below this, switch from house to neighborhood
  mesoToMacroZoom: 13,   // Below this, switch from neighborhood to city
};

// ─── District Coordinates ───
export const DISTRICTS = {
  alna: { center: [10.8155, 59.8976], zoom: 14, label: "Alna, Oslo" },
  sondre_nordstrand: { center: [10.7920, 59.8340], zoom: 14, label: "Søndre Nordstrand, Oslo" },
  skien: { center: [9.6089, 59.2094], zoom: 14, label: "Skien, Telemark" },
};

// ─── Care Frictions (connection line colors) ───
export const FRICTIONS = {
  rotate:    { label: "Rotate",    labelNo: "Rotere",        color: "#C45D3E", description: "Staff turnover breaks relational continuity. Trust erodes with every new face." },
  script:    { label: "Script",    labelNo: "Skripte",       color: "#5B6AAF", description: "Technologies and protocols embed assumptions that don't fit diverse households." },
  isolate:   { label: "Isolate",   labelNo: "Isolere",       color: "#3A8A7D", description: "Care plans sever people from family networks and community support systems." },
  reduce:    { label: "Reduce",    labelNo: "Redusere",      color: "#8B6914", description: "Complex cultural identities flattened into medical or bureaucratic categories." },
  exclude:   { label: "Exclude",   labelNo: "Ekskludere",    color: "#9B59B6", description: "Language, digital, and administrative barriers prevent access to services." },
  invisible: { label: "Invisible", labelNo: "Usynliggjøre",  color: "#D4A017", description: "Care work the system doesn't see: family contributions, transnational coordination." },
  displace:  { label: "Displace",  labelNo: "Fortrenge",     color: "#D14343", description: "Care interventions that make people feel less at home in their own homes." },
};

// ─── Care Qualities (node badges) ───
export const QUALITIES = {
  transnational_flow:         { label: "Transnational flow",         labelNo: "Transnasjonal flyt",             color: "#D4A017" },
  household_choreography:     { label: "Household choreography",     labelNo: "Husholdningens koreografi",      color: "#C45D3E" },
  invisible_labor:            { label: "Invisible labor",            labelNo: "Usynlig arbeid",                 color: "#7A756B" },
  cultural_anchoring:         { label: "Cultural anchoring",         labelNo: "Kulturell forankring",           color: "#9B59B6" },
  adaptive_resistance:        { label: "Adaptive resistance",        labelNo: "Adaptiv motstand",               color: "#3A8A7D" },
  intergenerational_exchange: { label: "Intergenerational exchange", labelNo: "Mellomgenerasjonell utveksling", color: "#5B6AAF" },
  digital_bridging:           { label: "Digital bridging",           labelNo: "Digital brobygging",             color: "#378ADD" },
  belonging_negotiation:      { label: "Belonging negotiation",      labelNo: "Tilhørighetsforhandling",        color: "#8B6914" },
};

// ─── Map Scale Labels ───
export const SCALES = {
  micro: { label: "Inside the home", labelNo: "Inne i hjemmet", icon: "🏠" },
  meso:  { label: "Neighborhood",    labelNo: "Nabolaget",       icon: "🏘️" },
  macro: { label: "City",            labelNo: "Byen",            icon: "🏙️" },
};

// ─── House Room Positions (% coords within house overlay) ───
export const HOUSE_HOTSPOTS = [
  { theme: "childrens_room", x: 28, y: 17, label: "Children's room" },
  { theme: "bedroom",        x: 65, y: 17, label: "Bedroom" },
  { theme: "study",          x: 24, y: 35, label: "Study" },
  { theme: "kitchen",        x: 68, y: 37, label: "Kitchen" },
  { theme: "living_room",    x: 38, y: 55, label: "Living room" },
  { theme: "front_door",     x: 14, y: 55, label: "Front door" },
  { theme: "garden",         x: 55, y: 80, label: "Garden" },
  { theme: "phone",          x: 78, y: 56, label: "Phone" },
];
```

---

### SEED CONTENT (hardcoded fallback while database is empty)

Include hardcoded seed data in a `lib/seed-data.ts` file with 10-12 sample story nodes distributed across all three scales, 4-5 connection lines, and room descriptions. Use the stories from our earlier work:

**Micro scale stories (lat/lng at the Alna home location ~59.8976, 10.8155):**
- "The dispenser and the prayer rug" — living_room, frictions: [script, invisible], qualities: [household_choreography, cultural_anchoring]
- "When the alarm doesn't understand family" — bedroom, frictions: [script, displace], qualities: [transnational_flow, household_choreography]
- "A coffee table of care" — living_room, frictions: [reduce, invisible], qualities: [digital_bridging]
- "The invisible care coordinator" — phone, frictions: [invisible, exclude], qualities: [transnational_flow, digital_bridging]

**Meso scale stories (nearby Alna locations):**
- "Twelve faces in three months" — front_door, frictions: [rotate, isolate], qualities: [adaptive_resistance], lat: 59.8970, lng: 10.8140 (homecare provider office)
- "The Thursday bench" — garden, frictions: [invisible], qualities: [cultural_anchoring, invisible_labor], lat: 59.8985, lng: 10.8170 (community center)
- "When 'halal' isn't enough" — kitchen, frictions: [reduce, rotate], qualities: [cultural_anchoring, adaptive_resistance], lat: 59.8965, lng: 10.8160

**Macro scale stories:**
- "Bus route 37 cancelled" — frictions: [isolate, exclude], qualities: [belonging_negotiation], lat: 59.9100, lng: 10.7700
- "Bo Trygt Hjemme reform deploys new tech" — frictions: [script], qualities: [], lat: 59.9139, lng: 10.7522 (Oslo city hall)

**Connections (seed):**
- "Bus route cancelled" → "GP appointment unreachable" → "Missed medication" via friction `isolate` (direct)
- "Reform deploys tech" → "Alarm conflict in bedroom" via friction `script` (indirect)
- "Staff rotation hub" → "Twelve faces" via friction `rotate` (direct)

---

### MAPLIBRE SETUP

**Style:** Use a warm, muted base style. Options:
- MapTiler Positron (light, minimal) — needs free API key from maptiler.com
- Carto Positron via `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json` (free, no key)
- Custom style JSON tweaking colors to match the warm palette

**Recommended:** Use Carto Positron and override colors in the style JSON to make it warmer (tint the water, roads, and building fills toward the parchment palette).

**Layers:**
1. **Story markers** — GeoJSON point layer for each scale level. Use `filter` expressions to show/hide by current zoom level.
2. **Connection lines** — GeoJSON line layer. Each line colored by its friction type. Use `line-dasharray` for 'indirect' connections. Opacity controlled by filter state.
3. **District boundaries** — GeoJSON polygon layer, visible only at macro zoom.
4. **House overlay** — Custom HTML overlay (MapLibre Marker with HTML element) at micro zoom, positioned at the home's coordinates.

**Camera animation:** When transitioning between scales (e.g., clicking a district from macro to zoom into meso), use `map.flyTo()` with a duration of 2-3 seconds for a smooth experience.

---

### DESIGN SYSTEM

```
Palette:
- bg:            #F7F5F0
- surface:       #FFFFFF
- surface-alt:   #EDE9E0
- border:        #E8E4DB
- text:          #2C2A25
- text-muted:    #7A756B
- text-light:    #A09A8E
- accent:        #C45D3E

Fonts (next/font/google):
- Source Serif 4 (400, 400i, 600, 700) — headings, body prose
- DM Sans (400, 500, 600, 700) — UI, navigation, badges

The map should feel warm and editorial, not like a GIS tool.
The story panel should feel like reading long-form journalism.
The filter panel should be minimal and unobtrusive until activated.
```

---

### WHAT NOT TO DO

- Do NOT add authentication — fully public site
- Do NOT modify Supabase tables — they already exist with the correct schema
- Do NOT use Mapbox GL (paid) — use MapLibre GL JS (free, open-source)
- Do NOT use react-map-gl wrapper — use MapLibre directly via `maplibre-gl` npm package for more control
- Do NOT make the map fill 100vh on load — leave room for the door entry animation to transition into it
- Do NOT put the filter panel in a modal — it should be a persistent, collapsible sidebar/drawer
- Do NOT pre-load the Three.js house model in v1 — use the illustrated 2D overlay first, with a clear code boundary where Three.js can be swapped in later

### PACKAGES TO INSTALL

```
maplibre-gl
framer-motion
@supabase/supabase-js
```

Optional for v2 (don't install yet, but structure code to accommodate):
```
three
@react-three/fiber
@react-three/drei
```

### FINAL NOTES

- The app should build and run with `npm run dev`
- Include `.env.local.example`
- The map MUST be interactive on first load — don't gate it behind loading screens
- If Supabase returns no published content, fall back to seed data seamlessly
- The zoom transition between scales should feel continuous, not like switching pages
- Connection lines appearing as you zoom out is the "aha moment" — make it smooth
- Mobile: the map should be touch-friendly. Story panel slides up from bottom instead of right.
- Every story should have a shareable URL: `/story/[id]` that opens the map centered on that node with the panel open
