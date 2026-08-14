-- Kontaktwidget: meldinger fra besøkende til prosjektledelsen.
--
-- Widgeten ligger nederst til høyre på hver side, også for utloggede. Den er
-- enveis: besøkende sender, svaret kommer på e-post utenfor plattformen.
--
-- Tabellen er den varige kopien. E-postvarselet er best effort — det sendes
-- etter at raden er lagret, slik at et utfall hos e-postleverandøren aldri
-- koster oss en melding.
--
-- Rent additivt: ingen eksisterende tabell røres. Reverserbart med DROP TABLE
-- + DROP FUNCTION.

-- ── contact_messages ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Navn og e-post er valgfrie: terskelen for å si fra skal være lav. Uten
  -- e-post kan vi ikke svare, og widgeten sier det med rene ord.
  name  TEXT CHECK (name  IS NULL OR char_length(name)  <= 120),
  email TEXT CHECK (email IS NULL OR char_length(email) <= 254),

  -- Selve meldingen. Øvre grense er en beskyttelse mot søppel, ikke en
  -- redaksjonell begrensning — 4000 tegn er romslig for et spørsmål.
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 2 AND 4000),

  -- Konteksten meldingen ble sendt fra. Uvurderlig når noen skriver «denne
  -- siden virker ikke» uten å si hvilken.
  page_path TEXT CHECK (page_path IS NULL OR char_length(page_path) <= 300),
  lang      TEXT CHECK (lang IS NULL OR lang IN ('no', 'en')),

  -- Satt automatisk hvis avsenderen tilfeldigvis er innlogget.
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Saltet hash av IP-adressen, aldri adressen selv: nok til å telle
  -- innsendinger per døgn, ikke nok til å identifisere en person.
  ip_hash TEXT CHECK (ip_hash IS NULL OR char_length(ip_hash) <= 64),

  status TEXT NOT NULL DEFAULT 'new'
         CHECK (status IN ('new', 'read', 'archived')),

  -- Når e-postvarselet faktisk gikk ut. NULL betyr «ligger her, men du fikk
  -- aldri mail» — den tilstanden må være synlig, ikke gjettes.
  notified_at TIMESTAMPTZ
);

-- Rate limiting slår opp på (ip_hash, created_at) ved hver innsending.
CREATE INDEX IF NOT EXISTS contact_messages_ip_hash_created_at_idx
  ON public.contact_messages (ip_hash, created_at DESC);

-- Innboksvisning: nyeste ubehandlede først.
CREATE INDEX IF NOT EXISTS contact_messages_status_created_at_idx
  ON public.contact_messages (status, created_at DESC);

-- Den globale timeskvoten teller på created_at alene, og kan ikke bruke
-- indeksen over fordi status står først i den.
CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
  ON public.contact_messages (created_at DESC);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Flat redaksjon, som for threads: alle innloggede leser og behandler alt.
DROP POLICY IF EXISTS "contact_messages_select_authenticated" ON public.contact_messages;
CREATE POLICY "contact_messages_select_authenticated"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "contact_messages_update_authenticated" ON public.contact_messages;
CREATE POLICY "contact_messages_update_authenticated"
  ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

-- Ingen INSERT-policy, med vilje. Anonyme skriver utelukkende gjennom RPC-en
-- under, som håndhever kvote og trimming. En direkte PostgREST-insert ville
-- gått utenom begge.
--
-- MERK om trusselbildet: RPC-en må være anon-kjørbar for at utloggede skal
-- kunne sende, og anon-nøkkelen ligger åpent i klienten. Den kan altså kalles
-- direkte, utenom honningkrukken og tidssjekken i server-handlingen, med en
-- oppdiktet p_ip_hash per kall. Døgnkvoten per avsender beskytter derfor den
-- normale veien; det er timeskvoten under som begrenser skadeomfanget hvis
-- noen kaller RPC-en direkte. Vil man stenge døra helt, må EXECUTE trekkes
-- fra anon og server-handlingen bruke service_role-nøkkelen — det ville gjøre
-- den nøkkelen til en påkrevd produksjonshemmelighet, noe prosjektet så langt
-- har unngått (se .env.local.example).

-- ── submit_contact_message ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_contact_message(
  p_body      TEXT,
  p_name      TEXT DEFAULT NULL,
  p_email     TEXT DEFAULT NULL,
  p_page_path TEXT DEFAULT NULL,
  p_lang      TEXT DEFAULT NULL,
  p_ip_hash   TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_body TEXT := btrim(COALESCE(p_body, ''));
  recent     INTEGER;
  new_id     UUID;
BEGIN
  IF char_length(clean_body) < 2 THEN
    RAISE EXCEPTION 'empty_body' USING ERRCODE = 'check_violation';
  END IF;

  -- Døgnkvote per avsender. Uten ip_hash (ukjent IP bak en proxy) slipper vi
  -- meldingen gjennom: heller en melding for mye enn å avvise en ekte
  -- henvendelse fordi vi ikke klarte å plassere den.
  IF p_ip_hash IS NOT NULL THEN
    SELECT COUNT(*) INTO recent
      FROM public.contact_messages
     WHERE ip_hash = p_ip_hash
       AND created_at > NOW() - INTERVAL '24 hours';

    IF recent >= 10 THEN
      RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Global timeskvote. Taket over p_ip_hash kan omgås av den som kaller
  -- RPC-en direkte og finner på en ny hash per kall; dette taket kan ikke
  -- omgås, for det teller rader og ikke avsendere. 60 i timen ligger langt
  -- over reell trafikk på et forskningsnettsted, så det binder aldri en ekte
  -- henvendelse — det setter bare en øvre grense for hvor mye søppel som kan
  -- havne i innboksen din i løpet av en time.
  SELECT COUNT(*) INTO recent
    FROM public.contact_messages
   WHERE created_at > NOW() - INTERVAL '1 hour';

  IF recent >= 60 THEN
    RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.contact_messages
    (name, email, body, page_path, lang, user_id, ip_hash)
  VALUES
    (NULLIF(btrim(COALESCE(p_name, '')), ''),
     NULLIF(btrim(COALESCE(p_email, '')), ''),
     left(clean_body, 4000),
     p_page_path,
     p_lang,
     auth.uid(),
     p_ip_hash)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_contact_message(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_contact_message(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ── mark_contact_message_notified ────────────────────────────────────────
-- Kalles av server-handlingen rett etter at e-posten er sendt. Id-en er en
-- ufalskbar UUID som bare den som nettopp sendte meldingen har sett, og
-- vinduet er to minutter — en fremmed kan ikke merke andres meldinger.
CREATE OR REPLACE FUNCTION public.mark_contact_message_notified(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.contact_messages
     SET notified_at = NOW()
   WHERE id = p_id
     AND notified_at IS NULL
     AND created_at > NOW() - INTERVAL '2 minutes';
END;
$$;

REVOKE ALL ON FUNCTION public.mark_contact_message_notified(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_contact_message_notified(UUID) TO anon, authenticated;
