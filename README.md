This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Copy `.env.local.example` to `.env.local` and fill in the Supabase keys, then run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment flags

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project credentials.
- `NEXT_PUBLIC_SITE_URL` — canonical site URL (used for OAuth redirect fallbacks).
- `NEXT_PUBLIC_DEV_LOCK` — set to `1` to enable the dev-mode public lock. While enabled, only `/`, `/auth`, `/auth/reset` are reachable by anonymous visitors; `/admin*` requires a signed-in Supabase session. Every other route redirects to `/`. Set to `0` or leave unset to disable.

The lock is implemented as a Next.js `proxy.ts` (the renamed `middleware.ts` convention in Next 16). It uses `@supabase/ssr` to read the session cookie.

## Supabase migrations

SQL migrations live in `supabase/migrations/`. Apply them via the Supabase SQL editor or CLI.

## Deploy on Vercel

See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
