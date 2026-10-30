# Covenant Culture 40-Day Experience

Mobile-first PWA for 40 days of daily discipleship with users in pods, leading into WOFBEC 2027.
Project rules and conventions: [CLAUDE.md](CLAUDE.md). Build plan: [docs/PLAN.md](docs/PLAN.md).

## Setup

Needs Node 24, pnpm 11 and Docker (for local Supabase).

```bash
pnpm install
pnpm exec supabase start        # first run downloads the Docker images
cp .env.example .env.local      # then paste the publishable key that `supabase start` printed
pnpm dev
```

Local services after `supabase start`: API `http://127.0.0.1:54321`, Studio `http://127.0.0.1:54323`,
Mailpit (sign-in codes) `http://127.0.0.1:54324`.

## Checks

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm test:e2e                   # Playwright; first time: pnpm exec playwright install chromium
```

## Icons

`public/logo.svg` is a placeholder until the logo files arrive. Replace it, then run `pnpm icons` to
regenerate the favicon, PWA and Apple touch icons.

## Deploying (Vercel)

`vercel.json` sets the SPA rewrite and cache headers. In the Vercel project, set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY`: the staging values for Preview and the prod values for Production. If the build
picks the wrong pnpm version, add the environment variable `ENABLE_EXPERIMENTAL_COREPACK=1` so Vercel uses
the version in `package.json`.
