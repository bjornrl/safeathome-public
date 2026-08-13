-- Analyselaget: tråder — argumenter under arbeid.
--
-- Plattformen har bare atomære enheter (quick_notes, insights, ressurser).
-- Det som mangler er enheten over: en tese med tilknyttede notater som lever i
-- månedsvis og endrer seg. Uten den bor analysen i et Word-dokument utenfor
-- plattformen, og plattformen forblir arkiv.
--
-- Rent additivt: ingen eksisterende tabell røres, ingen kolonner endres.
-- Reverserbart med DROP TABLE.
--
-- Flat redaksjon: alle innloggede leser, oppretter OG redigerer alt. Ingen
-- roller, ingen godkjenningsledd. Ingen anon-tilgang — dette er internt.

-- ── threads ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.threads (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  -- Selve argumentet slik det står nå. Levende tekst, skrives om underveis.
  summary    TEXT NOT NULL DEFAULT '',
  status     TEXT NOT NULL DEFAULT 'open'
             CHECK (status IN ('open', 'parked', 'landed')),
  -- «Vi står ved denne». Omvendt merking: default-tilstanden (under arbeid)
  -- gjelder nesten alt og bærer derfor ingen informasjon — vi merker bare det
  -- som faktisk er gjennomarbeidet.
  vetted     BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── thread_items ─────────────────────────────────────────────────────────
-- Polymorf kobling (source_type + source_id) i stedet for fire fremmednøkler,
-- slik at én tråd kan blande notater, innsikter, historier og ressurser i én
-- rekkefølge. Prisen er at referanseintegritet ikke kan håndheves av basen;
-- visningen må tåle at en kilde er slettet.
CREATE TABLE IF NOT EXISTS public.thread_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL
              CHECK (source_type IN ('quick_note', 'insight', 'story', 'resource')),
  source_id   UUID NOT NULL,
  -- Én setning: *hvorfor* dette hører til her. Annotasjonen er det analytiske
  -- arbeidet — uten den er tråden en mappe, ikke et argument.
  note        TEXT NOT NULL DEFAULT '',
  position    INT NOT NULL DEFAULT 0,
  added_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (thread_id, source_type, source_id)
);

CREATE INDEX IF NOT EXISTS thread_items_thread_idx
  ON public.thread_items (thread_id, position);

-- ── thread_log ───────────────────────────────────────────────────────────
-- «Tidligere tolkninger». Manuell, ikke automatisk versjonering: full historikk
-- fanger redigeringer, ikke tolkningsskift, og selve funnet — at dere trodde
-- noe annet i mars — drukner i «rettet skrivefeil».
CREATE TABLE IF NOT EXISTS public.thread_log (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
  entry     TEXT NOT NULL,
  logged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS thread_log_thread_idx
  ON public.thread_log (thread_id, logged_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.threads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_log   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS auth_all ON public.threads;
CREATE POLICY auth_all ON public.threads
  FOR ALL TO authenticated
  USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS auth_all ON public.thread_items;
CREATE POLICY auth_all ON public.thread_items
  FOR ALL TO authenticated
  USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS auth_all ON public.thread_log;
CREATE POLICY auth_all ON public.thread_log
  FOR ALL TO authenticated
  USING (TRUE) WITH CHECK (TRUE);

-- ── updated_at ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS threads_set_updated_at ON public.threads;
CREATE TRIGGER threads_set_updated_at
  BEFORE UPDATE ON public.threads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
