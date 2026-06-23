INSERT INTO public.welfare_technologies (
    title, description, category, tags, url, image_url,
    manufacturer, country_availability, notes, published, created_by
  ) VALUES
(
      'Suvanto Care',
      'Finsk innovasjon som gir kontinuerlig situasjonsinformasjon til pårørende og omsorgspersonell om en person som bor alene hjemme. Trådløse sensorer i boligen lærer seg beboerens rutiner og døgnrytme, og Suvanto Care-appen varsler ved avvik — for eksempel uvanlig søvn, manglende aktivitet eller at noe skjer utenfor det normale mønsteret. Tjenesten inkluderer også fjernmåling av helseverdier, videokommunikasjon og digital dagbok for kommunikasjon mellom pleiere og familie.',
      'Trygghet i hjemmet',
      ARRAY['app', 'sensorer', 'fjernoppfølging', 'avviksvarsling', 'hjemmeboende']::text[],
      'https://www.suvantocare.fi/en/front-page/',
      NULL,
      'Suvanto Care Oy',
      ARRAY['Finland', 'Norden']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Tunstall',
      'I over 65 år har Tunstall vært banebrytende med teknologi for helse- og omsorgssektoren. Løsningene muliggjør trygg og selvstendig livsstil for eldre og kronisk syke — gjennom digitale trygghetsalarmer (Lifeline Digital), GPS-klokker, bevegelsessensorer, komfyrvakter og elektroniske låser. Mer enn fem millioner mennesker bruker løsningene daglig globalt. I Norge leverer Tunstall integrerte systemer til hjemmetjeneste, omsorgsboliger og sykehjem.',
      'Trygghet i hjemmet',
      ARRAY['trygghetsalarm', 'GPS', 'sensorer', 'demens', 'pasientvarsling']::text[],
      'https://www.tunstall.no/',
      NULL,
      'Tunstall Norge AS',
      ARRAY['Norge', 'globalt']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Stella Care',
      'GPS-enheter utviklet spesifikt for personer med demens — for å finne de som har gått seg bort og skape trygghet for både kommuner og pårørende. Løsningen består av en bærbar GPS-enhet (flere modeller som klokke eller brikke), en sporingsapp og et administrasjonssystem for kommunalt personale. Brukes i dag av over 60 norske kommuner, med sanntidssporing, geofence-varsler og døgnåpen support.',
      'Trygghet i hjemmet',
      ARRAY['GPS', 'demens', 'lokalisering', 'geofence', 'klokke']::text[],
      'https://stellacare.dk/no/',
      NULL,
      'Stella Care ApS',
      ARRAY['Norge', 'Danmark', 'Skandinavia']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Wear&Care',
      'Dansk sensorteknologi for inkontinenspleie — en liten sensor festes på utsiden av alle typer bleer og varsler pleiepersonell via app når det er vannlating eller bleen er full. Løsningen muliggjør behovsbaserte blebytter i stedet for faste runder, reduserer unødvendige forstyrrelser og gir innsikt i vannlatingsmønster som kan avdekke helseendringer. Fungerer uten lokalt Wi-Fi og passer til sykehjem, omsorgsboliger og hjemmepleie.',
      'Trygghet i hjemmet',
      ARRAY['inkontinens', 'sensor', 'ble', 'helseovervåking']::text[],
      'https://wearandcare.com/da/hjem/',
      NULL,
      'Wear&Care Technologies',
      ARRAY['Danmark', 'Norden']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Securitas Technology',
      'Global leverandør og integrator av sikkerhets- og velferdsteknologi til helse- og omsorgssektoren. Tilbyr pasientvarslingssystemer, wander management (sporing av personer med demens), sanntids lokalisering (RTLS), spedbarnssikkerhet og integrerte sikkerhetsøkosystemer for sykehjem og omsorgsinstitusjoner. I Norge leverer de blant annet pasientvarsling til Trondheim kommunes nye Høyset helse- og velferdssenter, integrert med Helseplattformen.',
      'Trygghet i hjemmet',
      ARRAY['pasientvarsling', 'RTLS', 'wander management', 'integrator']::text[],
      'https://www.securitastechnology.com/no/bransjer/helsesektoren',
      NULL,
      'Securitas Technology',
      ARRAY['Norge', 'globalt']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    ),
(
      'Vivago',
      'Finsk selskap som tilbyr smarte trygghets- og velværeløsninger for forebyggende omsorg. Løsningen kombinerer intelligent pasientkall med sanntidsovervåking av søvn, aktivitet og døgnrytme — med automatiske alarmer ved plutselige endringer i tilstand eller hvis brukeren ikke klarer å tilkalle hjelp selv. Skalerer fra hjemmeboende til sykehjem og sykehus, og distribueres i Norge via Atea. Over 100 000 brukere daglig i Europa.',
      'Trygghet i hjemmet',
      ARRAY['velvære', 'søvn', 'aktivitet', 'pasientvarsel', 'forebygging', 'klokke']::text[],
      'https://vivago.com/en/about-us',
      NULL,
      'Vivago Oy',
      ARRAY['Norge', 'Finland', 'Europa']::text[],
      NULL,
      false,
      'f3c8e797-4fa1-44c8-868e-a674b1576c3a'::uuid
    );