import type { CareFriction, CareQuality, MapScale, HouseTheme } from "./types";

// ─── Map Configuration ───
export const MAP_CONFIG = {
  center: [10.8155, 59.8976] as [number, number], // Alna, Oslo
  initialZoom: 19,
  minZoom: 9,
  maxZoom: 19,
  microToMesoZoom: 17,
  mesoToMacroZoom: 13,
};

// ─── Inline MapLibre style (raster OSM tiles — proven to work) ───
export const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster" as const,
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// ─── District Coordinates ───
export const DISTRICTS: Record<string, { center: [number, number]; zoom: number; label: string }> = {
  alna: { center: [10.8155, 59.8976], zoom: 14, label: "Alna, Oslo" },
  sondre_nordstrand: { center: [10.7920, 59.8340], zoom: 14, label: "Søndre Nordstrand, Oslo" },
};

// ─── Care Frictions ───
// Friksjoner = mekanismer i tjenesteapparatet som gjør at velmenende omsorg
// likevel skader. Hver definisjon skal være entydig nok til at en ny redaktør
// kan velge riktig friksjon uten å være i tvil.
export const FRICTIONS: Record<
  CareFriction,
  { label: string; color: string; description: string; longDescription: string; examples: string[] }
> = {
  rotate: {
    label: "Rotasjon",
    color: "#C45D3E",
    description: "Ansatte byttes ut ofte.",
    longDescription:
      "Beboeren møter stadig nye ansatte fra hjemmetjenesten. Tillit, rutiner og kunnskap om personen må bygges opp igjen for hver ny vakt. Bruk denne friksjonen når problemet handler om at det ikke er én eller få personer beboeren forholder seg til over tid.",
    examples: [
      "En beboer har tolv ulike hjemmehjelpere på tre måneder.",
      "Hver ny vakt må forklares kostholdet, bønnetidene og hvor medisinene står.",
    ],
  },
  script: {
    label: "Skript",
    color: "#5B6AAF",
    description: "Teknologi eller protokoller forutsetter feil bruker.",
    longDescription:
      "Sensorer, alarmer, skjemaer eller rutiner er laget med én type bruker i tankene — gjerne én person som bor alene med faste vaner. Når beboerens hverdag ikke passer denne malen, lager verktøyet feil i stedet for å hjelpe. Bruk denne friksjonen når problemet ligger i selve designet eller utformingen.",
    examples: [
      "Bevegelsessensoren slår alarm hver natt når datteren er på besøk.",
      "Medisindispenseren står midt i bønnerommet og må flyttes fem ganger om dagen.",
    ],
  },
  isolate: {
    label: "Isolasjon",
    color: "#3A8A7D",
    description: "Tiltak kutter beboerens sosiale bånd.",
    longDescription:
      "Vedtak, tjenester eller endringer i nærmiljøet svekker beboerens kontakt med familie, naboer eller fellesskap. Bruk denne friksjonen når et tiltak (eller mangel på et tiltak) reduserer det sosiale nettverket — ikke når problemet er at tjenesten har feil innhold.",
    examples: [
      "Bussruten som koblet bydelen til sykehuset blir lagt ned.",
      "Hjemmetjenesten tilbyr ikke følge til kolonihagen lenger.",
    ],
  },
  reduce: {
    label: "Forenkling",
    color: "#8B6914",
    description: "Kategorier er for grove til å fange situasjonen.",
    longDescription:
      "Vurderingsskjemaer, koder, avkrysningsbokser eller algoritmer tvinger en sammensatt hverdag inn i ferdiglagde valgmuligheter. Det som ikke passer i en boks blir feiltolket eller usynlig. Bruk denne friksjonen når kategoriene tjenesten bruker ikke beskriver det som faktisk skjer.",
    examples: [
      "«Halal-diett» som én avkrysningsboks beskriver ikke hva personen faktisk spiser.",
      "Algoritmen for omsorgstimer måler mobilitet, men ikke ensomhet eller språkbarrierer.",
    ],
  },
  exclude: {
    label: "Ekskludering",
    color: "#9B59B6",
    description: "Krav stenger folk ute fra tjenester de har rett på.",
    longDescription:
      "Krav om norsk, digitale skjemaer, åpningstider, oppmøtested eller uskrevne regler hindrer beboeren i å nå tjenester de har rett til. Ofte handler det ikke om avslag — beboeren søker aldri, fordi terskelen er for høy eller informasjonen ikke når fram. Bruk denne friksjonen når problemet ligger i hvordan tjenesten er tilgjengelig.",
    examples: [
      "NAV-brev forutsetter flytende norsk og digital signering.",
      "Tolken er booket til onsdag, omsorgsmøtet er på tirsdag.",
    ],
  },
  invisible: {
    label: "Usynlighet",
    color: "#D4A017",
    description: "Omsorg som ikke registreres noen steder.",
    longDescription:
      "Arbeid utført av pårørende, naboer, frivillige eller familie i andre land registreres ikke i kommunale journaler eller planer. Systemet planlegger som om dette arbeidet ikke finnes. Bruk denne friksjonen når situasjonen handler om omsorg som faktisk skjer, men ikke synes for tjenesteapparatet.",
    examples: [
      "Datteren i Lahore som ringer hver kveld for å minne om medisiner.",
      "Imamen som kjenner medisinplanen bedre enn hjemmetjenesten.",
    ],
  },
  displace: {
    label: "Forskyvning",
    color: "#D14343",
    description: "Tiltak gjør at beboeren føler seg mindre hjemme.",
    longDescription:
      "Sikkerhetslåser, overvåkning, faste rutiner eller andre tiltak som er ment som trygghet, oppleves som krenkelse, fangenskap eller fremmedhet. Hjemmet slutter å føles som ens eget. Bruk denne friksjonen når selve hjemmefølelsen blir undergravd av tjenesten.",
    examples: [
      "Baderomsdøren som låses fra utsiden minner en mann om asyltiden.",
      "Den nye hjemmehjelpen ber kjøkkenradioen bli slått av.",
    ],
  },
};

// ─── Care Qualities ───
// Kvaliteter = mønstre som beskriver hvordan beboerne faktisk lever og
// mestrer. Ikke problemer, men ressurser og strategier — tjenester som ser
// dem fungerer bedre enn de som ikke gjør det.
export const QUALITIES: Record<
  CareQuality,
  { label: string; color: string; longDescription: string; examples: string[] }
> = {
  transnational_flow: {
    label: "Transnasjonal flyt",
    color: "#D4A017",
    longDescription:
      "Omsorg, penger, råd eller praktisk hjelp kommer fra familie i andre land. Disse båndene er ofte avgjørende for hverdagen, men registreres ikke i kommunale omsorgsplaner. Bruk denne kvaliteten når støtte kommer over landegrenser.",
    examples: [
      "Daglige videosamtaler med datter i Nairobi om medisiner.",
      "Søster i Lahore koordinerer fastlegetimer hjemmefra.",
    ],
  },
  household_choreography: {
    label: "Hverdagskoreografi",
    color: "#C45D3E",
    longDescription:
      "Rommene i boligen brukes om hverandre etter tid på dagen og hvem som er hjemme. Stuen kan være bønnerom, kjøkkenet møteplass, sofaen sykeseng. Bruk denne kvaliteten når funksjon og bruk av rom skifter gjennom dagen.",
    examples: [
      "Medisindispenseren flyttes fem ganger om dagen for bønn.",
      "Sengeplass og soverom byttes når familie er på besøk.",
    ],
  },
  invisible_labor: {
    label: "Usynlig arbeid",
    color: "#7A756B",
    longDescription:
      "Ubetalt omsorg utført av pårørende, naboer eller frivillige — uten å være registrert noen steder. Dette arbeidet holder ofte hjemmesituasjonen sammen. Bruk denne kvaliteten når en stor del av omsorgen utføres uten kompensasjon eller anerkjennelse.",
    examples: [
      "Datter sorterer ulest NAV-post annenhver helg.",
      "Pensjonisten i nabooppgangen handler mat hver fredag.",
    ],
  },
  cultural_anchoring: {
    label: "Kulturell forankring",
    color: "#9B59B6",
    longDescription:
      "Mat, bønn, språk, musikk eller ritualer som er sentrale for hvem beboeren er. Tjenester som gir plass til disse praksisene fungerer bedre enn de som ikke gjør det. Bruk denne kvaliteten når kulturell praksis er avgjørende for hverdagen.",
    examples: [
      "Kjøkkenradioen alltid innstilt på en etiopisk kanal.",
      "Bestemte krydder og tilberedninger som er kjente — ikke bare «halal».",
    ],
  },
  adaptive_resistance: {
    label: "Tilpasset motstand",
    color: "#3A8A7D",
    longDescription:
      "Beboeren omgår, justerer eller motsetter seg tjenester som ikke passer. I journalen ser det ofte ut som «manglende etterlevelse», men det er en bevisst strategi. Bruk denne kvaliteten når beboeren tar grep selv for å få hverdagen til å fungere.",
    examples: [
      "Sensoren skrus av når datteren er på besøk.",
      "Beboeren går til moskeen når hjemmebesøket er forsinket.",
    ],
  },
  intergenerational_exchange: {
    label: "Utveksling mellom generasjoner",
    color: "#5B6AAF",
    longDescription:
      "Hjelp og omsorg går begge veier mellom unge og eldre. Barnebarn fikser teknologi, besteforeldre passer barn og lærer bort språk. Bruk denne kvaliteten når situasjonen handler om gjensidig støtte på tvers av generasjoner.",
    examples: [
      "11-åringen er IT-support for bestemorens medisindispenser.",
      "Bestefaren henter barnebarn på SFO og lærer dem tigrinya.",
    ],
  },
  digital_bridging: {
    label: "Digitale broer",
    color: "#378ADD",
    longDescription:
      "Teknologi som faktisk fungerer for å holde kontakt over avstand — videosamtaler, talemeldinger, oversettelsesapper. Ofte verktøy beboeren har valgt selv (WhatsApp, Messenger), ikke det kommunen tilbyr. Bruk denne kvaliteten når digitale verktøy holder forbindelser i hevd.",
    examples: [
      "Stuebord med nettbrett, pilledosett på somali og en ordbok.",
      "Talemeldinger på morsmål når skrift ikke holder.",
    ],
  },
  belonging_negotiation: {
    label: "Forhandling om tilhørighet",
    color: "#8B6914",
    longDescription:
      "Spørsmålet om beboeren vil bli i Norge, dra «hjem» til opprinnelseslandet, eller leve i begge. Mange har ikke ett fast svar. Bruk denne kvaliteten når situasjonen handler om hvor personen hører hjemme.",
    examples: [
      "Stuebord som er kart over et omsorgsnettverk på tre kontinenter.",
      "Spørsmålet «hvor vil du gravlegges?» dukker opp i en omsorgsvurdering.",
    ],
  },
};

// ─── One-liner copy for qualities (shared across /qualities and /about) ───
export const QUALITY_COPY: Record<CareQuality, string> = {
  transnational_flow:         "Omsorg som sirkulerer på tvers av landegrenser",
  household_choreography:     "Daglig orkestrering av flerbruksrom",
  invisible_labor:            "Ubetalt omsorg fra pårørende og lokalsamfunn",
  cultural_anchoring:         "Praksiser som opprettholder identitet",
  adaptive_resistance:        "Stille tilpasninger rundt tjenestene",
  intergenerational_exchange: "Gjensidig omsorg mellom unge og eldre",
  digital_bridging:           "Teknologi som opprettholder forbindelser",
  belonging_negotiation:      "Spenningen mellom her og der",
};

// ─── Map Scale Labels ───
// Skala = hvilket nivå observasjonen handler om. Hver innsikt hører hjemme
// på én skala — velg den skalaen der det viktigste skjer.
export const SCALES: Record<MapScale, { label: string; longDescription: string }> = {
  micro: {
    label: "Inne i hjemmet",
    longDescription:
      "Observasjoner inne i én bestemt bolig — rommene, gjenstandene, rutinene, beboerens daglige liv. Bruk denne skalaen når situasjonen kunne pekt på et bestemt rom eller en bestemt person.",
  },
  meso: {
    label: "Nabolaget",
    longDescription:
      "Observasjoner i bydelen og dens tjenester eller møteplasser — legekontor, apotek, bibliotek, moské, hjemmetjeneste, frivillighet. Bruk denne skalaen når situasjonen handler om hvordan en tjeneste eller institusjon fungerer.",
  },
  macro: {
    label: "Byen",
    longDescription:
      "Observasjoner på kommune- eller systemnivå — vedtak, budsjetter, politikk, digitale plattformer, regelverk. Bruk denne skalaen når årsaken ligger i en beslutning som rammer mange.",
  },
};

// ─── Work packages (WP1–WP4) ───
// Arbeidspakke = hvilken del av forskningsprosjektet innsikten hører inn under.
// De fire pakkene følger ulike skalaer og spørsmål.
export type WpId = "wp1" | "wp2" | "wp3" | "wp4";

export const WP_LABELS: Record<WpId, { label: string; subtitle: string; longDescription: string }> = {
  wp1: {
    label: "WP1: Hjem og fellesskap",
    subtitle: "hjemmet, rommene og det nære fellesskapet",
    longDescription:
      "Mikronivå. Hjemmet og det nære nabolaget — rommene, gjenstandene, rutinene og relasjonene som utgjør beboerens hverdag. Bruk WP1 når innsikten handler om det som skjer i og rundt en bolig. Ledes av Carolina Rau (UiO).",
  },
  wp2: {
    label: "WP2: Helse- og omsorgsinstitusjoner",
    subtitle: "fastlege, hjemmetjeneste, sykehjem og veien dit",
    longDescription:
      "Mesonivå. Hvordan tjenesteapparatet faktisk fungerer — fastlege, hjemmetjeneste, korttidsplass, helsestasjon — og hvor lett (eller vanskelig) det er for eldre med innvandrerbakgrunn å bruke det. Bruk WP2 når innsikten handler om en tjeneste eller institusjon. Ledes av Jonas Debesay (OsloMet).",
  },
  wp3: {
    label: "WP3: Transnasjonale kontekster",
    subtitle: "bånd til familie, eiendom og omsorg over landegrenser",
    longDescription:
      "Familie, omsorg, økonomi og politikk som krysser landegrenser, og hvordan det møter norske tjenester og norsk forvaltning. Bruk WP3 når innsikten handler om noe som strekker seg ut over Norge. Ledes av Erika Gubrium (OsloMet).",
  },
  wp4: {
    label: "WP4: Innovasjon og design",
    subtitle: "konkrete tiltak utviklet sammen med beboere og kommuner",
    longDescription:
      "Tverrgående. Tar funn fra de andre arbeidspakkene og utvikler konkrete tiltak sammen med beboere, ansatte og kommunale partnere. Bruk WP4 når innsikten handler om en mulig løsning, et prøveprosjekt eller en endring i hvordan tjenesten utføres. Ledes av Alejandro Miranda Nieto (OsloMet) og Øystein Evensen (Comte Bureau).",
  },
};

// ─── DB-enum-shaped Work Package labels (uppercase) ───
// Mirrors WP_LABELS but keyed by the uppercase enum that lives in quick_notes
// and insights tables. Powers the admin form labels and inline help.
export type WorkPackageId = "WP1" | "WP2" | "WP3" | "WP4";

export const WORK_PACKAGE_INFO: Record<
  WorkPackageId,
  { label: string; longDescription: string }
> = {
  WP1: { label: "WP1 · Hjem og fellesskap",            longDescription: WP_LABELS.wp1.longDescription },
  WP2: { label: "WP2 · Helse- og omsorgsinstitusjoner", longDescription: WP_LABELS.wp2.longDescription },
  WP3: { label: "WP3 · Transnasjonale kontekster",     longDescription: WP_LABELS.wp3.longDescription },
  WP4: { label: "WP4 · Innovasjon og design",          longDescription: WP_LABELS.wp4.longDescription },
};

// ─── House Room Positions (% coords within house overlay) ───
export const HOUSE_HOTSPOTS: { theme: HouseTheme; x: number; y: number; label: string }[] = [
  { theme: "childrens_room", x: 28, y: 17, label: "Barnerom" },
  { theme: "bedroom",        x: 65, y: 17, label: "Soverom" },
  { theme: "study",          x: 24, y: 35, label: "Arbeidsrom" },
  { theme: "kitchen",        x: 68, y: 37, label: "Kjøkken" },
  { theme: "living_room",    x: 38, y: 55, label: "Stue" },
  { theme: "front_door",     x: 14, y: 55, label: "Inngangsdør" },
  { theme: "garden",         x: 55, y: 80, label: "Hage" },
  { theme: "phone",          x: 78, y: 56, label: "Telefon" },
];
