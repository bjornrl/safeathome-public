INSERT INTO public.welfare_technologies (
    title, description, category, tags, url, image_url,
    manufacturer, country_availability, notes, published, created_by
  ) VALUES
(
      'Hjelpemiddelpartner',
      'Norsk leverandør av hjelpemidler som gjør hverdagen enklere og mer selvstendig for personer med nedsatt funksjonsevne. Utvalget omfatter blant annet Active Up W — et batteridrevet løftesete for rullestol som hjelper brukeren å reise og forflytte seg selv (15 cm løftehøyde) — samt Active Up for bruk i hjemmet, rullestoler og rullatorer, elektrisk tannbørste med sug (Active Oral Clean), og strømpepåtager. Mange produkter kan søkes via NAV Hjelpemiddelsentral; privatkjøp via Velferdsbutikken.no.',
      'Hverdagsmestring',
      ARRAY['hjelpemiddel', 'rullestol', 'løftesete', 'hygiene', 'mobilitet']::text[],
      'https://www.hjelpemiddelpartner.no/',
      NULL,
      'Hjelpemiddelpartner AS',
      ARRAY['Norge']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Varodd Velferdsteknologi',
      'Landsdekkende leverandør av hjelpemidler til helse-Norge siden 1963, med bredt sortiment til hjelpemiddelsentraler, kommuner, sykehjem og sykehus. Tilbyr senger, madrasser, hygienehjelpemidler, personløftere, vendesystemer, rullatorer og annet teknisk utstyr — fra Lindesnes til Honningsvåg. Målet er produkter som gir økt trygghet, livskvalitet og selvhjulpenhet i dagliglivet, og som bidrar til at flere kan bo hjemme lenger.',
      'Hverdagsmestring',
      ARRAY['hjelpemiddel', 'senger', 'madrasser', 'hygiene', 'distributør']::text[],
      'https://hjelpemidler.varodd.no/',
      NULL,
      'Varodd Velferdsteknologi AS',
      ARRAY['Norge']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Abilia',
      'Leverandør med lang erfaring innen hjelpemidler for personer med funksjonsnedsettelser — uavhengig av alder og behov. Produktene hjelper med struktur i hverdagen, kommunikasjon med omgivelsene, styring av funksjoner i hjemmet og varsling ved behov. Sortimentet omfatter kommunikasjon (Grid, talemaskiner), kognisjon og planlegging, omgivelseskontroll, varsling og vektprodukter. Mange løsninger kan søkes via NAV Hjelpemiddelsentral. Abilia overtok Picomed i 2024.',
      'Hverdagsmestring',
      ARRAY['hjelpemiddel', 'kommunikasjon', 'kognisjon', 'omgivelseskontroll', 'varsling']::text[],
      'https://www.abilia.com/nb/vare-hjelpemidler',
      NULL,
      'Abilia AB',
      ARRAY['Norge', 'Sverige', 'Norden']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Guldmann',
      'En av verdens ledende leverandører av løfteløsninger for helsevesenet — takheissystemer, mobile løftere, løfteseler og tilbehør for trygg pasienthåndtering. Brukes i hjemmeboende omsorg, sykehjem, sykehus og rehabilitering for å redusere belastning på pleiere og øke pasientsikkerheten ved forflytning. Guldmann tilbyr også prosjektrådgivning ved installasjon av skinnesystemer i nye og eksisterende bygg.',
      'Hverdagsmestring',
      ARRAY['løft', 'takheis', 'pasienthåndtering', 'ergonomi', 'forflytning']::text[],
      'https://www.guldmann.com/no/',
      NULL,
      'Guldmann AS',
      ARRAY['Norge', 'globalt']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'YetiCare',
      'Finsk helseteknologiløsning med store berøringsskjermer (Yetitablet) og skreddersydde apper for eldre og personer med kognitive eller fysiske funksjonsnedsettelser. Den store skjermen med enkelt brukergrensesnitt (YetiLauncher) inviterer til sosial interaksjon, gruppeaktiviteter, reminisensarbeid og motorisk rehabilitering — tilpasset ulike ferdighetsnivåer. Brukes på sykehjem og omsorgsinstitusjoner i Norge, blant annet ved Sandsli bo- og aktivitetssenter i Bergen. Distribueres i Norge via VilMer.',
      'Hverdagsmestring',
      ARRAY['nettbrett', 'aktivitet', 'rehabilitering', 'stor skjerm', 'eldre']::text[],
      'https://yeticare.fi/no/',
      NULL,
      'YetiCare Oy',
      ARRAY['Norge', 'Finland']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Tessa',
      'Sosial zorgrobot utformet som en liten blomsterpotte — utviklet for personer med kognitiv svikt eller demens som trenger støtte i daglige rutiner. Tessa gir verbale påminnelser og veiledning på faste tidspunkter for mat, medisin, drikke og daglige gjøremål, styrt av pårørende eller helsepersonell via app. Roboten stiller også korte spørsmål om hvordan det går, med svar direkte i appen. Målet er økt selvstendighet og mindre behov for fysisk hjelp i hverdagen.',
      'Hverdagsmestring',
      ARRAY['robot', 'demens', 'selvhjelp', 'påminnelser', 'kognitiv støtte']::text[],
      'https://www.tinybots.nl/zorgrobot-tessa/maak-kennis-met-tessa',
      NULL,
      'Tinybots (Nederland)',
      ARRAY['Nederland', 'Europa']::text[],
      'Primært etablert i Nederland — relevant som eksempel på kognitiv støtte-teknologi, sammenlignbart med struktur- og påminnelsesverktøy i norsk eldreomsorg.',
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    );