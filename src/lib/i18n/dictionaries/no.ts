/**
 * Norwegian UI copy — the project's working language and the source text every
 * other locale is translated from.
 *
 * Deliberately *not* `as const`: `typeof no` is the contract every other
 * dictionary must satisfy, and literal types would make that impossible.
 */

const no = {
  common: {
    loading: "Laster…",
    saving: "Lagrer…",
    cancel: "Avbryt",
    confirm: "Bekreft",
    close: "Lukk",
    back: "Tilbake",
    retry: "Prøv igjen",
    previous: "Forrige",
    next: "Neste",
    add: "Legg til",
    remove: "Fjern",
    search: "Søk",
    searching: "Søker…",
    filter: "Filter",
    clearFilters: "Nullstill filtre",
    showAll: "Vis alt",
    untitled: "(uten tittel)",
    unknown: "Ukjent",
    skipToContent: "Hopp til hovedinnhold",
    languageLabel: "Språk",
    ofTotal: "av",
    entryOne: "oppføring",
    entryOther: "oppføringer",
    storyOne: "historie",
    storyOther: "historier",
    connectionOne: "kobling",
    connectionOther: "koblinger",
    tagOne: "tagg",
    tagOther: "tagger",
  },

  nav: {
    utility: "Forskning · OsloMet, UiO, Durham, Comte",
    mainMenu: "Hovedmeny",
    menu: "Meny",
    openMenu: "Åpne meny",
    closeMenu: "Lukk meny",
    closeShort: "Lukk",
    admin: "Admin",
    signIn: "Innlogging",
    signInTeam: "Innlogging for teamet →",
    signOut: "Logg ut",
    newNote: "Nytt notat",
    sectionInternal: "Internt",
    sectionPublic: "Offentlige sider",
    links: {
      about: { label: "Om", description: "Om prosjektet safe@home og forskningen bak." },
      admin: {
        label: "Redigering",
        description: "Skriv og rediger notater, innsikter, ressurser og mer.",
      },
      content: {
        label: "Innhold",
        description: "Søk, nodekart, friksjoner, kvaliteter og ressurser.",
      },
      threads: { label: "Tråder", description: "Argumenter under arbeid — analyselaget." },
      welfareTech: {
        label: "Eksisterende initiativer",
        description: "Bla gjennom teknologi-oppføringer med detaljer.",
      },
    },
  },

  footer: {
    tagline: "Forskningsplattform om aldring, omsorg og teknologi i reformen Bo trygt hjemme.",
    researchPartners: "Forskningspartnere",
    municipalPartners: "Kommunepartnere",
  },

  greeting: {
    // {name} is replaced with the signed-in user's first name.
    welcome: "Hei {name}, velkommen tilbake til Safe@Home-plattformen",
  },

  people: {
    placeholder: "Prosjektgruppen presenteres her.",
    defaultRole: "Prosjektgruppe",
  },

  home: {
    metaTitle: "SAFE@HOME — Tilpasning av kommunale hjemmetjenester for aldrende innvandrere",
    metaDescription:
      "Et forskningsprosjekt (2026–2029) som tilpasser kommunale hjemmetjenester for eldre innvandrere — ledet av OsloMet med UiO, Durham og Comte Bureau, i feltsamarbeid med bydelene Alna og Søndre Nordstrand.",
    heroEyebrow: "Forskningsprosjekt · 2026–2029",
    heroLead: "Tilpasning av kommunale hjemmetjenester for aldrende innvandrere.",
    heroBody:
      "SAFE@HOME er et forskningsprosjekt initiert av Marit Haldar og Carolina Borges Rau Steuernagel. Det skal undersøke hvordan reformen Bo trygt hjemme møter hverdagen i transnasjonale husholdninger. Vi følger tre skalaer — fra soverom til bystyresal — og kartlegger friksjonene og kvalitetene som oppstår når kommunal omsorg møter mangfoldige eldreliv.",
    heroCta: "Les mer om SAFE@HOME",
    heroIllustrationAlt: "Illustrasjon for SAFE@HOME",

    aboutEyebrow: "Om prosjektet",
    aboutHeading: "Bo trygt hjemme — for hvem, og på hvilke vilkår?",
    aboutParagraphs: [
      "Norges «Bo trygt hjemme»-reform legger opp til at flere eldre skal kunne bli boende lenger hjemme. Reformen forutsetter at hjemmet, familien og lokalsamfunnet kan bære en større del av omsorgsarbeidet — og at kommunale tjenester møter folk der de er.",
      "Men hjemmene, familiene og hverdagene til eldre med innvandrerbakgrunn følger ikke alltid de mønstrene tjenestene er bygget rundt. SAFE@HOME undersøker hva som skjer i dette møtet, og hvordan tjenestene kan tilpasses uten å miste retning eller rettferdighet.",
    ],
    factPeriod: "Periode",
    factFieldSites: "Feltsteder",
    factFunding: "Finansiering",
    fundingBody: "Prosjektet er finansiert av Norges forskningsråd. Du kan lese om prosjektet her:",

    wpEyebrow: "Arbeidspakker",
    wpHeading: "Fire spor som beveger seg fra hjem til politikk.",
    wpLead:
      "Hver arbeidspakke ledes av en av prosjektpartnerne, og resultatene kobles sammen i en felles plattform for innsikter, utfordringer og tjenesteforslag.",
    wpLedBy: "Ledet av",
    workPackages: {
      wp1: "Hvordan materielle rom og sosial dynamikk i og rundt boligen former hjemmebasert omsorg.",
      wp2: "Hvilke barrierer og muligheter institusjonene gir for tilgang til hjemmetjenester.",
      wp3: "Hvordan familiebånd og politikk på tvers av landegrenser påvirker det å eldes hjemme.",
      wp4: "Å ko-skape praktiske løsninger og tjenester sammen med beboere, ansatte og kommuner.",
    },

    partnersEyebrow: "Partnere",
    partnersHeading: "Et tverrfaglig konsortium på tvers av forskning, design og kommune.",
    partnerRoles: {
      lead: "Prosjektleder",
      research: "Forskningspartner",
      field: "Feltsamarbeid",
      design: "Designpartner",
    },
    partnerTitles: {
      pi: "Prosjektleder (PI)",
      wp2Lead: "WP2-leder — Helse- og omsorgsinstitusjoner",
      wp3Lead: "WP3-leder — Transnasjonale kontekster",
      wp4CoLead: "WP4 med-leder — Innovasjon og tjenestedesign",
      wp4Platform: "WP4 med-leder — Plattform og tjenestedesign",
      platform: "Plattform · WP4",
      wp1Lead: "WP1-leder — Hjem og fellesskap",
      wp1Member: "WP1 — Hjem og fellesskap",
      researcher: "Forsker",
      municipalPartner: "Kommunal partner",
    },

    peopleEyebrow: "Prosjektgruppe",
    peopleHeading: "Forskere, designere og kommunale partnere.",
    peopleLead:
      "Prosjektet drives av et team på tvers av OsloMet, Universitetet i Oslo, Durham University og Comte Bureau, i tett samarbeid med Bydel Alna og Bydel Søndre Nordstrand.",

    contactEyebrow: "Kontakt",
    contactHeading: "Vil du vite mer, eller samarbeide?",
    contactLead: "Ta kontakt med prosjektledelsen eller plattformteamet.",

    footerBlurb: "Forskningsprosjekt om aldring, omsorg og tilhørighet i reformen Bo trygt hjemme.",
    footerNavigate: "Naviger",
    footerConsortium: "Konsortium",
    footerCopyright: "© 2026 SAFE@HOME-konsortiet",
    footerLinks: {
      about: "Om prosjektet",
      welfareTech: "Eksisterende initiativer",
      municipalities: "For kommuner",
    },
  },

  about: {
    metaTitle: "Om — safe@home",
    metaDescription: "Om safe@home — forskningsprosjektet og feltstedene.",
    eyebrow: "Om prosjektet",
    heading: "Eldre, omsorg og teknologi — forskning i Oslo.",
    paragraphs: [
      "safe@home er et samarbeidsprosjekt (2026–2029) mellom OsloMet, Universitetet i Oslo, Durham University og Comte, i samarbeid med bydelene Alna og Søndre Nordstrand i Oslo.",
      "Prosjektet kombinerer feltarbeid, politikkanalyse og ko-design for å undersøke hvordan hjemmebaserte omsorgstjenester kan tilpasses en voksende gruppe eldre innvandrere — en gruppe hvis rutiner, familieformer og behov ofte ikke passer inn i standardiserte løsninger.",
      "Vi spør blant annet: Hva skjer når velferdsteknologi møter en transnasjonal hverdag? Hvordan virker reformen Bo trygt hjemme på tvers av språk, kultur og generasjoner? Hvilke lokale strategier og improvisasjoner holder folk oppe der tjenestene svikter?",
    ],
    pillarsEyebrow: "Tre tilnærminger",
    pillarsHeading: "Forskning som beveger seg mellom kjøkkenbord og kommunestyre.",
    pillars: {
      fieldwork: {
        tag: "Feltarbeid",
        title: "Hverdagen som datakilde",
        body: "Vi tilbringer tid i hjem, på møteplasser og hos tjenestemottakere — fra Alna til Søndre Nordstrand — og lytter til hvordan omsorg faktisk leves.",
      },
      policy: {
        tag: "Politikkanalyse",
        title: "Reformen møter virkeligheten",
        body: "Vi sporer hvordan «Bo trygt hjemme»-reformen oversettes til kommunal praksis — og hvor den mister grep i det transnasjonale.",
      },
      codesign: {
        tag: "Ko-design",
        title: "Verktøy som forhandler",
        body: "Sammen med beboere, ansatte og kommunale partnere bygger vi små, konkrete tjeneste- og teknologigrep som forskningen kan teste.",
      },
    },
    statusEyebrow: "Status",
    statusNote:
      "Resultater fra prosjektet vil bli publisert her etter hvert som de blir tilgjengelige.",
  },

  municipalities: {
    metaTitle: "For kommuner — safe@home",
    metaDescription:
      "Verktøykasser, praksisguider og kommunale erfaringer fra safe@home-prosjektet.",
    eyebrow: "For kommuner",
    heading: "Verktøy og erfaringer fra feltet.",
    lead: "Redigerbare verktøykasser, praksisguider og lett tilgjengelige beretninger om hva partnerkommunene prøver — hva som fungerer, hva som brøt sammen, og hvor kompromissene ligger. Tenkt for hjemmetjenestekoordinatorer, planleggere og tjenestedesignere.",
    empty: "Ingen verktøy eller erfaringer er publisert ennå.",
  },

  auth: {
    unknownEmail:
      "Vi fant ingen bruker med denne adressen. Ta kontakt med prosjektadministrator for tilgang.",
    badCode: "Koden er feil eller utløpt. Be om en ny kode.",
    rateLimit: "Du har bedt om for mange koder. Vent noen minutter og prøv igjen.",
    generic: "Noe gikk galt. Prøv igjen om litt.",
    noProfile:
      "Kontoen mangler en profil på plattformen. Ta kontakt med prosjektadministrator.",
    missingEmail: "Skriv inn e-postadressen din først.",
    // {n} is the required number of digits.
    shortCode: "Koden er {n} siffer.",
    wrongPassword: "Feil e-postadresse eller passord.",
    samePassword: "Det nye passordet må være forskjellig fra det forrige.",
    weakPassword: "Passordet er for svakt. Velg et lengre passord.",
    recoveryExpired: "Gjenopprettingslenken er utløpt. Be om en ny fra innloggingssiden.",
  },

  login: {
    metaTitle: "Innlogging — safe@home",
    backToHome: "Tilbake til forsiden",
    eyebrow: "Innlogging for prosjektgruppen",
    heading: "Logg inn for å publisere innsikter.",
    intro:
      "Medlemmer av SAFE@HOME-forskningsgruppen logger inn her for å publisere historier, designforslag og ressurser.",
    // {n} = number of digits, {email} = the address the code was sent to.
    codeIntro:
      "Vi har sendt en engangskode på {n} siffer til {email}. Koden er gyldig i kort tid — sjekk også søppelpost hvis den ikke dukker opp.",
    emailLabel: "E-post",
    emailPlaceholder: "navn@oslomet.no",
    passwordLabel: "Passord",
    codeLabel: "Engangskode",
    submitPassword: "Logg inn",
    submitPasswordBusy: "Logger inn…",
    submitEmail: "Send meg en engangskode",
    submitEmailBusy: "Sender kode…",
    submitCode: "Logg inn",
    submitCodeBusy: "Logger inn…",
    resend: "Send ny kode",
    // {s} = seconds left on the cooldown.
    resendCooldown: "Send ny kode ({s} s)",
    resendNotice: "Ny kode sendt. Bruk den nyeste koden i innboksen.",
    changeEmail: "Endre e-postadresse",
    noCodeHelp:
      "Får du ingen kode? Adressen må være registrert på forhånd — ta kontakt med prosjektadministrator hvis den ikke kommer.",
    forgotPassword: "Glemt passord?",
    resetSent: "Sjekk e-posten — vi har sendt en lenke for å sette nytt passord.",
    switchToPassword: "Logg inn med passord i stedet",
    switchToCode: "Logg inn med engangskode i stedet",
    accountsNote: "Kontoer administreres av forskningslederne i Supabase.",
  },

  reset: {
    metaTitle: "Nullstill passord — safe@home",
    eyebrow: "Nullstill passord",
    heading: "Velg et nytt passord.",
    intro: "Velg et passord du husker. Du blir automatisk logget inn så snart det er lagret.",
    expired:
      "Denne lenken er utløpt eller mangler en gjenopprettingsøkt. Be om en ny nullstillingslenke fra innloggingssiden.",
    newPassword: "Nytt passord",
    newPasswordPlaceholder: "Minst 8 tegn",
    confirmPassword: "Bekreft passord",
    tooShort: "Passordet må være minst 8 tegn.",
    mismatch: "Passordene er ikke like.",
    saved: "Passordet er oppdatert. Sender deg videre…",
    submit: "Lagre nytt passord",
    submitBusy: "Lagrer…",
    backToLogin: "Tilbake til innlogging",
  },

  internal: {
    checkingSession: "Sjekker økt…",
    metaTitle: "Analysebordet — safe@home",
    metaDescription:
      "Det som er nytt siden sist, innganger til visningene, og status for materialet.",
    heading: "Analysebordet for SAFE@HOME",
    workInProgress: "Alt her er arbeid under utvikling.",
    recentNotes: "Siste notater",
    noNotes: "Ingen notater ennå. Det første som legges inn, dukker opp her.",
    entrances: "Innganger",
    status: "Status",
    statNotes: "Hurtignotater",
    statInsights: "Innsikter",
    statResources: "Ressurser",
    statFootnote:
      "Datainnsamlingen i Alna og Søndre Nordstrand starter høsten 2026. Tallene her vokser i takt med den.",
    entranceBlurbs: {
      search: "Notater, innsikter og ressurser samlet. Filtrer eller søk.",
      nodes: "Notater og innsikter koblet av det de deler.",
      frictions: "De sju mekanismene der omsorg går galt.",
      qualities: "Det som gjør omsorg god når den treffer.",
      threads: "Argumenter under arbeid, med notatene som bærer dem.",
      admin: "Skriv og rediger notater, innsikter og ressurser.",
    },
    entranceLabels: {
      search: "Søk",
      nodes: "Nodekart",
      frictions: "Friksjoner",
      qualities: "Kvaliteter",
      threads: "Tråder",
      admin: "Redigering",
    },
  },

  content: {
    metaTitle: "Innhold — safe@home",
    metaDescription:
      "Alt materialet i prosjektet: søk, nodekart, friksjoner, kvaliteter og ressurser.",
    eyebrow: "Internt",
    heading: "Innhold",
    lead: "Alt materialet i prosjektet, sett fra fire vinkler — samme korpus, ulike innganger.",
    tabsLabel: "Innholdsfaner",
    tabs: {
      search: "Søk",
      nodes: "Nodekart",
      frictions: "Friksjoner",
      qualities: "Kvaliteter",
    },
    tabCopy: {
      search: {
        title: "Alt materialet",
        lead: "Notater, innsikter og ressurser samlet. Filtrer på type, friksjon eller kvalitet — eller søk.",
      },
      nodes: {
        title: "Nodekart",
        lead: "Kraftstyrt graf over notater og innsikter, koblet av delte kategorier.",
      },
      frictions: {
        title: "Syv måter systemet kolliderer med virkeligheten på",
        lead: "Friksjoner navngir de gjentakende mekanismene der velmenende omsorg likevel skader.",
      },
      qualities: {
        title: "Kvaliteter",
        lead: "Hvordan folk faktisk lever og mestrer — det som gjør omsorg god når den treffer.",
      },
    },
  },

  browser: {
    loadError: "Klarte ikke å hente materialet. Last siden på nytt.",
    searchPlaceholder: "Søk i alt materialet…",
    typeLabel: "Type",
    frictionsLabel: "Friksjoner",
    qualitiesLabel: "Kvaliteter",
    kinds: {
      quick_note: "Notat",
      insight: "Innsikt",
      resource: "Ressurs",
    },
    noSearchHits: "Ingen treff på dette søket.",
    noFilterHits: "Ingenting matcher disse filtrene.",
    empty: "Ingenting her ennå. Det første som legges inn, dukker opp her.",
    resourceSection: "Ressursen",
    openLink: "Åpne lenke ↗",
    // {name} = file name, omitted when unknown.
    download: "Last ned",
    pdfPreviewFallback: "Nettleseren kan ikke vise PDF-en her. Bruk nedlastingslenken under.",
    noPreview: "Formatet kan ikke forhåndsvises i nettleseren. Last ned filen for å åpne den.",
    // {name} = file name
    previewOf: "Forhåndsvisning av {name}",
    showInNodeMap: "Vis i nodekart →",
  },

  frictions: {
    chordIntro:
      "Dette akkord-diagrammet viser hvordan friksjonene fletter seg sammen på tvers av historier — jo tykkere bånd, jo flere liv deler den samme kollisjonen.",
    chordPending:
      "Når materialet vokser, viser et akkord-diagram her hvordan friksjonene fletter seg sammen på tvers av historier.",
    legend: "Tegnforklaring",
    clearSelection: "Nullstill valg",
    allGrouped: "Alle historier gruppert etter friksjon",
    sharedBothOne: "historie deler begge",
    sharedBothOther: "historier deler begge",
    chordHint:
      "Hold musen over et segment for å fremheve. Klikk for å låse. Klikk på et bånd for å se paret.",
    countsIntro:
      "Akkord-diagrammet tegnes når materialet er rikt nok til å vise hvordan friksjonene fletter seg sammen. Foreløpig viser vi tellingen slik den faktisk står.",
    corpusEmpty:
      "Her kommer feltmaterialet. Datainnsamlingen i Alna og Søndre Nordstrand starter høsten 2026 — etter hvert som notater tagges med friksjoner, dukker de opp her.",
    noCombination: "Ingen historier deler denne kombinasjonen ennå.",
    // {a} and {b} are friction labels, used in SVG tooltips.
    pairTooltip: "{a} + {b} — {n} historier deler begge",
    singleTooltip: "{a} — {n} historier",
  },

  qualities: {
    corpusEmpty:
      "Her kommer feltmaterialet. Datainnsamlingen i Alna og Søndre Nordstrand starter høsten 2026 — etter hvert som notater tagges med kvaliteter, dukker de opp her.",
    noStories: "Ingen historier ennå.",
    descriptionPending: "Lengre beskrivelse kommer snart.",
    examples: "Eksempler",
    // {label} = quality name
    showDescription: "Vis beskrivelse for {label}",
    hideDescription: "Skjul beskrivelse for {label}",
    descriptionComingSoon: "{label} — beskrivelse kommer snart",
  },

  nodes: {
    loading: "Laster nodegraf…",
    loadError: "Klarte ikke å hente materialet.",
    // {sources} = comma-separated list of the parts that failed
    partial: "Noe av materialet kunne ikke lastes ({sources}). Grafen er ufullstendig.",
    empty:
      "Ingen notater ennå. Datainnsamlingen starter høsten 2026. Det som legges inn, dukker opp her som noder.",
    graphLabel: "Konstellasjonsgraf over hurtignotater, innsikter og ressurser",
    title: "Nodekart",
    // {visible}, {total}, {edges}
    counts: "{visible} av {total} noder · {edges} koblinger.",
    edgeLegendLabel: "Forklaring av kantene",
    strongEdge: "Sterk kobling — manuelt opprettet",
    weakEdge: "Svak kobling — felles kategori",
    searchPlaceholder: "Søk i tittel eller tekst…",
    types: {
      all: "Alt",
      notes: "Notater",
      insights: "Innsikter",
      resources: "Ressurser",
    },
    kinds: {
      quickNote: "Hurtignotat",
      quickNoteShort: "Notat",
      insight: "Innsikt",
      resource: "Ressurs",
    },
    noMatches: "Ingen noder matcher filtrene.",
    filtersAndLegend: "Filtre & legende",
    scaleLabel: "Skala",
    workPackageLabel: "Arbeidspakke",
    hideSidebar: "Skjul sidepanel",
    showSidebar: "Vis sidepanel",
    legendNote:
      "Linjer kobler noder som deler en tag — friksjonsfargen brukes når koblingen går via en friksjon, ellers nøytralgrå.",
    manualEdge: "Manuell kobling",
    manualEdgeTooltip: "Manuell kobling (laget i notatredigereren)",
    openResource: "Åpne ressurs →",
    noConnections: "Ingen koblinger via delte kategorier",
  },

  threads: {
    metaTitle: "Tråder — safe@home",
    metaDescription: "Argumenter under arbeid: teser med tilknyttede notater.",
    heading: "Tråder",
    lead: "Et argument under arbeid: en tese, notatene som bærer den, og hvorfor hvert av dem hører hjemme der. Alt her er arbeid under utvikling.",
    // {error} = the underlying message
    loadError: "Klarte ikke å hente tråder: {error}",
    empty:
      "Ingen tråder ennå. En tråd er et argument under arbeid — start en når du ser et mønster som går igjen.",
    vetted: "✓ Vi står ved denne",
    markVetted: "Merk «Vi står ved denne»",
    unmarkVetted: "Fjern «Vi står ved denne»",
    // {date}
    lastChanged: "Sist endret {date}",
    newThread: "Ny tråd",
    titlePlaceholder: "Arbeidstittel, f.eks. «Dispenser-skript går igjen på tvers av feltsteder»",
    summaryPlaceholder: "Argumentet slik det står nå (valgfritt)",
    create: "Opprett",
    allThreads: "← Alle tråder",
    statusLabel: "Status",
    argumentLabel: "Argumentet slik det står nå",
    unsaved: "Ulagret — klikk utenfor feltet for å lagre.",
    interpretationChanged: "Endret tolkning? Logg gjerne hva dere trodde før.",
    addTurn: "Legg til vending",
    notNow: "Ikke nå",
    // {n}
    notesInThread: "Notater i tråden ({n})",
    noItems: "Ingen notater lagt til ennå. Finn dem under.",
    missingSource: "(kilden finnes ikke lenger)",
    itemNotePlaceholder: "Hvorfor hører dette til her?",
    findNotes: "Finn notater",
    searchCorpus: "Søk i materialet",
    searchPlaceholder: "Søk i tittel og tekst…",
    previousInterpretations: "Tidligere tolkninger",
    turnPlaceholder: "Fram til juni trodde vi X; feltnotatene fra Alna tyder heller på Y.",
    saveTurn: "Lagre vending",
    membershipHeading: "Tråder",
    addToThread: "Legg til i tråd",
    loadingThreads: "Laster tråder…",
    orNewThread: "…eller ny tråd",
    newThreadTitle: "Arbeidstittel på ny tråd",
    createAndAdd: "Opprett og legg til",
    sourceNoun: {
      quick_note: "Dette notatet",
      insight: "Denne innsikten",
      story: "Denne historien",
      resource: "Denne ressursen",
    },
    // {noun} = one of sourceNoun
    notInAnyThread: "{noun} inngår ikke i noen tråd ennå.",
  },

  welfareTech: {
    metaTitle: "Eksisterende initiativer · SAFE@HOME",
    metaDescription:
      "En kuratert oversikt over velferdsteknologi som er relevant for hjemmebasert omsorg for eldre med innvandrerbakgrunn — som inspirasjon og referanse.",
    eyebrow: "Internt",
    heading: "Eksisterende initiativer",
    lead: "En kuratert oversikt over velferdsteknologi som er relevant for hjemmebasert omsorg for eldre med innvandrerbakgrunn. Utvalget er gjort av SAFE@HOME-prosjektet som inspirasjon og referanse — ikke som anbefaling.",
    editLink: "+ Legg til / rediger oppføringer",
    filterLabel: "Filtrer etter kategori",
    emptyCategory: "Ingen oppføringer i denne kategorien ennå.",
    noImage: "ingen bilde",
    uncategorised: "Uten kategori",
    learnMore: "Lær mer →",
    curatorNote: "Kuratornotat:",
  },

  solutions: {
    metaTitle: "Designresponser — safe@home",
    metaDescription:
      "Designresponser blir til i WP4 når feltmaterialet fra WP1–3 peker på utfordringer verdt å jobbe med.",
    eyebrow: "Designresponser",
    heading: "Fra observasjon til tiltak.",
    lead1:
      "Designresponser blir til i WP4 når feltmaterialet fra WP1–3 peker på utfordringer verdt å jobbe med.",
    lead2:
      "Når forskningen avdekker en friksjon, svarer designteamet. Dette er tiltakene som utvikles, testes og foredles — fra observasjon i felt til praktisk løsning.",
    pipeline: "Pipeline",
    responseOne: "respons",
    responseOther: "responser",
    clearStageFilter: "Nullstill fasefilter",
    allResponses: "Alle responser",
    // {stage} = stage label
    stageResponses: "{stage} — responser",
    emptyStage: "Ingen responser i denne fasen ennå.",
    addresses: "Adresserer",
    basedOn: "Basert på",
    progressEyebrow: "Framdrift",
    progressHeading: "Månedlige rapporter fra arbeidspakkene.",
    progressLead:
      "Månedlige intervjuer med hver arbeidspakke, gjennomført av Comte, som oppsummerer hvor forskningen står.",
    monthLabel: "Måned",
    allMonths: "Alle måneder",
    showAllMonths: "Vis alle måneder",
    noReportsYet: "De første månedsrapportene skrives nå. Kom tilbake snart.",
    // {month}
    noReportsForMonth: "Ingen rapporter for {month}.",
    noPublishedReports: "Ingen publiserte rapporter ennå.",
    hideEarlier: "Skjul tidligere måneder",
    // {n}
    earlierMonths: "Tidligere måneder · {n}",
    nextSteps: "Neste steg:",
    interviewWith: "med",
  },

  story: {
    notFound: "Historie ikke funnet — safe@home",
    backToFrictions: "← Tilbake til friksjoner",
    designResponseEyebrow: "Designrespons",
    designResponseHeading: "Hvordan designteamet svarer",
    connectedStories: "Tilkoblede historier",
    noConnected: "Ingen tilkoblede historier ennå.",
    showFewer: "Vis færre",
    // {n}
    showAllN: "Vis alle {n}",
  },

  readingRoom: {
    frictionsLabel: "Friksjoner",
    qualitiesLabel: "Kvaliteter",
    // {n} = number of active filters
    clearWithCount: "Nullstill filtre ({n})",
    noMatches: "Ingen ressurser matcher disse filtrene.",
    empty:
      "Ingen publikasjoner ennå. De første arbeidsnotatene og policy-tekstene legges ut etter hvert som de blir til.",
  },

  resources: {
    // {n}
    linkedInsights: "Tilknyttede innsikter · {n}",
    open: "Åpne →",
    download: "Last ned →",
    comingSoon: "Kommer snart",
  },

  // Kontaktwidgeten nederst til høyre. Ligger på hver side, også for utloggede.
  contact: {
    launcher: "Send en melding",
    openLabel: "Åpne meldingsfeltet",
    closeLabel: "Lukk meldingsfeltet",
    title: "Send en melding",
    subtitle: "Går rett til prosjektledelsen",
    greeting:
      "Hei! Har du et spørsmål, en retting, eller noe fra praksis du vil dele? Skriv i vei — meldingen går rett til prosjektledelsen.",
    messageLabel: "Melding",
    messagePlaceholder: "Skriv meldingen din her…",
    nameLabel: "Navn",
    namePlaceholder: "Hva heter du?",
    emailLabel: "E-post",
    emailPlaceholder: "navn@eksempel.no",
    optional: "valgfritt",
    emailHelper: "Legg igjen adressen din hvis du vil ha svar.",
    send: "Send",
    sending: "Sender…",
    sentTitle: "Takk — meldingen er mottatt.",
    // {email} = adressen avsenderen oppga.
    sentWithEmail: "Vi svarer til {email} så snart vi rekker det.",
    sentNoEmail:
      "Du la ikke igjen e-postadresse, så vi har dessverre ingen måte å svare deg på.",
    again: "Send en til",
    errorEmpty: "Skriv en melding først.",
    errorEmail: "E-postadressen ser ikke riktig ut.",
    errorRate: "Du har sendt mange meldinger i dag. Prøv igjen i morgen.",
    errorGeneric: "Noe gikk galt, og meldingen ble ikke sendt. Prøv igjen om litt.",
    // {n} = tegn igjen av grensen.
    charsLeft: "{n} tegn igjen",
  },
};

export type Dictionary = typeof no;

export default no;
