import type { PublicStory, PublicConnection, CareFriction, CareQuality, MapScale, HouseTheme, WorkPackage } from "./types";

function story(
  id: string, title: string, body: string, theme: HouseTheme | null,
  field_site: string, frictions: CareFriction[], qualities: CareQuality[],
  map_scale: MapScale, latitude: number | null, longitude: number | null,
): PublicStory {
  return {
    id, title, body, theme, frictions, qualities, map_scale, latitude, longitude,
    home_based: theme !== null,
    field_site: field_site as PublicStory["field_site"],
    work_package: null,
    source_insight_id: null, media_urls: [], author_credit: "safe@home feltteam",
    published: true, published_at: "2025-01-01", sort_order: 0,
    created_by: "seed", created_at: "2025-01-01", updated_at: "2025-01-01",
  };
}

// Variant for meeting-derived insights that need work_package + a credited
// author. Same shape as `story()` but with the extra fields exposed.
function meetingInsight(
  id: string, title: string, body: string, field_site: string,
  frictions: CareFriction[], qualities: CareQuality[],
  map_scale: MapScale, latitude: number, longitude: number,
  work_package: WorkPackage, author_credit: string, date: string,
): PublicStory {
  return {
    id, title, body, theme: null, frictions, qualities, map_scale, latitude, longitude,
    home_based: false,
    field_site: field_site as PublicStory["field_site"],
    work_package,
    source_insight_id: null, media_urls: [], author_credit,
    published: true, published_at: date, sort_order: 0,
    created_by: "seed", created_at: date, updated_at: date,
  };
}

function conn(
  id: string, from: string, to: string, friction: CareFriction,
  type: "direct" | "indirect", desc: string,
): PublicConnection {
  return {
    id, from_story_id: from, to_story_id: to, friction,
    category_kind: "friction", category_key: friction,
    connection_type: type, description: desc,
    published: true, created_at: "2025-01-01",
  };
}

export const SEED_STORIES: PublicStory[] = [
  // ════════════════════════════════════════
  // MICRO — Inne i hjemmet (alle ved ~59.8976, 10.8155)
  // ════════════════════════════════════════
  story("seed-micro-1", "Dispenseren og bønneteppet",
    "Den automatiske medisindispenseren ble plassert i stua. Men dette rommet fungerer også som familiens bønnerom. Fem ganger om dagen blir dispenseren flyttet.\n\nHassans sønn begynte å flytte den til kjøkkenet under bønnetidene, og glemte å sette den tilbake. Doser ble droppet. Systemet flagget manglende etterlevelse.",
    "living_room", "Søndre Nordstrand", ["script", "invisible"], ["household_choreography", "cultural_anchoring"], "micro", 59.8976, 10.8155),

  story("seed-micro-2", "Når alarmen ikke forstår familie",
    "Amira er 78 og bor alene — det meste av året. Når datteren kommer på besøk fra Nairobi, utløses bevegelsessensoren på soverommet hver natt.\n\nEtter den tredje falske alarmen begynte Amira å skru av sensoren. Omsorgskoordinatoren noterte dette som «manglende etterlevelse».",
    "bedroom", "Alna", ["script", "displace"], ["transnational_flow", "household_choreography"], "micro", 59.8976, 10.8155),

  story("seed-micro-3", "Et stuebord av omsorg",
    "På Fatimas stuebord: et nettbrett for videosamtaler til Mogadishu, en pilledosett merket på somali, en norsk-somalisk ordbok. Denne flaten er et kart over omsorgsnettverket hennes — på tvers av kontinenter, språk og generasjoner.\n\nHjemmetjenestevurderingen noterte «begrenset sosialt nettverk».",
    "living_room", "Alna", ["reduce", "invisible"], ["digital_bridging"], "micro", 59.8976, 10.8155),

  story("seed-micro-4", "Den usynlige omsorgskoordinatoren",
    "Hver kveld klokka 19 ringer Rashidas datter fra Lahore. Hun spør om medisiner, minner mora på morgendagens fastlegetime og hjelper med nettbrettet.\n\nDenne daglige telefonsamtalen er et omsorgstiltak. Men den dukker ikke opp noe sted i Rashidas omsorgsplan.",
    "phone", "Søndre Nordstrand", ["invisible", "exclude"], ["transnational_flow", "digital_bridging"], "micro", 59.8976, 10.8155),

  story("seed-micro-5", "Baderomsdøra som låses fra utsiden",
    "Sikkerhetslåsen på Khalids baderomsdør ble installert for å hindre at han skulle falle og bli innestengt. Men for Khalid, en mann som tilbragte to år på et lukket mottak før han kom til Norge, er en dør som låses fra utsiden ikke sikkerhet. Det er fangenskap.\n\nHan ba hjemmetjenesten fjerne den. De henviste ham til ergoterapeuten. Ergoterapeuten noterte: «fallrisiko — låsen må bli».",
    "bathroom", "Alna", ["displace", "script"], ["adaptive_resistance"], "micro", 59.8976, 10.8155),

  story("seed-micro-6", "Kjøkkenradioen innstilt på Addis",
    "Selams kjøkkenradio er alltid innstilt på en etiopisk kanal som streames via telefonen. De kjente stemmene, musikken, nyhetene på amharisk — de fyller leiligheten med en verden hjemmetjenesten ikke ser.\n\nDa en ny medarbeider ba henne skru den av for å «konsentrere oss om morgenrutinen», forsvant en liten bit hjem for Selam.",
    "kitchen", "Alna", ["displace", "reduce"], ["cultural_anchoring", "belonging_negotiation"], "micro", 59.8976, 10.8155),

  story("seed-micro-7", "Barnebarna som IT-support",
    "Hver lørdag kommer Yusras 11 år gamle barnebarn innom og fikser det som har gått galt med nettbrettet, fjernkontrollen og den digitale pilledosetten. Hun nullstiller passord, oppdaterer apper og forklarer nye grensesnitt på en blanding av norsk og somali.\n\nDette barnet er den faktiske tekniske supporten for et velferdsteknologi-system designet av voksne som antok at brukerne ville ringe en hjelpetelefon.",
    "phone", "Alna", ["script", "invisible"], ["intergenerational_exchange", "digital_bridging"], "micro", 59.8976, 10.8155),

  story("seed-micro-8", "Arbeidsrommet fullt av brev",
    "I Abdis arbeidsrom flyter en skuff over av uåpnede konvolutter fra NAV, kommunen og sykehuset. Hvert brev forutsetter flytende norsk, digital kompetanse og fortrolighet med byråkratisk språk.\n\nAbdis datter kommer innom annenhver helg for å sortere dem. Mellom besøkene går frister ut. Klagefrister utløper. Rettigheter blir ikke brukt.",
    "study", "Søndre Nordstrand", ["exclude", "reduce"], ["transnational_flow", "invisible_labor"], "micro", 59.8976, 10.8155),

  // ════════════════════════════════════════
  // MESO — Nabolag (spredt rundt Alna)
  // ════════════════════════════════════════
  story("seed-meso-1", "Tolv ansikter på tre måneder",
    "Mariam førte en håndskrevet liste ved inngangsdøra — navnene på hver hjemmetjenestearbeider som hadde vært innom siden januar. I mars var de tolv.\n\n«Jeg har sluttet å lære meg navnene deres,» sa hun til sønnen sin.",
    "front_door", "Alna", ["rotate", "isolate"], ["adaptive_resistance"], "meso", 59.8970, 10.8140),

  story("seed-meso-2", "Torsdagsbenken",
    "Hver torsdag klokka 14 møtes fire kvinner på den samme benken utenfor frivillighetssentralen. De deler mat pakket inn i folie. De passer hverandres barnebarn.\n\nDa benken ble fjernet under en parkrenovering, sluttet kvinnene å gå ut i tre uker.",
    "garden", "Alna", ["invisible"], ["cultural_anchoring", "invisible_labor"], "meso", 59.8985, 10.8170),

  story("seed-meso-3", "Når «halal» ikke er nok",
    "Mohammeds omsorgsplan sier «halal-diett». Den roterende hjemmetjenestestaben tolker dette ulikt hver uke.\n\nDet Mohammed faktisk trenger er ikke bare halal — det er kjent. «Halal» er en mat-lov. Det er ikke et kjøkken.",
    "kitchen", "Alna", ["reduce", "rotate"], ["cultural_anchoring", "adaptive_resistance"], "meso", 59.8965, 10.8160),

  story("seed-meso-4", "Fastlegen som aldri har tid",
    "Dr. Andersen ser 30 pasienter om dagen. Når Yusuf kommer med datteren som tolker, blir 15 minutter til 7 minutters faktisk medisinsk samtale.\n\nYusufs sammensatte behov komprimeres til en avkrysningsboks på en skjerm.",
    "front_door", "Alna", ["reduce", "exclude"], ["belonging_negotiation"], "meso", 59.8960, 10.8120),

  story("seed-meso-5", "Apoteket som ble et klasserom",
    "Farmasøyten på Alna Senter merket at flere eldre kunder ikke kunne lese medisin-etikettene. Hun begynte å tilby uformelle «medisinskole»-økter hver tirsdag morgen — forklarte doser, bivirkninger og interaksjoner på enkelt språk, av og til med en somalisk tolk.\n\nKommunen finansierte det ikke. Apotekkjeden visste ikke om det. Det skjedde bare fordi noen så et hull.",
    "front_door", "Alna", ["invisible", "exclude"], ["adaptive_resistance", "invisible_labor"], "meso", 59.8950, 10.8100),

  story("seed-meso-6", "Moskeen som venterom",
    "Når Hamzas hjemmebesøk er forsinket — noe som skjer ofte — går han til moskeen tre kvartaler unna. Han ber, drikker te og venter. Imamen kan medisinskjemaet hans bedre enn de fleste i den roterende hjemmetjenestestaben.\n\nMoskeen fungerer som et uformelt omsorgsknutepunkt. Men den er usynlig for systemet som planlegger Hamzas tjenester.",
    "prayer_space", "Alna", ["invisible", "rotate"], ["cultural_anchoring", "invisible_labor"], "meso", 59.8990, 10.8190),

  story("seed-meso-7", "Tolken som ikke var der",
    "Fatimas kvartalsvise omsorgsvurdering var satt opp til en tirsdag. Tolken var bestilt til onsdag. Ingen oppdaget mismatchen før Fatima dukket opp og fant seg alene med tre fagpersoner som snakket hurtig norsk.\n\nHun nikket gjennom møtet. Omsorgsplanen hennes ble oppdatert basert på nikkene. Hun fortalte datteren etterpå: «Jeg vet ikke hva jeg sa ja til.»",
    "front_door", "Alna", ["exclude", "reduce"], ["adaptive_resistance", "belonging_negotiation"], "meso", 59.8940, 10.8180),

  story("seed-meso-8", "Hullet på nattevakt",
    "Mellom 22:00 og 06:00 finnes det ingen hjemmetjenestedekning i Alna øst. For Miriam, som trenger hjelp til å gå på toalettet om natta, betyr dette å gå med voksenbleier hun synes er ydmykende.\n\nDatteren hennes prøvde å ordne privat nattepleie, men hadde ikke råd. Kommunen sa at behovet «ikke møter terskelen for nattjenester».",
    "bedroom", "Alna", ["isolate", "displace"], ["invisible_labor", "adaptive_resistance"], "meso", 59.8955, 10.8200),

  story("seed-meso-9", "Kolonihagen",
    "Ibrahims kolonihage i Alna er der han dyrker tomater, mynte og chili — sorter du ikke får på Kiwi. Det er også der han møter andre menn på sin alder, deler frø og snakker tigrinya uten å unnskylde seg.\n\nDa mobiliteten hans gikk ned, var det ingen i hjemmetjenesten som tilbød seg å hjelpe ham dit. Hagebesøkene stoppet. Så stoppet matlagingen. Så stoppet matlysten.",
    "garden", "Alna", ["isolate", "invisible"], ["cultural_anchoring", "belonging_negotiation"], "meso", 59.8975, 10.8210),

  // ════════════════════════════════════════
  // MESO — Søndre Nordstrand
  // ════════════════════════════════════════
  story("seed-meso-10", "Lesesirkelen på Holmlia bibliotek",
    "Hver onsdag samles en gruppe eldre kvinner på Holmlia bibliotek for å lese norske barnebøker høyt — språket de aldri ble formelt undervist i. Bibliotekaren stiller med bøker og tålmodighet.\n\nFlere av deltakerne sier at denne timen er den eneste gangen i uka de snakker norsk med noen som ikke er en omsorgsarbeider med dårlig tid.",
    "study", "Søndre Nordstrand", ["exclude", "invisible"], ["adaptive_resistance", "belonging_negotiation"], "meso", 59.8355, 10.7940),

  story("seed-meso-11", "Køen på Mortensrud helsestasjon",
    "Helsestasjonen på Mortensrud betjener en mangfoldig befolkning, men har bare norskspråklige inntaksskjemaer. Køen går sakte fordi hver pasient trenger ekstra tid — ikke for behandlingen, men for oversettelsen.\n\nEn frivillig tolk kommer på torsdager. På andre dager tar folk med seg barn for å oversette de medisinske plagene sine.",
    "front_door", "Søndre Nordstrand", ["exclude", "reduce"], ["intergenerational_exchange"], "meso", 59.8320, 10.7900),

  // ════════════════════════════════════════
  // MACRO — By / systemnivå
  // ════════════════════════════════════════
  story("seed-macro-1", "Bussrute 37 ble lagt ned",
    "Da bussrute 37 ble lagt ned, var det en budsjettavgjørelse. Ruten knyttet Alna til nærmeste sykehus med tolketjenester.\n\nEn transportavgjørelse ble et helsegap. En budsjettlinje ble isolasjon.",
    "front_door", "Alna", ["isolate", "exclude"], ["belonging_negotiation"], "macro", 59.9100, 10.7700),

  story("seed-macro-2", "Bo trygt hjemme-reformen ruller ut ny teknologi",
    "Reformen lover teknologi som skal la eldre bo lenger hjemme. Sensorer, alarmer, digitale medisindispensere.\n\nMen forutsetningene er bygget rundt en bestemt husholdning: én person, som bor alene, med forutsigbare rutiner.",
    "hallway", "Alna", ["script"], [], "macro", 59.9139, 10.7522),

  story("seed-macro-3", "Den digital-først-baserte politikken",
    "Oslo kommune flyttet de fleste tjenestesøknader på nett. Innbyggere som trenger hjemmetjeneste, hjelpemidler eller transportstøtte må nå søke gjennom en digital portal — på norsk.\n\nFor eldre innvandrere som er pre-digitale og pre-litterate på norsk er ikke dette forenkling. Det er en ny mur.",
    "study", "Alna", ["exclude", "script"], ["digital_bridging"], "macro", 59.9200, 10.7400),

  story("seed-macro-4", "Kommunale budsjettkutt i tolketjenester",
    "I 2024 kuttet Oslo finansieringen av fysiske tolketjenester med 30 %, og dirigerte ressurser mot telefon- og videotolking i stedet.\n\nFor eldre pasienter som sliter med dårlig lyd på telefon og ikke klarer å navigere video-apper, gir denne innsparingen en annen kostnad: feildiagnoser, tapte nyanser og medisinske avgjørelser tatt på halv forståelse.",
    "front_door", "Alna", ["exclude", "reduce"], ["digital_bridging", "belonging_negotiation"], "macro", 59.9170, 10.7600),

  story("seed-macro-5", "Vurderingsalgoritmen for omsorgsbehov",
    "Kommunen innførte en standardisert algoritme for å fastsette antall hjemmetjenestetimer. Den vurderer fysisk mobilitet, kognitiv funksjon og daglige gjøremål. Den vurderer ikke ensomhet, kulturell isolasjon eller kompleksiteten i å håndtere omsorg på tvers av språk.\n\nKlienter som scorer «lavt behov» i algoritmen kan ha enorme udekkede behov algoritmen ikke er laget for å se.",
    "study", "Alna", ["reduce", "script"], ["invisible_labor"], "macro", 59.9050, 10.7800),

  // ════════════════════════════════════════
  // MØTE — Søndre Nordstrand 21.05
  // Insights destillert fra møtet med Linda Mari Tahir (enhetsleder hjemmetjenesten),
  // Gudrun Broback (ergoterapeut/seniorveileder) og Bodil Ananiassen (fagkonsulent
  // sykepleie). Spredt rundt Søndre Nordstrand-sentrum slik at de ikke overlapper
  // på kartet.
  // ════════════════════════════════════════
  meetingInsight(
    "meet-sn-1",
    "«Vi skal kaste oss rundt og kunne absolutt alt»",
    "Bodil Ananiassen, fagkonsulent i sykepleie med over 25 års erfaring i hjemmetjenesten, beskriver hvordan kompleksiteten har eskalert siden samhandlingsreformen. Ansatte må navigere brukernes hjem, rutiner, ønsker og personlige eiendeler — uten å vite på forhånd hva som venter dem. Mer uforutsigbarhet, flere brukere, mer digitalisering, men ikke nødvendigvis mer tid eller ressurser.\n\nHennes egne ord: «Vi skal kaste oss rundt og kunne absolutt alt, vi skal tilpasse oss, vi skal vite hva de vil ha, vi skal vite hvor de har tingene sine.»",
    "Søndre Nordstrand",
    ["reduce", "rotate"],
    ["invisible_labor", "adaptive_resistance"],
    "meso", 59.8345, 10.7920,
    "WP2",
    "Møte i Søndre Nordstrand 21.05 · Bodil Ananiassen",
    "2026-05-21",
  ),
  meetingInsight(
    "meet-sn-2",
    "De eldre vi aldri møter",
    "Bydelens største bekymring er ikke å forstå brukerne de allerede har — men å nå dem som aldri oppsøker tjenester. Språk, kultur, skam, familieforventninger og systemforståelse holder mange eldre med minoritetsbakgrunn utenfor tjenester de har rett på.\n\nTjenestene må kunne nå dem som ikke vet hvor de skal lete — og som ofte ikke vet at de har rett til å lete i det hele tatt.",
    "Søndre Nordstrand",
    ["exclude", "invisible"],
    ["belonging_negotiation", "cultural_anchoring"],
    "meso", 59.8330, 10.7905,
    "WP3",
    "Møte i Søndre Nordstrand 21.05",
    "2026-05-21",
  ),
  meetingInsight(
    "meet-sn-3",
    "PC-tid vs. tid med bruker",
    "Hjemmesykepleien ute i felt har lite tid foran skjerm og kort overskuddstid. Hvis erfaringene deres skal samles inn, må terskelen være ekstremt lav — et lite skjema, en lydmelding, et stikkord.\n\nKomplekse plattformer eller lange skjemaer vil systematisk ekskludere dem som er nærmest brukerne, og bare fange erfaringene til dem som sitter i administrative roller.",
    "Søndre Nordstrand",
    ["exclude", "script"],
    ["invisible_labor"],
    "meso", 59.8360, 10.7935,
    "WP4",
    "Møte i Søndre Nordstrand 21.05",
    "2026-05-21",
  ),
  meetingInsight(
    "meet-sn-4",
    "Personsensitivt vs. mønstre",
    "Den verdifulle innsikten fra hjemmebesøk handler ofte om mønstre på tvers av mange brukere — ikke om enkeltindivider. Men i innsamlingsøyeblikket er det vanskelig å skille det generiske mønsteret fra den identifiserbare personen.\n\nBydelen trenger derfor en kvalitetssikringsprosess før innsikt deles videre med prosjektet, og en intern kanal (f.eks. et Teams-skjema) som bydelen selv eier.",
    "Søndre Nordstrand",
    ["script"],
    ["invisible_labor"],
    "meso", 59.8325, 10.7945,
    "WP4",
    "Møte i Søndre Nordstrand 21.05",
    "2026-05-21",
  ),
  meetingInsight(
    "meet-sn-5",
    "Bydelens eget kunnskapsbibliotek",
    "Bydelens ansatte sitter på betydelig erfaringskunnskap om eldre med minoritetsbakgrunn — kunnskap som ikke er systematisk samlet noe sted. Prosjektet kan fungere som en plattform for å samle, strukturere og videreføre denne kunnskapen, men bare hvis det respekterer arbeidshverdagens grenser.\n\nDen eksisterende erfaringen er en ressurs som risikerer å forsvinne med rotasjon og pensjonering hvis den ikke fanges opp.",
    "Søndre Nordstrand",
    ["invisible"],
    ["invisible_labor", "intergenerational_exchange"],
    "meso", 59.8350, 10.7895,
    "WP4",
    "Møte i Søndre Nordstrand 21.05",
    "2026-05-21",
  ),
  meetingInsight(
    "meet-sn-6",
    "Forebyggende hjemmebesøk hos 80-åringer",
    "Gudrun Broback har jobbet forebyggende i bydelen siden 1992 — informasjonsmøter, hjemmebesøk hos 80-åringer, rådgivning, sosiale møteplasser, enkel tilrettelegging hjemme, oppfølging av bekymringsmeldinger fra naboer.\n\nForebyggende kontakt er det første og kanskje viktigste møtepunktet mellom tjenesten og eldre innbyggere som ennå ikke har omsorgsbehov. For dem som aldri søker tjenester selv, kan denne kontakten være det eneste de får.",
    "Søndre Nordstrand",
    [],
    ["cultural_anchoring", "belonging_negotiation"],
    "meso", 59.8340, 10.7955,
    "WP2",
    "Møte i Søndre Nordstrand 21.05 · Gudrun Broback",
    "2026-05-21",
  ),

];

export const SEED_CONNECTIONS: PublicConnection[] = [
  // ─── Makro → Meso-kaskader ───
  conn("seed-conn-1", "seed-macro-1", "seed-meso-4", "isolate", "direct",
    "Buss-nedleggelse gjør fastlegetimer utilgjengelige"),
  conn("seed-conn-2", "seed-macro-2", "seed-micro-2", "script", "indirect",
    "Reform-teknologi tar ikke høyde for transnasjonale familiemønstre"),
  conn("seed-conn-3", "seed-macro-2", "seed-micro-1", "script", "indirect",
    "Standardisert teknologi forstyrrer husholdningens bønnerytmer"),
  conn("seed-conn-4", "seed-macro-3", "seed-micro-8", "exclude", "direct",
    "Digital-først-politikk skaper en haug uåpnede brev"),
  conn("seed-conn-5", "seed-macro-4", "seed-meso-7", "exclude", "direct",
    "Tolkebudsjettkutt skaper mismatch i timeplanleggingen"),
  conn("seed-conn-6", "seed-macro-5", "seed-micro-4", "reduce", "indirect",
    "Algoritmen kan ikke se transnasjonale omsorgsnettverk"),

  // ─── Meso → Mikro-kaskader ───
  conn("seed-conn-8", "seed-meso-1", "seed-micro-2", "rotate", "direct",
    "Personalrotasjon undergraver tilliten intim hjemmebasert omsorg krever"),
  conn("seed-conn-9", "seed-meso-3", "seed-micro-1", "reduce", "direct",
    "Kulturell matkompleksitet redusert til en avkrysningsboks i omsorgsplanen"),
  conn("seed-conn-10", "seed-meso-3", "seed-micro-6", "reduce", "direct",
    "Kostholdsreduksjonisme gjenklang i kjøkkenradioen som ble slått av"),
  conn("seed-conn-11", "seed-meso-8", "seed-micro-5", "isolate", "direct",
    "Hullet på nattevakt tvinger fram uverdige omveier hjemme"),
  conn("seed-conn-12", "seed-meso-5", "seed-micro-3", "invisible", "indirect",
    "Apotekets uformelle omsorg speiler det usynlige stuebord-nettverket"),
  conn("seed-conn-13", "seed-meso-9", "seed-micro-6", "isolate", "direct",
    "Når hagen stopper, blir kjøkkenet stille"),
  conn("seed-conn-14", "seed-meso-6", "seed-micro-7", "invisible", "indirect",
    "Moskeens uformelle omsorg parallellerer barnebarnas IT-support"),

  // ─── Tverr-skala-kjeder ───
  conn("seed-conn-15", "seed-macro-1", "seed-meso-9", "isolate", "direct",
    "Transportkutt kutter tilgangen til kolonihager"),
  conn("seed-conn-16", "seed-macro-4", "seed-meso-11", "exclude", "direct",
    "Tolkekutt rulle videre til helsestasjonskøer"),
  conn("seed-conn-17", "seed-macro-3", "seed-meso-10", "exclude", "indirect",
    "Digital-først-politikk gjør biblioteksirkelen viktigere"),

  // ─── Meso ↔ Meso laterale koblinger ───
  conn("seed-conn-18", "seed-meso-1", "seed-meso-6", "rotate", "direct",
    "Personalrotasjon dytter folk mot uformell omsorg i moskeen"),
  conn("seed-conn-19", "seed-meso-7", "seed-meso-11", "exclude", "direct",
    "Tolkehull er systemiske, fra omsorgsvurderinger til helsestasjoner"),
  conn("seed-conn-20", "seed-meso-2", "seed-meso-9", "invisible", "indirect",
    "Uformelle samfunnsrom deler den samme skjørheten"),
];
