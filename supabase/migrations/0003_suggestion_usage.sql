-- Per-user daily quota for AI suggestion calls (Quick Notes "✦ Suggest").
-- Idempotent.

CREATE TABLE IF NOT EXISTS public.suggestion_usage (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date    DATE NOT NULL DEFAULT CURRENT_DATE,
  count   INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, date)
);

ALTER TABLE public.suggestion_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "suggestion_usage_select_own" ON public.suggestion_usage;
CREATE POLICY "suggestion_usage_select_own"
  ON public.suggestion_usage
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "suggestion_usage_upsert_own" ON public.suggestion_usage;
CREATE POLICY "suggestion_usage_upsert_own"
  ON public.suggestion_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "suggestion_usage_update_own" ON public.suggestion_usage;
CREATE POLICY "suggestion_usage_update_own"
  ON public.suggestion_usage
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Atomic increment via RPC. Lets the server action bump the counter in one
-- round-trip without race conditions, returning the new count.
CREATE OR REPLACE FUNCTION public.increment_suggestion_usage(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  INSERT INTO public.suggestion_usage (user_id, date, count)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET count = public.suggestion_usage.count + 1
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_suggestion_usage(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_suggestion_usage(UUID) TO authenticated;
