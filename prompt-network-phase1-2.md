# Prompt: Project Network Map — Phase 1-2 (Living Canvas + Node Identity)

## Context

Comte Bureau is a design consultancy. We're building an interactive project network visualization that shows ~30 projects as nodes connected by organic particle-lines. The visual is inspired by a p5.js generative art sketch (included below) that uses attractors and particles — particles pathfind through attractors by repeatedly lerping toward the nearest unvisited one, creating organic curved paths.

In our version: **attractors = project nodes**, **particles = connection lines between related projects**.

This component will be used in two places:
1. As a full-screen section within the homepage horizontal snap-scroll (teaser — may be non-interactive or simplified)
2. As the main content of the `/projects` page (full interactive version)

For now, build the **full version** as a standalone component. We'll integrate it into both locations afterward.

## Architecture: p5.js canvas + HTML overlay

Use a **hybrid rendering** approach:
- **p5.js canvas** (instance mode): renders the organic particle connection lines and the subtle background animation. This is where the generative art lives.
- **HTML overlay** (absolute-positioned div on top of the canvas): renders project nodes as styled divs, labels, tooltips, and eventually info cards. This keeps text crisp, makes hover/click handling natural with React, and allows CSS transitions.

The canvas and the HTML overlay share the same coordinate system (both fill the same container). Node positions are computed once and shared between both layers — the canvas reads positions to draw lines TO and FROM them, the HTML layer positions the node dots at those coordinates.

## Install p5.js

```bash
npm install p5
```

Also install the types:
```bash
npm install -D @types/p5
```

## File: `src/app/components/ProjectNetwork.tsx`

`"use client"` component.

### Project data

```typescript
type Domain = "health" | "education" | "integration" | "urban" | "climate" | "digital";

type Project = {
  id: string;
  name: string;
  client: string;
  domain: Domain;
  summary: string;
  featured: boolean;
  year: number;
};

const DOMAIN_COLORS: Record<Domain, string> = {
  health:      "#1F3A32",
  education:   "#F27887",
  integration: "#D6B84C",
  urban:       "#5F7C8A",
  climate:     "#4F7C6C",
  digital:     "#FF5252",
};

const DOMAIN_LABELS: Record<Domain, string> = {
  health:      "Health & Care",
  education:   "Education",
  integration: "Integration & Migration",
  urban:       "Urban Development",
  climate:     "Climate & Sustainability",
  digital:     "Digital Transformation",
};
```

Create 30 placeholder projects, ~5 per domain. Make 5-6 of them `featured: true`. Use realistic Norwegian-sounding project names and clients. Here are a few to start — fill in the rest:

```typescript
const PROJECTS: Project[] = [
  { id: "h1", name: "Redesigning Elderly Care Pathways", client: "Trondheim Kommune", domain: "health", summary: "Rethinking how elderly care is coordinated across home services, GPs, and hospitals.", featured: true, year: 2023 },
  { id: "h2", name: "Digital Health Literacy", client: "Helsedirektoratet", domain: "health", summary: "Improving how patients understand and navigate digital health services.", featured: false, year: 2022 },
  { id: "h3", name: "Mental Health Service Mapping", client: "Bergen Kommune", domain: "health", summary: "Mapping the patient journey through municipal mental health services.", featured: false, year: 2021 },
  { id: "h4", name: "Home Care Coordination", client: "Stavanger Kommune", domain: "health", summary: "Streamlining communication between home care workers and families.", featured: false, year: 2023 },
  { id: "h5", name: "Hospital Wayfinding", client: "St. Olavs Hospital", domain: "health", summary: "Redesigning physical and digital wayfinding for a major university hospital.", featured: false, year: 2022 },

  { id: "e1", name: "Student Housing Against Loneliness", client: "SiT Trondheim", domain: "education", summary: "Designing common areas in student housing to reduce loneliness and build community.", featured: true, year: 2023 },
  { id: "e2", name: "Learning Space Innovation", client: "NTNU", domain: "education", summary: "Rethinking university learning spaces for hybrid teaching models.", featured: false, year: 2024 },
  // ... continue for all 6 domains, 5 projects each, total 30
  
  { id: "i1", name: "Humanizing the Asylum Process for Children", client: "UDI / UNE / PU", domain: "integration", summary: "Creating child-friendly services across Norway's immigration authorities.", featured: true, year: 2022 },
  
  { id: "d1", name: "Supporting Vulnerable Young Men", client: "NAV / Trondheim Kommune", domain: "digital", summary: "A new cross-institutional service helping young men in the transition to adulthood.", featured: true, year: 2023 },
  
  { id: "u1", name: "Neighbourhood Identity Mapping", client: "Oslo Kommune", domain: "urban", summary: "Co-creating neighbourhood identities with residents to guide urban planning.", featured: true, year: 2024 },
];
```

### Connection data

Define which projects are connected and why. Each connection has a type:

```typescript
type ConnectionType = "domain" | "method" | "scale" | "theme";

type Connection = {
  from: string;  // project id
  to: string;    // project id
  type: ConnectionType;
};
```

Create ~50-60 connections. Most are `"domain"` (projects in the same domain connect). Add ~15 cross-domain connections of type `"method"`, `"scale"`, or `"theme"` — these are the interesting ones that show how Comte's work bridges domains.

For now, all connection types render the same visually (we'll differentiate line styles in Phase 3). But define the types in the data already.

### Node positioning

On mount, compute positions for all 30 project nodes. Use a **cluster layout with controlled randomness**:

1. Define 6 cluster center points distributed across the container. Use a layout like:
   ```
   // Distribute cluster centers in a loose organic arrangement
   // Avoid perfect symmetry — offset slightly for natural feel
   const clusterCenters: Record<Domain, { x: number; y: number }> = {
     health:      { x: width * 0.2,  y: height * 0.3 },
     education:   { x: width * 0.5,  y: height * 0.2 },
     integration: { x: width * 0.8,  y: height * 0.3 },
     urban:       { x: width * 0.15, y: height * 0.65 },
     climate:     { x: width * 0.5,  y: height * 0.75 },
     digital:     { x: width * 0.82, y: height * 0.68 },
   };
   ```

2. For each project, place it near its domain's cluster center with random offset:
   ```
   // Use project id as seed for consistent positioning
   const spreadRadius = Math.min(width, height) * 0.08;
   x = center.x + seededRandom(id, 0) * spreadRadius;
   y = center.y + seededRandom(id, 1) * spreadRadius;
   ```

3. Use a simple seeded random function based on the project id string so positions are stable across renders:
   ```typescript
   function seededRandom(seed: string, index: number): number {
     let hash = 0;
     const str = seed + index;
     for (let i = 0; i < str.length; i++) {
       hash = ((hash << 5) - hash) + str.charCodeAt(i);
       hash |= 0;
     }
     return (hash % 1000) / 1000; // returns -1 to 1 range
   }
   ```

### Gentle animation (node drift)

Nodes should drift very slowly — almost imperceptibly — to give the map a sense of life. On each frame:
- Each node drifts by a tiny amount (0.02-0.05px per frame) in a direction determined by Perlin noise or a simple sine wave based on time and the node's id
- Nodes stay within a small radius (~20px) of their original computed position
- This is subtle enough that you feel it rather than see it — like stars twinkling

The drift positions are passed to both the p5 canvas (for drawing lines) and the HTML overlay (for positioning node divs) on each animation frame.

### p5.js canvas layer (particle connection lines)

Use p5.js in **instance mode** (not global mode) so it works cleanly in React:

```typescript
import p5 from "p5";

// Inside useEffect:
const sketch = (p: p5) => {
  p.setup = () => {
    p.createCanvas(containerWidth, containerHeight);
    // Initialize particles for each connection
  };
  p.draw = () => {
    p.clear(); // transparent background — HTML behind handles bg color
    // Draw particle paths
  };
};

const p5Instance = new p5(sketch, canvasContainerRef.current);
```

**Particle system per connection:**
For each connection in the connections array, create 10-20 particles. Each particle:
- Starts near the "from" node's current position (with small random offset)
- Lerps toward the "to" node's current position (lerp value ~0.3-0.4)
- Draws a path as it goes (like the original sketch, but with just 2 attractors per particle: from and to)
- The result is organic curved lines flowing between connected nodes

**Line rendering:**
- `p.stroke(r, g, b, opacity)` — use a low opacity (5-15 out of 255)
- `p.noFill()`
- `p.beginShape()` / `p.vertex()` / `p.endShape()` for each particle path
- The many overlapping low-opacity lines create a beautiful organic bundle between connected nodes

**Important:** Call `p.clear()` at the start of each draw (not `p.background()`) so the canvas is transparent and the HTML background shows through.

**Performance:** With 60 connections × 15 particles = 900 particles, each with 2-3 path points, this should run smoothly at 60fps. If not, reduce particles per connection to 8-10.

### HTML overlay layer (nodes, labels, tooltips)

Rendered as React elements positioned absolutely on top of the canvas:

**Node dots:**
- Each project is a `<div>` with `position: absolute`, `border-radius: 50%`
- Regular projects: `width: 10px, height: 10px`
- Featured projects: `width: 20px, height: 20px`
- Background color: the project's domain color
- `transition: transform 0.2s ease-out, opacity 0.3s ease`
- `cursor: pointer`
- Their `left` and `top` values update on each animation frame to match the drift positions (use a ref to update positions without re-rendering React)
- Add a subtle glow/shadow in the domain color: `box-shadow: 0 0 8px [domain-color-at-30%-opacity]`

**Featured project labels:**
- Featured projects have a visible name label next to them
- `var(--font-geist-sans)`, `0.75rem`, `font-weight: 500`, `color: rgba(255,255,255,0.8)`
- Positioned 12px to the right of the dot, vertically centered
- `white-space: nowrap`

**Cluster domain labels:**
- Near each cluster center, render the domain name
- `var(--font-geist-mono)`, `0.6rem`, `letter-spacing: 0.15em`, `text-transform: uppercase`
- `color: rgba(255,255,255,0.25)` — very subtle, almost like a watermark
- Positioned slightly above the cluster center

**Hover tooltip:**
- On node hover, show a tooltip near the cursor (or near the node)
- Contains: project name (white, bold), client name (lighter)
- Background: `rgba(0,0,0,0.85)`, `border: 1px solid rgba(255,255,255,0.15)`
- `border-radius: 8px`, `padding: 8px 12px`
- `pointer-events: none` (so it doesn't interfere with the node hover)
- Fade in with `opacity` transition

**Hover dimming:**
- When hovering a node:
  - The hovered node scales to 1.4x
  - Nodes in the SAME domain brighten to full opacity
  - Nodes in OTHER domains dim to opacity 0.3
  - Connection lines from the hovered node brighten (increase particle opacity to 30-40)
  - Other connection lines dim (reduce opacity to 2-3)
- When not hovering anything, all nodes are at opacity 0.8, all lines at their default opacity

To achieve the line dimming: pass a `highlightedNodeId` (or null) to the p5 draw loop. In draw, check each connection — if either end matches the highlighted node, draw those particles brighter. Otherwise, draw them dimmer.

### Section heading

At the top-left corner of the container:
- Small label: "Our work" — `var(--font-geist-mono)`, `0.7rem`, uppercase, `rgba(255,255,255,0.4)`
- Below it (optional): "30 projects across six domains" — `var(--font-geist-sans)`, `1rem`, `rgba(255,255,255,0.5)`

### Background

The container background is `#212121`. This is set on the HTML container div, which sits behind both the canvas and the node overlay.

### Container sizing

The component accepts an optional `className` or `style` prop for sizing. By default, it fills its parent container (`width: 100%, height: 100%`). The parent controls the dimensions — on the homepage it'll be `100vw × 100svh`, on the /projects page it might be the full viewport minus some header space.

Use a `ResizeObserver` on the container to recalculate node positions and resize the p5 canvas when the container size changes.

## File: `src/app/projects/page.tsx`

Create the /projects page that renders the network map full-screen:

```tsx
"use client";

import ProjectNetwork from "../components/ProjectNetwork";
import BlobNav from "../components/BlobNav";

export default function ProjectsPage() {
  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "#212121",
    }}>
      <BlobNav />
      <ProjectNetwork />
    </div>
  );
}
```

(If BlobNav doesn't exist yet, skip that import and just render ProjectNetwork.)

## Technical requirements

- `"use client"` component
- p5.js in instance mode (NOT global mode)
- Clean up p5 instance in useEffect return function (`p5Instance.remove()`)
- Use refs (not state) for values that change every frame (node positions, highlighted node) to avoid React re-renders at 60fps
- Use state for values that change infrequently (active filters, expanded node — these come in later phases)
- Inline styles (matching codebase convention)
- `will-change: transform` on node divs
- The p5 canvas should have `pointer-events: none` so mouse events pass through to the HTML overlay nodes underneath

## Do NOT build yet (these come in later phases)

- Click-to-expand detail cards (Phase 4)
- Differentiated line styles for connection types (Phase 3)
- Domain filter pills (Phase 5)
- Node expansion into rich cards (Phase 6)
- Mobile responsive layout (Phase 7)

## Success criteria

1. ~30 project dots are visible, color-coded by domain, clustered into 6 organic groups
2. Featured projects are larger with visible name labels
3. Organic particle-lines flow between connected projects (the p5.js generative feel)
4. Nodes drift subtly, giving the map a sense of life
5. Hovering a node shows a tooltip with project name and client
6. Hovering dims unrelated nodes and lines, brightens related ones
7. Domain labels are subtly visible near each cluster
8. The whole thing feels like a living data visualization — generative art meets information design
9. Runs smoothly at 60fps
10. p5.js instance is properly cleaned up on component unmount
