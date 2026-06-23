INSERT INTO public.welfare_technologies (
    title, description, category, tags, url, image_url,
    manufacturer, country_availability, notes, published, created_by
  ) VALUES
(
      'Sensorem',
      'Privat trygghetsalarm i form av GPS-klokke med innebygd SIM-kort, SOS-knapp og toveis tale via høyttalertelefon. Ved alarm varsles pårørende med GPS-posisjon via app og SMS, og dersom ingen svarer, kobles anropet til Sensorems døgnåpne alarmsentral. Fungerer overalt med mobildekning — også utendørs — og krever ikke tilknytning til kommunal hjemmetjeneste. Ingen bindingstid; populært alternativ for pårørende som ønsker trygghet utenfor det kommunale systemet.',
      'Trygghet i hjemmet',
      ARRAY['trygghetsalarm', 'GPS', 'klokke', 'privat', 'pårørende']::text[],
      'https://www.sensorem.com/no/',
      NULL,
      'Sensorem AB',
      ARRAY['Norge', 'Sverige', 'EU']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Caretech',
      'Norsk leverandør og formidler av spesialiserte hjelpemidler for personer med funksjonsnedsettelser — rullestoler, stå- og gåtreningsutstyr (Innowalk), liggetraller, personløftere og hygieneutstyr. Caretec samarbeider med importører over hele landet og er spesielt aktiv i Nord-Norge. Utstyret kan bidra til tryggere og mer selvstendig hverdag hjemme for personer med nedsatt funksjonsevne, ofte tildeles via NAV Hjelpemiddelsentral etter ergoterapeutisk kartlegging.',
      'Trygghet i hjemmet',
      ARRAY['hjelpemiddel', 'rullestol', 'mobilitet', 'funksjonsnedsettelse']::text[],
      'https://www.caretec.no/',
      NULL,
      'Caretec AS',
      ARRAY['Norge']::text[],
      'Eksempel på hjelpemiddel-leverandør snarere enn velferdsteknologi-plattform — relevant for å vise bredden i teknologilandskapet rundt hjemmeboende med funksjonsnedsettelse.',
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Ably Medical',
      'Norsk helsesatsning (stiftet 2016, Ålesund) som utvikler berøringsfri sensorteknologi for pasientovervåking. Hovedproduktet LYNG er en sensormatte plassert under madrassen som overvåker tilstedeværelse, bevegelse og sengeutgang — med indikative trender for puls og respirasjon. Varsler pleiere når en beboer forlater sengen eller forblir immobil for lenge. Utviklet for sykehjem og hjemmesykepleie, med støtte fra Innovasjon Norge til prosjektet «framtidas pasientrom».',
      'Trygghet i hjemmet',
      ARRAY['startup', 'sensor', 'sensormatte', 'fall', 'seng', 'berøringsfri']::text[],
      'https://ablymed.com/no/technology',
      NULL,
      'Ably Medical AS',
      ARRAY['Norge']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Dignio',
      'Norsk helseteknologiselskap som gjør helsetjenester mindre avhengige av tid og sted — med digital hjemmeoppfølging og elektroniske medisindispensere samlet i én plattform. Dignio Prevent gir helsepersonell oversikt, varsler og beslutningsstøtte, mens pasientappen MyDignio brukes til videosamtaler, skjemaer, målinger og meldinger. Medisindispenseren varsler brukeren ved dosetid og gir beskjed til helsepersonell dersom medisinen ikke tas. Brukes i over halvparten av norske kommuner og ved flere sykehus.',
      'Helse og medisiner',
      ARRAY['medisindispenser', 'digital hjemmeoppfølging', 'MyDignio', 'målinger']::text[],
      'https://dignio.com/no/',
      NULL,
      'Dignio AS',
      ARRAY['Norge']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Evondos',
      'Automatisert medisindispenser som fungerer som et låst og sikkert medisinskap — minner brukeren når det er tid for medisin, deler ut riktig dose fra multidoserull og varsler helsepersonell dersom en dose uteblir. CE-merket medisinteknisk utstyr med 99 % etterlevelse av ordinert medisinering. Kan brukes i selvstendig modus eller assistert modus med videokommunikasjon for digitalt hjemmebesøk. Brukes av hundrevis av helse- og omsorgsorganisasjoner i Norden og Europa, med kontor i Oslo.',
      'Helse og medisiner',
      ARRAY['medisindispenser', 'legemiddelsikkerhet', 'automatisert', 'video']::text[],
      'https://www.evondos.no/',
      NULL,
      'Evondos Group',
      ARRAY['Norge', 'Norden', 'Europa']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Everon Global',
      'Europas største leverandør av digitale, trådløse og skybaserte løsninger for assisert boende (assisted living). Everon-økosystemet kombinerer intelligent programvare og trådløs maskinvare for å gi helse-, omsorgs- og boligleverandører sanntidsinformasjon og «patterns of life»-data — for mer målrettet og forebyggende omsorg. Over 150 000 installasjoner og mer enn én million tilkoblinger på tvers av Finland, Sverige og Storbritannia. Åpent og skalerbart system som støtter både hjemmeboende og institusjoner.',
      'Helse og medisiner',
      ARRAY['assisted living', 'sensorer', 'sky', 'økosystem', 'trådløs']::text[],
      'https://everon.global/',
      NULL,
      'Everon Group',
      ARRAY['Finland', 'Sverige', 'Storbritannia']::text[],
      'Primært etablert i Finland, Sverige og UK — relevant som eksempel på internasjonalt assisted living-økosystem, snarere enn en etablert norsk leverandør.',
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    );