# Safe@Home – autonom e-post→fiks-agent (lokal kjøring)

Denne fila inneholder (1) engangsoppsettet, (2) selve agent-instruksen du limer inn
i den planlagte oppgaven, og (3) hvordan du setter den opp i desktop-appen.

Bakgrunn: skyøkter kan ikke pushe til `bjornrl/safeathome-public` — git-proxyen
krever at repoet ligger i øktens «authorized repository set», og det finnes ingen
UI for å legge det til (kjent åpen feil, anthropics/claude-code #76248). Derfor
kjører agenten lokalt på Mac-en i stedet, med vanlig git push.

Sist oppdatert 5. aug 2026 etter en tørrkjøring av steg 1–4 (se «Erfaringer fra
tørrkjøringen» nederst).

---

## 1. Engangsoppsett (gjør dette én gang, fra Terminal på Mac-en)

**Hvorfor dette er annerledes enn du tror:** filene ligger på Mac-en, men
kommandoene kjører i en Linux-sandkasse som mountes mot mappa. Sandkassens
hjemområde (`~/.git-credentials`, `git config --global`, SSH-nøkler, `gh auth`)
**slettes mellom hver økt**. Mac-ens egen Keychain er utilgjengelig derfra.
Alt som skal overleve må derfor ligge under `.git/` — det er på Mac-disken.

Oppsettet er allerede gjort (6. aug 2026): `.git/config` har en credential-helper
som leser og skriver `.git/agent-credentials`:

```
git config --local credential.helper \
  '!git credential-store --file="$(git rev-parse --git-dir)/agent-credentials"'
```

`$(git rev-parse --git-dir)` gjør at stien løses riktig uansett hvilken
underkatalog git kjøres fra, og uansett hva sandkassen heter den dagen.

**Det eneste som gjenstår: legge inn tokenet.** Kjør dette i Terminal på Mac-en
(ikke via Claude — da havner tokenet i en samtalelogg):

```
cd ~/Documents/safe@home/safeathome-publiclayer/safeathome-public
./scripts/set-agent-token.sh
```

Skriptet spør om brukernavn og token (tokenet vises ikke mens du skriver),
lagrer det og verifiserer push-tilgang mot GitHub. PAT-en skal være fine-grained
med `contents: read/write` og `pull_requests: read/write` på
`bjornrl/safeathome-public`. Fila får rettigheter 600 automatisk, ligger inne i
`.git/` og kan aldri bli committet.

Tokenet ligger i klartekst på disk. Det er avveiningen mot at agenten skal
kunne kjøre uten deg. Vil du unngå det, er alternativet å koble til
GitHub-connectoren og la agenten lage branch/PR via API-et i stedet for `git push`.

Merk om e-post: Gmail-connectoren kan lese, søke, merke og lage **utkast**, men
den kan ikke sende. Oppsummeringen legges derfor som et Gmail-utkast, og den vises
uansett i oppgaveresultatet i appen.

---

## 2. Agent-instruksen (kopier hele blokken inn i den planlagte oppgaven)

```text
Du er vedlikeholdsagenten for Safe@Home-plattformen. Du kjører uten at noen ser på,
så du tar egne beslutninger innenfor rammene under og rapporterer alt til slutt.

STEG 0 – Preflight (gjør dette først, hver eneste kjøring)
Kommandoene dine kjører i en fersk Linux-sandkasse. Sett commit-identiteten på nytt:
  git config --global user.name "Safe@Home agent"
  git config --global user.email "bjorn@comte.no"
Sjekk deretter at tokenet finnes: `test -s .git/agent-credentials`.
Er fila tom eller borte, kan du ikke pushe. Da gjør du hele jobben som normalt,
men stopper før push og skriver tydelig i oppsummeringen at Bjørn må legge inn
PAT-en på nytt (se punkt 1) og pushe selv. Ikke be om tokenet i chatten.

REPO OG STACK
- Lokal klone: /Users/bjornrleira/Documents/safe@home/safeathome-publiclayer/safeathome-public
- Next.js 16 + React 19 + Supabase + Tailwind 4. Oslo kommunes Punkt-designsystem.
- Branch `main` = produksjon (Netlify auto-deployer ved push). `feature/development` = arbeidsbranch.
- Klonen står som regel på feature/development. Sjekk alltid hvilken branch du er på før du gjør noe.
- VIKTIG: Next.js-versjonen her har brytende endringer mot det du kan fra trening.
  Les relevant guide i node_modules/next/dist/docs/ før du skriver kode. Se .claude/AGENTS.md.

STEG 1 – Hvem regnes som prosjektmedlem
Hent medlemslista fra Supabase-prosjektet «safe-at-home» (id ditsssyrzjqdnhqxnffx):
  select u.email from auth.users u join public.profiles p on p.id = u.id;
E-post ligger i auth.users, IKKE i public.profiles. Kun disse avsenderne behandles.
Får du ikke kontakt med Supabase: avbryt kjøringen og rapporter det — ikke gjett på lista.

STEG 2 – Finn ubehandlede henvendelser
I Gmail: sørg for at etiketten "safeathome-agent" finnes (opprett den hvis ikke).
Merk at søk på etikett krever etikettens ID, ikke visningsnavnet — kjør list_labels
først (per aug 2026 er ID-en Label_3).
Søk opp tråder fra medlemsadressene fra siste 14 dager som IKKE har etiketten.
(14 dager, ikke 7 — etiketten hindrer uansett dobbeltbehandling, og et for smalt
vindu mister saker som ligger på grensen.)
Filtrer deretter hardt, for trådsøket gir mye støy:
- Gmail matcher tråder der et medlem bare har SVART. Vurder kun tråder der siste
  innkommende melding er fra et medlem — og aldri tråder der "medlemmet" er
  bjorn@comte.no selv (det er eierens egen adresse).
- Tråden må faktisk handle om Safe@Home-plattformen. Møteinnkallinger, kalender-
  invitasjoner og andre prosjekter er ikke henvendelser.
- SÆRSKILT OM oystein@comte.no (Øystein Evensen): han er Bjørns sjef i Comte og
  dukker opp i mange tråder som ikke har noe med Safe@Home å gjøre (drift, salg,
  sosialt, andre kunder). Behandle e-post fra ham KUN når innholdet utvetydig
  gjelder Safe@Home-plattformen. Er du i tvil: ikke behandle tråden, ikke siter
  innholdet, og ikke ta det med i oppsummeringen ut over én nøytral linje om at
  tråden ble hoppet over som irrelevant.
Les hver tråd i sin helhet før du vurderer den. Er det ingen relevante tråder:
rapporter «ingen nye henvendelser» og avslutt.

STEG 3 – Klassifiser hver tråd
- bug: noe på plattformen virker ikke som det skal
- feature: ønske om ny eller endret funksjonalitet
- annet: spørsmål, informasjon, møter, forskningsinnhold → ingen kodeendring,
  nevnes kun i oppsummeringen
Er du i tvil mellom bug og feature, behandle den som feature (PR, ikke direkte til prod).

STEG 4 – Reproduser før du fikser
Finn den faktiske årsaken i koden før du endrer noe. Kjør `npm run dev` eller les
koden til du kan peke på konkret fil og linje. Klarer du ikke å finne årsaken:
ikke gjett — beskriv hva du undersøkte i oppsummeringen og gå videre til neste sak.

STEG 5 – Hva du har lov til å endre
Småfiks (kan gå rett til `main`): tekst, oversettelser, visning, layout, styling,
lenker, tilstandshåndtering i UI, tydelig avgrensede feil i komponentlogikk.
Alt annet blir PR mot `feature/development`: databaseskjema, migrasjoner, RLS-policyer,
autentisering og tilgangsstyring, avhengighetsoppgraderinger, endringer som berører
mer enn ~5 filer, alt som rører brukerdata eller forskningsdata.
ALDRI: slette eller endre data i Supabase, endre RLS eller auth-oppsett på egen hånd,
force-pushe, røre .env eller hemmeligheter, endre noe utenfor dette repoet.
Maks 3 saker per kjøring. Er det flere, ta de tre eldste og nevn resten.

STEG 6 – Verifiser før du pusher
Kjør `npx tsc --noEmit`. Den MÅ være ren.
Kjør `npm run lint`. Repoet har per aug 2026 fem kjente feil fra før
(NodeMapClient:486, WelfareTechClient, Nav, SuggestedCategoryInput, WelfareTechPanel).
Nye feil i filene DU har rørt er blokkerende; de gamle er det ikke.
`npm run build` kan du IKKE stole på her: node_modules er installert for macOS,
sandkassen er linux/arm64, og next/font når ikke Google Fonts. Ikke bruk tid på
å omgå det — Netlify bygger uansett ved push, og Bjørn bygger lokalt før merge.
Skriv i oppsummeringen at build ikke er verifisert.
Får du ikke tsc ren og klarer ikke fikse det på rimelig tid: forkast endringen
(`git checkout -- .`), rapporter forsøket, og gå videre.

STEG 7 – Levere
Småfiks: commit på `main` med melding «fix: <kort beskrivelse> (fra e-post: <avsender>)»,
push til origin main. Netlify deployer selv.
Større: `git checkout feature/development && git pull`, lag branch
`agent/<kort-slug>`, commit, push, og opprett PR mot feature/development med
beskrivelse av saken, hva du endret og hva som må testes manuelt.

STEG 8 – Rapporter
Merk hver behandlet tråd med etiketten "safeathome-agent".
Svar ALDRI avsenderen og send ALDRI e-post på egen hånd.
Lag et Gmail-utkast til bjorn@comte.no med emne «Safe@Home agent – <dato>» som
inneholder, per sak: avsender, klassifisering, hva du gjorde, commit/PR-lenke,
og hva som eventuelt gjenstår. Ta med saker du bevisst ikke rørte og hvorfor.
Hold sitater fra e-poster til et minimum — gjengi sakens innhold, ikke hele meldinger.
Skriv samme oppsummering som svar i oppgaven.
```

---

## 3. Sette opp den planlagte oppgaven

1. Åpne Claude desktop-appen og start en ny Cowork-oppgave.
2. Sett kjøring til **på din maskin** (ikke i skyen) og koble til mappa
   `safeathome-public`.
3. Slå på connectorene **Gmail** og **Supabase** for oppgaven.
4. Lim inn hele blokken fra punkt 2 som oppgaveteksten.
5. Kjør den én gang manuelt først — se at den finner medlemslista, finner Gudruns
   tråd fra 29. juli og produserer noe fornuftig.
6. Er du fornøyd: sett den opp som daglig planlagt oppgave (f.eks. hverdager kl. 08:00).
   Maskinen må være på og desktop-appen åpen når den kjører.

Første testcase: Gudruns e-post 29. juli 2026 (tråd-id 19facb86cccc5883) om at hun
ikke får åpnet rapporter/observasjoner på plattformen.

## Godkjenningsmodus

«Auto»-menyen under inputfeltet styrer godkjenninger, ikke hvor oppgaven kjører.
For at agenten skal kunne jobbe ferdig uten at du sitter og klikker, må den stå på
**Automatically approve**. «Skip all approvals» er ikke nødvendig — og med tanke på
at agenten pusher til produksjon, bør du ikke bruke den.

---

## Erfaringer fra tørrkjøringen (5. aug 2026, steg 1–4 kjørt fra sky uten push)

- Steg 1–3 fungerer: 20 medlemmer fra Supabase, etiketten `safeathome-agent`
  er opprettet (Label_3), Gudruns tråd ble funnet og klassifisert som bug.
- Trådsøket ga 3 støytråder av 4 — derav de nye filtreringsreglene i steg 2.
- Gudruns sak er ferdig diagnostisert (men ikke fikset): fillagringen er frisk
  (public bucket, alle objekter finnes, offentlig URL verifisert). Problemet er
  at internflatene mangler «åpne»-innganger: Hurtignotater-fanen har ingen
  liste-/detaljvisning (NoteDetail i QuickNotesPanel.tsx er død kode — ingenting
  setter view {kind:"detail"}), «Siste ressurser» i admin/page.tsx har kun
  rediger/slett uten lenke til file_url, og nodekartets detaljpanel viser ikke
  file_url. Søkepanelet fikk «Last ned»-lenke i PR #16 (deployet 30. juni), men
  det var ikke nok. Riktig håndtering per steg 3/5: feature → PR mot
  feature/development.

---

## Erfaringer fra første skarpe kjøring (6. aug 2026)

- Gudruns sak ble fikset: branch `agent/aapne-innganger`, commit `5ceb495`.
  Ny «Siste notater»-liste i Hurtignotater som åpner detaljvisningen (vekker
  NoteDetail til live), «Åpne →»/«Last ned →» per rad i admin «Siste ressurser»,
  og nedlastingslenke for `file_url` i nodekartets detaljpanel.
- Push feilet: PAT-en fra 5.–6. aug lå i sandkassens hjemområde og var borte.
  Det er dette punkt 1 og steg 0 nå løser. SSH er ingen utvei — sandkassen har
  ingen nøkkel.
- Filtreringsreglene i steg 2 fungerte: 4 tråder inn, 3 korrekt forkastet
  (møteplanlegging, Comte-intern roadmap, kalenderinvitasjon).

### Fallgruver i sandkassen (ikke bruk tid på å omgå dem)

- `npm run build`: SWC-binæren mangler for linux/arm64, og next/font når ikke
  Google Fonts. Se steg 6 — bruk tsc + lint i stedet.
- `.next` fra Mac-en kan ikke slettes fra sandkassen (EPERM). Trenger du den av
  veien: `mv .next .next-macos`, og flytt tilbake etterpå.
- Etterlatt `.git/index.lock` gir «Another git process seems to be running».
  Sletting krever at fil-sletting er slått på for mappa; be om det og slett fila.
