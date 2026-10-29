# Handoff: where the build stands (Oct 29, 2026)

For a new Claude Code session in `~/Documents/covenant-40-day`. The first session ran from the home folder,
so none of its memory carries over. Read this file, then `CLAUDE.md` (project rules, auto-loaded) and
`docs/PLAN.md` (phase plan, with Phase 0 ticked and "Build notes" under it). Those two documents are the
source of truth; this file adds the current state, the decisions behind the code, and what to do next.
Delete or update this file once it's out of date.

## Where things stand

- **Phase 0 is done.** `main` is pushed to GitHub, CI is green, and the app is live at
  https://tcc-wofbec-40-days.vercel.app (smoke test, SPA rewrite, cache headers and offline loading checked
  against it on Oct 29). Still open: the user's phone check of the install prompt, and Resend (below).
- Typecheck, lint, 27 Vitest tests and 1 Playwright test pass. `pnpm build` works; initial JS is
  115.5 KB gzipped (the Supabase client isn't imported anywhere yet, so it isn't counted).
- Local Supabase is running in Docker (`pnpm exec supabase start -x logflare,vector,imgproxy,supavisor`).
  The schema is empty; `src/lib/database.types.ts` was generated from it.
- The landing page (`/`) is a themed placeholder with the real logo; every other route is a `RouteStub`
  card naming the phase that builds it.

### Accounts

| Account | State |
| --- | --- |
| GitHub | `tcncovenantculture/tcc-wofbec-40-days`, **private, owned by an organisation**. Remote `origin` over HTTPS. |
| Supabase staging | Created as **`tccwofbec-40-staging`** (not `c40-staging` as the plan says), region London `eu-west-2`, free org. CLI is logged in (`pnpm exec supabase login` done) but **not linked**. |
| `.env.staging` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_PASSWORD` filled; `RESEND_API_KEY` empty. Gitignored. The project ref is the subdomain in `SUPABASE_URL`. |
| Vercel | **Hobby**, project `tcc-wofbec-40-days`. Production and Preview env vars point at staging (switch Production to prod before Nov 8). Hobby doesn't support private organisation repos: if automatic deploys get blocked, the user deploys by hand from the dashboard (their call; don't add a CI deploy workaround). |
| Resend | Not set up. Use a domain the church already owns. Unknown: the domain name, who manages its DNS, the sender address. |
| Supabase prod | Later (by Nov 4, Phase 3): a **separate org on the Pro plan** so staging stays free (Supabase bills per org). Project `c40-prod`, same region. |
| Resend Pro | Before Nov 8 sign-ups. The free plan allows about 100 emails a day; check current limits. |

## Next task: Resend and DNS (user), then Phase 1

Steps 1 to 5 below were done on Oct 29 and are kept for reference. Step 6 (Resend and the app's custom
domain) is with the user and the church's DNS owner.

1. **Push to GitHub.** Ask the user for the repo URL (private, created empty). Then
   `git remote add origin <url> && git push -u origin main`. Git uses HTTPS with credentials in the macOS
   keychain; SSH isn't set up and the `gh` CLI isn't installed.
2. **CI.** The push triggers `.github/workflows/ci.yml` (checkout@v7, pnpm/action-setup@v6, setup-node@v7,
   Node 24: typecheck, lint, test). Ask the user to confirm it's green in the Actions tab; fix if not.
3. **Vercel (the user clicks; you guide).** Hobby plan, sign up with GitHub, Add New → Project → import the
   repo. Leave build settings alone: `vercel.json` sets framework `vite`, `pnpm install --frozen-lockfile`,
   `pnpm build`, output `dist`, the SPA rewrite and cache headers (`/assets/*` immutable; `sw.js`,
   `registerSW.js`, `manifest.webmanifest` must-revalidate). Environment variables, on **both Production and
   Preview, pointing at staging for now** (switch Production to prod before Nov 8):
   - `VITE_SUPABASE_URL`: staging project URL
   - `VITE_SUPABASE_ANON_KEY`: staging **publishable** key (`sb_publishable_…`, from Project Settings →
     API Keys). Safe to paste in chat; the secret key and DB password are not.
   - `ENABLE_EXPERIMENTAL_COREPACK=1`, so Vercel uses pnpm 11.4.0 from `packageManager`

   Things that could break the build: pnpm 11 on Vercel, `engines.node: "24.x"`, and `sharp` / `supabase`
   in devDependencies (both install from prebuilt platform packages, no install scripts). If it fails, ask
   the user to paste the build log.
4. **Check the deploy.** Run `E2E_BASE_URL=<vercel url> pnpm test:e2e`, then on a phone check the themed
   landing page, the install prompt (Android Chrome) and offline loading. Lighthouse no longer has a PWA
   category; use Chrome DevTools → Application → Manifest for the installability check.
5. Tick "Vercel SPA rewrite; first deploy" in `docs/PLAN.md`, commit, push.
6. **In parallel (user):** Resend. Add a subdomain such as `mail.<church-domain>` in region `eu-west-1`,
   have the DNS owner add its records, and add the app's CNAME from Vercel → Settings → Domains (e.g.
   `40days.<church-domain>`) in the same visit. Create an API key with sending access and put it in
   `.env.staging` as `RESEND_API_KEY`.

## Then Phase 1 (due Sun Nov 1)

Follow `docs/PLAN.md` 1.1 to 1.8. Decisions already made:

- **Content: dummy data for all five modules (40 days) for now** (the user's call; the real files haven't
  arrived). Write clearly labelled sample module files that pass the zod schema, load them to local and
  staging with the loader, and swap in the real files later. This lets the home progress strip, catch-up
  and reviewer preview be tested across all 40 days.
- **Staging setup:** `pnpm exec supabase link --project-ref <ref>`, reading `SUPABASE_DB_PASSWORD` from
  `.env.staging` in the shell without printing it. Then `pnpm exec supabase db push`. Auth settings in
  `supabase/config.toml` are already OTP length 6 and expiry 3600. If you use `supabase config push` for
  auth and the `{{ .Token }}` email template, review its diff before confirming, and make sure it can't
  switch off SMTP settings set elsewhere.
- **SMTP:** Resend via `[auth.email.smtp]` in `config.toml` (host `smtp.resend.com`, port 465, user
  `resend`, password `env(RESEND_API_KEY)`), once the domain is verified. Until then, Supabase's built-in
  email is rate-limited; check who it will send to before relying on it for the Nov 1 test.
- **Keys:** the browser uses the publishable key (in the variable named `VITE_SUPABASE_ANON_KEY`). Scripts use
  the secret key (`sb_secret_…`) as `SUPABASE_SERVICE_ROLE_KEY` from `.env.<target>`. Never in `src/`.
- **Scripts** run with Node 24's built-in TypeScript support (`node scripts/x.ts`); `erasableSyntaxOnly`
  is on to keep that working. `sharp` is already a devDependency for `compress-media.ts`.
- The landing page's "Sign in" link points at `/signup?mode=signin` as a placeholder; Phase 1 decides the
  real flow.

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

- **Bundle budget.** 115.5 KB gzipped before the Supabase client. Phase 3 wants the landing page under
  100 KB total on first load (excluding fonts), so plan for a lean landing route then; Phase 5 enforces the
  200 KB budget.
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
