INSERT INTO public.welfare_technologies (
    title, description, category, tags, url, image_url,
    manufacturer, country_availability, notes, published, created_by
  ) VALUES
(
      'Hepro',
      'Norsk leverandør av velferdsteknologi til kommuner, helseforetak og institusjoner — med vekt på større selvstendighet for eldre og avlastning for helsepersonell. Tilbyr mobile og stasjonære digitale trygghetsalarmer, pasientvarsling, lokalisering og digitalt tilsyn, samlet i skyplattformen Hepro Respons. Plattformen brukes av over 170 norske kommuner og kan integrere utstyr fra flere leverandører i ett felles grensesnitt.',
      'Trygghet i hjemmet',
      ARRAY['trygghetsalarm', 'plattform', 'digitalt tilsyn', 'pasientvarsling']::text[],
      'https://hepro.no/forside/velferdsteknologi/',
      NULL,
      'Hepro AS',
      ARRAY['Norge']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Tellu',
      'Norsk teknologileverandør som tilbyr høyteknologiske velferdsløsninger samlet i ett komplett økosystem. TelluCare-plattformen knytter trygghetsalarmer, digitalt tilsyn, digital hjemmeoppfølging, medisinstøtte og responssenter sammen i ett brukergrensesnitt — for hjemmeboende, sykehjem og institusjoner. Over 100 norske kommuner bruker løsningene, og plattformen er bygget for integrasjon med nasjonale systemer som VKP og elektronisk pasientjournal.',
      'Tjenester rundt hjemmet',
      ARRAY['plattform', 'økosystem', 'trygghetsalarm', 'digitalt tilsyn', 'responssenter']::text[],
      'https://www.tellu.no/',
      NULL,
      'Tellu AS',
      ARRAY['Norge']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'MiniFinder',
      'GPS-baserte trygghetsløsninger i form av smartklokker og bærbare alarmer, blant annet MiniFinder Watch og MiniFinder Nano. Enhetene har innebygd SOS-knapp, sanntidsposisjonering via GPS og mobilnett, fallalarm og toveis tale — uten at brukeren trenger egen telefon. Leveres til kommuner, hjemmetjenester og private brukere, og administreres via appen MiniFinder Live.',
      'Trygghet i hjemmet',
      ARRAY['GPS', 'trygghetsalarm', 'fallalarm', 'klokke', 'mobil alarm']::text[],
      'https://minifinder.com/no/losninger/omsorg/trygghetsalarm/',
      NULL,
      'MiniFinder AB',
      ARRAY['Norge', 'Sverige']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Zembro',
      'Bærbare trygghetsalarmer for seniorer — som klokke, armbånd eller hengesmykke — med innebygd SIM-kort, GPS-sporing og toveis tale. Ved nødtrykk varsles forhåndsvalgte kontakter eller en alarmsentral, og pårørende kan følge med via app. Tilbys i flere europeiske land; i Norge finnes lignende GPS-baserte trygghetsløsninger fra andre leverandører, men Zembro er et eksempel på denne typen «wearable»-alarm uten behov for egen mobiltelefon.',
      'Trygghet i hjemmet',
      ARRAY['trygghetsalarm', 'GPS', 'armbånd', 'fallalarm', 'bærbart']::text[],
      'https://www.zembro.com/',
      NULL,
      'Zembro (UEST-NV)',
      ARRAY['Europa']::text[],
      'Relevant som eksempel på personlig alarmteknologi — nyttig å sammenligne med norske alternativer som Stella Care og kommunale GPS-løsninger.',
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Doro',
      'Mobiltelefoner utviklet for seniorer og andre som trenger enkel, tydelig kommunikasjon — fra enkle knappetelefoner til smarttelefoner i Aurora-serien. Alle modeller har innebygd Doro Secure-knapp: ett trykk sender alarm med GPS-posisjon til forhåndsvalgte kontakter, etterfulgt av automatisk oppringing. Kan kombineres med Doro 3500, en separat Bluetooth-alarmutløser for håndledd eller hals.',
      'Kontakt og kommunikasjon',
      ARRAY['mobiltelefon', 'trygghetsknapp', 'senior', 'enkel telefon']::text[],
      'https://www.doro.com/nb-no/trygghetsknapp/',
      NULL,
      'Doro AB',
      ARRAY['Norge', 'Sverige', 'Europa']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Sensio',
      'Norsk leverandør og en av Nordens ledende aktører innen velferdsteknologi, med fokus på trygghetssensorer, AI og en samlet plattform for eldreomsorg. Sensio 365 samler alarmer, sensorer og tjenester i ett grensesnitt, mens RoomMate er en passiv multisensor som oppdager fall og muliggjør anonymisert digitalt tilsyn uten at brukeren bærer utstyr. Tilbyr også Safemate trygghetsalarmer, lokaliseringstjenester og digitalt tilsyn — brukt i hjemmetjeneste, omsorgsboliger og sykehjem, deriblant avtale med Oslo kommune fra 2025.',
      'Trygghet i hjemmet',
      ARRAY['plattform', 'RoomMate', 'digitalt tilsyn', 'trygghetsalarm', 'AI', 'sensor']::text[],
      'https://www.sensio.com/no/produkter/sensio-365',
      NULL,
      'Sensio AS',
      ARRAY['Norge', 'Norden']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    );