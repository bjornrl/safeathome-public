INSERT INTO public.welfare_technologies (
    title, description, category, tags, url, image_url,
    manufacturer, country_availability, notes, published, created_by
  ) VALUES
(
      'Pilloxa',
      'Svensk digital helseplattform for oppfølging av pasienter — med særlig fokus på medisinering og etterlevelse av behandling. Helseaktører kan sette opp merkevarede app-programmer med påminnelser, medisininformasjon, oppgaver og opplæringsmateriale. Kan kobles til den smarte medisinesken Pilloxa One, som registrerer når doser tas eller utelates. Støtter norsk språk, og har samarbeidet med Universitetet i Oslo om klinisk validering (ASTORIA-studien) for pasienter med hjerterytmeforstyrrelser.',
      'Helse og medisiner',
      ARRAY['medisinoppfølging', 'app', 'smart pillbox', 'etterlevelse']::text[],
      'https://pilloxa.com/',
      NULL,
      'Pilloxa AB',
      ARRAY['Norge', 'Sverige', 'Norden']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'DigiRehab',
      'Digital plattform for styrketrening og rehabilitering tilpasset eldre — med kartlegging, personlige treningsprogrammer og løpende oppfølging av funksjonsevne. Tilbys som Prehab (forebygging før pleiebehov), Rehab (for hjemmeboende med pleie) og Care (sykehjem). Eldre trener typisk 20 minutter to ganger i uken hjemme sammen med helsepersonell, basert på Helsedirektoratets retningslinjer for styrketrening mot fall. Brukes i norske kommuner som Nesna, Gjerstad og Etnedal, med mål om å utsette pleiebehov og øke selvhjulpenhet.',
      'Helse og medisiner',
      ARRAY['styrketrening', 'rehabilitering', 'prehab', 'fallforebygging', 'senior']::text[],
      'https://digirehab.no/',
      NULL,
      'DigiRehab A/S',
      ARRAY['Norge', 'Danmark']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'KOMP',
      'Skjerm utviklet for eldre og personer med kognitive utfordringer som ønsker enkel kontakt med familie — uten touchskjerm, menyer eller passord. Familien styrer alt via Komp-appen: sender bilder og meldinger, starter videosamtaler som besvares automatisk etter ti sekunder, og setter enheten i hvilemodus om natten. Skjermen har én fysisk knapp (på/av og volum), stor skjerm med god kontrast, og kobles til Wi-Fi eller innebygd 4G. Brukes av over 11 000 eldre og mer enn 130 norske kommuner.',
      'Kontakt og kommunikasjon',
      ARRAY['skjerm', 'video', 'bilder', 'familie', 'enkel teknologi']::text[],
      'https://komp.family/',
      NULL,
      'No Isolation (Komp)',
      ARRAY['Norge']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Nattugla',
      'Intelligent kamerasensor med innebygd AI for digitalt tilsyn i eldreomsorgen — oppdager automatisk hendelser som fall, at brukeren forlater sengen eller rommet, uteblitt vekking eller høy lyd, og varsler helsepersonell ved behov. Ved utløst alarm kan helsepersonell gjøre digitalt tilsyn med krystallklar toveis lyd og bilde direkte på smarttelefonen. Personvernet ivaretas med anonymisering på enheten, ende-til-ende-kryptering og ingen lagring av video i skyen. Godkjent av Norsk Helsenett og integreres med plattformer som Hepro Respons.',
      'Kontakt og kommunikasjon',
      ARRAY['AI', 'digitalt tilsyn', 'hendelsesdeteksjon', 'fall', 'video']::text[],
      'https://nattugla.no/nb/',
      NULL,
      'Nattugla AS',
      ARRAY['Norge', 'Europa']::text[],
      'Ofte plassert under trygghet/digitalt tilsyn — inkludert her også for kommunikasjonsdimensjonen mellom bruker og helsepersonell.',
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Picomed',
      'Norsk leverandør av hjelpemidler og velferdsteknologi til eldre og funksjonshemmede — med salg til kommuner, institusjoner og privatpersoner. Sortimentet omfatter omgivelseskontroll (styring av lys, dør, TV og telefon), varslingssystemer for demens, epilepsi og fall, samt produkter for demensomsorg, søvn og spisevansker. Picomed utvikler og produserer norsk assistiv teknologi fra Gjerstad, og er også distributør av produkter som robotselen Paro og vektprodukter fra Novista.',
      'Kontakt og kommunikasjon',
      ARRAY['hjelpemiddel', 'omgivelseskontroll', 'varsling', 'demens', 'distributør']::text[],
      'https://www.picomed.no/',
      NULL,
      'Picomed AS',
      ARRAY['Norge']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Paro',
      'Terapeutisk robot utformet som en selunge, utviklet i Japan for å skape glede, stimulere sosial kontakt og øke livskvaliteten hos personer med demens eller hjerneskade. Paro reagerer på berøring, tale og lys med bevegelser, lyder og øyebevegelser — og kan virke beroligende, stimulere språk og dempe uro. Distribueres i Norge av Picomed, og bruk krever sertifisering av pleiepersonell. Skal fungere som supplement til menneskelig kontakt, ikke erstatning — og er mest utbredt på demensavdelinger og i dagtilbud.',
      'Kontakt og kommunikasjon',
      ARRAY['robotsel', 'demens', 'terapi', 'sosial robot', 'omsorgsterapi']::text[],
      'https://www.picomed.no/demensomsorg/selen-paro/',
      NULL,
      'PARO Robots (distribuert av Picomed)',
      ARRAY['Norge', 'Japan', 'globalt']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    );