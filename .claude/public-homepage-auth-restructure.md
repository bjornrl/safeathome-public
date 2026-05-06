# SAFE@HOME — Prompt 1: Public Homepage & Auth Restructure

## Context
Read the existing codebase carefully before making changes. This is a Next.js 14+ App Router project with Supabase auth. The current structure mixes public and authenticated content. We need to cleanly separate them.

## Goal
Make the homepage (`/`) a proper public-facing project site. Move all internal platform content behind `/internal` (or keep existing routes but gate them properly). No user should be forced to log in to see the homepage.

## Changes Required

### 1. New public homepage (`/`)
Replace the current homepage with an editorial project page containing:

**Hero section:**
- Project name: SAFE@HOME
- Tagline: "Tilpasning av kommunale hjemmetjenester for aldrende innvandrere" / "Adapting municipal homecare for aging immigrants"
- Short 2–3 sentence project description
- CTA button: "Utforsk prosjektet" → `/explore`

**About the project:**
- Brief description of the Bo Trygt Hjemme reform context
- The three field sites: Alna (Oslo), Søndre Nordstrand (Oslo), Skien (Telemark)
- Project period: 2026–2029
- Funded by: [placeholder — add when known]

**Work packages section** (4 cards):
- WP1: Homes & Communities — Carolina Rau, UiO
- WP2: Health & Care Institutions — Jonas Debesay, OsloMet
- WP3: Transnational Contexts & Policies — Erika Gubrium, OsloMet
- WP4: Innovation & Service Development — Alejandro Miranda Nieto + Øystein Evensen, OsloMet/Comte Bureau

**Partners section:**
- OsloMet (project lead)
- University of Oslo (UiO)
- Durham University
- Comte Bureau
- Alna District, Oslo
- Søndre Nordstrand District, Oslo
- Skien Municipality

**People section** (grid of team member cards):
Use the 11 provisioned users from the profiles table. Each card: name, institution, role/WP. No email shown publicly.

**Contact section:**
- Project PI: Marit Haldar, OsloMet — mariha@oslomet.no
- Platform/WP4: Øystein Evensen, Comte Bureau — oystein@comte.no

**Footer:**
- Links: About, Explore, For Municipalities, Reading Room
- Discreet "Team login" link → `/login`

### 2. Auth gate for internal platform
All routes under `/internal/*` (or the existing dashboard/insights/challenges routes — check the actual codebase) should:
- Require authentication
- Redirect unauthenticated users to `/login` with a `?redirect=` param
- After login, redirect back to where they came from

The public routes (`/`, `/explore`, `/frictions`, `/qualities`, `/insights`, `/solutions`, `/story/[id]`, `/about`, `/reading-room`, `/for-municipalities`) must remain accessible without login.

### 3. Login page
- Keep existing `/login` page but ensure it:
  - Has a "Back to homepage" link
  - Does NOT show any internal content before auth

### 4. Navigation
- Public nav: Home, Explore, About, For Municipalities, Reading Room, [Team Login button — subtle, secondary style]
- Internal nav (post-login): same public nav + Insights, Quick Notes, Challenges, Node Map, [user avatar/logout]

## Design
Use the existing design system (warm parchment palette, Source Serif 4 + DM Sans). The homepage should feel like a research project or museum exhibition website — editorial, warm, not a SaaS dashboard.

## Do not change
- The /explore map
- The /frictions, /qualities pages
- The Supabase schema (read-only in this prompt)
- Any existing working functionality