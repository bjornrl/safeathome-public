-- Publisher / author credit on public resources (reading room + municipal pages).

ALTER TABLE public.public_resources
  ADD COLUMN IF NOT EXISTS authors TEXT;
