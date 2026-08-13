# Claude Code-prompt 03: Intern forside + nodekart som primærvisning + friksjoner/kvaliteter på samme korpus

## Kontekst

safe@home er et analysebord for to analytikere (Bjørn, Øystein) med vinduer inn for resten av prosjektgruppen. MapLibre-kartet er fjernet permanent; D3-nodekartet (`src/app/internal/nodes/NodeMapClient.tsx`, ~1 790 linjer, kraftsimulering) har arvet rollen som primærvisning. Beslutning: nodekartet, `/frictions`-siden og `/qualities`-siden skal vise **samme materiale** (quick_notes + insights + ressurser), presentert ulikt. Mikro/meso/makro beholdes som analytiske nivåer, men har mistet sin romlige metafor — løsningen under gir dem kropp igjen uten geografi.

I dag: brukere lander i `/admin` (redigeringsverktøy) etter innlogging; `/internal` har ingen forside (404); `/frictions` og `/qualities` leser `public_stories` med et koordinatfilter som gjør ekte innhold usynlig. Datainnsamlingen starter høsten 2026 — korpuset er lite (17 notater), så tomtilstander og småkorpus-oppførsel er viktigere enn skalering akkurat nå, men kantlogikken skal ikke lyve når korpuset vokser.

Stack: Next.js 16 App Router (nyere enn treningsdataene dine — les `.claude/AGENTS.md` og `node_modules/next/dist/docs/` ved behov), Supabase med RLS, D3, Punkt-designtokens. Prompt 02 (opprydding) bør være kjørt først, men denne kan kjøres uavhengig.

## Ikke rør

- Datamodellen: ingen nye tabeller, ingen migrasjoner
- Auth, `src/proxy.ts` (`/internal/*` er allerede beskyttet)
- Challenges-pipelinen
- Punkt-tokens; ingen nye avhengigheter (D3 og framer-motion finnes)
- Søket (`/internal/search`) — fungerer

## Undersøk dette først

1. Les hele `NodeMapClient.tsx` — særlig `findShared` (:399–413), kantbyggingen (:575–619), `computeForceLayout` (:176–238), `FilterState` (:303–308) og `insightToNode` (:353–397). Merk: `MAX_DEGREE = 4` (:100) er deklarert men aldri brukt; `selectedIdRef.current = selectedId` (:486) er tilordning under render (kjent lint-feil).
2. Se på dagens datainnlasting (:507–535): seks spørringer, asymmetrisk feilhåndtering (ressursfeil svelges stille).
3. Les `SCALES` i `src/lib/constants.ts:234–249` og hvordan `map_scale` brukes i notater (16 av 17 har verdi).
4. Sjekk hva `/frictions` og `/qualities` leser i dag (`getMapStories` i `queries.ts:29–40`) og hva de burde lese.

## Gjør

**A. `/internal` — ny forside og landingspunkt**

1. Opprett `src/app/internal/page.tsx` (serverkomponent): kort velkomst («Analysebordet for SAFE@HOME»), tre kolonner — *Siste notater* (5 nyeste `quick_notes` med forfatter og dato), *Innganger* (Nodekart / Friksjoner / Kvaliteter / Søk, med én setnings forklaring hver), *Status* (antall notater, innsikter, tråder når de finnes). Én global linje under tittelen: «Alt her er arbeid under utvikling.» Tomtilstand hvis 0 notater: «Ingen notater ennå. Det første som legges inn, dukker opp her.»
2. Endre default-redirect etter innlogging fra `/admin` til `/internal` (`safeRedirect()` i `src/app/login/page.tsx:32`) og logo-målet for innloggede fra `/admin` til `/internal` (`Nav.tsx:99`).
3. Legg en global «Nytt notat»-knapp i intern-navigasjonen som åpner hurtignotat-flyten (gjenbruk `QuickNotesPanel`-skjemaet — vurder å trekke selve skjemaet ut som delt komponent i stedet for å duplisere).

**B. Mikro/meso/makro: vertikal lagdeling + filter (vedtatt løsning)**

4. I kraftsimuleringen: legg til `forceY` per skala — makro-noder mot øvre bånd, meso mot midten, mikro mot nedre (svak styrke ~0.08–0.12; noder uten skala uten y-kraft). Tre diskrete båndetiketter i venstre marg: **«Systemet»**, **«Tjenestene»**, **«Hjemmet»** (nye etiketter, erstatter «Byen/Nabolaget/Inne i hjemmet» i `SCALES` — oppdater `constants.ts`, behold nøklene `macro/meso/micro`).
5. Legg skala til som filter i `FilterState` og filterpanelet (tre chips), på linje med friksjoner/kvaliteter/WP.
6. **Fjern `map_scale` og `house_theme` fra kantlogikken** i `findShared`: kanter skal bare oppstå av delt friksjon, kvalitet, work package eller feltsted. Skala vises som posisjon (båndet), ikke som kobling.
7. Håndhev `MAX_DEGREE` (4) for *auto-utledede* kanter (manuelle koblinger fra `note_connections` teller ikke mot taket): behold de sterkeste kantene per node målt ved `categorySimilarity`.

**C. Nodekartets robusthet**

8. Ekte tomtilstand ved 0 noder: sentrert tekst i SVG-flaten — «Ingen notater ennå. Datainnsamlingen starter høsten 2026. Det som legges inn, dukker opp her som noder.» Skill tomt korpus fra tomt filterresultat (da: «Ingen noder matcher filtrene» + «Nullstill filtre»-knapp).
9. Feiltilstand med «Prøv igjen»-knapp; delvise lastefeil (ressurser/koblinger) skal vises som diskret varsel («Noe av materialet kunne ikke lastes»), ikke svelges.
10. Fiks `selectedIdRef`-tilordningen under render (flytt til `useEffect`).
11. Innsikter (`insightToNode`): ta med `tags` slik at insights kan koble seg på mer enn WP/feltsted — men først når insights-tabellen faktisk får taksonomifelter; inntil da, la dem være og noter begrensningen i en kodekommentar i stedet for å bygge spekulativt.

**D. Friksjoner og kvaliteter på samme korpus**

12. Legg om `/frictions` og `/qualities` (som etter prompt 02 ligger bak innlogging) til å lese samme datagrunnlag som nodekartet: `quick_notes` + `insights` (+ `public_stories` når de finnes), gruppert per friksjon/kvalitet. Gjenbruk datainnlastingen — trekk den ut av `NodeMapClient` til en delt modul (f.eks. `src/lib/corpus.ts`) slik at de tre visningene ikke kan drive fra hverandre igjen.
13. Behold chord-diagrammet på `/frictions` (D3) og kolonnene på `/qualities`, men koblet til korpuset. Hver historie/hvert notat lenker til sin detaljvisning; fra detaljvisningen skal man kunne hoppe til noden i nodekartet («Vis i nodekart» med `?focus=<id>`).
14. Tomtilstander per gruppe: «Ingen notater med denne {friksjonen/kvaliteten} ennå.»

## Manuelt (Bjørn)

- Godkjenn de nye skala-etikettene («Systemet/Tjenestene/Hjemmet») — åpent spørsmål 4 i strategidokumentet.
- Vurder om `/frictions`/`/qualities` skal flyttes fysisk til `/internal/frictions` osv. (penere IA) eller beholde URL-ene med beskyttelse — begge er akseptable; flytting krever redirects.

## Akseptansekriterier

- Innlogging uten `?redirect` lander på `/internal`, som viser innhold (eller ærlig tomtilstand) uten «Sjekker økt…»-blink lenger enn nødvendig.
- Nodekartet viser tre navngitte bånd; noder med skala ligger i riktig bånd; kanter mellom bånd er synlige og betyr delt friksjon/kvalitet/WP/feltsted — aldri kun delt skala eller rom.
- Ingen node har mer enn 4 auto-genererte kanter; manuelle koblinger vises alltid.
- Med tom database viser nodekart, friksjoner og kvaliteter forklarende tomtilstander — ingen blank SVG.
- Et notat tagget med f.eks. «script» er synlig i nodekartet, under Skripte på `/frictions`, og i søk — samme korpus tre steder, verifisert med et testnotat i dev.
- «Nytt notat» er tilgjengelig fra alle interne sider; å opprette et notat tar ikke flere steg enn i dag.
- `npm run lint` uten nye feil; kjent render-tilordningsfeil i `NodeMapClient` er borte.
