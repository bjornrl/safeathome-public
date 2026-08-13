# Claude Code-prompt 01: Fullfør og land OTP-innloggingen

## Kontekst

safe@home (Next.js 16 App Router + Supabase Auth, deploy via Netlify til safeathome.no) skal bytte fra passord til e-post-OTP med **kode** (ikke magic link — Microsoft Defender Safe Links «bruker opp» engangslenker i kommunale postkasser). Invite-only: `shouldCreateUser: false` skal bevares.

**Viktig utgangspunkt: mesteparten av koden er allerede skrevet.** Det ligger en *ukommittert* implementasjon i `src/app/login/page.tsx` på branchen `agent/aapne-innganger`, bygget etter planen i `.claude/otp-auth-prompt.md`. Den har: tosteg e-post→kode, `shouldCreateUser: false`, norske feilmeldinger via `authErrorMessage()`, 60 s resend-sperre, passord som fallback bak diskret lenke, profilsjekk med utlogging hvis `profiles`-rad mangler, fokushåndtering og `role="alert"`. Ikke skriv dette på nytt. Jobben er å verifisere, flikke og lande det.

Merk: Next.js-versjonen (16.2.1) er nyere enn treningsdataene dine. Les `.claude/AGENTS.md` og relevant i `node_modules/next/dist/docs/` før du uttaler deg om Next-spesifikke løsninger. `src/proxy.ts` er Next 16-navnet på middleware — den skal ikke endres.

## Ikke rør

- `src/proxy.ts` (tilgangskontrollen er riktig)
- `shouldCreateUser: false` (invite-only)
- RLS, Supabase-skjema, miljøvariabler, `.env.local`
- Passord-fallbacken (skal bestå som sekundær vei)
- Designsystemet (Punkt-tokens); ingen nye avhengigheter

## Undersøk dette først

1. `git status` og `git diff src/app/login/page.tsx` — se nøyaktig hva som er ukommittert, og på hvilken branch du står. Avklar med Bjørn om arbeidet skal flyttes til en ren branch (f.eks. `feature/otp-login`) før commit.
2. Les `.claude/otp-auth-prompt.md` og sammenlign akseptansekriteriene (linje 135–142) med koden.
3. Verifiser antakelsen i feilteksten «Vi fant ingen bruker med denne adressen» (`login/page.tsx:20–21`): send `signInWithOtp` for en ukjent adresse mot dev-miljøet og se om Supabase faktisk returnerer feil, eller generisk suksess. Hvis generisk suksess: endre til ærlig tekst («Hvis adressen er registrert, får du en kode på e-post») — teksten må ikke love noe Supabase ikke leverer.
4. Sjekk `src/app/auth/reset/page.tsx` — den viser i dag rå Supabase-feil (`:52`) og lenker tilbake til `/auth` (unødvendig redirect-hopp via `/auth` → `/login`).

## Gjør

1. Fullfør og commit OTP-implementasjonen på ren branch, med eventuelle korrigeringer fra undersøkelsene over.
2. `auth/reset`: bytt rå feiltekst til samme `authErrorMessage`-mønster som login; pek tilbakelenken direkte på `/login`.
3. Oppdater `.env.local.example`: beskrivelsen av `NEXT_PUBLIC_DEV_LOCK` er feil (koden redirecter til `/login?redirect=…`, ikke `/`; `/login` mangler i lista over åpne stier) — og legg inn en kommentar om at OTP krever de manuelle Supabase-stegene under. Rett samme feil i `README.md:19` (som også mangler `/internal*`).
4. Legg en kort driftsnotis i `docs/` («otp-drift.md»): hva som er konfigurert manuelt i Supabase, og hvordan man verifiserer at kodemalen er aktiv.

## Manuelle steg (Supabase-dashboard + DNS — kan ikke gjøres i kode; gjøres av Bjørn)

1. **Auth → Email Templates → Magic Link:** bytt `{{ .ConfirmationURL }}` til `{{ .Token }}` med kort norsk tekst («Din innloggingskode: {{ .Token }}. Gyldig i 60 minutter.»). **Uten dette er kodefeltet dødt** — Supabase sender lenke, brukeren har ingen kode å lime inn.
2. **Auth → Sign In / Up:** «Allow new users to sign up» → av.
3. **SMTP før utrulling til alle 20:** Supabase sin innebygde e-post er rate-limitet (~2/time). Sett opp Resend eller Postmark under Auth → SMTP (domene-DNS: SPF + DKIM for safeathome.no). Anbefalt: Resend, EU-region.
4. Verifiser i Netlify at `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` er uendret og at bygget går grønt etter merge.

## Akseptansekriterier

- Innlogging med e-post → 6-sifret kode fungerer i produksjon for en eksisterende bruker; koden ankommer som kode, ikke lenke.
- Ukjent e-postadresse gir en ærlig norsk melding (verifisert mot faktisk Supabase-oppførsel) og oppretter ingen bruker.
- Feil kode gir norsk feilmelding med `role="alert"`, fokus tilbake i kodefeltet, og mulighet til å be om ny kode etter 60 s.
- Passord-fallback og «Glemt passord?» fungerer fortsatt; reset-siden viser aldri rå engelske Supabase-strenger.
- `?redirect=`-parameteren respekteres fortsatt kun for interne stier (én ledende `/`).
- Ingen endringer i `src/proxy.ts`, ingen nye avhengigheter, `npm run lint` uten nye feil.
