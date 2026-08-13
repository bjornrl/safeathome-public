# SAFE@HOME-plattformen — strategi og prioritering

*Gjennomgang utført 6. august 2026. Grunnlag: full kodegjennomgang av `safeathome-public` (branch `agent/aapne-innganger`), direkte lesing av produksjonsdatabasen (Supabase `ditsssyrzjqdnhqxnffx`), rutegjennomgang av safeathome.no som utlogget besøkende, og prosjektdokumentene i prosjektmappa. Faktapåstander om prosjektet er sporet til søknaden («Transnational homecare.Final»). Ingen filer i repoet eller rader i databasen er endret.*

---

## 1. Sammendrag

Plattformen brukes ikke fordi den er bygget for en fase prosjektet ikke er i, og peker brukerne mot feil sted når de først kommer inn. Databasen bekrefter diagnosen med tall: 20 brukere er opprettet, 9 har noen gang logget inn, én siste 30 dager. De 17 notatene som finnes er skrevet av to personer — deg og Øystein. Kjernetabellene for den tiltenkte flyten (insights: 0, challenges: 0, comments: 0) er helt tomme. Datainnsamlingen har ikke startet; det stemmer at det ikke finnes feltnotater.

Tre ting må skje, i denne rekkefølgen:

**Først, før datainnsamlingen starter (høst 2026):** Rydd. Fjern all seed-fiksjon — den ligger fortsatt i koden som fallback og blander oppdiktede personer med *ekte, navngitte* kommunalt ansatte i samme datastruktur. Fjern kartrestene (maplibre, three.js, koordinatfiltre som aktivt skjuler innhold). Tett de offentlige lekkasjene: `/explore` viser intern admin-tekst til alle, og ressursfiler ligger i en åpen bucket. Fullfør OTP-innloggingen som allerede ligger ukommittert i repoet — den er kodet ferdig, men er død i produksjon til to manuelle Supabase-steg er gjort.

**Deretter:** Bygg det plattformen faktisk skal være — et analysebord for to med vinduer inn for resten. Det betyr en intern forside som ikke er et redigeringsskjema (i dag lander alle i `/admin`), et nodekart med en løsning for mikro/meso/makro (anbefalt: vertikal lagdeling + filter, se §6.1), og et analyselag av «tråder» der notater settes sammen til argumenter under arbeid (§6.2).

**Parallelt, lavt press:** Anonymiseringsregelen inn i grensesnittet (§6.3), minimal statusmerking (§6.4), og et intake-format klart til WP-lederne (§6.6).

Alt dette er beskrevet som seks kjørbare prompts (filene `01`–`06`) pluss en prioritert tiltaksliste i §9.

---

## 2. Diagnose — hvorfor plattformen ikke brukes

Premisset fra gjennomgangen med deg står seg, og koden og databasen gir det belegg:

**Tallene.** `auth.users` har 20 brukere (opp fra 11 i april-dokumentet), alle med profilrad. 9 har logget inn noen gang; **én** siste 30 dager. `quick_notes` har 17 rader fra **2 forfattere**. `insights`, `challenges`, `challenge_insights`, `challenge_transitions`, `comments` og `attachments` har **0 rader hver**. Hele den tiltenkte flyten — forsker legger inn innsikt → flagges for design → blir challenge → vandrer gjennom pipeline → publiseres som historie — har aldri vært brukt én gang. `public_stories` har 1 rad («Eldre innvandrere er mer ensomme»). Rollene i `profiles`: 10 forskere, 7 kommunale partnere, 2 admin, 1 designer.

**Førstemøtet peker feil vei.** Etter innlogging sendes alle til `/admin` (`src/app/login/page.tsx:32` — `safeRedirect()` returnerer `/admin` som default). `/admin/page.tsx` er 2 338 linjer redigeringsverktøy. Logoen i toppmenyen bytter mål til `/admin` for innloggede (`src/components/Nav.tsx:99`), så en innlogget bruker kommer aldri tilbake til den offentlige forsiden via logoen. En forsker som logget inn i vår møtte altså et innholdsproduksjonsverktøy for et innhold som ikke fantes, uten noen forklaring på hva hen skulle gjøre der. Det er her de som aldri kom tilbake, ga opp. `/internal` — området som burde vært hjemmet — har ikke engang en `page.tsx`; ruta gir 404.

**Plattformen er bygget for et datagrunnlag som ikke eksisterer, og later som den har det.** `src/lib/seed-data.ts` inneholder 30 oppdiktede historier («Dispenseren og bønneteppet» :54, «Tolv ansikter på tre måneder» :89, «Bussrute 37 ble lagt ned» :139) merket `author_credit: "safe@home feltteam"` og `published: true`. Fallback-logikken i `src/lib/queries.ts:17–26` viser dem når databasen returnerer null rader — som den gjør nå. Alvorligst: i samme array ligger seks «møteinnsikter» (`seed-data.ts:166–237`) med **ekte, navngitte personer** — Bodil Ananiassen, Gudrun Broback, Linda Mari Tahir — med direkte sitater, umulige å skille fra fiksjonen i grensesnittet. Det er både et etisk problem og et tillitsproblem: en kommunal partner som finner sitt eget navn side om side med oppdiktede «feltfunn» har god grunn til å miste tilliten til plattformen.

**Innlogging er reelt, men sekundært.** Passord-flyten med `temp_safe_home_2026` + tilbakestilling var skjør (Safe Links-problemet er reelt for magic links), og OTP-arbeidet er riktig. Men 9 av 20 har faktisk kommet seg inn — og ikke kommet tilbake. Det bekrefter at hovedproblemet er at det ikke var noe å komme tilbake til.

---

## 3. Hva plattformen skal være nå

Et **analysebord for to — med vinduer inn for resten.** Konkret betyr det:

**Analysebordet** er der du og Øystein finner mønstre på tvers, tester om en friksjon faktisk går igjen, og sammenligner feltsteder. Det krever tre ting koden ikke har i dag: en enhet over det atomære notatet (tråder, §6.2), visninger som viser samme korpus fra flere vinkler (nodekart + friksjoner + kvaliteter på samme datagrunnlag, i dag leser de *ulike* tabeller — se §4), og søk som allerede finnes og fungerer (semantisk + nøkkelord, `src/app/actions/search.ts`).

**Vinduene inn** er de innloggede visningene datainnsamlerne og prosjektgruppen møter: nodekartet, friksjons- og kvalitetssidene, trådene — lesbare for alle innloggede, med uferdighet synlig og forklart. Terskelen for å levere inn et notat skal være så lav som mulig; alt annet er valgfritt (intake-formatet i §6.6).

**Den offentlige siden** reduseres til prosjektinformasjon: hva, hvem, hvorfor, kontakt (beslutning 8). Det betyr at `/frictions`, `/qualities`, `/reading-room` og `/welfare-tech` — som i dag er offentlige — flyttes bak innlogging. Dette er den ene plassen jeg leser beslutningene 4 og 8 som motstridende: «friksjons- og kvalitetssidene beholdes» og «ingen analyser offentlig». Anbefalingen er å beholde sidene, men som interne visninger. Taksonomien i seg selv (de sju friksjonene som *begreper*) kan gjerne beskrives på den offentlige om-siden — det er prosjektinformasjon — men historiene og grupperingene er analyse.

**Arkitektonisk konsekvens:** Datamodellens kjerne trenger ikke endres (og skal ikke, jf. beslutning 10). `quick_notes` + `insights` + `public_resources` er et tilstrekkelig atomnivå. Det som mangler er ett tillegg (tråder) og en omlegging av hvilke tabeller visningene leser fra. Challenges-pipelinen beholdes urørt og ligger klar til WP4-fasen.

---

## 4. Konsekvensene av at kartet er borte

Kartet er fjernet fra visningen, men ikke fra koden, skjemaet eller metaforene. Dødvekt og aktiv skade, verifisert:

**Aktiv skade (dette forvirrer eller ødelegger nå):**

- `getMapStories()` filtrerer på `.not("latitude", "is", null)` (`src/lib/queries.ts:33`) og brukes av `/frictions` (`frictions/page.tsx:9`) og `/qualities` (`qualities/page.tsx:8`) — to sider uten kart. Den ene ekte publiserte historien har ingen koordinater og blir dermed **usynlig på begge sider**, som i stedet faller tilbake til seed-fiksjonen. En kartrest som aktivt skjuler ekte innhold og viser oppdiktet.
- `/explore` er «avslått» via `EXPLORE_MAP_ENABLED = false`, men ruta er offentlig og viser intern admin-tekst til alle utloggede: «Utforsk-kartet er skjult fra admin-menyen inntil videre … Gå til innholdsredigering» med knapp til `/admin`. Forsidens footer lenker dit. Dette er den tydeligste lekkasjen på hele nettstedet.
- Login-sidens meta-beskrivelse lover fortsatt «et interaktivt kart av historier».
- I nodekartet er `map_scale` en kant-genererende kategori (`NodeMapClient.tsx:408–410`): to vilkårlige notater som begge er «meso» får en kobling selv om de ikke deler noe annet. Med bare tre mulige verdier produserer dette meningsløse kanter og vil gjøre grafen til en hårball når korpuset vokser.

**Ren dødvekt (koster vedlikehold, bundle og sårbarhetsflate):**

- `three` + `@types/three` i `package.json` — null importer i `src/`. `.glb|.gltf` i proxy-matcheren (`src/proxy.ts:71`).
- `maplibre-gl` importeres fortsatt: CSS-en lastes på **hver eneste side** (`src/app/globals.css:2`), og hele kartimplementasjonen (635 linjer, `ExplorePageClient.tsx`) ligger bak det avslåtte flagget. `MAP_CONFIG` med zoomterskler og `DISTRICTS` med koordinater (`src/lib/constants.ts:4–39`) er ubrukt. Én av de fem npm-sårbarhetene (`protocol-buffers-schema`) kommer via maplibre og forsvinner med den.
- I databasen: `latitude`/`longitude` på `public_stories` og `public_design_responses` (0 rader bruker dem), samt de tilsvarende feltene i typene (`src/lib/types.ts:59–60, 79–80`).

**Hva som må overta hvilken rolle:** Nodekartet er primærvisningen (beslutning 2) og må da bære det kartet bar: inngangen til materialet og den romlige intuisjonen for skala. Det siste er §6.1. Husgjennomskjæringen kan overta mikro-inngangen på sikt — se samme seksjon.

---

## 5. Informasjonsarkitektur etter kartet

Foreslått rutestruktur. Prinsipp: offentlig = prosjektinformasjon; innlogget = ett sammenhengende arbeidsområde med én tydelig forside; redigering er en handling, ikke et sted man bor.

**Offentlig:**

| Rute | Innhold | Endring fra i dag |
|---|---|---|
| `/` | Prosjektinfo: hva, hvem (WP-er, partnere), hvorfor, kontakt | Beholdes i hovedsak som i dag; fjern footer-lenken til `/explore` |
| `/about` | Utdypning + taksonomien som *begreper* | Beholdes |
| `/for-municipalities` | Ærlig tomtilstand til noe finnes | Beholdes |
| `/login` | OTP | Fullfør ukommittert arbeid |
| `/index` | — | **Fjernes** (duplikat av `/`, SEO-støy) |
| `/explore` | — | **Fjernes** (redirect til `/`) |
| `/frictions`, `/qualities`, `/reading-room`, `/welfare-tech`, `/story/[id]`, `/solutions` | — | **Flyttes bak innlogging** |

**Innlogget** (alt under `/internal`, som i dag er beskyttet av proxyen):

| Rute | Rolle |
|---|---|
| `/internal` | **Ny forside.** Det som er nytt siden sist, siste notater, aktive tråder, innganger til visningene. Redirect-mål etter innlogging (i stedet for `/admin`). |
| `/internal/nodes` | Nodekartet — primærvisning, med skala-løsningen fra §6.1 |
| `/internal/frictions`, `/internal/qualities` | Samme korpus som nodekartet, gruppert per friksjon/kvalitet (i dag leser de `public_stories`+koordinatfilter — legges om til notater+innsikter) |
| `/internal/threads` | Analyselaget (§6.2) |
| `/internal/search` | Som i dag |
| `/internal/resources` | Lesesalen, intern |
| `/internal/solutions` | Challenges-pipelinen, klar til WP4 |
| `/admin` | Beholdes som redigeringsverktøy, men er ikke lenger landingssted; logo peker til `/internal` |

«Nytt notat» skal være tilgjengelig som handling fra hele det interne området (én knapp i toppmenyen), ikke noe man må inn i `/admin`-fanene for å finne. Det er den viktigste enkeltendringen for datainnsamlerne.

---

## 6. Løsninger på de åpne problemene

### 6.1 Mikro/meso/makro uten kart

**Hva nivåene er analytisk, uavhengig av geografi.** Formuleringen i oppdraget holder, og den har støtte i søknaden, som organiserer feltarbeidet i tre «sites»: *homes and communities* (WP1), *health and care institutions* (WP2), *transnational contexts and policy* (WP3). Nivåene er altså ikke primært romlige — de er **hvor i systemet årsaken bor**: mikro = det som skjer mellom mennesker og ting i et hjem; meso = tjenestene og fellesskapsarenaene rundt; makro = politikk, reform og systemiske krefter (inkludert de transnasjonale). Merk at makro dermed rommer mer enn «byen» — WP3s transnasjonale bånd er makro uten å være Oslo. Det taler i seg selv for å kutte den geografiske metaforen.

**Alternativ A — ren filterakse.** Skala blir en tagg på linje med feltsted og WP: et filter i nodekartet og en fasett i søk. Billig, ærlig, ingen falsk romlighet. Konsekvens: nivåene mister all visuell kraft; fortellingen om at makrobeslutninger forplanter seg ned i soverommet — en bærende idé fra Feral Atlas-inspirasjonen og kartets sterkeste grep — blir usynlig.

**Alternativ B — vertikal lagdeling i nodekartet.** Kraftsimuleringen får en svak y-kraft per nivå: makro-noder øverst, meso i midten, mikro nederst (tre bånd, ikke harde soner — noder uten skala flyter fritt). En kant som krysser bånd *viser* forplantning: politikkvedtaket øverst koblet til medisindispenseren nederst. Konsekvens: skala får kropp igjen uten geografi, og det koster lite (én `forceY` per bånd i eksisterende D3-oppsett). Risiko: med tynt datagrunnlag kan båndene se glisne ut; og lagdelingen må ikke forveksles med hierarki (makro er ikke «viktigere»).

**Alternativ C — kutt nivåene helt.** Sterkeste argument: nivåtilordning er ofte flertydig (en historie om en dispenser innført av reformen er både mikro og makro), taggen produserer i dag meningsløse kanter i grafen, og med få notater fragmenterer tre nivåer materialet mer enn de ordner det. Hvorfor det likevel ikke vinner: forplantningen *på tvers* av nivåer er en av prosjektets analytiske hovedpåstander — søknaden beskriver eksplisitt hvordan reformens teknologier bærer «scripts» inn i hjemmene. Fjerner du nivåene, fjerner du muligheten til å *se* akkurat det funnet. Og WP-strukturen (WP1/2/3 ≈ mikro/meso/makro) gjør at nivåene får gratis datadisiplin: de følger i praksis av hvem som leverer.

**Anbefaling:** B + A kombinert. Vertikal lagdeling som standard i nodekartet, skala som filter, og **fjern skala (og rom) fra kantlogikken** i `findShared` — kanter skal bety delt friksjon, kvalitet, WP eller feltsted, ikke delt nivå. Nivået settes valgfritt på notatet og arves ellers fra WP-en. Etikettene bør samtidig bytte fra kartspråkets «Inne i hjemmet / Nabolaget / Byen» (`src/lib/constants.ts:234–249`) til «Hjemmet / Tjenestene / Systemet» — det tredje nivået rommer da også det transnasjonale.

**Husgjennomskjæringen og `house_theme`.** Enumen er i aktiv bruk (16 av 17 notater har skala; rom-tagger brukes i notater og søkepanel) og skal beholdes. Husgjennomskjæringen kan overleve uten kartet nettopp fordi den aldri var geografisk: et generisk hus peker ikke på noen adresse — det er en *typologi* av rom, og den beste visuelle inngangen til mikro-materialet når det finnes. Anbefaling: ikke bygg den nå (tomt hus over tomt datagrunnlag gjentar hovedfeilen), men planlegg den som mikro-inngang i fase 2, som illustrert cutaway i Punkt-profilen slik samlingsdokumentet allerede konkluderte.

### 6.2 Analyselaget uten å forvirre de som leverer inn

**Anbefalt modell: «tråder» som egen inngang.** En tråd er et argument under arbeid: en tese med tilknyttede notater, som lever i månedsvis og endrer seg.

Datamodell (to nye tabeller, ingen endring i eksisterende):

- **`threads`**: `id`, `title` (arbeidstittel, f.eks. «Dispenser-skript går igjen på tvers av feltsteder»), `summary` (levende tekst — selve argumentet slik det står nå), `status` (`open` / `parked` / `landed`), `created_by`, `created_at`, `updated_at`.
- **`thread_items`**: `thread_id`, `source_type` (`quick_note` | `insight` | `resource` | `story`), `source_id`, `note` (én setning: *hvorfor* dette hører til her — annotasjonen er det analytiske arbeidet), `position`, `added_by`, `added_at`.

(Pluss `thread_log` hvis endringssporet i §6.5 vedtas.) RLS som resten av intern-laget: alle innloggede leser og skriver — flatt, jf. beslutningen om ingen godkjenningsledd.

**Hva en datainnsamler ser:** nøyaktig det samme som i dag, pluss én lenke i menyen («Tråder») der de kan *lese* analysene under arbeid — det er vinduet inn. Innleveringsflyten deres berøres ikke med ett eneste felt.

**Hva en analytiker ser:** `/internal/threads` som arbeidsrom — liste over tråder med status og sist endret; trådvisning med summary øverst og de annoterte notatene under; «legg til i tråd»-knapp på hvert notats detaljvisning (den ene, lille flaten der analyse berører resten av grensesnittet). Semantisk søk finnes allerede og blir måten man *finner* kandidat-notater til en tråd.

**Alternativer vurdert:** (a) *Rollestyrt progressiv avsløring* — analysefunksjoner kun synlige for `designer`/`admin`-roller. Forkastet: redaksjonen er flat, teamet er lite, og skjulte funksjoner i et prosjekt der «prosjektgruppen er orientert om work in progress» motarbeider vindus-prinsippet. (b) *Samlinger som tagg* — en `collection`-tagg på notater. Billigst, men uten summary-tekst blir det en mappe, ikke et argument; analysen bor da fortsatt i et Word-dokument utenfor plattformen, og plattformen forblir arkiv. (c) Egen inngang (anbefalt) — skiller «legg inn» (handling, overalt) fra «arbeid med» (modus, ett sted), uten roller og uten å røre innleveringsterskelen.

### 6.3 Anonymisering som funksjon

Regelen flyttes til de tre stedene den møter folk. Ferdig formulert tekst (bokmål, Punkt-tonen — kort og direkte):

**1. Ved skrivefeltet** (alltid synlig, én linje + utvidbar):

> **Skriv så ingen kan gjenkjennes.** Aldersspenn, ikke alder («i 70-årene»). Landbakgrunn, ikke landsby. Bydel, ikke adresse. Ingen navn — heller ikke fornavn.

Utvidet («Hvorfor?»-lenke): «Rådata hører hjemme i TSD. Her ligger bare det som trygt kan deles med hele prosjektgruppen. Husk at kombinasjonen kan røpe det enkeltfeltene skjuler: bydel + alder + landbakgrunn + en spesifikk hendelse kan være nok til å peke på én person.»

**2. Ved publisering** (én avkryssing, ikke et skjema):

> ☐ Ingen enkeltperson kan gjenkjennes i dette — heller ikke gjennom kombinasjonen av detaljer.

**3. Automatisk sjekk — anbefalt, i minste utgave.** En klientside-sjekk (~30 linjer, ingen API-kall) som *varsler, aldri blokkerer*, ved tre mønstre: 11 sifre på rad (fødselsnummer), gatenavn + husnummer (`\b[A-ZÆØÅ][a-zæøå]+ (gate|vei|veien|gata|plass|allé)\w* \d+`), og eksakt firesifret årstall 1930–1970 i nærheten av «født». Varseltekst: «Dette kan være {en adresse / et fødselsnummer / et fødselsår}. Sjekk en ekstra gang før du lagrer.» Mer enn dette (navnegjenkjenning, NER) er ikke verdt kompleksiteten: falske positiver i norsk fritekst vil lære folk å ignorere varselet.

**Kombinasjonsrisikoen** skal nevnes, men i det utvidbare laget og i publiserings-checkboxen — ikke i énlinjeren. Den er den reelle faren, men den kan ikke regelsjekkes; den kan bare holdes i bevisstheten, og en tekst man ser hver dag slutter man å lese. Merk spenningen som består: «sterilt materiale er ubrukelig» betyr at regelen over er en *minstestandard*, ikke en garanti — restrisikoen ved kombinasjon er en redaksjonell vurdering som ligger hos den som publiserer. Det er derfor bekreftelsen er formulert som en påstand man går god for, ikke en avkryssing av at regler er fulgt.

### 6.4 Statusmerking uten rot

**Anbefaling: omvendt merking.** Ingen statusfelt på notater. Én global, rolig linje i det interne området (i footer eller under sidetittelen på visningene): «Alt her er arbeid under utvikling.» Deretter **én valgfri markør** som bare settes på det som faktisk er gjennomarbeidet: «✓ Vi står ved denne» — på tråder og eventuelt innsikter, aldri på notater.

Begrunnelse: default-tilstanden («under arbeid») gjelder nesten alt og bærer derfor ingen informasjon — å merke den er ren støy, og støy er eksplisitt uønsket (beslutning 11). Unntaket er informasjonen. Tre nivåer (råmateriale / under arbeid / vi står ved denne) forkastes fordi skillet råmateriale/under arbeid ikke styrer noen beslutning hos leseren; ingenting i det hele tatt forkastes fordi vinduene inn trenger ett signal om hva som er trygt å sitere videre i prosjektgruppen. Kostnad: én boolean på `threads`/`insights`, én badge-komponent.

### 6.5 Sporet av endring

**Anbefaling: manuell «vendinger»-logg på tråder — ingen automatisk versjonering.**

- *Full versjonshistorikk* (alle endringer i alle felt): fanger redigeringer, ikke tolkningsskift. 95 % av innslagene blir «rettet skrivefeil»; selve funnet — at dere trodde noe annet i mars — drukner. Kostnad: høy (historikktabeller eller trigger-oppsett på flere tabeller, diff-UI). Forkastes.
- *Ingenting*: gratis, men prosjektet mister det du selv peker på — for et prosjekt der konklusjonene er ukjente, kan endringen i tolkning være selve funnet. Søknaden rammer inn WP4 som «iterative cycles of exploration and experimentation»; et spor av iterasjonene er metodisk verdi, ikke pynt.
- *Manuell logg* (anbefalt): tabell `thread_log` (`thread_id`, `entry` tekst, `logged_at`, `logged_by`). Når summary-en i en tråd skrives vesentlig om, legger man inn én frivillig linje: «Fram til juni trodde vi X; feltnotatene fra Alna tyder heller på Y.» Vises som diskret «Tidligere tolkninger»-seksjon nederst i tråden, skjult når tom.

Ærlig kostnad: dette virker bare hvis du og Øystein faktisk skriver innslagene — det er en disiplin, ikke en funksjon. Mitigering: når noen redigerer summary, vis en liten, avvisbar påminnelse («Endret tolkning? Logg gjerne den gamle»). Hvis loggen står tom i september, har den kostet én tabell og null skjermplass — nedsiden er nær null, oppsiden er potensielt et metodefunn. Derfor: bygg den, i minste utgave.

### 6.6 Innkommende materiale fra WP1–WP3 — minimalt intake-format

Til møtene med WP-lederne, ett ark. Et notat er brukbart i analysen når det har:

| Felt | Krav | Hvorfor |
|---|---|---|
| **Hva skjedde** (fritekst) | Obligatorisk | Selve materialet. Konkret situasjon, ikke oppsummering. Anonymisert etter regelen i §6.3. |
| **Feltsted** (Alna / Søndre Nordstrand / Skien) | Obligatorisk | Uten dette kan ingenting sammenlignes på tvers — prosjektets kjernespørsmål. |
| **Kildetype** (intervju / observasjon / møte / dokument) | Obligatorisk (én av fire) | Analysen må vite hva slags belegg dette er. Matcher `material_type`-enumen som allerede finnes. |
| **WP** | Auto fra forfatterens profil, kan overstyres | Gir gratis skala-tilordning (§6.1). |
| Friksjoner, kvaliteter, skala, rom | **Valgfritt** | Tagging er analysearbeid og kan gjøres av dere i etterkant. Å kreve det av innleverer hever terskelen og senker kvaliteten (gale tagger er verre enn ingen). |

Det er hele formatet. Fire ting hvorav to fylles av systemet. Hver WP bestemmer selv *hva* de leverer (jf. at dette ikke kan avklares nå) — formatet sier bare hva et innlevert notat minimum må bære for å kunne brukes. Dagens skjema i QuickNotesPanel er allerede nær dette; endringen er å gjøre kildetype obligatorisk og alt annet eksplisitt valgfritt.

---

## 7. UX-gjennomgang

Prioritert etter effekt på brukeropplevelsen, ikke etter hvor lett det er å fikse. (Tilgjengelighet har eget kapittel, §8.)

**U1 — Førstemøtet etter innlogging er et redigeringsverktøy uten orientering.** *Problem:* default-redirect til `/admin` (`login/page.tsx:32`), logo låst til `/admin` (`Nav.tsx:99`), `/internal` mangler forside (404). *Hvorfor:* en ny bruker får ingen svar på «hva er dette, hva gjør jeg her» — dette er dokumentert som stedet brukerne falt fra. *Fiks:* `/internal` som landingsside med det som er nytt, inngangene, og én tydelig «Nytt notat»-handling (prompt 03).

**U2 — Intern tekst og verktøy lekker offentlig.** *Problem:* `/explore` viser admin-instruksjoner og knapp til `/admin` for utloggede; footer lenker dit; login-meta lover et kart som ikke finnes; testoppføringen «Apotek 1, Test fra Bjørn» ligger offentlig i Lesesalen; ressursfiler ligger i åpen bucket (alle med lenken kan laste ned pptx/docx fra kommunale partnere). *Hvorfor:* undergraver inntrykket av kontroll overfor akkurat de partnerne plattformen skal betjene, og bryter beslutning 8. *Fiks:* prompt 02 + manuelle steg (bucket, testrad).

**U3 — Fiksjon presentert som funn.** *Problem:* seed-fallback (§2) på `/frictions`, `/qualities`, `/index`, `/story`, `/solutions`, `/reading-room`; blandet med ekte navngitte personer. *Hvorfor:* ødelegger kildetillit — plattformens éneste valuta i et forskningsprosjekt. *Fiks:* fjern all seed + ærlige tomtilstander (ferdig tekst i prompt 02).

**U4 — Nodekartet mangler tomtilstand og forklaring.** *Problem:* ved 0 noder rendres en blank SVG uten tekst (`NodeMapClient.tsx:852–939`); sidepanelteksten «Ingen noder matcher filtrene» (:1539) er feil når korpuset er tomt; feiltilstand er en rå rød boks uten retry; delvise lastefeil svelges stille (`:527–535`). *Hvorfor:* primærvisningen er det første vinduet inn — et blankt lerret leser som «ødelagt», ikke «tidlig». *Fiks:* ekte tomtilstand med forklaring + retry (tekst i prompt 02/03).

**U5 — «Sjekker økt…»-blink på hver intern side.** *Problem:* dobbel gating — proxyen har allerede verifisert økten, så sjekker klient-`Gate` på nytt i `useEffect` (`admin/layout.tsx:17–70`, `internal/layout.tsx:17–70`). *Hvorfor:* hver sidelast føles treg og ustabil; det er plattformens «kroppsspråk». *Fiks:* fjern klient-gaten eller gjør den serverside (prompt 06).

**U6 — Feilmeldinger på rå engelsk fra Supabase.** *Problem:* `auth/reset/page.tsx:52`, `QuickNotesPanel.tsx:583/610/619`, `NodeMapClient.tsx:523`, `WelfareTechPanel.tsx:221` (som `alert()`); blandet norsk/engelsk («Note not found.», «No publications yet…», «Clear filters», «Frictions»/«Qualities»-overskrifter offentlig). *Hvorfor:* utrygghet og halvferdighet; login-siden har allerede vist riktig mønster (`authErrorMessage`, `login/page.tsx:46–90`). *Fiks:* samme mønster overalt (prompt 06).

**U7 — Redigeringsflatene er tette og uten skydd.** *Problem:* `/admin` er 2 338 linjer faner; 36 inputfelter, 8 med `required`; validering først ved lagring; `WelfareTechPanel` bruker native `confirm()` (:218) enda `InlineConfirm` finnes. *Hvorfor:* bryter «sleek og ryddig»-kravet der innholdet faktisk produseres. *Fiks:* lavthengende del i prompt 06; full admin-sanering er bevisst *ikke* prioritert nå (lite trafikk der før datainnsamlingen).

**U8 — Fire konkurrerende stilsystemer.** *Problem:* Punkt-tokens, Clay-lag, 158 Tailwind-arbitrary-rester (`[font-size:12px]` i 11 filer), hardkodede hex-farger, `FONT_STACK` duplisert i 8 filer. *Hvorfor:* hver ny flate arver tilfeldig stil; vedlikehold blir dyrere for hver måned. *Fiks:* konsolidering som del av opprydding (prompt 02, avgrenset — ikke full redesign).

**U9 — Grafalgoritmen skalerer ikke sosialt.** *Problem:* kanter genereres av første delte kategori inkl. skala/rom (`findShared`, `NodeMapClient.tsx:399–413`), `MAX_DEGREE` deklarert men aldri håndhevet (:100); innsikter får aldri friksjoner/kvaliteter i grafen (`insightToNode`, :366–371) og blir systematisk perifere. *Hvorfor:* grafen vil lyve om sammenhenger når korpuset vokser — akkurat det analysebordet ikke tåler. *Fiks:* prompt 03.

**Positivt som skal bevares:** den nye OTP-login-flyten er godt bygget (fokusflytting, `role="alert"`, norske feiltekster); søket degraderer pent til nøkkelord uten API-nøkkel; flere tomtilstander i admin er allerede gode («Ingenting her ennå. Bruk skjemaet …»).

---

## 8. Tilgjengelighet (WCAG 2.1 AA)

Kommunale partnere er bundet av forskrift om universell utforming; dette er krav, ikke polering. Prioritert:

**A1 — Nodegrafen er utilgjengelig med tastatur og skjermleser.** Nodene er `<g onClick>` uten `tabIndex`/`role`/tastaturhåndtering (`NodeMapClient.tsx:906–937`). Sidepanelets nodeliste er i praksis det tilgjengelige alternativet, men er ikke annonsert som det. *Krav 2.1.1.* Fiks: gjør listen til dokumentert ekvivalent («Vis som liste»), gi nodene tastaturnavigasjon der det er overkommelig.

**A2 — SkipToContent rendres aldri.** Komponent og CSS finnes (`SkipToContent.tsx`, `globals.css:281–298`) men brukes ingen steder; 12 av 17 ruter mangler `id="main-content"`. *Krav 2.4.1.* Fiks: render i rot-layout + anker på alle sider.

**A3 — Ingen fokusfelle i noen modal.** Tre dialoger med `role="dialog" aria-modal="true"` flytter ikke fokus inn, holder det ikke, returnerer det ikke, lukker ikke på Escape (`ExplorePageClient.tsx:525`, `WelfareTechClient.tsx:397`, `SearchClient.tsx:364`). *Krav 2.1.2, 2.4.3.*

**A4 — Statusendringer annonseres ikke.** Kun `InlineConfirm` har `aria-live`; «Søker…», «Lagrer…», «Laster…» er stumme for skjermleser. *Krav 4.1.3.* Fiks: felles status-komponent med `role="status"`.

**A5 — Ufullstendig kombobox.** `SuggestedCategoryInput.tsx:169` har `role="listbox"` uten `aria-activedescendant`/`aria-expanded`/`aria-controls`. *Krav 4.1.2.*

**A6 — Motstridende bildemerking + engelsk alt.** `page.tsx:712` har `aria-hidden` rundt `<img alt="Hero illustration">`; kun 5 alt-attributter i hele kodebasen. *Krav 1.1.1.*

**A7 — Skjemaetiketter.** Implisitte `<label>`-wrappere fungerer, men admin har titalls felter der koblingen bør verifiseres; `role="button"` uten tastaturstøtte i `admin/page.tsx:1699`. *Krav 1.3.1, 4.1.2.*

**Ikke verifisert:** kontrast (krever rendret side med faktiske farger — Punkt-paletten er i utgangspunktet god, men Clay-laget og hardkodede gråtoner som `#9a9a9a` på hvit bør måles), og faktisk skjermleseroppførsel. Anbefaler én manuell økt med VoiceOver + axe DevTools etter at prompt 06 er kjørt.

Alt over er samlet som akseptansekriterier i prompt 06.

---

## 9. Prioritert tiltaksliste

Rekkefølgen er styrt av to ting: hva som må være på plass **før datainnsamlingen starter** (terskel: en WP1-forsker skal kunne logge inn, forstå hva hun ser, og levere et anonymisert notat uten å møte fiksjon, lekkasjer eller blindveier), og hva som bygger analysebordet dere to trenger gjennom høsten.

**Må gjøres før datainnsamlingen starter:**

1. **Opprydding og lekkasjetetting** (prompt 02 + manuelle steg). Seed-fiksjonen ut (inkl. de ekte personene i `seed-data.ts:166–237`), `/explore` og `/index` bort, testinnhold ut av Lesesalen, bucket-strategi avklart (se Løse tråder), ærlige tomtilstander inn. *Begrunnelse: tillit er forutsetningen for alt annet; dette er også eneste punkt med utside-eksponering.*
2. **OTP fullføres og committes** (prompt 01 + to manuelle dashboard-steg + SMTP). *Begrunnelse: koden ligger ukommittert på en agent-branch; til malbyttet er gjort er kodefeltet dødt i produksjon — verre enn dagens passordflyt.*
3. **Intern forside + omlegging av landingspunkt** (prompt 03, del 1). *Begrunnelse: førstemøtet er dokumentert frafallspunkt (U1).*
4. **Anonymiseringsregelen i grensesnittet** (prompt 05). *Begrunnelse: må stå der fra første ekte notat — den kan ikke ettermonteres på innhold som allerede er skrevet feil.*

**Bygger analysebordet (høst 2026, i rekkefølge):**

5. **Nodekart som primærvisning + friksjoner/kvaliteter på samme korpus + skala-løsningen** (prompt 03). *Begrunnelse: beslutning 2 og 4 er ikke reelle før visningene leser samme data; i dag viser to av tre visninger fiksjon eller ingenting.*
6. **Tråder + statusmerking + vendinger-logg** (prompt 04). *Begrunnelse: skillet mellom arkiv og analysebord; trenger ikke vente på mye data, dere har 17 notater å prøve det på.*
7. **Tilgjengelighet og feedback-tilstander** (prompt 06). *Begrunnelse: forskriftskrav og kvalitetsfølelse; mest verdt når flatene over er stabile — men A1–A3 kan gjerne tas tidligere om det passer.*

**Kan vente / annen kanal:**

8. Sårbarheter: `npm audit fix` for `ws` + `protocol-buffers-schema` (sistnevnte forsvinner uansett med maplibre); `sharp` krever Next 16.3-oppgradering — ta den som egen, liten PR. Lav praktisk eksponering i dag (bildeoptimalisering, websockets i dev).
9. Intake-avklaring med WP-ledere (arket i §6.6) — menneskearbeid, ikke kode.
10. Flerspråklighet (prioritet 2, jf. beslutning 9), husgjennomskjæring som mikro-inngang, admin-sanering, `/for-municipalities`-innhold: fase 2.

---

## 10. Løse tråder — verifisert status

| Sak | Status etter verifisering |
|---|---|
| `0003_suggestion_usage.sql` muligens ikke kjørt | **Kjørt — kan lukkes.** Tabellen `suggestion_usage` finnes i produksjon (4 rader), RPC `increment_suggestion_usage` finnes, RLS-policyer på plass. Merk: navnet finnes ikke i Supabase sin migrasjonshistorikk (som har andre navn enn repoets filer) — repoets migrasjonsmappe og faktisk historikk har glidd fra hverandre generelt, og `0007_*` finnes i to varianter med samme prefiks. Verdt en oppryddingsnotis, men ingen manglende funksjonalitet. |
| `ANTHROPIC_API_KEY` mangler i `.env.local` og Netlify | **Delvis utdatert.** Nøkkelen *er* definert i lokal `.env.local` (kun variabelnavn lest). Netlify-miljøvariablene kunne ikke leses med tilgjengelige MCP-verktøy — **manuell sjekk i Netlify-dashboardet gjenstår.** Uten den er AI-forslagsknappen skjult i produksjon (uten forklaring — `FormPrimitives.tsx:95` returnerer `null`). |
| `package.json`/`package-lock.json` committet med `@anthropic-ai/sdk` | **Lukket.** Committet siden `55e701d` (18. mai). |
| Fem npm audit-sårbarheter | **Bekreftet: 1 moderate + 4 high** (`sharp` via Next — krever `next@16.3`; `ws` ×2; `protocol-buffers-schema` via maplibre). Anbefaling i §9 pkt. 8. |
| Egen SMTP før OTP-utrulling | **Utestående.** Ingen spor av SMTP-konfig i repo. Anbefaler Resend (enkleste DNS-oppsett, EU-region tilgjengelig); Postmark likeverdig. Konfigureres i Supabase Auth → SMTP. Uten dette gjelder Supabase sine rate-limits (~2 e-post/time), som ikke overlever en OTP-utrulling til 20 brukere. |
| Supabase e-postmal `{{ .ConfirmationURL }}` → `{{ .Token }}` | **Kan ikke verifiseres fra kode — manuelt dashboard-steg.** Kritisk: til dette er gjort sender `signInWithOtp` en lenke, og hele kodefeltet i den nye login-siden er dødt. Står som første manuelle steg i prompt 01, sammen med «Allow new users to sign up: off». |

**Nye løse tråder funnet i gjennomgangen:**

- **Branch-tilstand:** repoet står på `agent/aapne-innganger` med OTP-arbeidet *ukommittert* og agent-commiten `5ceb495` umerget. Produksjon (`main`, deploy 30. juni, `f570474`) er ren. Avklar: skal agent-commiten PR-es inn, og OTP-endringene committes på egen branch? En `.git/index.lock` ligger også igjen.
- **Åpne buckets:** `resource-files` og `welfare-tech-images` er `public: true` (19 objekter totalt). Kolliderer med beslutning 8 når Lesesalen flyttes bak innlogging — filene må da over på privat bucket med signerte URL-er (migrasjonssteg i prompt 02s manuelle liste).
- **RLS vs. flat redaksjon:** `quick_notes` og `insights` tillater UPDATE kun for forfatter (+admin for notater). Det motsier «alle kan skrive og redigere». Anbefaler å utvide UPDATE til alle autentiserte — men det er en RLS-endring og ligger derfor hos deg, ikke i noen prompt.
- **Supabase security advisors:** tre SECURITY DEFINER-funksjoner er kallbare av `anon` (`flag_insight_for_design`, `handle_new_user`, `increment_suggestion_usage`), `search_path` er mutabel på tre funksjoner, `vector`-utvidelsen ligger i public-skjemaet, lekkasjebeskyttelse for passord er av. Ingen akutt eksponering funnet, men `increment_suggestion_usage` bør minst få `EXECUTE` revokert for `anon`.
- **E-postagenten:** `docs/email-agent.md` beskriver en autonom agent med GitHub-PAT i klartekst i `.git/agent-credentials` og lov til å pushe direkte til `main` → auto-deploy. Utløses av innkommende e-post — en reell prompt-injeksjonsflate der grensene håndheves av modellen selv. Anbefaler: agenten skriver alltid til branch + PR, aldri direkte til `main`.
- **Kontaktdata:** ~20 navngitte personer med e-postadresser hardkodet på offentlig forside (`page.tsx:84–136`), og navnefeil i fallback-teamlista (`People.tsx:26–28`: duplikat-id `marit-haldar`, Carolinas navn på feil id) samt «Tony Sandseth/Sandset»-inkonsistens på forsiden (søknaden skriver **Tony Sandset**, rådgivningsgruppe — ikke WP1-leder). Rettes i prompt 02.

---

## 11. Åpne spørsmål til deg

1. **Offentlig taksonomi eller ikke?** Jeg anbefaler å flytte `/frictions` og `/qualities` bak innlogging (§3). Men det finnes et formidlingsargument for å la *begrepene* (uten historier) stå offentlig — søknaden lover en plattform som «showcaser» funn utad på sikt. Trenger din avgjørelse før prompt 02 kjøres: alternativ A = alt bak innlogging (min anbefaling nå, revurder i 2027), B = begrepssidene offentlige uten historier.
2. **Lesesalen og buckets:** Skal *alle* dagens 14 ressurser bak innlogging, eller er noen (policy-notatene?) ment offentlige? Avgjør om `resource-files` kan gjøres privat i én operasjon eller må splittes i to buckets.
3. **RLS-endringen for flat redigering** (§10): vil du at alle innloggede skal kunne redigere alle notater/innsikter? Jeg anbefaler ja, men det endrer attribusjon — vurder om `updated_by` bør legges til samtidig.
4. **Skala-etiketter:** «Hjemmet / Tjenestene / Systemet» i stedet for «Inne i hjemmet / Nabolaget / Byen» — ok? (Konsekvens: makro rommer transnasjonalt, jf. §6.1.)
5. **`welfare-tech`-katalogen:** intern eller offentlig? 36 oppføringer uten bilder ser uferdig ut offentlig; internt er den et greit arbeidsverktøy. Jeg har lagt den internt i IA-forslaget.
6. **E-postagentens skriverettigheter** (§10): kan jeg stramme instruksen til branch+PR-only i en senere kjøring?
7. **Netlify-miljøvariabler:** kunne ikke leses herfra — bekreft at `ANTHROPIC_API_KEY` (og evt. `OPENAI_API_KEY`) er satt i produksjon, ellers er AI-forslag og semantisk søk stille av der.
8. **Navnene på forsiden:** «NORFOK» som finansiør-betegnelse ser ut som en feil (Forskningsrådet bekrefter tildelingen under eget navn); og Sandset-rollen må rettes. Vil du at prompt 02 retter tekstene, eller vil du formulere dem selv?

---

## 12. Beslutninger — status 13. august 2026

Avklart med Bjørn i økten 13. august. Prompt 02 er ikke lenger blokkert.

| § | Spørsmål | Beslutning |
|---|---|---|
| 11.1 | Offentlig taksonomi? | **Alternativ A — alt bak innlogging.** `/frictions`, `/qualities`, `/reading-room`, `/welfare-tech`, `/story/[id]`, `/solutions` flyttes til `/internal`. Revurderes i 2027. |
| 11.2 | Lesesalen og buckets | **Alt privat i én operasjon.** `resource-files` gjøres privat i sin helhet; filer serveres med signerte URL-er. Ingen splitt i to buckets. |
| 11.5 | `welfare-tech`-katalogen | **Intern.** Flyttes til `/internal` som arbeidsverktøy. |
| 11.8 | Tekstrettelser på forsiden | **Agenten retter etter søknaden** («Transnational homecare.Final»): Sandset-navn og -rolle, NORFOK-betegnelsen. Diffen legges fram for godkjenning før commit. |

**Fortsatt åpne** (blokkerer ikke prompt 02): 11.3 RLS for flat redigering, 11.4 skala-etikettene, 11.6 e-postagentens skriverettigheter, 11.7 Netlify-miljøvariabler.

### Allerede utført siden gjennomgangen

- **Prompt 01 (OTP) er ferdig og committet** på `feat/otp-login`, basert på `main` — ikke på `agent/aapne-innganger`. Ukjent-e-post-flyten er verifisert mot produksjons-Supabase: den returnerer faktisk en distinguerbar feil, så teksten «Vi fant ingen bruker» lyver ikke (lukker usikkerhet 1 i `99-kjorerapport.md`). De to manuelle dashboard-stegene og SMTP gjenstår hos Bjørn.
- **`.git/index.lock`** (§10, ny løs tråd) er fjernet.
- **Duplikat-id-en i `People.tsx`** (§10, «Kontaktdata») er rettet — Carolina og Tony har nå egne id-er, og React-advarselen er borte. Merk: kun *id-ene* er rettet. Navneformen «Tony Sandseth» og rollen «WP1-leder» står fortsatt feil begge steder (`People.tsx:28`, `page.tsx:97` har «Tony Joakim Ananiassen Sandset», WP1) og hører til prompt 02 sammen med de øvrige tekstrettelsene.
- **Branch-spørsmålet** (§10) er delvis avklart: OTP ligger på egen branch. Om agent-commiten `5ceb495` på `agent/aapne-innganger` skal PR-es inn i `main` er fortsatt uavklart.
