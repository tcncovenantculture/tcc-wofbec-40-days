# Handoff: where the build stands (Oct 30, 2026)

For a new Claude Code session in `~/Documents/covenant-40-day`. Read this file, then `CLAUDE.md` (project
rules, auto-loaded) and `docs/PLAN.md` (phase plan: ticked tasks plus "Build notes" under each section, which
record the decisions made while building). Those two documents are the source of truth; this file adds the
current state and what to do next. Update it at the end of each session.

## Where things stand

- **Phase 0 is done.** Live at https://tcc-wofbec-40-days.vercel.app (Vercel Hobby, pointing at staging).
- **Phase 1 code is done** (1.1 to 1.8, plus `compress-media.ts`): schema and RLS, programme clock, email-code
  sign-up and sign-in, content schema and loader, sample content for all 40 days, home, the daily screen
  (lesson stepper and synthesis template), reviewer preview, local seed. Its acceptance (the phone test)
  waits on the user's staging dashboard steps.
- **Phase 2 code is done** (2.1 to 2.4), built Oct 30 ahead of the Phase 1 phone test at the user's request:
  pods, members and messages with RLS; the pod screen with live chat; sharing a reflection; the WhatsApp
  link. Its acceptance passed locally (three Playwright phones) and still has to be shown on staging.
- **Phase 3 started Oct 30** (again ahead of the staging walkthroughs, at the user's request). **3.1 landing
  is done.** Agreed order from here (user, Oct 30): **4.1 reports and moderation next, pulled forward** so it
  exists before sign-up opens on Nov 8 (brief rule 5), then 3.2 privacy and consent, 3.3 avatars, 3.4
  baseline questions (wording still due from the project lead), 3.5 load and email check (needs Resend).
- Checks: typecheck, lint, 136 Vitest tests, 75 pgTAP tests, the Playwright smoke test and `pnpm size` pass.
  The landing page is **91.8 kB as served** (budget 100); the signed-in app's JS is **184.9 kB gzipped**
  (budget 200). `/pod` is a lazy 21 kB chunk, like the other screens.
- **Staging** is linked and has all seven migrations and the 40 sample days (loaded with `--publish-now`, so
  testers can open any day with `?asOf`), but **no pods**: the seed is local only. `pnpm pods:test --target
  staging --name "…" email…` puts testers in a pod.
- **Local**: `supabase db reset` applies the migrations and `supabase/seed.sql`: 12 users, two pods of five
  (Rooftop: Ada facilitates, with Bola, Dayo, Efe, Funmi; Lantern: Gbenga facilitates, with Chidi, Halima,
  Ife, Jide), a few messages, one announcement, Module 1 open. Sign in with a seeded email; the code arrives
  in Mailpit (http://127.0.0.1:54324).

## What's left (mostly the user)

1. **The user's by-hand steps are in `docs/SETUP-TODO.md`**: the Vercel env var (`VITE_ENABLE_AS_OF`), the
   staging Auth dashboard (code template, OTP settings, Site URL), the Phase 1 phone test, the domain and
   Resend setup, and the Nov 8 items. Keep that file current: tick or reword items when the user reports
   progress, and add new by-hand steps there rather than here.
2. **Resend is needed before the Nov 2 leaders' test.** Until then staging uses Supabase's built-in sender (a
   few emails an hour). DNS for tcnikeja.org is with a church contact; the user sends one batched request.
3. **Real Module 1:** when it arrives, save as `content/module-1.json`, run
   `pnpm media:compress content/module-1.json --target …` if it has media, then `pnpm content:load` to local
   and staging. It replaces the sample days by day number.
4. **Acceptance on staging for Phases 1 and 2** waits on the user: deploy the latest commit on Vercel, the
   dashboard steps, testers signing up, then test pods (`pnpm pods:test`; the user may send the emails for
   Claude to run it). If either test turns up bugs, fix them before starting Phase 3.

## Next: 4.1 reports and moderation (pulled forward), then the rest of Phase 3

Follow PLAN.md 4.1: the `reports` table, the report sheet behind the message options' (currently switched
off) Report button, the facilitator's badge, `/mod` for moderators, and the `notify-report` edge function.
The email needs Resend, which isn't set up yet: build and test everything else, with the function ready to
switch on once `RESEND_API_KEY` exists. Then PLAN.md 3.2 onwards. Things to know:
- 3.3 avatars: choosing the DiceBear style (and checking its licence) also decides whether it replaces the
  initials avatars in the pod header and the drawn pod picture (`src/features/pods/pod-picture.ts`).
- Production Supabase (a separate Pro org) and Resend Pro are needed before Nov 8.

## Accounts

| Account | State |
| --- | --- |
| GitHub | `tcncovenantculture/tcc-wofbec-40-days`, **private, owned by an organisation**. Remote `origin` over HTTPS; credentials in the macOS keychain; no `gh` CLI. |
| Supabase staging | **`tccwofbec-40-staging`**, London `eu-west-2`, free org. Linked; seven migrations applied. Migrations: `SUPABASE_DB_PASSWORD="$(node -e "process.loadEnvFile('.env.staging'); process.stdout.write(process.env.SUPABASE_DB_PASSWORD ?? '')")" pnpm exec supabase db push --linked --yes` (dry run first with `--dry-run`). The shell can't `source` `.env.staging` (a value has special characters), and the password must never be printed. |
| `.env.staging` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (an `sb_secret_` key), `SUPABASE_DB_PASSWORD` filled; `RESEND_API_KEY` empty. Gitignored. |
| Vercel | **Hobby**, project `tcc-wofbec-40-days`. Production and Preview env vars point at staging (switch Production to prod before Nov 8). Hobby doesn't support private organisation repos: if automatic deploys get blocked, the user deploys by hand from the dashboard (their call; don't add a CI deploy workaround). |
| Resend | Not set up. Church domain **tcnikeja.org** (DNS at Namecheap, run by a church contact). Proposed, not yet agreed: **`40days.tcnikeja.org`** for both the app (Vercel CNAME) and the Resend sending domain (region `eu-west-1`), sender `hello@40days.tcnikeja.org`, name "Covenant Culture 40 Days". `mail.` and the root are taken by another church team's Resend. Steps and DNS findings in `docs/SETUP-TODO.md`. |
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

## Phase 2 decisions worth knowing (details in PLAN.md build notes)

- **Message bodies are only readable through the `pod_messages` view** (`messages.body` isn't granted), so a
  hidden message really is hidden from members. Realtime payloads therefore carry no body: a change is a
  signal to refetch the thread.
- **`pod_roster()` is a function, not the view the plan named**, because Supabase's advisor flags security
  definer views as errors. It returns `user_id` too, so messages can carry names.
- **Realtime** subscribes only while `/pod` is open, filtered by `pod_id`, and refetches the pod's threads
  every time the subscription is confirmed (first connect and every reconnect). The channel must join with
  the user's token; joined as anon, Realtime rejects the `pod_id` filter.
- **Sending:** ids are made on the phone; sending, waiting and failed messages come from TanStack's mutation
  cache (Try again / Remove); a duplicate-id error (23505) counts as sent.
- **Report is a switched-off placeholder** in the message options until 4.1. Hide works for facilitators.
- The pod picture for WhatsApp is drawn on a canvas, not DiceBear (that style is chosen in 3.3).
- The viewport meta has `interactive-widget=resizes-content` (composer above the Android keyboard), and the
  bottom nav hides while the composer has focus on touch screens (CSS `:has()` in `index.css`).
- shadcn tabs were resized to 48px with 16px text; use them as they are now.
- `pnpm pods:test` makes test pods on local or staging (never prod); `pods:form` (4.2) is the real one.

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

- **Size budgets.** Run `pnpm build && pnpm size` after every feature. The signed-in app's JS is 184.9 kB
  gzipped of 200 (React DOM and the Supabase client are most of it). The landing page is 91.8 kB as served of
  100, with little room: anything `main.tsx`, `landing.tsx`, `error-boundary.tsx`, `load-failed.tsx` or
  `page-frame.tsx` imports lands in it, so those use `buttonVariants` (not `<Button>`) and never import the
  router, Supabase, TanStack Query or `cn`. The smoke test catches the App chunk or Supabase loading there.
- Pipe-free checks: run `pnpm format:check` on its own before committing. Piping it through `tail` hides a
  failure (it happened three times on Oct 30). Prettier sometimes needs a second `--write` pass on long
  method chains.
- Playwright checks in the scratchpad: a Radix sheet marks the rest of the page hidden while it opens and
  closes, so wait for elements (`waitFor`) instead of checking `isVisible()` straight after. Realtime is cold
  for a few seconds after `supabase db reset`.
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

- Agree the proposed names (`40days.tcnikeja.org`, `hello@40days.tcnikeja.org`) and a church inbox for
  replies; the welcome and reminder emails in Phase 4 use it as reply-to
- Original logo file (SVG or 1024px+ PNG)
- From the plan: moderator names (by Nov 7), whether reports also go to moderators, baseline question
  wording (by Nov 5), data retention period
- A contact email for the privacy notice (3.2); it could be the same church inbox as the reply-to
