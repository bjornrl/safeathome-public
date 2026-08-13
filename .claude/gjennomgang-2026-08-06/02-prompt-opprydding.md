# Claude Code-prompt 02: Opprydding — seed-fiksjon, kartrester, lekkasjer, ærlige tomtilstander

## Kontekst

safe@home er forskningsplattformen for SAFE@HOME-prosjektet (2026–2029, aldrende innvandrere og kommunale hjemmetjenester). Datainnsamlingen har ikke startet. Plattformen inneholder i dag: (a) 30 oppdiktede seed-historier som vises som ekte funn når databasen er tom, blandet med *ekte, navngitte* kommunalt ansatte; (b) rester av et fjernet MapLibre-kart som aktivt skjuler ekte innhold; (c) intern admin-tekst som lekker til utloggede på `/explore`; (d) blandet norsk/engelsk og manglende tomtilstander. Kartet er en tatt beslutning: det kommer ikke tilbake. All fiksjon skal ut; tomme sider skal forklare ærlig hva som kommer.

Stack: Next.js 16 (App Router, TypeScript), Supabase, Tailwind 4, Punkt (Oslo kommunes designsystem). Next-versjonen er nyere enn treningsdataene dine — les `.claude/AGENTS.md` og `node_modules/next/dist/docs/` ved behov. Produksjon deployes fra `main` via Netlify.

## Ikke rør

- Datamodellens kjerne (`insights`, `challenges`, `quick_notes` osv.) — ingen migrasjoner i denne prompten; databaseendringer står under «Manuelt»
- Auth-oppsett, `src/proxy.ts`, RLS
- Challenges-pipelinen og `/solutions`-sidens struktur (beholdes, jf. prosjektbeslutning)
- Punkt-designtokens (`src/lib/design-tokens.ts` kan ryddes, ikke erstattes)
- D3-nodekartet (egen prompt tar det)

## Undersøk dette først

1. `git branch --show-current` og `git status` — jobb fra ren branch ut fra `main`.
2. Kartlegg all seed-bruk: `grep -rn "SEED_" src/` og les fallback-policyen i `src/lib/queries.ts:17–26`. Merk hvilke sider som treffes: `/frictions`, `/qualities`, `/index`, `/story/[id]`, `/reading-room`, `/solutions`, `/for-municipalities`.
3. Kartlegg kartrester: `grep -rn "maplibre\|MAP_STYLE\|MAP_CONFIG\|DISTRICTS\|latitude\|longitude" src/` og `grep -rn "three" src/ package.json`.
4. Sjekk hvilke ruter som er offentlige i `src/proxy.ts:6–19` før du flytter noe bak innlogging.
5. Verifiser i nettleser (dev) hvordan `/frictions` og `/qualities` faktisk ser ut i dag — de er klientkomponenter, så seed-innholdet vises først etter hydrering.

## Gjør

**A. Seed-fiksjon ut**

1. Slett `src/lib/seed-data.ts`, `src/lib/seed-resources.ts`, `src/lib/seed-solutions.ts` og alle fallbacks til dem i `src/lib/queries.ts`. Spørringer som feiler skal gi feiltilstand; spørringer med 0 rader skal gi tomtilstand — aldri fiksjon. Vær særlig oppmerksom på `seed-data.ts:166–237`: innslagene der refererer virkelige personer (Bodil Ananiassen, Gudrun Broback, Linda Mari Tahir) og skal ikke gjenoppstå noe annet sted.
2. Fjern `FALLBACK_TEAM`-datafeilene i `src/components/People.tsx:25–33` (duplikat-id `marit-haldar`, feil navn/rolle-kobling). Hvis `profiles` er tom skal seksjonen vise en nøytral tomtilstand, ikke en hardkodet liste med feil.
3. Rett navnefeil på forsiden: «Tony Joakim Ananiassen Sandseth»-varianter — søknaden («Transnational homecare.Final») skriver **Tony Sandset**, medlem av rådgivningsgruppen (Minotenk), ikke WP1-leder. Rett også finansiør-teksten: Norges forskningsråd (ikke «NORFOK») — bekreft ordlyd med Bjørn hvis usikker.

**B. Kartrester ut**

4. Avinstaller `three`, `@types/three` og `maplibre-gl` (+ `@types/d3` beholdes — D3 er i aktiv bruk). Fjern `@import "maplibre-gl/dist/maplibre-gl.css"` fra `src/app/globals.css:2`.
5. Slett `src/app/explore/` (hele ruta inkl. `ExplorePageClient.tsx`) og `src/lib/feature-flags.ts`; legg inn permanent redirect `/explore` → `/` (Next `redirects()` i `next.config.ts`). Fjern «Utforsk»-lenker i `Nav.tsx` og footer.
6. Rydd `src/lib/constants.ts`: fjern `MAP_STYLE`, `MAP_CONFIG`, `DISTRICTS`. Behold `SCALES`, `FRICTIONS`, `QUALITIES` osv.
7. Fjern `.glb|.gltf` fra proxy-matcheren (`src/proxy.ts:68–72`) — dette er eneste tillatte endring i fila, og den er kosmetisk; hopp over hvis du er i tvil.
8. `getMapStories()` i `src/lib/queries.ts:29–40`: fjern koordinatfilteret `.not("latitude", "is", null)` eller erstatt funksjonen med `getAllStories` der den brukes. Behold `latitude`/`longitude` i typene inntil videre (DB-kolonnene røres ikke her).
9. Slett `/index`-ruta (duplikat av `/`); redirect `/index` → `/`.

**C. Lekkasjer og offentlig flate**

10. Flytt `/frictions`, `/qualities`, `/reading-room`, `/welfare-tech`, `/story/[id]` og `/solutions` bak innlogging. Riktig sted er `ALWAYS_PROTECTED`-lista i `src/proxy.ts:15–19` — dette er rutebeskyttelse, ikke auth-oppsett, og er det ene unntaket fra «ikke rør proxy». Alternativ uten proxy-endring: serverside-sjekk i hver sides layout med `supabase-server.ts` + `redirect("/login?redirect=…")`. Avklar med Bjørn (åpent spørsmål 1 i strategidokumentet) før dette punktet kjøres; standardvalget er alt bak innlogging.
11. Fjern kart-løftet i login-sidens metadata («et interaktivt kart av historier») og gi taksonomisidene egne `metadata`-titler i stedet for app-shell-tittelen.
12. `/story/[id]` med ukjent id skal gi ordentlig 404 (`notFound()`), ikke blank side.

**D. Ærlige tomtilstander — ferdig tekst (bokmål, kan justeres i tone, ikke i innhold)**

- `/frictions` og `/qualities` (historieseksjonene): «Her kommer feltmaterialet. Datainnsamlingen i Alna, Søndre Nordstrand og Skien starter høsten 2026 — etter hvert som notater tagges med {friksjoner/kvaliteter}, dukker de opp her.»
- `/reading-room`: «Ingen publikasjoner ennå. De første arbeidsnotatene og policy-tekstene legges ut etter hvert som de blir til.» (erstatter dagens engelske «No publications yet…»; «Clear filters» → «Nullstill filtre»; filteroverskriftene «Frictions»/«Qualities» → «Friksjoner»/«Kvaliteter»)
- `/solutions`: behold dagens gode tekster; legg til én innledende linje: «Designresponser blir til i WP4 når feltmaterialet fra WP1–3 peker på utfordringer verdt å jobbe med.»
- `/for-municipalities`: behold dagens ærlige tekst.
- Nodekartets tomtilstand håndteres i prompt 03; hvis denne kjøres først, legg inn midlertidig: «Ingen notater ennå. Det første som legges inn, dukker opp her.»
- `People`/team-seksjon tom: «Prosjektgruppen presenteres her.»

**E. Stilkonsolidering (avgrenset)**

13. Erstatt Tailwind-arbitrary-rester (`[font-size:12px]`-mønsteret, 158 forekomster i 11 filer) med tokens/utilities kun i filene du likevel endrer — ikke som egen masseoperasjon. Samle `FONT_STACK`-duplikatene (8 filer) til én eksport fra `design-tokens.ts`.

## Manuelt (gjøres av Bjørn — ikke i denne prompten)

- Slett testoppføringen «Apotek 1, Test fra Bjørn» fra `public_resources` (og tilhørende fil i `resource-files`-bucketen).
- Vurder `public_stories`-raden «Eldre innvandrere er mer ensomme» — reell eller test?
- Bucket-strategi: `resource-files` og `welfare-tech-images` er offentlige. Når Lesesalen legges bak innlogging bør `resource-files` gjøres privat med signerte URL-er (krever kodeendring i `resource-file-storage.ts` — ta det som oppfølging når beslutningen er tatt).
- DB-kolonnene `latitude`/`longitude` (0 rader i bruk) kan droppes i en senere migrasjonsrunde — ikke kritisk.

## Akseptansekriterier

- `grep -rn "seed" src/` gir ingen treff på innholdsseed; ingen side viser oppdiktet materiale ved tom database — verifiser `/frictions`, `/qualities`, `/story`, `/solutions`, `/reading-room` i nettleser med dev-server.
- `npm ls three maplibre-gl` → ikke installert; `npm run build` går grønt; bundle inneholder ikke maplibre-CSS.
- Utlogget besøk på `/explore`, `/index` → redirect til `/`; på `/frictions` m.fl. → redirect til `/login` (hvis pkt. 10 er godkjent).
- Ingen engelske strenger i offentlige/interne flater som er endret; alle tomtilstander bruker tekstene over.
- `/story/finnes-ikke` gir 404-side med lenke tilbake.
- Ukjente personnavn forekommer ikke i kodebasen (grep på navnene fra `seed-data.ts:166–237`).
- `npm run lint` uten nye feil; `src/proxy.ts` uendret bortsett fra ev. pkt. 7.
