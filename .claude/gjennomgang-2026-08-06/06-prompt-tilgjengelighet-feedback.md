# Claude Code-prompt 06: Tilgjengelighet (WCAG 2.1 AA) og feedback-tilstander på tvers

## Kontekst

safe@home brukes av kommunale partnere som er bundet av forskrift om universell utforming — WCAG 2.1 AA er krav, ikke polering. Gjennomgangen fant konkrete brudd: en skip-lenke som aldri rendres, modaler uten fokusfelle, en nodegraf uten tastaturtilgang, statusendringer som ikke annonseres, rå engelske Supabase-feil, og «Sjekker økt…»-blink på hver intern sidelast. Denne prompten fikser tverrgående tilgjengelighet og feedback; den overlapper bevisst ikke med prompt 02 (tomtilstander/tekst) og 03 (nodekartets tomtilstand) — men kan kjøres før eller etter dem.

Stack: Next.js 16 App Router (nyere enn treningsdataene dine — les `.claude/AGENTS.md` og `node_modules/next/dist/docs/` før du bruker Next-spesifikke mønstre), Supabase, Punkt-designtokens, Tailwind 4.

## Ikke rør

- Auth-logikk (kun *presentasjonen* av feil), proxy-reglene, RLS
- Datamodellen
- Ingen nye avhengigheter — ingen a11y-biblioteker; fokusfelle skrives for hånd eller med `<dialog>`-elementet
- Visuell identitet (farger/typografi endres ikke, med unntak av dokumenterte kontrastfikser)

## Undersøk dette først

1. `SkipToContent` finnes (`src/components/ui/SkipToContent.tsx`, CSS i `globals.css:281–298`) men rendres aldri; kun 5 sider har `id="main-content"`. Kartlegg alle sider.
2. De tre dialogene med `role="dialog" aria-modal="true"`: `WelfareTechClient.tsx:397`, `SearchClient.tsx:364` (+ `ExplorePageClient.tsx:525` hvis explore ikke alt er slettet av prompt 02). Test dagens oppførsel med tastatur.
3. Klient-gatene i `admin/layout.tsx:17–70` og `internal/layout.tsx:17–70` — proxyen (`src/proxy.ts`) har allerede verifisert økten før siden i det hele tatt serveres; undersøk om gaten kan fjernes helt eller gjøres serverside med `supabase-server.ts`.
4. Feilmeldingsflater med rå Supabase-tekst: `auth/reset/page.tsx:52`, `QuickNotesPanel.tsx:583, 610, 619`, `NodeMapClient.tsx:523`, `WelfareTechPanel.tsx:221` (`alert()`), «Note not found.» (`QuickNotesPanel.tsx:516`). Se mønsteret som allerede er riktig i `login/page.tsx:46–90` (`authErrorMessage`).
5. `SuggestedCategoryInput.tsx:169` — `role="listbox"` uten resten av kombobox-mønsteret. Les WAI-ARIA APG «combobox» før du fikser.

## Gjør

**A. Struktur og navigasjon**

1. Render `SkipToContent` øverst i rot-layouten (`src/app/layout.tsx`); sørg for `id="main-content"` på hovedinnholdet på **alle** ruter (inkl. `/admin`, `/login`, `/internal/*`, `/story/[id]`, `/solutions`, `/frictions`, `/qualities`).
2. Én `<h1>` per side; sjekk overskriftshierarki på sidene du likevel er innom.

**B. Dialoger og fokus**

3. Fokusfelle i alle modaler: fokus flyttes til dialogen ved åpning, holdes inne (Tab/Shift+Tab sykler), Escape lukker, fokus returnerer til utløsende element. Vurder å migrere til det native `<dialog>`-elementet med `showModal()` — det gir felle og Escape gratis; verifiser stilbarhet med Punkt-tokens.
4. `role="button"`-elementet i `admin/page.tsx:1699`: gi `tabIndex={0}` + Enter/Space-håndtering, eller bytt til `<button>`.

**C. Status og feedback**

5. Felles `<StatusMessage>`-komponent med `role="status" aria-live="polite"` (feil: `role="alert"`). Bytt alle «Lagrer…», «Søker…», «Laster…»-tekster til den. `InlineConfirm` har mønsteret allerede (`InlineConfirm.tsx:123–124`).
6. Fjern «Sjekker økt…»-dobbelgatingen: proxyen beskytter allerede `/admin` og `/internal`; erstatt klient-`Gate` med serverside-sjekk i layoutene (eller fjern den helt hvis undersøkelsen i pkt. 3 over viser at proxyen dekker alt). Målet: ingen synlig autentiserings-blink ved intern navigasjon.
7. Normaliser feilmeldinger: én hjelpefunksjon (utvid mønsteret fra `authErrorMessage` til en generell `userErrorMessage(err, context)` i `src/lib/`) — norsk, handlingsrettet, aldri rå Supabase-tekst. Bytt `alert()`/`confirm()` i `WelfareTechPanel` til `InlineConfirm`. «Note not found.» → «Fant ikke notatet. Det kan være slettet.»

**D. Skjemaer og ARIA**

8. Fullfør kombobox-mønsteret i `SuggestedCategoryInput`: `role="combobox"` + `aria-expanded` + `aria-controls` på input, `aria-activedescendant` mot aktivt option, piltast-navigasjon.
9. Verifiser label-kobling på alle inputfelter i admin-panelene (implisitt `<label>`-wrap er ok; felter uten label får `aria-label`). Legg `required`/`aria-required` på faktisk obligatoriske felter og vis valideringsfeil ved feltet, ikke bare ved lagreknappen.

**E. Bilder og grafikk**

10. Hero-illustrasjonen (`page.tsx:706–759`): fjern motsigelsen — enten `aria-hidden` på container og `alt=""` på bildet (dekorativt, anbefalt), eller meningsfull norsk alt-tekst uten `aria-hidden`. Rydd samtidig bort de ~90 utkommenterte linjene.
11. Alle `<img>` får eksplisitt `alt` (tom streng hvis dekorativt); avatarer i `QuickNotesPanel`/`People` sjekkes.
12. Nodegrafen (koordiner med prompt 03): SVG-en beholder `role="img"` + beskrivende `aria-label`; sidepanelets nodeliste løftes til dokumentert ekvivalent — synlig «Vis som liste»-omkobling, og listen får full tastaturnavigasjon. Nodene i selve grafen får `tabIndex` og Enter-aktivering hvis det lar seg gjøre uten å skrive om rendering; ellers er listen den formelle løsningen.

**F. Kontrast (verifiser, ikke anta)**

13. Mål tekstfarger mot bakgrunn der hardkodede gråtoner brukes (`#9a9a9a`, `#808080`, `#A09A8E` på lyse flater) — alt under 4.5:1 for normal tekst byttes til nærmeste Punkt-token som består. Dokumenter målingene i commit-meldingen.

## Manuelt (Bjørn)

- Én manuell økt etter merge: VoiceOver gjennom login → `/internal` → nytt notat → søk, pluss axe DevTools på forsiden, `/internal` og `/admin`. Funn tilbake som saker.
- Beslutt om `NEXT_PUBLIC_DEV_LOCK`-scenarioet fortsatt trengs (påvirker hvor aggressivt klient-gatene kan fjernes).

## Akseptansekriterier

- Tab fra adresselinjen på enhver side: første stopp er «Hopp til hovedinnhold», og den virker.
- Alle modaler: fokus inn ved åpning, felle aktiv, Escape lukker, fokus tilbake. Verifisert med tastatur alene.
- Skjermleser annonserer lagre-/søke-/lastestatus og feil; ingen rå engelske feilstrenger noe sted (grep etter kjente Supabase-fraser gir null treff i UI-strenger).
- Ingen «Sjekker økt…»-tekst synlig ved navigasjon mellom interne sider.
- Kombobox-en er navigerbar med piltaster og annonserer aktivt valg.
- axe DevTools: ingen «critical» eller «serious» funn på forsiden, `/login`, `/internal` og `/admin`.
- `npm run lint` grønt; de fem kjente lint-feilene (`NodeMapClient:486`, `WelfareTechClient`, `Nav`, `SuggestedCategoryInput`, `WelfareTechPanel`) er borte.
