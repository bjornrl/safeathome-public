-- Curated welfare technology entries for /welfare-tech (admin-managed, public when published).

CREATE TABLE IF NOT EXISTS public.welfare_technologies (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                TEXT NOT NULL,
  description          TEXT NOT NULL,
  category             TEXT,
  tags                 TEXT[],
  url                  TEXT,
  image_url            TEXT,
  manufacturer         TEXT,
  country_availability TEXT[],
  notes                TEXT,
  published            BOOLEAN NOT NULL DEFAULT FALSE,
  created_by           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.welfare_technologies ENABLE ROW LEVEL SECURITY;

-- anon: published rows only (public page)
DROP POLICY IF EXISTS anon_select_published ON public.welfare_technologies;
CREATE POLICY anon_select_published ON public.welfare_technologies
  FOR SELECT TO anon
  USING (published = TRUE);

-- authenticated: see drafts in admin UI
DROP POLICY IF EXISTS auth_select ON public.welfare_technologies;
CREATE POLICY auth_select ON public.welfare_technologies
  FOR SELECT TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS auth_admin_insert ON public.welfare_technologies;
CREATE POLICY auth_admin_insert ON public.welfare_technologies
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS auth_admin_update ON public.welfare_technologies;
CREATE POLICY auth_admin_update ON public.welfare_technologies
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS auth_admin_delete ON public.welfare_technologies;
CREATE POLICY auth_admin_delete ON public.welfare_technologies
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
