# safe@home — Rework: Homepage + Move Map to /explore

Paste this into Claude Code with `claude --dangerously-skip-permissions`:

---

## CONTEXT

You are working on the safe@home public-facing site — a Next.js app with a MapLibre-based exploration experience. The site currently has a map with story markers, connection lines, and a filter panel, but the page structure needs reworking.

**Before doing anything, examine the current codebase.** Look at:
- All routes in `/app`
- All components, especially map-related ones
- The current homepage content
- Any Three.js / 3D model code (GLB loader, custom layers)
- The MapLibre setup and what's working
- The seed data and constants files

## WHAT TO DO

### 1. Remove the glitchy 3D house model

Find and remove all Three.js 3D model rendering code — the GLB loader, the MapLibre CustomLayerInterface for the 3D model, any Three.js camera/lighting setup. This is causing glitches and needs to go.

**Keep everything else about the map:**
- MapLibre map with pan/zoom/tilt
- Story node markers (colored circles by friction)
- Connection lines between nodes
- Story panel slide-in on click
- Friction/quality filter panel
- Seed data fallback

**Do NOT remove:**
- The GLB file from `/public/models/` (keep it for future use)
- The `three` package from package.json (we'll use it later)
- Any map marker or GeoJSON layer code

Just remove the 3D model rendering pipeline so the map works cleanly without it.

### 2. Rework the homepage (`/`)

The homepage should be an editorial project page that explains safe@home and drives visitors to explore the map. It should NOT contain the map or any data visualizations.

**Structure the homepage with these sections, scrolling vertically:**

**Hero section:**
- Headline: "safe@home" in Source Serif 4, large
- Subtitle: "Technologies of care for aging migrants" 
- A short paragraph (2-3 sentences): "What happens when Norway's homecare reform meets the reality of transnational households? This platform maps the experiences of aging immigrants navigating care, technology, and belonging across three scales — from the intimacy of a bedroom to the policies that shape a city."
- A prominent CTA button: "Explore the map →" linking to `/explore`
- Warm background (#F7F5F0), generous whitespace

**About the project section:**
- Headline: "A research platform for the Bo Trygt Hjemme reform"
- 2-3 paragraphs explaining: SAFE@HOME is a collaborative research project (2026-2029) between OsloMet, University of Oslo, Durham University, Comte Bureau, and three municipalities (Alna, Søndre Nordstrand in Oslo, and Skien in Telemark). The project investigates how homecare services can be adapted for Norway's growing aging immigrant population.
- Mention the four work packages briefly:
  - WP1: Homes & Communities — how material spaces and social dynamics shape homecare
  - WP2: Health & Care Institutions — what barriers and enablers shape service access
  - WP3: Transnational Contexts — how cross-border ties affect aging in place
  - WP4: Innovation & Design — co-creating practical solutions with users and municipalities

**The three scales section:**
- Headline: "From bedroom to city hall"
- Visual or text explanation of the three zoom levels:
  - Micro: Inside the home — where care technologies meet daily life
  - Meso: The neighborhood — where services interact with people
  - Macro: The city — where policies ripple into households
- This section should make visitors curious to explore the map

**Care frictions section:**
- Headline: "Seven ways the system collides with reality"
- Show the 7 friction categories as a visual grid or list, each with its color dot and one-sentence description:
  - Rotate (#C45D3E): Staff turnover breaks relational continuity
  - Script (#5B6AAF): Technologies embed assumptions that don't fit
  - Isolate (#3A8A7D): Care plans sever people from support systems
  - Reduce (#8B6914): Complex lives flattened to categories
  - Exclude (#9B59B6): Barriers prevent access to services
  - Invisible (#D4A017): Care work the system doesn't see
  - Displace (#D14343): Interventions make people feel less at home
- Each friction pill could be clickable, linking to `/explore?friction=rotate` etc. (or just display them for now)

**Care qualities section:**
- Headline: "How people actually live and cope"  
- Show the 8 quality categories similarly:
  - Transnational flow, Household choreography, Invisible labor, Cultural anchoring, Adaptive resistance, Intergenerational exchange, Digital bridging, Belonging negotiation
- Brief intro text: "These describe the realities, strategies, and strengths of aging immigrants and their families."

**CTA section (bottom):**
- "Ready to explore?" with a large button to `/explore`
- Links to other pages: About, Reading Room, For Municipalities

**Footer:**
- Partner logos/names: OsloMet, University of Oslo, Durham University, Comte Bureau
- Municipality partners: Alna District, Søndre Nordstrand, Skien Municipality
- Project funding acknowledgment if relevant

### 3. Move the map experience to `/explore`

Take all the current map content (MapLibre map, markers, panels, filters) and make sure it lives at `/explore`. If it's already there, great. If it's currently on the homepage or elsewhere, move it.

The `/explore` page should be:
- Full-screen map (fills viewport below a minimal top bar)
- Minimal top bar: safe@home logo (links to `/`), "← Back to home" link, and maybe the friction filter toggle
- Story panel slides in from the right on marker click
- Filter panel on the left (collapsible)
- All seed data markers visible
- Connection lines rendering between connected nodes

### 4. Navigation

Add a simple, minimal navigation that works across the site:

**On the homepage:** A subtle top bar with the safe@home logo and links to: Explore, About, Reading Room, For Municipalities

**On the /explore page:** A minimal overlay bar — just the logo (links home), a back arrow, and the filter panel toggle. Don't compete with the map for attention.

**On other pages (about, reading-room, etc.):** Same nav as homepage.

### 5. Ensure other pages exist as shells

Make sure these routes exist, even if they're placeholder pages for now:
- `/about` — "About the project" with a paragraph of placeholder text
- `/reading-room` — "Reading Room" placeholder
- `/for-municipalities` — "For Municipalities" placeholder
- `/explore` — the map (fully functional)

## DESIGN TOKENS

Use consistently across all pages:

```
Background: #F7F5F0 (warm parchment)
Surface: #FFFFFF
Surface alt: #EDE9E0
Border: #E8E4DB
Text: #2C2A25
Text muted: #7A756B
Text light: #A09A8E
Accent: #C45D3E (terracotta)

Friction colors:
- rotate: #C45D3E
- script: #5B6AAF
- isolate: #3A8A7D
- reduce: #8B6914
- exclude: #9B59B6
- invisible: #D4A017
- displace: #D14343

Fonts (next/font/google):
- Source Serif 4 (400, 400i, 600, 700) — headings and body prose
- DM Sans (400, 500, 600, 700) — UI, navigation, badges, labels

Border radius: 6px (sm), 10px (md), 14px (lg)
```

## RULES

- **Examine the existing code first.** Don't rebuild what works. Move things, don't recreate them.
- **Don't break the map.** The MapLibre map with markers, lines, filters, and story panels must keep working at `/explore`.
- **Only remove the 3D model rendering code.** Keep everything else about the map intact.
- **The homepage must feel editorial and warm** — like a museum website or a long-form journalism landing page. Not a SaaS dashboard, not a government portal.
- **Run `npm run dev` after each major change** and verify the build. Fix errors before moving on.
- **The homepage sections should use Source Serif 4 for headlines and body text, DM Sans for UI elements and labels.** Keep generous whitespace, especially between sections.
- **Mobile responsive.** The homepage should read well on mobile. The map at `/explore` should be touch-friendly.

## SUPABASE (already configured)

```
NEXT_PUBLIC_SUPABASE_URL=https://ditsssyrzjqdnhqxnffx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdHNzc3lyempxZG5ocXhuZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyODcwMzQsImV4cCI6MjA4ODg2MzAzNH0.BHWcpVrsenHjtTHCUUfGZv_SaDS-RqeGmENBXdVi7V0
```

These should already be in .env.local.
