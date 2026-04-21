# safe@home Public Website — Claude Code Setup Prompt

Paste the following into Claude Code in your new cloned repo:

---

## PROMPT

Create a Next.js 14+ app (App Router) for the public-facing website of the "safe@home" research project. This is a **separate site** from the internal research platform, but it reads from the **same Supabase backend**. It requires NO authentication — all content is publicly accessible.

The site's central concept: an **interactive isometric house illustration** serves as the navigational entry point. Visitors click on rooms and objects in the house to explore curated field stories about aging immigrants' experiences with homecare in Norway, alongside the design responses the project has developed.

### Stack
- **Framework**: Next.js 14+ with App Router, TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (shared backend — read-only, no auth)
- **Deployment**: Netlify
- **Animations**: Framer Motion (for page transitions, hotspot pulses, panel slides)

### Supabase Project (shared with internal platform — DO NOT create a new one)
- **URL**: `https://ditsssyrzjqdnhqxnffx.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdHNzc3lyempxZG5ocXhuZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyODcwMzQsImV4cCI6MjA4ODg2MzAzNH0.BHWcpVrsenHjtTHCUUfGZv_SaDS-RqeGmENBXdVi7V0`
- **Region**: eu-north-1 (Stockholm)

Store in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://ditsssyrzjqdnhqxnffx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpdHNzc3lyempxZG5ocXhuZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyODcwMzQsImV4cCI6MjA4ODg2MzAzNH0.BHWcpVrsenHjtTHCUUfGZv_SaDS-RqeGmENBXdVi7V0
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### CRITICAL: This site has NO authentication
- No sign-in, no sign-up, no protected routes
- All Supabase queries use the anon key without auth headers
- RLS policies on the database ensure only `published = true` rows are visible to anon users
- The Supabase client should be a simple browser client with no SSR auth middleware

---

### Database Tables (already exist — DO NOT create or modify)

This site reads from these public content tables:

**`public_stories`** — curated, de-identified field narratives
```
id uuid PK
title text
body text
source_insight_id uuid (nullable, internal reference)
theme house_theme enum
field_site field_site enum (nullable)
media_urls text[]
author_credit text
published boolean
published_at timestamptz
sort_order integer
created_by uuid
created_at timestamptz
updated_at timestamptz
```

**`public_design_responses`** — what the project designed/tested in response
```
id uuid PK
title text
body text
source_challenge_id uuid (nullable, internal reference)
theme house_theme enum
stage text
outcome text
media_urls text[]
published boolean
published_at timestamptz
sort_order integer
created_by uuid
created_at timestamptz
updated_at timestamptz
```

**`public_resources`** — publications, toolkits, policy briefs
```
id uuid PK
title text
description text
type resource_type enum
url text
theme house_theme (nullable)
published boolean
created_at timestamptz
```

**`public_pages`** — static editorial pages
```
id uuid PK
slug text (unique)
title text
body text (markdown)
published boolean
updated_at timestamptz
```

**Enums:**
- `house_theme`: front_door, living_room, kitchen, bedroom, study, childrens_room, garden, phone, prayer_space, bathroom, hallway
- `field_site`: Alna, Søndre Nordstrand, Skien
- `resource_type`: publication, policy_brief, toolkit, practice_guide, teaching_guide

**All queries must filter by `published = true`** — this is enforced by RLS, but be explicit in queries anyway for clarity.

---

### The House Image

Place the house illustration at `public/images/house.png`. For now, use a placeholder image — I will replace it with the actual illustrated house. The image is an isometric cutaway of a house showing all rooms.

The house has these clickable zones (positioned as percentage coordinates over the image):

| Room ID | Label | Position (x%, y%) | Theme Color | Icon |
|---|---|---|---|---|
| `childrens_room` | Children's Room | 28%, 17% | #9B59B6 | 👨‍👩‍👧 |
| `bedroom` | Bedroom | 65%, 17% | #5B6AAF | 🛏️ |
| `study` | Study / Dining | 24%, 35% | #8B6914 | 📋 |
| `kitchen` | Kitchen | 68%, 37% | #3A8A7D | 🍳 |
| `living_room` | Living Room | 38%, 55% | #C45D3E | 🛋️ |
| `front_door` | Front Door | 14%, 55% | #2D6A4F | 🚪 |
| `garden` | Garden | 55%, 80% | #5D8233 | 🌿 |
| `phone` | Phone / Tablet | 78%, 56% | #D4A017 | 📱 |

Each hotspot should:
- Render as a colored, gently pulsing dot (CSS animation) positioned absolutely over the house image
- Show the room label on hover (tooltip above the dot)
- On click, navigate to `/room/[theme]`

Store the hotspot positions, labels, colors, descriptions, and icons in a constants file so they're easy to adjust.

---

### App Structure

```
src/
├── app/
│   ├── layout.tsx                  # Root layout: fonts, nav header, footer
│   ├── page.tsx                    # Landing page with house + hotspots
│   ├── room/
│   │   └── [theme]/
│   │       └── page.tsx            # Themed content space
│   ├── story/
│   │   └── [id]/
│   │       └── page.tsx            # Individual field story (full page)
│   ├── design/
│   │   └── [id]/
│   │       └── page.tsx            # Individual design response (full page)
│   ├── index/
│   │   └── page.tsx                # Super Index: all content, filterable
│   ├── reading-room/
│   │   └── page.tsx                # Publications, papers, policy briefs
│   ├── for-municipalities/
│   │   └── page.tsx                # Implementation toolkits and guides
│   ├── about/
│   │   └── page.tsx                # Project, team, partners, reform context
│   └── [slug]/
│       └── page.tsx                # Dynamic pages from public_pages table
├── components/
│   ├── house/
│   │   ├── HouseExplorer.tsx       # The house image with hotspot overlay
│   │   ├── Hotspot.tsx             # Individual pulsing dot component
│   │   └── RoomLegend.tsx          # Clickable legend below the house
│   ├── content/
│   │   ├── StoryCard.tsx           # Card preview of a field story
│   │   ├── StoryFull.tsx           # Full-page story layout
│   │   ├── DesignResponseCard.tsx  # Card preview of a design response
│   │   ├── DesignResponseFull.tsx  # Full-page design response layout
│   │   └── ResourceCard.tsx        # Publication/toolkit card
│   ├── layout/
│   │   ├── Header.tsx              # Fixed nav: logo, Explore, Reading Room, About
│   │   ├── Footer.tsx              # Project info, partners, credits
│   │   └── BackToHouse.tsx         # Persistent "back to home" navigation element
│   └── ui/
│       ├── Badge.tsx
│       ├── ThemeBadge.tsx          # Room/theme colored badge
│       └── MarkdownRenderer.tsx    # For rendering public_pages body content
├── lib/
│   ├── supabase.ts                 # Browser-only Supabase client (no auth)
│   ├── types.ts                    # TypeScript types for public tables
│   ├── constants.ts                # Room configs, colors, hotspot positions
│   └── queries.ts                  # Reusable Supabase query functions
└── middleware.ts                    # NOT NEEDED — no auth. Skip this file.
```

---

### Page Designs

#### 1. Landing Page (`/`)

The hero of the site. Structure:

**Top**: Headline — "What does it mean to feel *safe at home*?" (Source Serif 4, large, with "safe at home" in terracotta italic)

**Subhead**: "Explore the rooms and objects of a transnational home to discover how aging immigrants in Norway navigate care, technology, and belonging."

**Center**: The house image (max-width ~800px, centered) with pulsing hotspot dots. The image should be responsive and the hotspot positions should scale proportionally.

**Below house**: A row of clickable room pills/chips as an alternative navigation — each showing the room icon and label, colored by theme. Clicking navigates to `/room/[theme]`.

**Footer area**: Brief project description + partner logos.

The house image should feel like the centrepiece — generous whitespace around it, no clutter.

#### 2. Room Page (`/room/[theme]`)

This is the themed content space. It fetches stories and design responses from Supabase filtered by `theme` and `published = true`.

**Layout:**
- **Header section**: Room icon, label, subtitle, and a 2-3 paragraph editorial introduction (store these in constants for now, they'll come from the database later)
- **Field Stories section**: Grid of StoryCards. Each card shows title, body preview (3 lines), field site badge, and author credit. Clicking navigates to `/story/[id]`.
- **Design Responses section**: Grid of DesignResponseCards. Each shows title, stage badge, body preview. Clicking navigates to `/design/[id]`.
- **Related Resources**: Any resources tagged with this theme.
- **Navigation**: "Back to home" link that returns to the landing page. Plus links to adjacent rooms ("Also explore: Kitchen, Front Door").

If no published content exists yet for a theme (the database is currently empty), show an elegant empty state: "Research is underway. Stories from this room will appear as fieldwork progresses." with the room's color accent.

#### 3. Story Page (`/story/[id]`)

Full-page reading experience for a single field story.

- Room/theme badge at top
- Title (large, Source Serif 4)
- Author credit and field site
- Full body text (generous line height, max-width 680px reading column)
- Media gallery if media_urls exist
- "Back to [room name]" navigation
- Related stories from the same theme at bottom

#### 4. Design Response Page (`/design/[id]`)

Similar to story page but with:
- Stage badge (e.g., "Prototyping", "Testing")
- Outcome section if provided
- Link back to the room

#### 5. Super Index (`/index`)

A structured listing of all published content. Filterable by:
- Theme (room pills)
- Content type (stories, design responses, resources)
- Field site

Shows results as a list or grid. This is the "conventional navigation" escape hatch for people who don't want to explore via the house.

#### 6. Reading Room (`/reading-room`)

Grid of ResourceCards filtered by type: publications, policy briefs, teaching guides. Each card shows title, description, type badge, and a link/download button.

#### 7. For Municipalities (`/for-municipalities`)

A dedicated landing page for municipal audiences. Fetches from `public_pages` where slug = 'for-municipalities', plus resources of type 'toolkit' and 'practice_guide'.

#### 8. About (`/about`)

Static page about the project. Fetches from `public_pages` where slug = 'about'. Include sections for:
- Project description
- The team (can be hardcoded initially)
- Partner institutions
- The Bo Trygt Hjemme reform context
- Funding acknowledgement

---

### Design System

```
Palette (warm, editorial, atmospheric):
- bg:            #F7F5F0 (warm parchment)
- surface:       #FFFFFF
- surface-alt:   #EDE9E0
- border:        #E8E4DB
- text:          #2C2A25
- text-muted:    #7A756B
- text-light:    #A09A8E
- accent:        #C45D3E (terracotta)
- accent-light:  #FDF0EC

Room theme colors (use for badges, borders, accents on room pages):
- front_door:      #2D6A4F on #E6F5EC
- living_room:     #C45D3E on #FDF0EC
- kitchen:         #3A8A7D on #E6F3F1
- bedroom:         #5B6AAF on #ECEEF7
- study:           #8B6914 on #FFF8E6
- childrens_room:  #9B59B6 on #F3E8FF
- garden:          #5D8233 on #EEF5E0
- phone:           #D4A017 on #FFF8E6
- prayer_space:    #C45D3E on #FDF0EC
- bathroom:        #3A8A7D on #E6F3F1
- hallway:         #7A756B on #EDE9E0

Fonts (via next/font/google):
- Headings + body prose: Source Serif 4 (400, 400 italic, 600, 700)
- UI elements + navigation: DM Sans (400, 500, 600, 700)

Typography scale:
- Hero headline: 36-42px, Source Serif 4, weight 700
- Page titles: 28px, Source Serif 4, weight 700
- Section headers: 20px, Source Serif 4, weight 600
- Body text: 17px, Source Serif 4, weight 400, line-height 1.75
- Card titles: 16px, Source Serif 4, weight 600
- UI labels: 13px, DM Sans, weight 600
- Captions: 12px, DM Sans, weight 500

Border radius: 6px (small), 10px (default), 14px (large)
Max reading width: 680px for long-form text
```

### UX Principles

- **The house is always home.** Every page should have a clear path back to the floor plan. A subtle "Back to home" element or the logo in the header should always return to `/`.
- **Empty states are first-class.** The database is currently empty. Every page that fetches content should handle zero results gracefully with a warm, informative message — not a blank page or an error.
- **Reading experience matters.** Field stories are long-form narratives. They need generous typography, breathing room, and a calm reading environment. No sidebar, no widgets — just the text.
- **Editorial, not academic.** The tone is closer to a museum exhibition or long-form journalism than a research portal. Design accordingly.
- **Accessibility.** Sufficient color contrast, keyboard navigation on all hotspots, proper heading hierarchy, alt text on the house image describing what it shows.

### Seed Content (hardcoded for now)

Since the database tables are empty, hardcode the room descriptions and a few sample stories in the constants file so the site isn't blank. Use these:

**Bedroom:**
- Description: "The bedroom is where safety technologies meet the most intimate rhythms of daily life. Security alarms, motion sensors, and night monitoring systems are designed for single occupants — but transnational households are fluid."
- Sample story: "When the alarm doesn't understand family" — "Amira is 78 and lives alone in Alna — most of the year. When her daughter visits from Nairobi, the bedroom's motion sensor triggers every night. The alarm treats her as an intruder in her mother's home."

**Living Room:**
- Description: "The living room is where care technologies collide with cultural life. Medicine dispensers sit in rooms that also serve as prayer spaces and video-call studios."
- Sample story: "The dispenser and the prayer rug" — "The automated medicine dispenser was placed in the living room. But this room also serves as the family's prayer area. Five times a day, the dispenser gets moved."

**Kitchen:**
- Description: "The kitchen is where cultural identity meets care protocols. Dietary needs in homecare plans often reduce complex food cultures to medical categories."
- Sample story: "When 'halal' isn't enough" — "Mohammed's care plan says 'halal diet.' His rotating homecare staff interpret this differently each week."

**Front Door:**
- Description: "The front door is where public services meet private life. For aging immigrants, opening the door to care workers involves trust — trust often eroded by rotating staff and cultural misunderstandings."
- Sample story: "Twelve faces in three months" — "Mariam kept a handwritten list by her front door — the names of every homecare worker who had visited since January."

**Phone:**
- Description: "A phone on a table, a tablet propped against a pillow. These are the portals through which transnational care flows — video calls with daughters abroad, voice messages to sons in distant cities."
- Sample story: "The invisible care coordinator" — "Every evening at 7pm, Rashida's daughter calls from Lahore, asking about medication and reminding her about tomorrow's GP appointment."

Include 2-3 more rooms with descriptions. These will be replaced by database content once it's populated.

### What NOT to do
- Do NOT add any authentication — this is a fully public site
- Do NOT create or modify Supabase tables — they already exist
- Do NOT use `@supabase/ssr` — use `@supabase/supabase-js` directly (no server-side auth needed)
- Do NOT over-engineer data fetching — simple client-side queries or server components with direct Supabase calls
- Do NOT add a CMS or admin interface — content is managed through the internal platform

### Final Notes
- The app should build and run with `npm run dev`
- Include `.env.local.example`
- The house hotspot positions WILL need adjustment — make them easy to change in one place
- Use `next/font/google` for font loading
- Add Framer Motion for subtle animations: hotspot pulses, page transitions, panel slides
- The site should feel warm, immersive, and human — like walking into someone's home and hearing their story
