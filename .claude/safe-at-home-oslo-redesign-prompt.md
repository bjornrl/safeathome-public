# safe@home — Redesign til Oslo kommunes designmanual

Paste this into Claude Code with `claude --dangerously-skip-permissions`:

---

## CONTEXT

The safe@home site is a working Next.js application with functional pages: an editorial homepage, a MapLibre map at /explore, a chord diagram at /frictions, narrative columns at /qualities, an insights list, a solutions page, and various static pages. All functionality works.

The task is purely visual: redesign the entire site to follow Oslo kommune's visual identity (designmanual.oslo.kommune.no). **Do not change any functionality, routing, data fetching, or interactive behavior.** Only change CSS, colors, typography, spacing, component styling, and layout to match Oslo kommune's design system.

**Before doing anything, examine the existing codebase.** Look at the Tailwind config, global styles, font imports, color tokens, and component files to understand the current design system. Then systematically replace it.

## OSLO KOMMUNE DESIGN SYSTEM — KEY ELEMENTS

### Typography: Oslo Sans

Oslo Sans is Oslo kommune's custom typeface. It is not available on Google Fonts or CDNs. 

**Approach:** Check if Oslo Sans font files (.woff2, .woff, .ttf) exist anywhere in the project or in /public/fonts/. If not, use this fallback strategy:
1. Create a `public/fonts/` directory
2. Add a comment/TODO noting that Oslo Sans font files need to be obtained from the municipal partners
3. For now, use `"Oslo Sans", "Helvetica Neue", Arial, sans-serif` as the font stack — the system fonts will render cleanly until Oslo Sans is added
4. Set up the @font-face declarations in global CSS ready to activate once the font files arrive:

```css
@font-face {
  font-family: 'Oslo Sans';
  src: url('/fonts/OsloSans-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Oslo Sans';
  src: url('/fonts/OsloSans-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Oslo Sans';
  src: url('/fonts/OsloSans-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}
```

Remove all Source Serif 4 and DM Sans font imports from next/font/google. The entire site uses one font family (Oslo Sans / fallback sans-serif). No serif fonts.

### Color Palette

Replace ALL existing color tokens with Oslo kommune's brand colors:

```
/* Primary brand colors */
--oslo-blue: #2a2859;           /* Dark blue — primary brand, headers, text */
--oslo-blue-light: #6fe9ff;     /* Light blue — accent, highlights */
--oslo-blue-100: #f1fdff;       /* Lightest blue — backgrounds */
--oslo-blue-200: #e5fcff;
--oslo-blue-300: #d1f9ff;
--oslo-blue-500: #b3f5ff;
--oslo-warm-blue: #1f42aa;      /* Warm blue — links, interactive */

--oslo-green: #034b45;          /* Dark green — secondary brand */
--oslo-green-light: #43f8b6;    /* Light green — success, highlights */
--oslo-green-400: #c7fde9;

--oslo-yellow: #f9c66b;         /* Yellow — warning, attention */
--oslo-yellow-light: #ffe7bc;

--oslo-red: #ff8274;            /* Red — error, danger */
--oslo-red-light: #ffdfdc;
--oslo-red-100: #fff2f1;

--oslo-beige-light: #f8f0dd;    /* Light beige — warm backgrounds */
--oslo-beige-dark: #d0bfae;     /* Dark beige — borders, muted */

/* Neutrals */
--oslo-white: #ffffff;
--oslo-gray-100: #f9f9f9;       /* Page background */
--oslo-gray-200: #f2f2f2;       /* Surface background */
--oslo-gray-300: #e6e6e6;
--oslo-gray-400: #cccccc;
--oslo-gray-500: #b3b3b3;
--oslo-gray-600: #9a9a9a;
--oslo-gray-700: #808080;
--oslo-gray-800: #666666;
--oslo-gray-900: #2c2c2c;       /* Body text */
--oslo-black: #000000;
```

### Mapping Old Tokens to New

| Old token | New token | Usage |
|-----------|-----------|-------|
| #F7F5F0 (parchment bg) | #f9f9f9 (oslo-gray-100) | Page background |
| #FFFFFF (surface) | #ffffff (oslo-white) | Card/surface background |
| #EDE9E0 (surface alt) | #f2f2f2 (oslo-gray-200) | Alternate surface |
| #E8E4DB (border) | #e6e6e6 (oslo-gray-300) | Borders |
| #2C2A25 (text) | #2c2c2c (oslo-gray-900) | Body text |
| #7A756B (text muted) | #808080 (oslo-gray-700) | Muted text |
| #A09A8E (text light) | #9a9a9a (oslo-gray-600) | Light text |
| #C45D3E (accent/terracotta) | #2a2859 (oslo-blue) | Primary accent |

### Friction Colors — KEEP THESE

The 7 friction colors are project-specific analytical categories, NOT design system colors. **Keep them exactly as they are:**
```
rotate:    #C45D3E
script:    #5B6AAF
isolate:   #3A8A7D
reduce:    #8B6914
exclude:   #9B59B6
invisible: #D4A017
displace:  #D14343
```

These colors must remain unchanged on:
- Map markers on /explore
- Connection lines between nodes
- Friction pills/badges everywhere
- Chord diagram segments on /frictions

### Quality badge colors — KEEP THESE

Same principle — keep the quality colors as project-specific.

### Design Principles from Oslo Kommune

- **Clean, functional, accessible.** Universell utforming (WCAG AA minimum) is core.
- **No decorative elements** — Oslo's identity is built on three "Osloformer" (square, circle, angle/arrow) used sparingly as graphic elements. Don't overuse them.
- **Spacing uses 8px grid.** All spacing values should be multiples of 8: 8, 16, 24, 32, 40, 48, 56, 64px.
- **Border radius:** Use 4px for small elements (badges, pills), 8px for medium (cards, inputs), 0px for large containers (sections, hero).
- **No shadows or gradients.** Clean flat surfaces. Borders for visual separation.
- **Color is functional, not decorative.** Use the blue for interactive elements, green for success states, red for errors. The beige tones can add warmth to backgrounds.

## WHAT TO CHANGE

### 1. Tailwind Configuration

Update `tailwind.config.ts` (or `.js`) to replace all custom colors with the Oslo palette. Extend with the new color tokens. Remove the old warm parchment palette.

### 2. Global Styles

Update global CSS to:
- Set page background to `#f9f9f9` (not the warm parchment #F7F5F0)
- Set font family to `"Oslo Sans", "Helvetica Neue", Arial, sans-serif`
- Remove all serif font references
- Set base text color to `#2c2c2c`
- Set link color to `#1f42aa` (oslo-warm-blue)
- Add the @font-face declarations (ready for when font files arrive)

### 3. Homepage

- Replace warm terracotta accent (#C45D3E) with Oslo dark blue (#2a2859) for headings and CTAs
- Use Oslo light blue (#6fe9ff or #b3f5ff) for accent highlights
- CTA buttons: dark blue background (#2a2859) with white text, or outlined with dark blue border
- Section backgrounds: alternate between white (#ffffff) and light gray (#f9f9f9)
- The friction and quality grids keep their respective colors (those are content colors, not design colors)

### 4. Navigation

- Header background: white with a subtle bottom border (#e6e6e6)
- Logo/title in dark blue (#2a2859)
- Nav links in dark gray (#2c2c2c), active/hover in warm blue (#1f42aa)
- Clean, minimal, left-aligned logo + right-aligned nav items

### 5. Map Page (/explore)

- Map UI controls (filter panel, story panel, zoom indicator) follow the new design system
- Filter panel: white background, gray borders, Oslo blue for active states
- Story panel: white background, Oslo Sans typography, friction pills keep their colors
- The map itself (MapLibre, basemap, markers) stays exactly the same

### 6. Frictions Page (/frictions)

- Page chrome (header, intro text, story cards below the chart) uses the new design system
- The chord diagram itself keeps its friction colors — those are data visualization colors, not UI colors
- Story cards below: white background, gray border, Oslo Sans text

### 7. Qualities Page (/qualities)

- Column headers and cards use the new design system
- Quality pills keep their original colors (content colors)
- Card styling: white bg, subtle gray border, 8px radius, Oslo Sans

### 8. Solutions Page (/solutions)

- Pipeline visualization: use Oslo blue for the pipeline bar, gray for inactive stages
- Design response cards: white bg, gray border, Oslo Sans
- Stage badges: use Oslo blue tones instead of the old custom colors

### 9. Story Pages (/story/[id])

- Typography: all Oslo Sans, no serif
- Headings in dark blue (#2a2859)
- Body text in dark gray (#2c2c2c), line-height 1.6-1.7
- Friction and quality badges keep their original colors
- Design response section: clean card with gray border

### 10. Footer

- Background: dark blue (#2a2859) with white text
- Or: light gray (#f2f2f2) background with dark text — pick whichever matches the rest of the site better
- "Team login" link stays

### 11. Internal Platform Pages (if visible)

If there are authenticated routes (insights, challenges dashboard, etc.), apply the same design system changes there too. Same typography, same colors, same component styling.

## RULES

- **DO NOT change functionality.** No routing changes, no data fetching changes, no interaction changes. Only visual.
- **DO NOT remove any content.** Same text, same sections, same structure. Just restyle.
- **KEEP friction and quality colors.** These are analytical content colors, not design system colors.
- **Test after each major change.** Run `npm run dev` and verify the build. Check that the map still renders, that the chord diagram still works, that panels still slide in.
- **Remove all serif fonts.** Oslo kommune's identity uses one font family only.
- **Use the 8px spacing grid.** Adjust padding, margins, and gaps to multiples of 8.
- **Accessibility first.** Ensure all text meets WCAG AA contrast ratios against its background. Oslo kommune's identity is grounded in universal design.
- **Mobile responsive.** All changes must work on mobile. Don't break anything.

## FONT FILE NOTE

After running this prompt, you will need to obtain Oslo Sans font files from the municipal partners (Elisabeth Lie Arulnesar at Alna, Lillian Rognstad at Søndre Nordstrand, or Frøydis Straume at Skien) or from Oslo kommune's design team. Place the .woff2 files in `/public/fonts/` with the names referenced in the @font-face declarations. Until then, the site will render in Helvetica Neue / Arial, which is visually close enough for development.
