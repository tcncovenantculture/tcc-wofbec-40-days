# Covenant Culture 40-Day Experience

Mobile-first web app (installable PWA, no app store) that guides participants through 40 days of daily
discipleship in pods of about five, then nine waiting days that lead into WOFBEC 2027. The full build plan,
phase by phase, is in `docs/PLAN.md`. Work through it in order and tick its checkboxes as you finish.

## Key dates (all Africa/Lagos time)

| Date | Milestone |
| --- | --- |
| Nov 1 | Working version with Module 1 content loaded (re-baselined from Oct 29) |
| Nov 2 | Internal test with leaders |
| Nov 4 | Walkthrough for Pastor Yemi |
| Nov 8 | Youth Sunday: QR code goes live, public sign-up opens |
| Nov 12 | Final checks |
| Nov 13 | Launch: pods formed, welcome email sent |
| Nov 14 | Day 1 |
| Dec 23 | Day 40, last lesson |
| Dec 24 to Jan 1 | Waiting days 41 to 49: no new content, pods stay open to talk |
| Jan 2, 2027 | Day 50, WOFBEC begins |

Day N unlocks at 00:00 Lagos time on Nov 13 + N days. Day 1 = Nov 14, Day 15 = Nov 28 (The Convergence),
Day 40 = Dec 23, Day 50 = Jan 2.

## Stack

- **App:** React 19, TypeScript (strict), Vite, React Router 7 (declarative mode), Tailwind CSS v4, shadcn/ui
- **Server state:** TanStack Query. **No Redux**: there's almost no client state. The few local settings
  (text-only mode, dismissed prompts) live in a small context backed by `localStorage`.
- **Forms and validation:** react-hook-form + zod. The same zod schemas validate content files.
- **Backend:** Supabase (Postgres, Auth with email OTP codes, row-level security, Realtime, Storage,
  Edge Functions, pg_cron). There's no custom server.
- **PWA:** vite-plugin-pwa (Workbox). It caches the app shell and the current day.
- **Email:** Resend, both as Supabase Auth's custom SMTP and for reminder and report emails
- **Avatars:** DiceBear (`@dicebear/core` plus one style package), rendered client-side from options
  stored on the profile
- **Dates:** date-fns + `@date-fns/tz`, always in `Africa/Lagos`
- **Motion:** `motion` for small transitions, `canvas-confetti` for day complete. Both are lazy-loaded.
- **Icons:** Lucide, because shadcn/ui ships with it and one icon set keeps the bundle small
- **Fonts:** Barlow Condensed (headings) and Manrope (body) via `@fontsource`, Latin subset, two weights each
- **Hosting:** Vercel (SPA rewrite to `index.html`)
- **Tests:** Vitest (logic), pgTAP via `supabase test db` (RLS), Playwright (one end-to-end smoke test)
- **Package manager:** pnpm

## Commands

```bash
pnpm dev                      # Vite dev server
pnpm build && pnpm preview    # production build
pnpm size                     # after a build: landing page under 100 KB, signed-in app JS under 200 KB
pnpm og:image                 # redraw public/og.png (the WhatsApp link preview) after design or date changes
pnpm typecheck                # tsc --noEmit
pnpm lint                     # eslint
pnpm test                     # vitest
pnpm test:e2e                 # playwright
supabase start                # local Supabase (Studio, Mailpit for OTP emails)
supabase migration new <name> # every schema change is a migration
supabase db reset             # re-apply migrations + seed locally
supabase test db              # RLS tests in supabase/tests
pnpm db:types                 # supabase gen types typescript --local > src/lib/database.types.ts
pnpm content:load content/module-1.json [--target local|staging|prod]
pnpm media:compress content/module-1.json [--target local|staging|prod]   # before content:load, if it has media
pnpm pods:form [--commit]     # suggest pods (dry run prints CSV); --commit writes them
pnpm pods:test --name "Leaders" first@x.com second@y.com [--target staging]   # test pod; --list, --remove; never prod
```

## Repo layout

```
src/
  app/            router, providers, layout shell, error boundary
  routes/         one file per screen (landing, signup, verify, home, day, journey, pod, settings, mod, preview)
  features/       auth, days, progress, reflections, pods, chat, moderation, avatar, reminders, analytics
  components/ui/  shadcn/ui components (generated, lightly themed)
  lib/            supabase.ts, database.types.ts, programme.ts (day maths), analytics.ts
  theme/          tokens.ts (mirrors CSS variables in index.css)
supabase/
  migrations/     SQL migrations (source of truth for schema and RLS)
  functions/      edge functions: notify-report, daily-reminder, welcome-email
  tests/          pgTAP RLS tests
  seed.sql        local seed: test users, seeded pods, Module 1 sample
scripts/          load-content.ts, form-pods.ts, compress-media.ts
content/          module-N.json files, one per curriculum module
docs/             PLAN.md, brief notes
```

## Domain terms

- **Segment:** one of `undergrad`, `early_career`, `experienced_professional`, `entrepreneur`, picked at
  sign-up. Screens are identical for every segment; only content examples differ.
- **Pod:** about five people from the same segment (Mark 2:1 to 4). Sizes 4 to 6 are allowed.
- **Facilitator:** one member of each pod, picked at random when pods are formed. A peer, not staff. They
  can pin a post in their pod, hide a message in their pod, and create the pod's WhatsApp group.
- **Moderator:** a church leader with `role = 'moderator'`. Receives every report by email, can hide or
  remove any message, and can post an announcement to all pods.
- **Reviewer:** the project lead or a church leader with `role = 'reviewer'`, who can preview unpublished days.
- **Curriculum module:** 8 days. Day 1 of a module is `intro`, days 2 to 7 are `developmental`, day 8 is
  `synthesis` (rest, synthesis, pod alignment) and uses its own template that must never look like a lesson.
  "Curriculum module" (content) is different from "build phase" (this plan).
- **Daily flow:** Encounter, Understand, Apply, Connect, Complete. The core flow takes 10 to 15 minutes on a phone.
- **Waiting days:** days 41 to 49. No new content; the home screen points people to their pod chat.

## Rules that cannot bend (from the brief)

1. **Low-cost phones, weak data.** Text first. Media is compressed and optional, with a text-only fallback
   (manual toggle, plus automatic when `navigator.connection.saveData` is true). Initial JS budget: 200 KB
   gzipped. Route-split pods, moderation, avatar builder and anything heavy.
2. **No app install, short sign-up.** Collect only name, segment, email, optional WhatsApp number, consents.
3. **Private reflections stay private.** Owner-only by RLS. Sharing copies the text into a pod message;
   it never exposes the reflections table.
4. **Every table has RLS enabled.** No exceptions. The service role key is used only in `scripts/` and
   edge functions, never in `src/`, and never committed.
5. **Moderation, reporting and escalation exist before public sign-up opens on Nov 8.**
6. **Reminders only with consent**, worded to encourage and never to shame. No "you missed", no
   "you're behind", no streak loss.
7. **Accessible.** Body text at least 16px, contrast at least 4.5:1 for text, captions or transcript for
   every video (the content loader rejects a video without one), tap targets at least 44px.
8. **No leaderboards or rankings.** Progress shows only to the person, and to the pod as totals with no
   names ("4 of 5 done today").
9. **All ages.** No age question (agreed with the project lead).
10. **AI and likeness.** Any AI-generated image, audio or video carries a visible "AI-generated" label
    (`ai_generated: true` in content). No real person's likeness, and no realistic depiction of Jesus.

## Conventions

- Strict TypeScript and no `any`. Use generated database types; never hand-write table types.
- Data access lives in `features/*/api.ts` as TanStack Query hooks. Components never call Supabase directly.
- Cross-row logic that needs elevated rights (pod totals, hiding a message, pod membership checks) goes in
  `security definer` SQL functions with a fixed `search_path`, not in client code.
- Every "today" calculation goes through `src/lib/programme.ts`. In non-production builds,
  `?asOf=2026-11-20` overrides the clock for testing.
- Copy is warm and plain. British spelling isn't required; consistency is.
- Theme colours come only from tokens (see `docs/PLAN.md`, Phase 0). No raw hex values in components.
- Small commits, one task each. Before calling a task done, run `pnpm typecheck && pnpm lint && pnpm test`,
  and `supabase test db` if SQL changed.
- Tick the task's checkbox in `docs/PLAN.md` in the same commit.

## Out of scope (don't build)

Native apps, an admin UI, automated WhatsApp groups or WhatsApp messaging, AI-generated characters or video,
advanced analytics dashboards, per-segment app versions, dark mode, public profiles, leaderboards.
