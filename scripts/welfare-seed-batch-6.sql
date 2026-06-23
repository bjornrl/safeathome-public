INSERT INTO public.welfare_technologies (
    title, description, category, tags, url, image_url,
    manufacturer, country_availability, notes, published, created_by
  ) VALUES
(
      'Hemby',
      'Finsk #agetech-startup (grunnlagt 2018, omdøpt fra Helppy til Hemby i 2025) som tilbyr teknologidrevet hjemmeomsorg og hverdagsassistanse — kobler personer som trenger hjelp med lokale omsorgspersoner via app. Tjenesten gir personlig, fleksibel hjelp hjemme med faste, kjente hjelpere, og en familieportal for pårørende. Opererer i Finland, Tyskland og London. Navnet «Hemby» betyr «hjembygd» på skandinaviske språk.',
      'Hverdagsmestring',
      ARRAY['startup', 'hjemmehjelp', 'omsorg', 'app', 'pårørende']::text[],
      'https://www.hemby.com/en',
      NULL,
      'Hemby Oy (tidligere Helppy)',
      ARRAY['Finland', 'Tyskland', 'Storbritannia']::text[],
      'Ikke etablert i Norge ennå — relevant som eksempel på plattformmodell for lokal hjemmehjelp og pårørendestøtte, snarere enn tradisjonell velferdsteknologi.',
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'FARSEEING',
      'EU-finansiert forskningsprosjekt (2012–2015) som utviklet teknologier for å forebygge, detektere og håndtere fall hos eldre. SINTEF og NTNU testet blant annet en «trygghetsalarm 2.0» — et falldeteksjonsbelte med mobil og fallalgoritme — i Trondheim med eldre fra Byneset og Laugsand. Prosjektet bygde verdens største database over reelle fall registrert med bærbare sensorer, utviklet fallrisikovurderingsverktøyet FRAT-up, og forsket på rehabilitering etter fallskader.',
      'Tjenester rundt hjemmet',
      ARRAY['forskning', 'fall', 'forebygging', 'sensorer', 'rehabilitering']::text[],
      'https://www.sintef.no/en/projects/2012/farseeing/',
      NULL,
      'SINTEF / NTNU (EU-prosjekt)',
      ARRAY['Norge', 'Europa']::text[],
      'Forskningsprosjekt, ikke et kommersielt produkt — relevant som eksempel på norsk forskning som la grunnlag for senere fallteknologi og kommersialisering (f.eks. mHealth Technologies).',
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Phoniro',
      'Svensk pioner innen velferdsteknologi som tilbyr et sammenhengende økosystem med smarte, fysiske løsninger for eldreomsorg. Phoniro Care er en tjenesteplattform med moduler for digital nøkkelhåndtering (150 000 installerte e-låser), tids- og tjenesteoppfølging, trygghetsalarmer (Phoniro 6000), e-tilsyn og analyseverktøy — alt samlet i én database. Brukes i over 200 svenske kommuner og integreres i Norge med TelluCare. Målet er å frigjøre tid til menneskelig omsorg ved å automatisere administrative oppgaver.',
      'Tjenester rundt hjemmet',
      ARRAY['plattform', 'økosystem', 'e-lås', 'trygghetsalarm', 'e-tilsyn']::text[],
      'https://phoniro.com/no/om-phoniro/',
      NULL,
      'Phoniro AB',
      ARRAY['Norge', 'Sverige', 'Norden']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'AddSecure',
      'Europeisk leverandør av sikker IoT-tilkobling og ende-til-ende-løsninger for kritisk alarmkommunikasjon. Smart Care-porteføljen omfatter trygghetsalarmer, GPS-klokker, sensorer og døgnbemannet alarmsentral (ARC) med toveis tale — primært etablert i Finland (200+ kommuner). I Norge leverer AddSecure alarmoverføring, teknisk alarm og IoT-løsninger for bygg, heis og sikkerhetsinstallasjoner. Norsk opprinnelse via Safetel og Securinet (fusjon 2014).',
      'Tjenester rundt hjemmet',
      ARRAY['alarm', 'IoT', 'alarmsentral', 'trygghetsalarm', 'overføring']::text[],
      'https://www.addsecure.com/smart-care-mo-start-page/',
      NULL,
      'AddSecure Group',
      ARRAY['Norge', 'Norden', 'Europa']::text[],
      'Beslektet med Securitas Technology (alarmer og sikkerhet), men separate selskaper — AddSecure fokuserer mer på IoT-kommunikasjon og alarmoverføring, mens Securitas Technology er integrator for pasientvarsling og institusjonsløsninger.',
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Teton.ai',
      'Dansk helsesatsning (grunnlagt 2020) som bruker deep learning og computer vision til autonomt overvåkningssystem for sykehjem og sykehus. Takmonterte optiske sensorer registrerer aktivitet i rommet — søvn, mobilitet, stilling og fallsituasjoner — uten at beboeren bærer utstyr. All bildebehandling skjer lokalt, uten lagring av video, for å ivareta personvern. Gir helsepersonell sanntidsvarsler og langsiktige trenddata for å forebygge fall og effektivisere arbeidsflyt.',
      'Tjenester rundt hjemmet',
      ARRAY['AI', 'computer vision', 'overvåking', 'fall', 'autonom']::text[],
      'https://www.teton.ai/',
      NULL,
      'Teton AI (Danmark)',
      ARRAY['Danmark', 'Europa']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      '9Solutions',
      'Nordens ledende leverandør av sanntidslokalisering (RTLS) og kommunikasjonsløsninger for helse- og omsorgssektoren. Systemet bruker et trådløst Bluetooth-nettverk for romnivå-presisjon av alarmer, personell, pasienter og utstyr — integrert med pasientvarsel, personalsikkerhet og utstyrssporing i ett system. Brukes i over 2 000 helseorganisasjoner i Norden, inkludert 80 % av Finlands universitetssykehus. Tilbyr også løsninger for sykehjem og hjemmeboende omsorg.',
      'Tjenester rundt hjemmet',
      ARRAY['RTLS', 'lokalisering', 'pasientvarsel', 'sykehus', 'sykehjem']::text[],
      'https://www.9solutions.com/en/about-us/rtls',
      NULL,
      '9Solutions Oy (ASSA ABLOY)',
      ARRAY['Finland', 'Sverige', 'Norden']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    );