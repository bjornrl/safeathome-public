-- Cross-corpus manual links: any research entity → any other entity.
-- Powers the "Koble til andre" sidebar on notes, insights, and resources.

CREATE TABLE IF NOT EXISTS public.entity_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_type   TEXT NOT NULL CHECK (from_type IN ('quick_note', 'insight', 'story', 'resource')),
  from_id     UUID NOT NULL,
  to_type     TEXT NOT NULL CHECK (to_type IN ('quick_note', 'insight', 'story', 'resource')),
  to_id       UUID NOT NULL,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_type, from_id, to_type, to_id),
  CONSTRAINT entity_links_no_self CHECK (NOT (from_type = to_type AND from_id = to_id))
);

CREATE INDEX IF NOT EXISTS entity_links_from_idx ON public.entity_links (from_type, from_id);
CREATE INDEX IF NOT EXISTS entity_links_to_idx ON public.entity_links (to_type, to_id);

ALTER TABLE public.entity_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS entity_links_auth_all ON public.entity_links;
CREATE POLICY entity_links_auth_all ON public.entity_links
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- Backfill from legacy note_connections (directional: from → to).
INSERT INTO public.entity_links (from_type, from_id, to_type, to_id, created_by)
SELECT
  'quick_note',
  nc.from_note_id,
  CASE WHEN nc.to_note_id IS NOT NULL THEN 'quick_note' ELSE 'insight' END,
  COALESCE(nc.to_note_id, nc.to_insight_id),
  nc.created_by
FROM public.note_connections nc
WHERE nc.from_note_id IS NOT NULL
  AND (nc.to_note_id IS NOT NULL OR nc.to_insight_id IS NOT NULL)
ON CONFLICT (from_type, from_id, to_type, to_id) DO NOTHING;

INSERT INTO public.entity_links (from_type, from_id, to_type, to_id, created_by)
SELECT
  'insight',
  nc.from_insight_id,
  CASE WHEN nc.to_note_id IS NOT NULL THEN 'quick_note' ELSE 'insight' END,
  COALESCE(nc.to_note_id, nc.to_insight_id),
  nc.created_by
FROM public.note_connections nc
WHERE nc.from_insight_id IS NOT NULL
  AND (nc.to_note_id IS NOT NULL OR nc.to_insight_id IS NOT NULL)
ON CONFLICT (from_type, from_id, to_type, to_id) DO NOTHING;
