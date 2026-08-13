# Claude Code-prompt 04: Analyselaget — tråder, statusmerking og vendinger-logg

## Kontekst

safe@home skal støtte *analyse*, ikke bare arkivering: finne mønstre på tvers, se om en friksjon går igjen, sammenligne feltsteder. I dag finnes bare atomære enheter (quick_notes, insights). Dette bygger laget over: **tråder** — argumenter under arbeid som samler notater, lever i månedsvis og endrer seg. Redaksjonen er flat (alle innloggede kan skrive og redigere, ingen godkjenningsledd), men innleveringsflyten for datainnsamlere skal ikke bli ett felt tyngre: analyse er en egen inngang, ikke et lag over alt annet.

To tilleggsbeslutninger fra gjennomgangen bygges samtidig: (a) *omvendt statusmerking* — ingen statusfelt på notater, én global «alt her er arbeid under utvikling»-linje, og én valgfri markør «Vi står ved denne» på tråder; (b) *vendinger-logg* — en manuell «tidligere tolkninger»-liste per tråd, fordi endringen i tolkning mellom mars og september kan være selve funnet i et prosjekt som skal finne ut hva konklusjonene er.

Stack: Next.js 16 App Router (nyere enn treningsdataene — les `.claude/AGENTS.md` og `node_modules/next/dist/docs/` ved behov), Supabase (RLS), Punkt-tokens. Semantisk søk finnes (`src/app/actions/search.ts`) og skal gjenbrukes for å finne kandidat-notater. Prompt 03 (intern forside/nodekart) bør være kjørt, men denne er selvstendig.

## Ikke rør

- Eksisterende tabeller — trådene er *nye* tabeller, ingen endring i `quick_notes`/`insights`
- Auth, proxy, challenges-pipelinen
- Innleveringsskjemaet for notater (null nye obligatoriske felt)
- Punkt-tokens; ingen nye avhengigheter

## Undersøk dette først

1. Les `src/lib/queries.ts`, `src/app/internal/search/SearchClient.tsx` og notat-detaljvisningen i `QuickNotesPanel.tsx` (`NoteDetail`) — trådene skal koble seg på detaljvisningene som finnes, ikke bygge nye.
2. Se hvordan migrasjoner er formatert i `supabase/migrations/` (merk: to filer deler prefikset `0007` — bruk neste ledige firesifrede nummer, `0013`).
3. Sjekk RLS-mønsteret på `note_connections` (alle innloggede leser, skaper egne) — trådtabellene skal følge flat-modellen: alle innloggede kan lese, opprette **og redigere alt** (`using true / with check true` for authenticated, som `entity_links`).

## Gjør

**A. Migrasjon (skrives som fil i `supabase/migrations/0013_threads.sql` — kjøres av Bjørn, se Manuelt)**

```sql
create table threads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  status text not null default 'open' check (status in ('open','parked','landed')),
  vetted boolean not null default false,          -- «Vi står ved denne»
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table thread_items (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references threads(id) on delete cascade,
  source_type text not null check (source_type in ('quick_note','insight','story','resource')),
  source_id uuid not null,
  note text not null default '',                  -- hvorfor hører dette til her
  position int not null default 0,
  added_by uuid references profiles(id),
  added_at timestamptz not null default now(),
  unique (thread_id, source_type, source_id)
);
create table thread_log (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references threads(id) on delete cascade,
  entry text not null,                            -- «Fram til juni trodde vi X …»
  logged_by uuid references profiles(id),
  logged_at timestamptz not null default now()
);
```

RLS: enable på alle tre; `authenticated`: full les/skriv (flat redaksjon); ingen anon-tilgang. `updated_at`-trigger som på øvrige tabeller.

**B. `/internal/threads` — arbeidsrommet**

1. Listevisning: tråder sortert på `updated_at`, med tittel, status-chip (kun hvis `parked`/`landed`), «✓ Vi står ved denne»-badge hvis `vetted`, antall notater, sist endret. «Ny tråd»-knapp (tittel + valgfri summary — to felter, ikke mer). Tomtilstand: «Ingen tråder ennå. En tråd er et argument under arbeid — start en når du ser et mønster som går igjen.»
2. Trådvisning: summary øverst (redigerbar rett i visningen, autosave eller eksplisitt lagre — velg det enkleste robuste), deretter de tilknyttede notatene i rekkefølge, hver med sin annotasjon (`note`, redigerbar inline) og lenke til kildens detaljvisning. Fjern/flytt-kontroller diskret.
3. «Tidligere tolkninger»: seksjon nederst, skjult når tom. «Legg til vending»-knapp åpner ett tekstfelt. Når noen lagrer en vesentlig omskriving av summary (>40 % endret tekstlengde eller etter eget skjønn — hold heuristikken dum), vis en *avvisbar* hint: «Endret tolkning? Logg gjerne hva dere trodde før.» Aldri blokkerende.
4. Søk-inn-i-tråd: fra trådvisningen, en «Finn notater»-flate som gjenbruker eksisterende søkeaction og lar deg legge treff rett inn i tråden.

**C. Koblingen fra materialet (den ene flaten datainnsamlere kan se)**

5. På notat-/innsikt-detaljvisninger: én knapp «Legg til i tråd» (velger eksisterende tråd eller oppretter ny). Ingen andre endringer i innleveringsflyten.
6. Viser et notat hvilke tråder det inngår i (diskret liste nederst i detaljvisningen) — det er et vindu inn i analysen for den som leverte notatet.

**D. Statusmerking (omvendt merking)**

7. Global linje i intern-layouten (under sidetittel eller i footer): «Alt her er arbeid under utvikling.» Én gang, rolig, ikke banner.
8. `vetted`-toggle i trådvisningen: «Vi står ved denne» — badge vises i lister og på trådsiden. Ingen statusfelt på notater.
9. `/internal`-forsiden (fra prompt 03): «Aktive tråder»-seksjonen viser de 3 sist endrede.

## Manuelt (Bjørn)

- Kjør migrasjonen `0013_threads.sql` mot Supabase (dashboard SQL editor eller CLI) — prompten skriver bare filen.
- Bekreft RLS-modellen «alle innloggede redigerer alt» for trådene (anbefalt, konsistent med flat redaksjon). Beslektet, utenfor denne prompten: samme åpning for `quick_notes`/`insights` (åpent spørsmål 3 i strategidokumentet).

## Akseptansekriterier

- En analytiker kan: opprette en tråd, søke opp og legge til 3 notater med hver sin annotasjon, skrive summary, logge en vending, markere tråden «Vi står ved denne» — uten å forlate `/internal/threads` bortsett fra søket.
- En datainnsamler som åpner et notat ser hvilke tråder det inngår i, og kan legge det til en tråd — men møter ingen nye felter eller krav når hen *oppretter* notater.
- Tråder er synlige (lesbare) for alle innloggede; ingen roller, ingen godkjenning.
- «Tidligere tolkninger» vises kun når loggen har innhold; hintet ved summary-omskriving kan avvises og maser ikke.
- Sletting av en tråd fjerner items/logg (cascade) men rører aldri notatene.
- Tomtilstander som spesifisert; alt på bokmål; `npm run lint` grønt; ingen endringer i eksisterende tabeller.
