# Claude Code-prompt: Bytt til e-post-OTP-innlogging (safe@home)

## Kontekst

Dette er safe@home-plattformen — en Next.js 14+ (App Router, TypeScript) app med Supabase
(PostgreSQL + Auth + RLS), deployet på Netlify til safeathome.no.

Plattformen har to lag: en offentlig del uten innlogging, og en intern forskningsplattform
bak autentisering. Kun det interne laget berøres av denne oppgaven.

Dagens innlogging bruker e-post + passord. De 11 teambrukerne er opprettet på forhånd med
et midlertidig passord, men de fleste har aldri logget inn — passordflyten er for tungvint,
og «glemt passord» har ikke fungert i produksjon.

Brukerne jobber i norske universiteter og kommuner (oslomet.no, uio.no, oslo.kommune.no,
skien.kommune.no). De har ikke Google-kontoer på jobb. Derfor: passordløs innlogging med
6-sifret engangskode på e-post.

## Mål

Erstatt passordinnlogging med e-post-OTP (engangskode) som primær metode.

**Viktig: kode, ikke magic link.** Microsoft Defender Safe Links skanner lenker automatisk i
kommunale postkasser, og siden Supabase-lenker er engangsbruk kan lenken være «brukt opp»
før mottakeren rekker å klikke. Koder unngår hele problemet.

## Gjør dette først

Undersøk eksisterende kode før du endrer noe:

1. Finn dagens innloggingsside og alle steder `signInWithPassword` brukes
2. Finn Supabase-klientoppsettet (browser-klient, server-klient, middleware)
3. Sjekk om `@supabase/ssr` er i bruk, eller den eldre `@supabase/auth-helpers-nextjs`
4. Finn hvordan beskyttede ruter sjekker session i dag
5. Finn eksisterende designtokens (farger, fonter, border-radius) og gjenbruk dem —
   ikke innfør ny styling

Oppsummer hva du fant før du begynner å skrive kode.

## Implementering

### 1. Tosteg-innlogging på `/login`

**Steg 1 — e-post:**
```ts
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: { shouldCreateUser: false }
})
```

`shouldCreateUser: false` er kritisk. Plattformen er invite-only — uten dette kan hvem som
helst opprette bruker ved å skrive inn en e-postadresse. Med det satt sendes kode kun til
adresser som allerede finnes i `auth.users`.

**Steg 2 — kode:**
```ts
const { data, error } = await supabase.auth.verifyOtp({
  email,
  token: code,
  type: 'email'
})
```

Etter vellykket verifisering: sjekk at brukeren har en rad i `profiles`. Hvis ikke — logg ut
og vis en feilmelding om å kontakte prosjektadministrator. Redirect til den interne
forsiden ved suksess.

### 2. UI-krav

- Ett felt om gangen. E-post → kode. Ikke begge synlig samtidig.
- Kodefelt: `inputMode="numeric"`, `autoComplete="one-time-code"`, `maxLength={6}`.
  Dette gjør at iOS/Android foreslår koden automatisk fra SMS/e-post.
- «Send ny kode»-knapp med 60 sekunders nedtelling før den blir aktiv igjen
- «Endre e-postadresse»-lenke tilbake til steg 1
- Tydelig beskjed om at koden er gyldig i begrenset tid, og at den kan havne i søppelpost
- Loading-state på begge knapper, deaktivert under sending

### 3. Feilhåndtering

Ikke vis rå Supabase-feilmeldinger. Map til norsk:

| Situasjon | Melding |
|---|---|
| Ukjent e-post / `shouldCreateUser: false` avviser | «Vi fant ingen bruker med denne adressen. Ta kontakt med prosjektadministrator for tilgang.» |
| Feil eller utløpt kode | «Koden er feil eller utløpt. Be om en ny kode.» |
| Rate limit fra Supabase | «Du har bedt om for mange koder. Vent noen minutter og prøv igjen.» |
| Nettverks-/ukjent feil | «Noe gikk galt. Prøv igjen om litt.» |

Merk: av sikkerhetshensyn kan Supabase returnere samme respons for ukjent e-post som for
suksess. Sjekk faktisk oppførsel i testing, og juster teksten så den ikke lyver.

### 4. Behold passord som fallback

Ikke fjern passordinnlogging. Legg den bak en diskret «Logg inn med passord i stedet»-lenke
nederst på `/login`. Det gir en vei inn hvis e-postlevering svikter hos en av kommunene.

### 5. Session og middleware

Kontroller at eksisterende middleware/session-refresh fungerer uendret med OTP — tokens er
de samme, kun innloggingsmetoden endres. Rydd bort eventuell `/auth/callback`-rute som kun
fantes for magic link-redirect, hvis den ikke brukes av noe annet.

### 6. Ikke gjør dette

- Ikke endre RLS-policies eller databaseskjema
- Ikke rør den offentlige delen av nettstedet
- Ikke slett eksisterende brukere eller `profiles`-rader
- Ikke innfør nye avhengigheter uten å si fra først
- Ikke endre `.env`-variabler

## Manuelle steg i Supabase Dashboard (gjør IKKE dette selv — list dem opp til slutt)

Auth-innstillinger kan ikke settes via MCP. Skriv ut en sjekkliste jeg kan følge:

1. **Authentication → Email Templates → Magic Link**: bytt malen fra `{{ .ConfirmationURL }}`
   til `{{ .Token }}`. Uten dette sendes lenke, ikke kode.
2. **Authentication → Providers → Email**: bekreft at e-postprovideren er aktiv og at
   «Confirm email» ikke blokkerer flyten
3. **Authentication → Sign In / Providers**: slå av «Allow new users to sign up»
4. **Authentication → URL Configuration**: Site URL = `https://safeathome.no`, med
   redirect-URL-er for både produksjon og `http://localhost:3000`

## SMTP — flagg dette

Supabase sin innebygde e-postsender har lave timesgrenser og er ikke ment for produksjon.
Med OTP som primær innlogging blir det raskt et problem. Anbefal oppsett av egen SMTP
(Resend, Postmark eller tilsvarende) med verifisert avsenderdomene på safeathome.no —
verifisert domene reduserer også risikoen for at kommunale spamfiltre stopper e-posten.

Ikke sett opp SMTP selv. Bare nevn det i sluttoppsummeringen.

## Akseptansekriterier

- [ ] Eksisterende bruker skriver inn e-post → mottar 6-sifret kode → logger inn
- [ ] Ukjent e-postadresse fører aldri til at ny bruker opprettes
- [ ] Feil kode gir forståelig norsk feilmelding, ikke rå Supabase-tekst
- [ ] «Send ny kode» er sperret i 60 sekunder
- [ ] Passordinnlogging fungerer fortsatt via fallback-lenken
- [ ] Beskyttede ruter er utilgjengelige uten session, som før
- [ ] `npm run build` går gjennom uten feil eller nye TypeScript-advarsler
- [ ] Ingen designtokens, farger eller fonter er endret

## Til slutt

Oppsummer:
1. Hvilke filer du endret og hvorfor
2. Sjekklisten for Supabase Dashboard
3. SMTP-anbefalingen
4. Hva jeg bør teste manuelt før dette går i produksjon