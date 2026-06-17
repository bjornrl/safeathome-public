-- Add map scale to public resources (same values as quick_notes / stories).

ALTER TABLE public.public_resources
  ADD COLUMN IF NOT EXISTS map_scale TEXT;

ALTER TABLE public.public_resources
  DROP CONSTRAINT IF EXISTS public_resources_map_scale_chk;
ALTER TABLE public.public_resources
  ADD CONSTRAINT public_resources_map_scale_chk
  CHECK (map_scale IS NULL OR map_scale IN ('micro', 'meso', 'macro'));
