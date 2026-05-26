# Project Cluster — Recreation Guide

A complete recreation guide for the Project Cluster. It's a single-file component (`ProjectCluster.tsx`, ~850 lines) plus a types/data file (`projectNetworkData.ts`). No third-party physics / graph library — everything is hand-rolled with `requestAnimationFrame` and an SVG overlay.

---

## 1. What it is, conceptually

A full-viewport "constellation" of dots on a beige panel.

- Each **dot** is one project, coloured by its primary category (domain).
- **Lines** between dots show shared categories — they're not based on proximity but on data overlap.
- The whole web **breathes**: every dot drifts on its own sine wave, and lines follow.
- When the cursor gets near a dot, that one dot **snaps to the cursor** and reveals a tooltip. Click it → a dark detail card slides in over the cluster with image carousel, customers, year, methods, contact person.
- A row of **filter pills** along the bottom (one per category) dims everything that doesn't match.

Visually: ~30 projects, beige (`#F5F5E9`) background, dark-green hairlines, 8 distinct domain colours all tuned to clear WCAG AA on beige.

---

## 2. Files & their roles

```
ProjectCluster.tsx       — the component
projectNetworkData.ts    — types, palette, fallback data, helpers
```

Drop them into any `components/` folder. They have **no Sanity / CMS dependency** — the component takes a `projects` prop and falls back to seed data baked into the file if you pass nothing.

External deps:
- `react` (hooks)
- `next/image` (replace with `<img>` if you're not on Next)
- `lucide-react` for `ChevronLeft` / `ChevronRight` (or use any icon)

---

## 3. The data model

The minimum a project needs to render:

```ts
type Project = {
  id: string;
  name: string;
  client: string;
  domain: Domain;            // → colour + filter group
  summary: string;
  featured: boolean;         // featured dots are 2× larger + show name label
  year: number;

  // Optional, used by the detail card and edges
  customers?: string[];
  allCategoryIds?: Domain[]; // ordered; [0] = primary, rest drive secondary edges
  subCategories?: { id: string; label: string; color?: string }[];
  scale?: Scale;
  methods?: Method[];
  heroImageUrl?: string;
  galleryUrls?: string[];
  cardLinks?: { label: string; url: string }[];
  responsible?: { name: string; email?: string; phone?: string; photoUrl?: string };
};
```

The two type unions `Domain | Scale | Method` are just string literals — rename them to your domain ("food", "fashion", whatever). Update three tables in lockstep:

```ts
DOMAIN_COLORS   // hex per domain, must read on your background
DOMAIN_LABELS   // user-facing names
VISIBLE_DOMAINS // ordered array — controls filter-bar order
```

---

## 4. Layout algorithm — Poisson-disk scatter

`dotPositions` (lines ~179–233). For a stable but organic look:

1. Compute a **usable rectangle** inside the container, reserving `padTop` for the section heading and `padBottom` for the filter bar (mobile vs desktop pads differ).
2. Pick a **minimum distance** between dots: `sqrt(area / numProjects) * 0.65`. That keeps density similar across viewport sizes.
3. For each project, try up to 200 random candidate positions, reject any within `minDist` of a placed dot, accept the first survivor. If none survive, use the last candidate (so it never infinite-loops).
4. Random numbers come from a **seeded RNG** (`seededRandom("comte-projects-scatter")`) so the layout is stable across renders — without this the constellation reshuffles on every mount/resize.

Tunables: `padX`, `padTop`, `padBottom`, the `0.65` density factor, and `MAX_ATTEMPTS`.

---

## 5. Edge generation — category overlap, not proximity

`lines` (lines ~250–322). The graph is sparse and data-driven:

- **Primary edge:** two projects share `allCategoryIds[0]` (same domain). Drawn at full opacity.
- **Secondary edge:** they share any *other* category (not the primary). Drawn at 0.4× opacity — these cross between colour clusters.
- Rank all candidate edges (primary first, then by 2D distance as a tie-breaker).
- Greedily add edges; cap each node at `MAX_DEGREE = 4`. Result: ~2N edges total.

This is what makes the picture "read" — within-domain dots form coloured clumps, secondary lines stitch the clumps together loosely.

If you don't want sub-categories at all, just leave `allCategoryIds` undefined — it falls back to `[project.domain]`, and only primary edges render.

---

## 6. The rAF animation loop

`useEffect` at lines ~353–488. This is the heart of the feel. **Everything mutates the DOM directly — no setState per frame.**

Per project, on mount, seed:
```
{ px, py, fx, fy }   // phase x/y, freq x/y in Hz, seeded from project.id
```

Each frame (`tick(now)`):

1. Compute mouse position relative to the section's bounding rect.
2. Loop all dots once to find the **nearest dot** to the cursor.
3. If `nearestDist < SNAP_RADIUS` (110px), only that one dot gets the snap treatment. Everyone else is pure drift. This guarantees one-at-a-time hover (no flickering between adjacent dots).
4. Ramp a per-project `snapFactor` toward 1 (engaged) or 0 (released) at `0.35` per frame — that's the soft "grab/release" feel without slowing tracking once engaged.
5. For each dot:
   - `snapX = (mouseX - anchorX) * snapFactor` (instant tracking when factor = 1)
   - `driftX = sin(2π * fx * t + px) * 6 * (1 - snapFactor)` (drift fades out when snapped)
   - Write `wrapper.style.transform = translate3d(x, y, 0)`.
6. For each line, write the new `x1/y1/x2/y2` attributes using the endpoints' offsets — the lines follow the dots.
7. Push the new hover ID into React state only **on transitions** (not every frame), so the cluster doesn't re-render constantly.

Tunables: `DRIFT_AMP` (6px), `SNAP_RADIUS` / `HOVER_RADIUS` (110px), `SNAP_RAMP` (0.35), the frequency range `0.07–0.13 Hz`.

---

## 7. Pointer events

(lines ~508–539). Subtle but important:

- Uses **native** `pointermove` / `pointerleave` on the section, not React's synthetic `onMouseMove`. The user hit a hardware/browser quirk where synthetic events weren't firing.
- Mouse coords go straight into a **ref** (read every rAF tick). React state is updated at most once per frame via a coalesced `requestAnimationFrame` — protects against 500Hz mice flooding renders.
- On `pointerleave`, park the ref at `(-10000, -10000)` so no dot stays snapped.

---

## 8. The dot button — collapsed hit target

(lines ~711–797). Each dot is **one button**, 44×44px hit area, containing a non-interactive `<span>` for the visible coloured circle (10px normal, 20px featured). The wrapper button is what the rAF loop translates. `pointer-events: none` on the inner span prevents hit-test ambiguity.

Featured projects additionally render a small name label to the right of the dot on desktop.

`dotOpacity` and `scale` react to:
- `activeFilter` (matching domain stays at 1.0, others fade to 0.2)
- `activeProject` (open card → that one stays 1.0, others 0.3)
- `hoveredProject` (hovered → 1.0 + scale 1.8, others 0.4)

---

## 9. The constellation lines

(lines ~655–702). A single `<svg>` covering the section, `pointer-events: none`. One `<line>` per edge. `opacity` is computed in JSX based on `activeFilter / activeProject / hoveredProject` precedence (later overrides earlier), and the actual `x1/y1/x2/y2` come from the rAF loop. Secondary edges always get `× 0.4` opacity on top.

Baseline opacity: `0.10` idle, up to `0.28` when an endpoint is hovered.

---

## 10. The expanded card

`ExpandedProjectCard` (lines ~870–1320). When a dot is clicked, this modal slides in:

- Sits centred over the cluster (`position: absolute, top: 50%, left: 50%, translate(-50%,-50%)`).
- Dark background `#2a2a2a`, max-height `86vh`, internal scroll.
- Image carousel at top, then chips, title, customers/year, summary, scale + method chips, responsible person block, optional links.
- The carousel **parallaxes at 0.5× scroll speed** — image lags the text on internal scroll. Implementation: a separate `parallaxRef` whose `transform` is rewritten on the inner scroller's `scroll` event, coalesced through `requestAnimationFrame`.
- Click outside (the `inset:0, z:25` backdrop) or Escape to close.

The `accent` colour everywhere inside the card is `DOMAIN_COLORS[project.domain]` — that's what makes the card feel of-a-piece with the dot it opened from.

---

## 11. The filter bar

(lines ~594–648). One pill per `VISIBLE_DOMAINS`. 48px tall to match a navbar. Outlined in the domain colour when idle, filled when active. Lowercase, Work Sans, letter-spacing 0.01em. Toggle pattern: clicking the active filter clears it.

---

## 12. Mounting context

In this project, the cluster lives inside a horizontally-scrolling page (`SectionProjects.tsx`):

```tsx
<section className="relative h-svh w-screen flex-shrink-0 overflow-hidden">
  <ProjectCluster projects={projects} backgroundColor="#F5F5E9" heading="Projects" />
</section>
```

It needs:
- A parent with **defined width and height** (the `ResizeObserver` in the component measures `clientWidth/clientHeight` to know where to scatter).
- `position: relative` somewhere up the tree (the component is `position: absolute` everywhere internally).
- `overflow: hidden` if you don't want the off-screen dot drift to spill.

---

## 13. To recreate it in a new project — concrete checklist

1. **Copy both files** into your new project's components folder. Strip the Next-specific bits if needed (`next/image` → `img`).
2. **Rename `Domain`** to your taxonomy. Pick 4–8 categories. Don't go above 8 — the filter bar starts wrapping awkwardly.
3. **Recolor `DOMAIN_COLORS`** against your actual background:
   - Run each colour through a contrast checker against the background → minimum 4.5:1 for the filter labels to be readable.
   - Spread hues wide enough that they're distinguishable as dots (test at 10px).
4. **Update `DOMAIN_LABELS` and `VISIBLE_DOMAINS`**.
5. **Replace `SEED_PROJECTS`** with your own fallback list, or just pass `projects` as a prop and remove the fallback.
6. **Change `FG_DARK` and `BG_CREAM`** to your brand neutrals. `FG_DARK` is the constellation line colour + heading text.
7. **Change the scatter seed string** if you want a different stable layout: `SCATTER_SEED = "your-project-scatter"`.
8. **(Optional) Tune feel**: `DRIFT_AMP`, `SNAP_RADIUS`, `MAX_DEGREE`, density factor `0.65`, padding.
9. **(Optional) Strip the card sections** you don't have data for — `scale/methods/responsible/cardLinks` are all guarded by truthiness checks already.
10. **Test at 375px** — the mobile branch lives in `containerSize.w < 768` and changes padding, hides the featured name labels, and widens the card.

---

## 14. Performance notes worth preserving

- Drift + lines are pure DOM writes, not React state — keep it that way or you'll re-render the whole cluster at 60fps.
- The hover ID *is* React state, but updated only on transitions.
- Mouse state is rAF-coalesced.
- Animations use `transform` and `opacity` only — never `width`/`height`/`top`/`left`.
- `prefers-reduced-motion` is honoured at the bottom of the component (kills the CSS transitions; the rAF drift is so subtle it's usually fine to leave running, but you can early-return from `tick()` if you want to fully respect it).

That's the whole thing. The trickiest parts to get right when porting are (a) ensuring the parent has a measured size before the scatter runs, and (b) re-tuning the colour palette against the new background so the dots, lines, and pill labels all stay legible.
