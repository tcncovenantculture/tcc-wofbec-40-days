# Handoff: where the build stands (Oct 30, 2026)

For a new Claude Code session in `~/Documents/covenant-40-day`. Read this file, then `CLAUDE.md` (project
rules, auto-loaded) and `docs/PLAN.md` (phase plan: ticked tasks plus "Build notes" under each section, which
record the decisions made while building). Those two documents are the source of truth; this file adds the
current state and what to do next. Update it at the end of each session.

## Where things stand

- **Phase 0 is done.** Live at https://tcc-wofbec-40-days.vercel.app (Vercel Hobby, pointing at staging).
- **Phase 1 code is done** (1.1 to 1.8, plus `compress-media.ts`): schema and RLS, programme clock, email-code
  sign-up and sign-in, content schema and loader, sample content for all 40 days, home, the daily screen
  (lesson stepper and synthesis template), reviewer preview, local seed. All pushed to `main`.
- Checks: typecheck, lint, 115 Vitest tests, 26 pgTAP tests (`supabase test db`) pass. First-load JS is
  **180.6 KB gzipped** (budget 200); sign-up, verify, day, preview and the other screens are lazy-loaded.
- **Staging** is linked (`supabase link` done) and has all four migrations and the 40 sample days, loaded
  with `--publish-now` so testers can open any day with `?asOf`.
- **Local**: `supabase db reset` applies the migrations and `supabase/seed.sql` (five test users, Module 1
  open). Sign in with a seeded email; the code arrives in Mailpit (http://127.0.0.1:54324).

## What's left for the Nov 1 working version (mostly the user)

1. **Vercel:** add `VITE_ENABLE_AS_OF=true` to Production and Preview, then redeploy the latest commit. Every
   Vercel build is a production build, and the test clock is off in those without it. **Remove it from
   Production before Nov 8.** Check whether pushes now deploy automatically (Hobby may block a private
   organisation repo); if not, the user deploys by hand.
2. **Supabase staging dashboard** (project `tccwofbec-40-staging`), Authentication:
   - Emails → Templates: "Confirm signup" and "Magic link" both get subject `{{ .Token }} is your 40 Days
     code` and the body from `supabase/templates/sign-in-code.html`. Without this, staging emails contain a
     link, not a code, and sign-up can't be finished.
   - Sign In / Providers → Email: OTP length 6, expiry 3600 seconds.
   - URL Configuration → Site URL: `https://tcc-wofbec-40-days.vercel.app`.
   - After the user signs up on staging: Table Editor → `profiles` → their row → `role` = `reviewer`.
3. **Email limits:** until Resend is set up, staging uses Supabase's built-in sender: a few emails an hour,
   and (as far as we know) only to members of the Supabase organisation. Fine for the user's own Nov 1 test;
   **Resend is needed before the Nov 2 leaders' test.** Resend and DNS are backlogged (Oct 30) until the
   user has the church domain's DNS access.
4. **Acceptance test on an Android phone** (PLAN.md, end of Phase 1): sign up, open
   `/home?asOf=2026-11-14`, do Day 1's five steps, see it complete on home, reopen Day 1 and find the answers
   saved, check Day 8 (`/day/8?asOf=2026-11-21`), and preview days at `/preview/1`.
5. **Real Module 1:** when it arrives, save as `content/module-1.json`, run
   `pnpm media:compress content/module-1.json --target …` if it has media, then `pnpm content:load` to local
   and staging. It replaces the sample days by day number.

## Next: Phase 2 (pods and chat, Nov 1 to Nov 4)

Follow PLAN.md 2.1 to 2.4. Pod screen links already point at `/pod`; the Connect step and the synthesis
day's pod card are where "Share with my pod" goes. Seed: two pods of five with a facilitator in each
(extend `supabase/seed.sql`; its fixed user ids start `a1000000-`).

## Accounts

| Account | State |
| --- | --- |
| GitHub | `tcncovenantculture/tcc-wofbec-40-days`, **private, owned by an organisation**. Remote `origin` over HTTPS; credentials in the macOS keychain; no `gh` CLI. |
| Supabase staging | **`tccwofbec-40-staging`**, London `eu-west-2`, free org. Linked. Migrations: `pnpm exec supabase db push --linked`, with `SUPABASE_DB_PASSWORD` read from `.env.staging` in the shell without printing it. |
| `.env.staging` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (an `sb_secret_` key), `SUPABASE_DB_PASSWORD` filled; `RESEND_API_KEY` empty. Gitignored. |
| Vercel | **Hobby**, project `tcc-wofbec-40-days`. Production and Preview env vars point at staging (switch Production to prod before Nov 8). Hobby doesn't support private organisation repos: if automatic deploys get blocked, the user deploys by hand from the dashboard (their call; don't add a CI deploy workaround). |
| Resend | Not set up; backlogged. Use a domain the church already owns (`mail.<domain>` for sending, region `eu-west-1`; app at e.g. `40days.<domain>` via a Vercel CNAME). Unknown: the domain, who manages DNS, the sender address. |
| Supabase prod | Later (by Nov 4, Phase 3): a **separate org on the Pro plan** so staging stays free (Supabase bills per org). Project `c40-prod`, same region. |
| Resend Pro | Before Nov 8 sign-ups. The free plan allows 100 emails a day and 3,000 a month. |

## Phase 1 decisions worth knowing (details in PLAN.md build notes)

- **Content:** sample modules in `content/samples/` (titles start "Sample:", KJV scripture) until the real
  files arrive. `pnpm content:load` validates with the zod schema in `src/features/days/schema.ts`.
- **Clock:** the app decides which days are open (`src/lib/programme.ts`, so `?asOf` works); RLS also hides
  locked days. `?asOf` lasts for the browser tab session; `?asOf=off` clears it.
- **Auth:** codes only. The profile is created when the code is sent (trigger on `auth.users`), so Phase 4's
  pod formation must only pick confirmed emails. The privacy tick isn't stored yet; if the NDPA review wants
  a consent record, add `privacy_accepted_at` in Phase 3.
- **Offline:** the query cache (days, progress, profile; never reflections) is saved to localStorage and
  cleared on sign-out; an expired token offline doesn't sign people out.
- **Bundle:** dates display through `Intl` (date-fns `format`/`parse` were too heavy); zod, react-markdown
  and confetti load on demand. Phase 3's landing page must also keep the Supabase client off its first load.
- **Settings placeholder** has text-only mode and sign out, both needed for testing before Phase 3.
- **Audio** compression is written but untested: ffmpeg isn't installed (`brew install ffmpeg`).

## Decisions in the code so far (and why)

**Tooling**
- TypeScript pinned to **6.0** (typescript-eslint doesn't support 7). React Router pinned to **7** (8 is out;
  the plan says 7). ESLint 10 flat config with type-aware rules; the Vite template's oxlint was removed.
- `pnpm typecheck` is `tsc -b`. Prettier: no semicolons, single quotes, width 110, Tailwind class sorting.
  Prettier skips `src/components/ui` (shadcn output), `docs`, `content`, `CLAUDE.md`.
- `pnpm db:types` generates types and runs Prettier on them.
- **Ports:** the user's other app (78MFB) runs on 5173, so this dev server is fixed at **5271**
  (`strictPort`, the user's choice). Playwright uses its own dev server on **5317**. Supabase `site_url`
  is `http://localhost:5271`. Local Studio 54323, API 54321, Mailpit (sign-in codes) 54324. Never stop the
  other project's server.

**shadcn/ui**
- Preset `radix-nova` (Radix, Lucide). Components import `cn` from the `cn` package (shadcn's own
  replacement for clsx + tailwind-merge); `src/lib/utils.ts` re-exports it.
- **`form` is an empty stub in current shadcn**, so `field` (and `separator`) was added; use it with
  react-hook-form. react-hook-form, zod 4 and @hookform/resolvers are installed.
- `sonner` is light-only, with no `next-themes`. Dialog and sheet overlays use `bg-overlay` with no
  backdrop blur (slow on low-end phones).
- Lightly themed for the brief's rules: every button size is at least 44px tall with 16px+ labels; inputs,
  textarea and select are `h-11`, `text-base`, `bg-card`.
- Primary button: `bg-cta` (135° orange gradient), `shadow-cta`, **20px Barlow Condensed 700**, `border-0`.
  Manrope is only loaded at 400/600, so the large-bold label that white on orange needs (about 3.1:1) comes
  from the heading font.

**Theme (`src/index.css`, mirrored in `src/theme/tokens.ts`)**
- **Tailwind's default palette is switched off** (`--color-*: initial`; only `white` added back), so only
  tokens exist.
- shadcn's hover colour is renamed to **`--ui-accent`**, leaving `--accent` / `--accent-display` /
  `--accent-ink` for module accents, set by `[data-module="1..5"]` (module 1 is the default).
  Utilities: `bg-module`, `text-module-display`, `text-module-ink`.
- `card`, `border` and muted text come through shadcn's names (`bg-card`, `border-border`,
  `text-muted-foreground`), because the plan's `--color-card` / `--color-muted` names clash with shadcn's.
- `dark:` classes in shadcn files are inert: `@custom-variant dark` only matches under a `.dark` class the
  app never sets.
- Background glows are a fixed `body::before` layer.
- `src/theme/tokens.test.ts` checks tokens.ts against index.css and checks contrast: every ink shade is at
  least 4.5:1 on cream and card; display shades are about 3:1, so large titles only. Prettier writes the
  selectors as `[data-module='1']`, and the test accepts either quote.

**Brand**
- **Logo:** the user supplied a 1080px graphic, now at `docs/brand/covenant-culture-source.png`.
  `node scripts/extract-logo.ts docs/brand/covenant-culture-source.png` writes:
  - `src/assets/brand/logo.webp` (504×143, 29 KB) and `logo-mark.webp` (142×143, 15 KB), with white made
    transparent
  - `public/icon-source.png`: the mark on cream with a margin

  `pnpm icons` then builds every icon on cream (transparent icons looked speckled on dark launchers). Use
  `<Logo />` or `<Logo variant="mark" />`; keep the full logo under about 250px wide. An SVG or a 1024px+
  PNG would sharpen the 512px icons.
- `LogoStrip` (the five colours) is for special moments only (day 8, module complete, pod scene), as the
  plan says. `DotsLoader` is the Suspense fallback.

**App**
- `src/app`: `App` → `ErrorBoundary` → `Providers` (QueryClient with `staleTime` 60s and `retry` 2;
  sonner toaster) → `BrowserRouter` → `AppRoutes` inside `AppLayout` (max-w-md, safe-area padding,
  Suspense).
- Journey, pod, settings, mod and preview are lazy-loaded. Route files default-export their component.
- `src/lib/supabase.ts` throws if the env vars are missing and sets `detectSessionInUrl: false`
  (sign-in uses codes, not links). `src/vite-env.d.ts` types both env vars as `string | undefined`.

**PWA**
- `registerType: 'autoUpdate'`, with the plugin injecting `registerSW.js`. Precache is the app shell only:
  `**/*.{js,css,html,woff2,webp}` plus favicon. Media comes from Supabase Storage, not the build.
- `navigateFallback: /index.html`. Checked on a Pixel 7 profile: the service worker controls the page,
  the manifest and icons load, and routes open offline.

**Tests**
- Vitest includes `src/**/*.test.{ts,tsx}` and `scripts/**/*.test.ts`. `css.include` lets `index.css?raw`
  work.
- Playwright uses a Pixel 7 profile and `E2E_BASE_URL` to target a deployed URL.

## Watch out for

- **Bundle budget.** First load is 180.6 KB gzipped of the 200 KB budget (React DOM and the whole Supabase
  client are most of it; its storage and realtime parts aren't needed up front). Check the size after every
  feature: `pnpm build`, then gzip the scripts named in `dist/index.html`. Phase 3 wants the landing page
  under 100 KB on first load (excluding fonts), so it will need the Supabase client kept off that route.
- Pipe-free checks: run `pnpm format:check` on its own before committing. Piping it through `tail` hides a
  failure (it happened twice on Oct 30).
- The staging project name differs from the plan (`tccwofbec-40-staging`). That's fine; don't rename it.

## How the user works

- Short, plain updates with the outcome first. They make account and product calls themselves; ask when
  something is theirs to decide.
- **Don't add features the plan leaves out**: omissions in their specs are deliberate.
- Secrets: they fill `.env.*` themselves. Never print or ask them to paste secret keys or passwords;
  publishable keys and URLs are fine.
- Small commits, one task each, ticking the `docs/PLAN.md` checkbox in the same commit. Run
  `pnpm typecheck && pnpm lint && pnpm test` (and `supabase test db` once SQL exists) before calling a task
  done.
- `docs/PLAN.md` still asks to tell OyinDamola about the Nov 1 re-baseline in today's progress note;
  remind the user if it hasn't come up.

## Open questions for the user

- The church domain to use, who manages its DNS, and the sender address for sign-in codes
- Original logo file (SVG or 1024px+ PNG)
- From the plan: moderator names (by Nov 7), whether reports also go to moderators, baseline question
  wording (by Nov 5), data retention period
