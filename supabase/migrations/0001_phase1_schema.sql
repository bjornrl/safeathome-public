-- Phase 1 schema migration
--
-- Written to be idempotent: re-runs should be safe.
-- RLS on new objects follows the existing public-site pattern:
--   anon  -> SELECT only (filtered by `published = true` where applicable)
--   authenticated -> full CRUD (admin UI)
-- If the existing public_* tables use a different/more specific policy
-- pattern (e.g. role claims), mirror it on the new tables before running.

-- ════════════════════════════════════════════════════════════════
-- 1. public_stories: home-based flag + nullable theme
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.public_stories
  ADD COLUMN IF NOT EXISTS home_based BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill home_based from existing theme assignments before relaxing NOT NULL.
UPDATE public.public_stories
  SET home_based = TRUE
  WHERE theme IS NOT NULL AND home_based = FALSE;

ALTER TABLE public.public_stories
  ALTER COLUMN theme DROP NOT NULL;

-- theme is only allowed when home_based = TRUE.
ALTER TABLE public.public_stories
  DROP CONSTRAINT IF EXISTS public_stories_theme_home_based_chk;
ALTER TABLE public.public_stories
  ADD CONSTRAINT public_stories_theme_home_based_chk
  CHECK (home_based = TRUE OR theme IS NULL);

-- ════════════════════════════════════════════════════════════════
-- 2. public_connections: generic category_kind + category_key
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.public_connections
  ADD COLUMN IF NOT EXISTS category_kind TEXT NOT NULL DEFAULT 'friction';

ALTER TABLE public.public_connections
  DROP CONSTRAINT IF EXISTS public_connections_category_kind_chk;
ALTER TABLE public.public_connections
  ADD CONSTRAINT public_connections_category_kind_chk
  CHECK (category_kind IN ('friction', 'quality'));

ALTER TABLE public.public_connections
  ADD COLUMN IF NOT EXISTS category_key TEXT;

-- Backfill category_key from the legacy friction column.
UPDATE public.public_connections
  SET category_key = friction::text
  WHERE category_key IS NULL;

ALTER TABLE public.public_connections
  ALTER COLUMN category_key SET NOT NULL;

-- NOTE: the legacy `friction` column is intentionally left in place for now.
-- A future phase will drop it once the UI has migrated to category_key.
-- The `connection_type` column (direct/indirect) is also untouched here.

-- ════════════════════════════════════════════════════════════════
-- 3. public_design_responses: qualities as first-class
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.public_design_responses
  ADD COLUMN IF NOT EXISTS qualities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- ════════════════════════════════════════════════════════════════
-- 4. Resource <-> stories / frictions / qualities join tables
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.public_resource_frictions (
  resource_id  UUID NOT NULL REFERENCES public.public_resources(id) ON DELETE CASCADE,
  friction_key TEXT NOT NULL,
  PRIMARY KEY (resource_id, friction_key)
);

CREATE TABLE IF NOT EXISTS public.public_resource_qualities (
  resource_id UUID NOT NULL REFERENCES public.public_resources(id) ON DELETE CASCADE,
  quality_key TEXT NOT NULL,
  PRIMARY KEY (resource_id, quality_key)
);

CREATE TABLE IF NOT EXISTS public.public_resource_stories (
  resource_id UUID NOT NULL REFERENCES public.public_resources(id) ON DELETE CASCADE,
  story_id    UUID NOT NULL REFERENCES public.public_stories(id)   ON DELETE CASCADE,
  PRIMARY KEY (resource_id, story_id)
);

-- ════════════════════════════════════════════════════════════════
-- 5. Category description tables (long-form + examples)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.public_friction_descriptions (
  key              TEXT PRIMARY KEY,
  long_description TEXT NOT NULL DEFAULT '',
  examples         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.public_quality_descriptions (
  key              TEXT PRIMARY KEY,
  long_description TEXT NOT NULL DEFAULT '',
  examples         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keys mirror FRICTIONS / QUALITIES in src/lib/constants.ts.
INSERT INTO public.public_friction_descriptions (key) VALUES
  ('rotate'),
  ('script'),
  ('isolate'),
  ('reduce'),
  ('exclude'),
  ('invisible'),
  ('displace')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.public_quality_descriptions (key) VALUES
  ('transnational_flow'),
  ('household_choreography'),
  ('invisible_labor'),
  ('cultural_anchoring'),
  ('adaptive_resistance'),
  ('intergenerational_exchange'),
  ('digital_bridging'),
  ('belonging_negotiation')
ON CONFLICT (key) DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- 6. Monthly WP progress reports
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.public_wp_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wp_id       TEXT NOT NULL,
  month       DATE NOT NULL,
  summary     TEXT NOT NULL DEFAULT '',
  highlights  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  next_steps  TEXT NOT NULL DEFAULT '',
  interviewer TEXT NOT NULL DEFAULT 'Comte',
  interviewee TEXT,
  published   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (wp_id, month)
);

-- ════════════════════════════════════════════════════════════════
-- 7. Row-level security on new tables
-- ════════════════════════════════════════════════════════════════

ALTER TABLE public.public_resource_frictions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_resource_qualities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_resource_stories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_friction_descriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_quality_descriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_wp_reports             ENABLE ROW LEVEL SECURITY;

-- ── anon: SELECT ──

DROP POLICY IF EXISTS anon_select ON public.public_resource_frictions;
CREATE POLICY anon_select ON public.public_resource_frictions
  FOR SELECT TO anon USING (TRUE);

DROP POLICY IF EXISTS anon_select ON public.public_resource_qualities;
CREATE POLICY anon_select ON public.public_resource_qualities
  FOR SELECT TO anon USING (TRUE);

DROP POLICY IF EXISTS anon_select ON public.public_resource_stories;
CREATE POLICY anon_select ON public.public_resource_stories
  FOR SELECT TO anon USING (TRUE);

DROP POLICY IF EXISTS anon_select ON public.public_friction_descriptions;
CREATE POLICY anon_select ON public.public_friction_descriptions
  FOR SELECT TO anon USING (TRUE);

DROP POLICY IF EXISTS anon_select ON public.public_quality_descriptions;
CREATE POLICY anon_select ON public.public_quality_descriptions
  FOR SELECT TO anon USING (TRUE);

-- wp_reports: anon sees only published rows.
DROP POLICY IF EXISTS anon_select_published ON public.public_wp_reports;
CREATE POLICY anon_select_published ON public.public_wp_reports
  FOR SELECT TO anon USING (published = TRUE);

-- ── authenticated: full CRUD ──

DROP POLICY IF EXISTS auth_all ON public.public_resource_frictions;
CREATE POLICY auth_all ON public.public_resource_frictions
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS auth_all ON public.public_resource_qualities;
CREATE POLICY auth_all ON public.public_resource_qualities
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS auth_all ON public.public_resource_stories;
CREATE POLICY auth_all ON public.public_resource_stories
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS auth_all ON public.public_friction_descriptions;
CREATE POLICY auth_all ON public.public_friction_descriptions
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS auth_all ON public.public_quality_descriptions;
CREATE POLICY auth_all ON public.public_quality_descriptions
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS auth_all ON public.public_wp_reports;
CREATE POLICY auth_all ON public.public_wp_reports
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
