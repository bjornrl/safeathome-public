# OTP-innlogging — drift

Innlogging på `/login` bruker e-post-engangskode (6 siffer). Passord er
beholdt som fallback bak en diskret lenke.

**Kode, ikke lenke.** Microsoft Defender Safe Links skanner lenker automatisk i
kommunale postkasser. Supabase-lenker er engangsbruk, så en skanner som følger
lenken *bruker den opp* før mottakeren rekker å klikke. Koder unngår hele
problemet. Derfor må e-postmalen aldri inneholde både kode og lenke — lenken og
koden er samme engangstoken under panseret, og en skannet lenke dreper også
koden i samme e-post.

Kodefeltet er invite-only: `signInWithOtp` kalles med `shouldCreateUser: false`,
så en ukjent adresse får aldri opprettet bruker.

## Konfigurert manuelt i Supabase

Dette ligger ikke i koden og forsvinner ikke med en revert. Prosjektet er
`ditsssyrzjqdnhqxnffx` — samme prosjekt for lokal utvikling og produksjon, så en
endring her slår ut begge steder umiddelbart.

| Sted i dashboardet | Innstilling |
|---|---|
| Authentication → Emails → **Magic Link** | Malen må bruke `{{ .Token }}`, ikke `{{ .ConfirmationURL }}`. Samme mal brukes for `signInWithOtp` — det er variabelen, ikke malnavnet, som avgjør om mottakeren får kode eller lenke. |
| Authentication → Sign In / Providers → Email | «Allow new users to sign up» = **av**. |
| Authentication → Providers → Email | «Email OTP Expiration» (standard 3600 s). Login-siden sier bare «gyldig i kort tid», så verdien kan endres uten kodeendring. |
| Authentication → Emails → SMTP Settings | **Ikke satt opp ennå.** Se «Rate limits» under. |

Malen for **passord-tilbakestilling** er en annen mal og skal fortsatt være en
lenke — den peker på `/auth/reset`.

## Verifiser at kodemalen er aktiv

Raskest, uten å lese kode: be om en kode fra `/login` med din egen adresse og se
på e-posten. Får du seks siffer, er malen riktig. Får du en lenke, står
`{{ .ConfirmationURL }}` fortsatt i malen, og kodefeltet i grensesnittet er dødt
— brukeren har ingenting å skrive inn.

Symptomet hvis dette glipper: brukeren får «Sjekk e-posten», mottar en lenke, og
klikker seg til en side som ikke forventer en lenkebasert økt.

## Rate limits

Supabase sin innebygde e-postsender er begrenset til **~2 e-post per time for
hele prosjektet** — ikke per bruker. Mislykkede forsøk teller også. Feilen vises
som «Du har bedt om for mange koder» (`AUTH_MSG.rateLimit`).

Grensen kan ikke skrus av. Feltet under Authentication → Rate Limits →
«Rate limit for sending emails» er låst så lenge prosjektet bruker den
innebygde senderen; det låses opp når egen SMTP er satt opp.

**Konsekvens for utrulling:** ikke inviter alle 20 brukerne før egen SMTP er på
plass. Noen få samtidige førstegangsinnlogginger tømmer timekvoten, og resten
møter en feilmelding på sitt aller første møte med plattformen.

Anbefalt: Resend eller Postmark med verifisert avsenderdomene på safeathome.no
(SPF + DKIM). Verifisert domene reduserer også risikoen for at kommunale
spamfiltre stopper koden. Sett deretter e-postgrensen til noe moderat — rundt
30/time holder i romslig monn for et team på 20, og en høy grense betyr først og
fremst større skadeomfang hvis en adresse blir spammet.

## Merk

- Sesjonshåndtering og `src/proxy.ts` er uendret av OTP-arbeidet — tokenene er
  de samme, kun innloggingsmetoden er ny.
- Etter vellykket kode sjekker `/login` at brukeren har en rad i `profiles`, og
  logger ut igjen hvis ikke. Per 13. august 2026 har alle 20 auth-brukere en
  profilrad, så ingen treffer denne veien i dag.
- Norske feilmeldinger for både login og passord-tilbakestilling ligger samlet i
  `src/lib/auth-messages.ts`. Legg nye Supabase-feil der, ikke i sidene.
