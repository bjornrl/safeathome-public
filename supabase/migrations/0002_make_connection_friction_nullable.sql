-- Phase 2 prep: allow legacy friction column to be NULL for
-- quality-based connections. The admin form mirrors category_key into
-- friction only when category_kind = 'friction'; for quality
-- connections, friction is intentionally left NULL.

ALTER TABLE public.public_connections
  ALTER COLUMN friction DROP NOT NULL;
