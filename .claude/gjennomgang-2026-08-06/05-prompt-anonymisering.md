# Claude Code-prompt 05: Anonymisering i grensesnittet

## Kontekst

SAFE@HOME samler kvalitativt materiale om eldre med innvandrerbakgrunn. Rådata (opptak, transkripsjoner) hører hjemme i TSD; plattformen skal bare inneholde polerte, anonymiserte versjoner. Sikt og REK har godkjent opplegget. Men «dataene skal være anonyme» er i dag en intensjon uten mekanisme — regelen skal inn i grensesnittet, der den møter folk. Samtidig: materialet må kunne beskrive omtrentlig alder, opprinnelsesland og område for å ha analytisk verdi — regelen er en minstestandard, ikke sterilisering. Den reelle faren er kombinasjonsrisiko: bydel + alder + landbakgrunn + en spesifikk livshendelse kan identifisere selv om hvert felt er uskyldig.

Tre mekanismer bygges: (1) en kort regel ved skrivefeltet, (2) en bekreftelse ved publisering, (3) en minimal automatisk varsling. Alt skal føles lett — ingen skjemabelastning, ingen blokkering.

Stack: Next.js 16 App Router (nyere enn treningsdataene — les `.claude/AGENTS.md` ved behov), Punkt-tokens. Berører primært `QuickNotesPanel`, innsikt-skjemaet i `/admin`, og publiseringsflyten for historier/ressurser.

## Ikke rør

- Datamodellen — ingen nye tabeller eller kolonner (bekreftelsen lagres ikke; den er et redaksjonelt øyeblikk, ikke et revisjonsspor)
- Auth, proxy, RLS
- Ingen eksterne API-kall eller nye avhengigheter — sjekken er ren klientside-regex

## Undersøk dette først

1. Finn alle flater der fritekst om feltmateriale skrives: `QuickNotesPanel` (notater), innsikt-skjema og historie-/ressursredigering i `src/app/admin/page.tsx`, ev. kommentarfelt. Regelen skal stå ved *alle* skriveflater for feltmateriale, men bekreftelsen kun ved publisering til delte flater.
2. Se hvordan hjelpetekster/hints er stilet i dag (`FormPrimitives.tsx`, `Field.tsx`) — gjenbruk mønsteret.
3. Sjekk hvor «publiser»-handlingene bor (published-toggle for historier/ressurser; lagring av notat er *ikke* publisering i denne forstand — notater er interne, men synlige for hele gruppen, så de får regel + varsling, ikke bekreftelse).

## Gjør

**A. Regelen ved skrivefeltet** — komponent `AnonymityHint`, plassert rett under fritekstfeltet, alltid synlig i kompakt form:

> **Skriv så ingen kan gjenkjennes.** Aldersspenn, ikke alder («i 70-årene»). Landbakgrunn, ikke landsby. Bydel, ikke adresse. Ingen navn — heller ikke fornavn.

Med en «Hvorfor?»-lenke som ekspanderer (details/disclosure, ikke modal):

> Rådata hører hjemme i TSD. Her ligger bare det som trygt kan deles med hele prosjektgruppen. Husk at *kombinasjonen* kan røpe det enkeltfeltene skjuler: bydel + alder + landbakgrunn + én spesifikk hendelse kan være nok til å peke på én person. Er du i tvil — gjør detaljen grovere eller utelat den.

Typografisk: liten, dempet tekst (Punkt `--pkt-color-text-subtle`-nivå), fet kun på første setning. Skal ikke konkurrere med feltet.

**B. Bekreftelsen ved publisering** — én avkryssing i publiseringsflyten for historier og ressurser (der `published` settes til true første gang):

> ☐ Ingen enkeltperson kan gjenkjennes i dette — heller ikke gjennom kombinasjonen av detaljer.

Publiser-knappen er deaktivert til boksen er krysset av. Ved *re*-publisering av allerede publisert innhold: ikke spør igjen. Ikke lagre avkryssingen.

**C. Automatisk varsling** — funksjon `checkAnonymity(text): Warning[]` i `src/lib/anonymity.ts`, kjørt debounced (~800 ms) på fritekstfeltene. Tre mønstre, ikke flere:

1. **Fødselsnummer:** 11 sifre på rad (tillat mellomrom etter 6): `/\b\d{6}\s?\d{5}\b/`
2. **Gateadresse:** `/\b[A-ZÆØÅ][a-zæøåé]+(?:s)? ?(?:gate|gata|vei|veien|vegen|allé|alle|plass|terrasse|tun)\s?\d+/`
3. **Eksakt fødselsår:** `/\bfødt (?:i )?(19[2-6]\d)\b/i` og `/\b(19[2-6]\d)-modell\b/i`

Varseltekst (rolig, under feltet, `role="status"`, gul Punkt-varselfarge, aldri blokkerende):

> Dette ligner {en adresse / et fødselsnummer / et eksakt fødselsår}: «{match}». Sjekk en ekstra gang før du lagrer.

Ingen NER, ingen navnelister, ingen API — falske positiver i norsk fritekst vil lære folk å ignorere varselet, og da er det verre enn ingenting. Skriv 5–6 enhetstester for regexene (positive + negative: «i 70-årene» skal ikke varsle; «Karl Johans gate 22» skal).

**D. Én linje i intake-dokumentasjonen:** legg regelteksten (A, kompaktversjonen) også inn som statisk tekst i onboarding-/hjelpeflaten hvis en slik finnes; ellers dropp — ikke bygg ny hjelpeside for dette.

## Manuelt (Bjørn)

- Les korrektur på de tre tekstene over — de er skrevet for å være ferdige, men tonen er din å justere.
- Vurder med Sikt/DMP-ansvarlig om bekreftelsen bør *logges* (hvem krysset av, når). I så fall er det en liten migrasjon — bevisst utelatt her for å holde det lett.

## Akseptansekriterier

- Regelen er synlig ved hvert fritekstfelt for feltmateriale, uten å måtte åpnes; «Hvorfor?» ekspanderer uten sidebytte; alt på bokmål.
- Å skrive «Hun er født 1943 og bor i Snarøyveien 12» gir to varsler mens man skriver; å skrive «Hun er i 80-årene og bor i Bydel Alna» gir ingen.
- Varsler blokkerer aldri lagring; de forsvinner når teksten rettes.
- Første gangs publisering av historie/ressurs krever avkryssing; re-publisering gjør ikke; ingenting lagres om avkryssingen.
- Skjermleser får varslene via `role="status"`; avkryssingen er et ekte `<input type="checkbox">` med label.
- Enhetstestene for `checkAnonymity` kjører grønt; `npm run lint` grønt; ingen nye avhengigheter.
