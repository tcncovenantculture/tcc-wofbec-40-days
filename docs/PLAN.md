# Build plan: Covenant Culture 40-Day Experience

This is the working plan for Claude Code. Work through the phases in order, one phase per session, and tick
tasks as they're done. Each phase ends with acceptance checks; don't start the next phase until they pass.
Project rules, stack and conventions are in `/CLAUDE.md`.

**Re-baselined Oct 29.** The original Oct 29 working-version milestone is today and the build is starting
now, so the working version moves to **Sun Nov 1**. Every later date in the brief holds. Tell OyinDamola
in today's progress note.

## At a glance

| Phase | What | Dates | Gate |
| --- | --- | --- | --- |
| 0 | Accounts, scaffold, theme tokens, deploy | Oct 29 | App shell deployed |
| 1 | Schema, auth, home, daily screen, content loader, Module 1 loaded | Oct 29 to Nov 1 | **Working version, Nov 1** |
| 2 | Pods, pod chat, shared reflections, pod totals | Nov 1 to Nov 4 | Leaders' test Nov 2; **walkthrough Nov 4** |
| 3 | Public sign-up: landing, privacy, consent, avatars, baseline | Nov 4 to Nov 7 | **QR live Nov 8** |
| 4 | Moderation, pod formation, reminders, My journey polish | Nov 7 to Nov 11 | Feature-complete Nov 11 |
| 5 | Hardening: low-end QA, accessibility, metrics, runbook | Nov 11 to Nov 13 | **Launch Nov 13** |
| 6 | After launch: module loads, waiting days, day-40 baseline | Nov 14 to Dec 23 | Waiting state live Dec 20 |

**If the schedule slips, cut in this order:** web push (already deferred), live chat updates (ship the
threaded board), the pod scene illustration, the avatar builder (use a seeded random avatar), share to
WhatsApp, motion and confetti. Never cut: RLS, reporting and moderation, text-only mode, consent.

---

## Phase 0: Setup (Oct 29)

Goal: an empty but real app, themed and deployed, with local Supabase running.

### Accounts (Seyi, by hand)

- [x] GitHub repo `covenant-40-day` (created as `tcncovenantculture/tcc-wofbec-40-days`, private)
- [ ] Supabase: `c40-staging` (free, used for previews and the leaders' test) and `c40-prod` (paid plan, so
      it never pauses). Pick the closest region on offer. There's no African region, so data sits abroad;
      note this for the privacy task in Phase 3.
- [ ] Vercel project linked to the repo: previews use staging, production uses prod. Live on Hobby at
      https://tcc-wofbec-40-days.vercel.app; Production points at staging until `c40-prod` exists.
- [ ] Resend account. Verify a sending domain (DNS) today, because verification can take time.
- [ ] Domain or subdomain for the app, which the Nov 8 QR code points at. **Proposed Oct 30:**
      `40days.tcnikeja.org` for both the app and the Resend sending domain (`mail.tcnikeja.org` is taken).
      Steps for both items are in `docs/SETUP-TODO.md`.

### Scaffold (Claude Code)

- [x] Vite + React 19 + TS strict, pnpm, ESLint, Prettier, path alias `@/`
- [x] Tailwind v4 (`@tailwindcss/vite`), shadcn/ui init, add: button, card, input, label, form, select,
      radio-group, checkbox, textarea, tabs, sheet, dialog, sonner, progress, skeleton, avatar, badge,
      dropdown-menu
- [x] React Router 7 with routes stubbed: `/`, `/signup`, `/verify`, `/home`, `/day/:n`, `/journey`,
      `/pod`, `/settings`, `/mod`, `/preview/:n`
- [x] TanStack Query provider, Supabase client (`src/lib/supabase.ts`) reading `VITE_SUPABASE_URL` and
      `VITE_SUPABASE_ANON_KEY`
- [x] `supabase init`, `supabase start`, `pnpm db:types` script
- [x] vite-plugin-pwa: manifest (name "Covenant Culture 40 Days", theme and background colour `#FBF5EE`,
      icons from the logo), `registerType: 'autoUpdate'`, precache the app shell only
- [x] Vitest and Playwright configured, one passing placeholder test each
- [x] GitHub Action: typecheck, lint, test on every push
- [x] Vercel SPA rewrite; first deploy. The rewrite and cache headers are in `vercel.json`; first deploy
      Oct 29, smoke test and offline loading pass against the live URL.

Build notes (Oct 29):

- TypeScript is pinned to 6.0 because typescript-eslint doesn't support TypeScript 7 yet. React Router is
  pinned to 7 (8 is out).
- shadcn's `form` component is now an empty stub; its replacement `field` is installed instead, and works
  with react-hook-form.
- The logo and icons are cut from the 1080px Covenant Culture graphic (`docs/brand/`) by
  `scripts/extract-logo.ts`. Use `<Logo />` (full) or `<Logo variant="mark" />` in screens. When the
  original logo file arrives, regenerate `public/icon-source.png` and run `pnpm icons`.
- `supabase start` skips the logging and image-resizing services (`-x logflare,vector,imgproxy,supavisor`).
- Vercel's Hobby plan doesn't support private repos owned by a GitHub organisation. If automatic deploys
  get blocked, deploy by hand from the Vercel dashboard (the agreed fallback); don't add a CI workaround.

### Theme tokens (Claude Code)

The palette comes from the earlier Covenant Culture app, sampled from the logo. Put the tokens in
`src/index.css` under `@theme` and mirror them in `src/theme/tokens.ts`.

```css
/* brand */
--color-orange: #E86F36;  --color-orange-ink: #BC4B16;  --color-orange-deep: #D2551F;
--color-amber:  #F0942F;  --color-yellow: #F6CA35;      /* yellow: decoration only, never text */
--color-green:  #106635;  --color-purple: #892B89;      --color-coral: #EF545C;
/* neutrals */
--color-cream: #FBF5EE;  --color-card: #FFFDF9;  --color-ink: #1B1714;
--color-ink-soft: #5C5149;  --color-muted: #7A6E65;  --color-border: #EADFD3;
--color-overlay: rgba(27, 23, 20, 0.45);
--shadow-card: 0 18px 50px -12px rgba(120,60,20,.18), 0 2px 8px rgba(120,60,20,.06);
--shadow-cta: 0 10px 24px -8px rgba(210,85,31,.55);
```

- [x] Map shadcn variables: `background` cream, `card` card, `foreground` ink, `muted-foreground` muted,
      `border` / `input` border, `primary` orange (foreground white), `destructive` `#C2343E`, `ring` orange-ink
- [x] **One accent per curriculum module**, each with base, display and ink shades. Base is for bars, dots
      and glows; display for large titles; ink for small text.

      | Module | Accent | Base | Display | Ink |
      | --- | --- | --- | --- | --- |
      | 1 | Orange | #E86F36 | #E76629 | #BC4B16 |
      | 2 | Purple | #892B89 | #892B89 | #892B89 |
      | 3 | Green | #106635 | #106635 | #106635 |
      | 4 | Coral | #EF545C | #EF545C | #C2343E |
      | 5 | Amber | #F0942F | #D3750F | #A15D0A |

      Expose them as `data-module="1..5"` on a wrapper that sets `--accent`, `--accent-display` and
      `--accent-ink`. (Utilities: `bg-module`, `text-module-display`, `text-module-ink`. shadcn's own hover
      colour moved to `--ui-accent` so it doesn't clash.)
- [x] Primary button: white text on a 135° gradient from `#E86F36` to `#D2551F`, with `--shadow-cta`. White on
      orange is about 3.1:1, so button labels must be at least 19px bold (large text). (20px Barlow
      Condensed 700, since Manrope is only loaded at 400 and 600.)
- [x] Logo strip component (purple, green, yellow, amber, coral) for special moments only: day 8, module
      complete, pod scene. Bouncing-dots loader in the same colours.
- [x] Background glows on cream: amber at 13%, purple at 5%, yellow at 10%. Image shimmer `#F6EDE2`.
- [x] Fonts via `@fontsource/barlow-condensed` (600, 700) and `@fontsource/manrope` (400, 600), Latin subset
- [x] Light mode only. No `dark:` variants. (shadcn's generated files keep theirs, but they only match
      under a `.dark` class the app never sets.)

**Acceptance:** the deployed URL shows a themed placeholder home on a phone, Lighthouse PWA install check
passes, CI is green.

---

## Phase 1: Core loop (Oct 29 to Nov 1) → working version

Goal: a signed-in person can open today's day, go through all five steps, save reflections, complete it,
and see progress. Module 1 is loaded from a content file.

### 1.1 Schema and RLS (migrations)

```sql
create type segment as enum ('undergrad','early_career','experienced_professional','entrepreneur');
create type user_role as enum ('participant','moderator','reviewer');
create type day_kind as enum ('intro','developmental','synthesis');
create type dimension as enum ('career','character','community');

profiles (
  id uuid pk references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  segment segment not null,
  email text not null,
  whatsapp_number text,                 -- optional contact, E.164
  role user_role not null default 'participant',
  avatar jsonb,                         -- DiceBear options
  reminder_email boolean not null default false,   -- consent
  unsubscribe_token uuid not null default gen_random_uuid(),
  created_at timestamptz default now()
)

days (
  day_number int pk check (day_number between 1 and 40),
  module_number int not null check (module_number between 1 and 5),
  kind day_kind not null,
  title text not null,
  introduction text not null,
  scripture_ref text not null,
  scripture_text text,
  scripture_url text,
  body_md text not null,
  media jsonb not null default '[]',    -- [{type:'image'|'audio'|'video', url, alt?, caption?, transcript?, ai_generated}]
  reflection_prompts text[] not null,
  practical_action text not null,
  action_dimension dimension not null,
  pod_prompt text not null,
  est_minutes int not null,
  publish_at timestamptz not null,
  status text not null check (status in ('draft','published')),
  updated_at timestamptz default now()
)

progress (user_id uuid references profiles, day_number int references days,
          completed_at timestamptz default now(), primary key (user_id, day_number))

reflections (id uuid pk, user_id uuid references profiles, day_number int references days,
             prompt_index int not null, body text not null, updated_at timestamptz default now(),
             unique (user_id, day_number, prompt_index))
```

- [x] Migrations for the above, plus an `updated_at` trigger
- [x] Helper `is_role(r user_role)`: `security definer`, `search_path = public`
- [x] RLS `profiles`: select and update own row. Users can't change `role` (column-level grant or trigger).
      Moderators can read `display_name` of anyone (needed for reports).
- [x] RLS `days`: select where `status = 'published' and publish_at <= now()`, or `is_role('reviewer')`,
      or `is_role('moderator')`. No client insert, update or delete.
- [x] RLS `progress` and `reflections`: own rows only, for every operation
- [x] Trigger: create the `profiles` row from `auth.users` metadata on sign-up
- [x] pgTAP tests: a participant can't read a future day; can't read another user's reflections; can't set
      their own role. A reviewer can read a draft day.
- [x] `pnpm db:types`

Build notes (Oct 30):

- Every migration that adds a table starts from `revoke all ... from anon, authenticated` and grants back
  only what the app uses, because Supabase grants every privilege on new public tables by default.
- Security definer functions use `set search_path = ''` with schema-qualified names (stricter than
  `public`, and what Supabase's linter expects).
- Profile edits are a column-level grant: `display_name`, `whatsapp_number`, `avatar`, `reminder_email`.
  Role, email, segment (pods are formed by segment) and the unsubscribe token can't be changed from the app.
- Moderators get display names through `moderator_display_names(uuid[])`, not a wider profiles policy, so
  they never see emails or phone numbers.
- Progress and reflections can only be written for days the person can see, so nobody completes or
  answers a day before it unlocks. Staging therefore needs content loaded with past `publish_at` values
  for `?asOf` testing (see 1.4).

### 1.2 Programme clock (`src/lib/programme.ts`)

- [x] `programmeDay(now)` returns a `{ phase: 'before'|'lesson'|'waiting'|'wofbec', day?: number, module?: number }`,
      computed in Africa/Lagos. Day 1 starts 2026-11-14 00:00 WAT; days 41 to 49 are `waiting`; day 50 and
      later are `wofbec`.
- [x] `publishAtFor(day)` is used by the content loader
- [x] `?asOf=YYYY-MM-DD` override, only when `import.meta.env.MODE !== 'production'`. Also allowed when
      `VITE_ENABLE_AS_OF=true`, because every Vercel build is a production build and the Nov 1 test runs on
      staging. Set it on Vercel while it points at staging; **remove it from Production before Nov 8.**
      The override lasts for the browser tab session; `?asOf=off` clears it.
- [x] Vitest coverage of boundaries: Nov 13 23:59, Nov 14 00:00, Day 8, Day 9, Day 40, Dec 24, Jan 1, Jan 2.
      UTC midnight must not be treated as Lagos midnight.

### 1.3 Auth (email OTP code)

Use 6-digit **codes**, not magic links. On iPhone, a magic link opens Safari instead of the installed app,
which breaks the session; a code works everywhere and is lighter on weak data.

- [ ] Supabase Auth: email provider on, OTP length 6, expiry 1 hour. Email template contains `{{ .Token }}`.
      Done locally (`config.toml`, `supabase/templates/sign-in-code.html` for both "Confirm signup" and
      "Magic link"). Staging still needs the same settings and template in the dashboard.
- [ ] Custom SMTP set to Resend on staging and prod. The built-in sender is rate-limited and only for testing.
      **Backlogged Oct 30:** waiting on the church domain's DNS.
- [x] `/signup`: name, segment (four large radio cards), email, WhatsApp number (optional), privacy
      acknowledgement (required), reminder consent (unticked by default). Calls `signInWithOtp` with
      `options.data` carrying the profile fields and `shouldCreateUser: true`.
- [x] `/verify`: 6-digit input, `verifyOtp({ email, token, type: 'email' })`, resend after 60s, clear errors
- [x] Returning users: "Sign in" reuses the same email-to-code flow (`/signup?mode=signin`)
- [x] Route guard: signed-out users go to `/`; signed-in users skip the landing and signup screens
- [x] Locally, codes arrive in Mailpit (`supabase start` prints its URL)

Build notes (Oct 30):

- The profile is created when the code is *sent*, not when it's verified (Supabase creates the user then).
  `pods:form` (Phase 4) must only pick people whose email is confirmed (`auth.users.email_confirmed_at`).
- WhatsApp numbers are normalised to E.164 in the form; an 11-digit number starting with 0 is read as
  Nigerian. The database rejects anything that isn't E.164.
- The privacy tick is required by the form but not stored. If the NDPA review wants a consent record,
  add a `privacy_accepted_at` column in Phase 3.
- Sign out sits on the Settings placeholder for now, for testing several accounts on one phone.
- `/privacy` is a placeholder until Phase 3, so the sign-up form's link has somewhere to go.
- Signing out, or a different person signing in, clears the TanStack Query cache, so a shared phone never
  shows the previous person's data.
- Checkbox and radio borders use `muted-foreground`, because `border` on cream is too faint to see (non-text
  contrast needs 3:1).
- The Supabase client is now in the first-load bundle (through the session provider). Phase 3's lean
  landing page will need to keep it off the landing route.

### 1.4 Content format and loader

The content file format is in `content/module-1.template.json`. One file per curriculum module, eight days each.

- [x] Zod schema `features/days/schema.ts`, shared by the loader and the app. Rules: day numbers are
      contiguous within the module; `kind` is `intro` for the first day, `synthesis` for the eighth and
      `developmental` otherwise; at least one reflection prompt; `est_minutes` between 5 and 20; every video
      has a `transcript`; every image has `alt`; `ai_generated` is present on every media item. Also: at
      most three prompts, audio needs a transcript (text-only mode shows it instead), videos must be YouTube
      links, and unknown fields are rejected so typos are caught.
- [x] `scripts/load-content.ts <file> --target local|staging|prod`: validates, fills `publish_at` from
      `publishAtFor` unless given, upserts by `day_number`, prints a summary table. Uses the service role key
      from `.env.<target>` (gitignored). `--dry-run` validates only. Local reads its keys from
      `supabase status`. `--publish-now` unlocks every day now for `?asOf` testing (refused for prod);
      prod needs `--yes`.
- [x] `scripts/compress-media.ts`: resizes images to at most 1200px wide as WebP (target 150 KB or less) with
      sharp; re-encodes audio to 64 kbps mono; uploads to the Storage bucket `media` (public read); rewrites
      URLs in the JSON. `pnpm media:compress <file> [--target …] [--dry-run]`. Sources go in `content/media/`
      (gitignored); outputs are named with a content hash so they can be cached for a year, and the JSON gets
      a bucket path (`media/module-1/day-3-1a2b3c4d.webp`) that works in every environment, so run it once
      per target. The loader refuses a file with unprocessed media. Images tested; **audio is untested**
      because ffmpeg isn't installed here (`brew install ffmpeg`).
- [x] Video: not self-hosted. Use an unlisted YouTube link rendered as a tap-to-load facade (thumbnail only
      until tapped), with the transcript beside it. Plays from `youtube-nocookie.com`.
- [ ] Load Module 1 to local and staging as soon as the file arrives. The real file hasn't arrived; the
      sample modules (`content/samples/`, all 40 days) are loaded to local and staging with `--publish-now`.

### 1.5 Home (`/home`)

- [x] `before`: welcome card, countdown to Day 1, "Your pod forms on Nov 13"
- [x] `lesson`: today's card (module accent, day number, title, estimated minutes, Continue button); personal
      progress "Day 12 of 40" as a 40-dot strip grouped into five modules; a "Catch up" list of unlocked,
      uncompleted days, worded neutrally ("Ready when you are")
- [x] `waiting`: a card that points to the pod chat (Phase 6 polishes it). Day 50 onwards shows a short
      "WOFBEC has begun" version until Phase 6.
- [x] Skeletons while loading. Works from cache when offline: the shell plus the last fetched day.

Build notes (Oct 30):

- Home, journey, pod and settings share a bottom nav (Today, Journey, Pod, Settings), because nothing
  else links to journey or settings. The day screen leaves it out.
- Offline: TanStack Query's cache is saved to localStorage (`days`, `progress`, `profile` only; never
  reflections) for 7 days, and cleared on sign-out. If the access token expired while offline, the auth
  provider uses the saved session instead of signing the person out; supabase-js refreshes it when the
  signal returns. The session is stored under `c40.auth`.
- Dates are displayed with `Intl.DateTimeFormat` (Lagos time zone) and `?asOf` is parsed by hand, because
  date-fns `format` and `parse` added about 9 KB gzipped to the first load. date-fns still does the date
  maths. First load is now 180 KB gzipped.
- Progress is cached as an array (it's saved as JSON) and turned into a Set for screens.

### 1.6 Daily screen (`/day/:n`)

- [x] Five steps as a vertical stepper on one route (`?step=`), with back and next. Steps:
      **Encounter** (scripture reference and text, introduction, body markdown, optional media),
      **Understand** (reflection prompts, each a textarea that autosaves after 800 ms idle),
      **Apply** (practical action with its dimension badge: career, character, community),
      **Connect** (the pod prompt; links to the pod thread, and Phase 2 adds "Share a reflection"),
      **Complete** (button writes `progress`; confetti; shows the next step: tomorrow's unlock time, or the
      next catch-up day)
- [x] `kind = 'synthesis'` uses a distinct template: no stepper, a calm layout with the logo strip, a
      "Look back on this module" list of the module's practical actions, and the pod prompt given most space.
      It must not look like a lesson.
- [x] Body markdown through `react-markdown` (no raw HTML)
- [x] Media respects text-only mode: images become their alt text; audio and video become their transcript
- [x] Media flagged `ai_generated` shows an "AI-generated" label
- [x] A day that isn't unlocked yet shows a friendly "Unlocks on <date>" (RLS returns nothing, so the UI
      handles the empty result)

Build notes (Oct 30):

- Every step stays mounted (inactive ones are `hidden`), so a half-typed answer survives moving between
  steps. Answers also save on blur and when the screen closes, and saves for one box run in order.
- The clock decides whether a day is open (so `?asOf` works on staging, where everything is published);
  RLS hides it as well. A day that's open by the clock but not in the database shows "Not quite ready".
- The synthesis day keeps the private answer boxes ("Just for you") and a "Finish Day 8" button, so it
  counts towards progress like any other day.
- Text-only mode lives in a small localStorage context (`features/settings`) and is on by default when
  Data Saver is. Its toggle sits on the Settings placeholder now (the plan has it in Phase 5).
- The day screen is lazy-loaded (42 KB gzipped with react-markdown); zod loads with day content. Confetti
  loads on completion and is skipped for people who prefer reduced motion.

### 1.7 Reviewer preview (`/preview/:n`)

- [x] Reviewers (role set by hand in Studio) can open any day, draft or future, rendered exactly as
      participants will see it, with a "Preview" ribbon and a day picker. This is how the project lead reviews
      content without an admin. Saving answers and completing are switched off in preview, and anyone
      without the reviewer role sees "This page is for reviewers".

### 1.8 Seed

- [x] `supabase/seed.sql`: three participants, one reviewer, one moderator, and Module 1 sample days with
      `publish_at` in the past for local testing. Emails are listed at the top of the file; sign in with
      the code from Mailpit. The RLS tests clear content inside their transaction, so they pass with the
      seed loaded.

**Acceptance (working version, Nov 1):** on a real Android phone on staging, sign up with a code, open Day 1
(via `?asOf=2026-11-14`), finish all five steps, see Day 1 complete on home, and reopen to find the
reflections saved. Day 8 renders the synthesis template. The project lead can preview every Module 1 day.
RLS tests pass.

---

## Phase 2: Pods and chat (Nov 1 to Nov 4) → walkthrough

Goal: seeded pods where members talk under each day's prompt, share reflections, and see pod totals.

### 2.1 Schema and RLS

```sql
pods (id uuid pk, name text not null, segment segment not null,
      avatar_seed text not null default gen_random_uuid()::text,
      whatsapp_invite_link text check (whatsapp_invite_link is null
             or whatsapp_invite_link like 'https://chat.whatsapp.com/%'),
      created_at timestamptz default now())

pod_members (pod_id uuid references pods on delete cascade,
             user_id uuid references profiles on delete cascade,
             is_facilitator boolean not null default false,
             joined_at timestamptz default now(),
             primary key (pod_id, user_id),
             unique (user_id))               -- one pod per person

create type message_kind as enum ('message','shared_reflection','pinned','announcement');

messages (id uuid pk, pod_id uuid references pods,   -- null for an all-pods announcement
          day_number int,                           -- null for general chat
          author_id uuid references profiles,
          kind message_kind not null default 'message',
          body text not null check (char_length(body) between 1 and 2000),
          hidden_at timestamptz, hidden_by uuid references profiles,
          created_at timestamptz default now())
```

- [x] Helpers: `my_pod_id()`, `is_pod_member(pod uuid)`, `is_facilitator_of(pod uuid)`, all `security definer`
- [x] RLS `pods`: members and moderators can select. Members can update only `whatsapp_invite_link`, and
      only if they're the facilitator (via RPC `set_whatsapp_link(link)`).
- [x] RLS `pod_members`: select rows of my own pod (display names come through a view
      `pod_roster` that exposes only `display_name`, `avatar` and `is_facilitator`)
- [x] RLS `messages`: select where `is_pod_member(pod_id)`, or `pod_id is null` (announcements), or
      moderator. Hidden messages return with their body replaced by "Message hidden" through a view, unless
      the reader is a moderator. Insert where `author_id = auth.uid()` and the user is a member, with `kind` in
      (`message`, `shared_reflection`). `pinned` is facilitator-only; `announcement` is moderator-only.
      No update or delete from the client.
- [x] RPC `hide_message(id)`: facilitator of that pod or moderator
- [x] RPC `pod_today_totals()`: returns `{ members, completed_today }` for my pod with no names, plus the
      same for a given day
- [x] pgTAP: non-members can't read a pod's messages; a member can't post as someone else; a participant
      can't post an announcement; totals never return user ids
- [x] Seed: two pods of five, a facilitator in each

Build notes (Oct 30):

- **Hiding is access control, not just display.** `messages.body` isn't granted to the app (nor
  `hidden_by`), so reading it directly is refused. The app reads `pod_messages`, a `security_invoker` view
  whose body comes from `message_body(id)`: "Message hidden" once hidden, unless the reader is a moderator.
- **`pod_roster()` is a function, not a view.** It has to read other members' profiles, and Supabase's
  advisor flags security definer views as errors. It also returns `user_id`, so the app can put names on
  messages; never email, phone, segment or role (pgTAP checks the result type).
- `pod_today_totals(for_day)` takes the day number from the app, so `?asOf` works. Counts only.
- Inserts: `author_id` isn't insertable (it defaults to `auth.uid()`), so nobody can post as someone else.
  `id` is, so the app can retry a send with the same id without posting twice. Day threads open with their
  day, like progress. Moderators post announcements only, not messages inside pods. A table check keeps
  announcements (`pod_id` null) and pod messages apart; a partial unique index allows one facilitator per pod.
- **Realtime:** `messages` is in the `supabase_realtime` publication. Checked locally: a member gets inserts
  and updates for their own pod without `body` or `hidden_by` (Realtime sends only granted columns), and
  someone in another pod gets nothing. So the app treats a change as a signal and refetches through
  `pod_messages`. The channel must join with the user's token: joined as anon, Realtime rejects the
  `pod_id` filter ("invalid column for filter").
- Seed: Rooftop (undergrad: Ada facilitates, with Bola, Dayo, Efe, Funmi) and Lantern (early career: Gbenga
  facilitates, with Chidi, Halima, Ife, Jide), a few Day 1 messages, one announcement, and Day 1 done for
  Dayo, Efe and Halima. The Phase 1 RLS test now clears messages before days.

### 2.2 Pod screen (`/pod`)

- [x] Header: pod name, the five avatars (initials until Phase 3), "4 of 5 done today"
- [x] Tabs: **Today** (day's pod prompt pinned at the top, then that day's thread), **Earlier** (list of past
      days with message counts; tap to open the thread), **General** (`day_number` null)
- [x] Announcements from moderators pinned above the tabs; facilitator's pinned post at the top of Today
- [x] Composer: textarea with send, optimistic insert, retry on failure, 2000-character limit
- [x] Load the latest 30 messages, older ones on scroll up (keyset pagination on `created_at, id`)
- [x] **Board first:** pull-to-refresh plus refetch on focus. **Then live:** Supabase Realtime
      `postgres_changes` on `messages` filtered by `pod_id`, subscribed only while `/pod` is open. If Realtime
      isn't stable by Nov 3, ship the board for the walkthrough.
- [x] Message actions sheet: Report (Phase 4 wires the email), Hide (facilitator and moderator only)
- [x] No pod yet (before Nov 13): "Your pod forms on Nov 13. Here's how pods work" (Mark 2:1 to 4)

Build notes (Oct 30):

- **Report is listed but switched off** ("Reporting opens before launch…") until 4.1 adds the reports
  table, the reason form and the email. Hide works, with a confirmation that says moderators can still read
  the message.
- Threads read `pod_messages` newest first, 30 a page, with a `(created_at, id)` cursor. "Load earlier
  messages" loads the next page when it scrolls into view. The screen opens at the newest message and only
  follows new ones while the reader is at the bottom.
- **Sending:** the phone makes the message id. Sending, waiting (offline) and failed messages come from
  TanStack's mutation cache, so they survive tab switches; a failed one offers Try again or Remove. A retry
  that turns out to have got through already (23505) counts as sent.
- **Live:** the Realtime channel is open only on `/pod`. Each change refetches that thread, since bodies
  aren't in Realtime payloads. Whenever the subscription is confirmed (first connect and every reconnect
  after a dropped signal), the pod's threads refetch once, so nothing sent in the gap is missed.
  Announcements (`pod_id` null) can't match the pod filter: they refresh on focus and pull-to-refresh.
- Pull-to-refresh is hand-made (the installed app has no browser refresh) and turns the browser's own off
  while `/pod` is open.
- The facilitator pins with "Pin to the top of this thread" in the composer (shown once there's text). The
  newest pinned post shows above its thread.
- Header: overlapping initials (module ink shades, picked from the user id) with the names as a sentence
  ("Ada, Dayo, Efe, Funmi and you"), so a pod of six fits on a small phone. Finishing a day refreshes the
  totals. Earlier's counts come from `pod_thread_counts()`, a small RPC added for this tab, rather than
  downloading every message. Outside the 40 days the screen opens on General.
- **Phone keyboard:** the viewport meta now has `interactive-widget=resizes-content`, so the fixed composer
  sits above the Android keyboard, and the bottom nav hides while typing (CSS `:has()`, touch screens only).
- shadcn tabs were 32px with 14px text; now 48px with 16px, per the brief's tap-target and text-size rules.
- Bundle: `/pod` is a lazy 21 KB chunk; first load is still about 178 KB gzipped.
- Checked locally with three phones in Playwright: live delivery between Ada and Bola, nothing for Chidi in
  the other pod, hiding, the totals after finishing a day, Earlier's counts, and the "no pod yet" screen.

### 2.3 Share a reflection

- [x] On the Connect step and in My journey: "Share with my pod" on any saved reflection, with a preview and
      confirm. It inserts a `shared_reflection` message (a copy of the text) into that day's thread. The
      reflection itself stays private.

Build notes (Oct 30):

- On the Connect step, and on Day 8 under "Just for you" (its answers sit below the pod card). My journey
  gets the same button when it's built in 4.4.
- The preview is editable and starts as the question plus the answer, so the pod has context. A pod message
  holds 2,000 characters and an answer up to 5,000, so a long answer has to be shortened before sharing.
- It uses the composer's send path: an id made on the phone, and it waits offline.
- Without a pod yet, the answers show "Once your pod forms, you can share…"; the reviewer preview shows
  nothing.
- Checked locally: Ada sees the copy as "Shared a reflection", Bola's private answer is unchanged, and Ada
  still can't read Bola's reflections.

### 2.4 WhatsApp link

- [x] Facilitator sees "Add your pod's WhatsApp group" with steps (create the group, copy the invite link,
      paste it here) and a download of the pod avatar as a PNG for the group icon
- [x] Members see "Join the pod on WhatsApp" once a link exists, behind a notice: "Everyone in a WhatsApp
      group can see each other's phone numbers, and this app's moderation doesn't reach WhatsApp."
- [x] Optional: a "Share to WhatsApp" button on the pod prompt (`https://wa.me/?text=` with the prompt)

Build notes (Oct 30):

- **The pod picture is drawn, not DiceBear:** the pod's first letter on a module colour picked from
  `avatar_seed`, with the five-colour strip, as a 640px PNG (WhatsApp's icon size), colours read from the
  theme tokens. Phase 3 chooses the DiceBear style (and checks its licence) and can swap the picture then.
- The link box accepts WhatsApp's own share text ("Follow this link to join my WhatsApp group: …") and keeps
  only the clean invite, dropping `?mode=…`. Anything else gets a clear message. `set_whatsapp_link` and the
  table check enforce the same on the server. The facilitator can change or remove the link.
- "Share this question on WhatsApp" sits under the day's question on the pod screen.
- Checked locally with three phones: download, wrong link refused, share text accepted, members see the
  notice before the join link, the other pod sees nothing, removing the link hides the join button.

**Acceptance (walkthrough, Nov 4):** two test phones in the same seeded pod post under the Day 1 prompt and
see each other's messages; one shares a reflection; totals update after completing the day; a third
account in another pod sees none of it. The flow is shown on staging with Module 1 loaded and the theme
applied.

Build notes (Oct 30): every check above passed locally with three phones (Playwright, seeded pods). Staging
has the schema but no pods, because the seed is local only and real pods come from 4.2. To test there, people
sign up on staging and `pnpm pods:test --target staging --name "Leaders" first@… second@…` puts them in one
pod (the first email facilitates; `--list` and `--remove` too; refused for prod).

---

## Phase 3: Public sign-up (Nov 4 to Nov 7) → QR live Nov 8

Goal: anyone scanning the QR code on Youth Sunday can sign up in under two minutes on weak data.

### 3.1 Landing (`/`)

- [x] One screen: what the 40 days are (Acts 1:3), dates, pods of five (Mark 2:1 to 4), three dimensions
      (Romans 12:11), "Join" CTA, "Sign in" link. At most one illustration, lazy-loaded. Under 100 KB total
      on first load, excluding fonts.
- [x] Open Graph image and description, for when the link is shared on WhatsApp

Build notes (Oct 30):

- **The landing page boots on its own.** With no saved session, `src/main.tsx` renders it without the router,
  Supabase client or query cache, and its links are plain anchors that load the full app. Everything else,
  and `/` for anyone with a saved session (sent on to `/home`, which is how the installed app opens), loads
  the full app with a dynamic import.
- **Size:** 91.8 kB as served (Brotli, which Vercel sends Chrome), including the logo and favicon; 103.7 kB
  if measured with gzip. React DOM alone is about 60 kB, so the margin is small. **Anything imported by
  `main.tsx`, `landing.tsx`, `error-boundary.tsx`, `load-failed.tsx` or `page-frame.tsx` counts against it.**
  Those files use `buttonVariants` (now in `button-variants.ts`) instead of `<Button>`, whose class-merging
  library costs about 9 kB, and `<Logo>` joins its classes itself. The full logo, used only here, is 416px at
  lighter compression (13.9 kB, down from 28.7 kB). `pnpm size` checks this budget and the app's 200 kB after a
  build, and the smoke test fails if the landing page requests the App chunk or Supabase.
- **The service worker is registered by `main.tsx` when the full app loads** (`injectRegister: false`), so a
  visitor who only reads the landing page doesn't download the whole app in the background. Same behaviour as
  before otherwise: no forced reloads on deploy.
- A static loader in `index.html` shows until the app starts, so a slow connection never sees a blank page.
- Open Graph tags use absolute URLs from `VERCEL_PROJECT_PRODUCTION_URL` (the custom domain once one is added;
  `VITE_SITE_URL` overrides). The image is `public/og.png` (1200×630, 37 kB), drawn by `pnpm og:image` in the
  app's fonts. Re-run it if the dates or design change.
- No illustration yet; there's room for about 8 kB if one is wanted.

### 3.2 Privacy and consent

- [x] `/privacy`: what's collected (name, segment, email, optional WhatsApp number, reflections, progress,
      pod messages), why, who can see what (reflections: only you; pod messages: your pod and moderators),
      where it's stored (hosting outside Nigeria), how long (delete 90 days after Jan 2 unless the project
      lead decides otherwise), how to delete your account, contact email
- [ ] Have the privacy notice checked against Nigeria's NDPA requirements, including cross-border transfer,
      before Nov 8. That's a human review, not code.
- [x] Settings: change reminder consent; delete account (RPC removes profile, reflections, progress and
      memberships; messages become "Former member")

Build notes (Oct 31, overnight run):

- **Consent record:** `profiles.privacy_accepted_at`, set by the sign-up trigger from `privacy_accepted: true`
  in the form's metadata, with the server's time. Nullable: accounts made before it existed have none, and the
  trigger doesn't refuse a sign-up without it (the form already requires the tick). Nobody can edit it.
- **The contact email isn't decided:** the notice says "[contact email to come]" (`CONTACT` at the top of
  `src/routes/privacy.tsx`). It names Supabase in London, Vercel and Resend, and says there's no age question
  and no trackers. "Last updated" is a fixed date in the page; change it with the words.
- **Delete account** is `delete_my_account()`: it deletes the `auth.users` row, which cascades to the profile,
  progress, reflections and pod membership; messages keep their text with no author ("Former member") and
  reports stay open with no reporter. The app then signs out on the phone (the server's 403 for the missing
  user is expected). A two-step sheet explains what goes and what stays. If the facilitator leaves, the pod
  has no facilitator until someone sets one in Studio.
- **Sign-out now removes the saved query cache at once.** It used to be rewritten up to a second later, so a
  phone closed in that second kept the previous person's cached profile (`forgetCachedData` in
  `features/auth/session.tsx`).
- Settings is now a real screen: reminder consent (saves straight away, with a toast), text only, Moderation
  (moderators), the privacy notice, sign out, and delete account at the bottom.

### 3.3 Avatars

- [x] Choose one DiceBear style (try `adventurer`, `big-smile`, `fun-emoji`, `notionists`), check its licence
      and add the attribution to `/privacy` or a credits line if it's CC BY, and check its skin-tone and hair
      range before committing
- [x] Background colours restricted to the five accent bases
- [x] Builder after verify: skin, hair, outfit or accessory, background, each a row of tappable options with
      a live preview. "Surprise me" and "Skip" both work; a skipped profile gets a seeded random avatar.
      Lazy-loaded route.
- [x] `<UserAvatar>` used in the pod header, roster and chat (small, memoised SVG data URI)
- [ ] Pod scene (stretch): the pod's avatars together on a simple themed scene beside the totals

Build notes (Oct 31, overnight run):

- **Style: Big Smile** (`@dicebear/big-smile`), design "Custom Avatar" by Ashley Seo, **CC BY 4.0**: credited
  on `/privacy` (Credits) and under the builder. Compared from the packages themselves: Big Smile has eight
  skin tones from very light to deep brown and 13 hairstyles including braids, a fro bun, curly bob and short
  curls. Adventurer (CC BY) has only four skin tones; Notionists (CC0) is uncoloured line art, so no skin
  tones at all; Fun Emoji (CC BY) is emoji faces with no skin or hair.
- **Versions:** `@dicebear/core` and `@dicebear/big-smile` are both pinned at 9.4.2. Core 10 is out, but the
  style packages are still 9.x and need core 9.
- **Stored shape** (`profiles.avatar`): `{ v: 1, skin, hair, hairColour, accessory, eyes, mouth, background }`,
  checked by a small hand-written parser in `features/avatar/options.ts` (zod stays out of the pod chunk).
  `background` is a module number (1 to 5), so its colour always comes from `theme/tokens.ts`. Anything
  missing or invalid draws the seeded avatar from the user id.
- **A friendly subset only:** three cheerful eye styles and four smiles (no sad, angry or "starstruck" faces);
  extras are none, glasses, sunglasses or a moustache (no clown nose, sleep mask, cat ears or the cartoon
  crown); hair colours are the style's four natural ones. "Surprise me" picks from the same subset, with no
  extras three times out of five.
- **Builder** (`/avatar`, lazy, no bottom nav): a big preview with the person's name, then rows for skin,
  hair, hair colour, extras and background, each option drawn as the avatar would look with it. Each row
  scrolls sideways and opens centred on the current choice. Nothing saves until "Save my avatar".
- **"After verify"** is done from home: someone whose `avatar` is null is sent to `/avatar?setup=1` once per tab
  session. "Skip for now" saves their seeded avatar (so they're never asked again) and moves on even if
  offline. From Settings ("Change your avatar", a row the plan didn't list but the builder needs a way back
  in) it saves and returns to Settings, with Cancel instead of Skip.
- **`<UserAvatar>`** draws an SVG data URI on the phone, memoised per avatar (nothing to download, so it works
  offline and in text-only mode). It's in the pod header and beside other people's messages (not your own,
  like most chat apps); a "Former member" gets a plain placeholder circle. The initials avatar is gone.
- **Size:** DiceBear and Big Smile are a 23 kB gzipped lazy chunk shared by `/pod` and `/avatar`. First load is
  unchanged (184 kB).
- The WhatsApp pod picture stays the drawn letter: it's the group's icon, not one person's face.
- Seed: every seeded user has an avatar except Funmi (shows the seeded fallback). Sign up with a new email to
  see the builder.

### 3.4 Baseline questions (optional)

- [x] After the avatar step: three optional questions (career, character, community), with wording from
      the project lead; 1 to 5 scale plus optional text; "Skip" is prominent. **Built with sample wording**
      (each question starts "Sample:"); the real wording goes in `src/features/baseline/questions.ts`.
- [x] Table `baseline_responses (user_id, phase 'start'|'end', career int, character int, community int,
      note text, created_at)`, own rows only

Build notes (Oct 31, overnight run):

- `/questions` (lazy) comes straight after the avatar step on first sign-in, then home. It isn't offered again
  if someone closes the app before it (it's optional), and opening it after answering says thanks.
- Each question is a row of five large buttons (1 to 5) with the end labels under it ("Not at all", "A great
  deal": sample labels too); tapping the chosen number again clears it, so any question can be left out.
  "Save my answers" needs at least one answer or a note. "Skip" is at the top and as a full-size button
  under Save, and skipping stores nothing.
- The intro says only the project team sees the answers, as totals. `/privacy` lists them under what's
  collected and who sees what.
- Table: primary key `(user_id, phase)`, every answer nullable, note up to 1,000 characters, deleted with the
  account. Insert and read your own only; no updates (answered once per phase); moderators can't read them.
  10 pgTAP tests. The `end` phase is ready for Phase 6's Day 40 offer (`useSaveBaseline('end')`).
- The form uses plain React state rather than react-hook-form, like the report sheet: four optional fields
  with nothing to validate beyond the database checks.

### 3.5 Load and email check

- [ ] Simulate 500 sign-ups against staging (script calling the auth API with test addresses that Resend
      accepts) and confirm codes arrive within a minute. Check Resend's sending limits for the plan in use.
- [ ] Production: Module 1 loaded, Supabase Auth URL and SMTP configured, QR code generated for the prod URL
      and tested on three different phones

**Acceptance:** a person new to the app goes from QR scan to the "before" home screen in under two minutes on
a throttled "Slow 3G" profile, with no app install.

---

## Phase 4: Moderation, pods, reminders (Nov 7 to Nov 11)

### 4.1 Reports and moderation

- [x] `reports (id, message_id, reporter_id, reason text, status 'open'|'actioned'|'dismissed',
      handled_by, handled_at, created_at)`. Reporters insert; moderators select and update.
- [x] Report sheet: reason chips (unkind, unsafe, spam, something else) plus optional text; confirmation copy
      tells the reporter a church leader will see it
- [x] Database webhook on `reports` insert → edge function `notify-report` → email to every moderator
      through Resend, with the message, pod and a link to `/mod`. Built and checked locally (Oct 30): the
      seed's trigger calls the function, which emails moderators through Mailpit. **Staging still needs** the
      function deployed, the webhook made in the dashboard and the secrets set (docs/SETUP-TODO.md).
- [x] Facilitator gets an in-app badge on reports from their pod, which satisfies the brief's "escalation
      path to facilitators". **Confirm with the project lead** that reports also going to church moderators
      is wanted. It's recommended because facilitators are randomly picked peers.
- [x] `/mod` (moderators only): open reports, newest first; view message in context; hide or dismiss;
      post an announcement to all pods
- [ ] Moderators set by hand in Studio. List of names still needed from the project lead.

Build notes (Oct 30, built ahead of Phase 3's remaining tasks so it exists before Nov 8):

- **Schema:** `reason` is an enum of the four chips, and the optional words go in a separate `details`
  column (up to 1,000 characters). One report per person per message; a repeat gets "You've already
  reported this message". `notified_at` is for the email function.
- **Nobody reads `reports` directly.** Reporters can only insert (for messages they can see). Moderators work
  through `moderation_queue()` (one row per reported message, real body even if hidden),
  `moderation_context(id)` (three messages either side) and `resolve_reports(id, 'hide'|'dismiss')`, which
  closes every open report on that message. The facilitator gets `pod_reported_messages()`: message, thread
  and reasons, never the reporter or their words. 27 pgTAP tests.
- The facilitator sees a notice under the pod header with links to the threads, and the message is marked
  "Reported: …" with a red outline. It drops off once the message is hidden.
- `/mod` is linked from Settings for moderators only; anyone else gets "This page is for church
  moderators". Already-hidden messages offer "Keep hidden" (there's no un-hide). Announcements need a second
  tap to post, and recent ones can be hidden.
- The reporter's name isn't shown on `/mod` (the plan doesn't ask for it), though it's recorded. If the
  church wants it for safeguarding follow-up, it's a small change.
- **notify-report needs no key** (`verify_jwt = false`): it claims `notified_at` atomically before sending,
  so a repeated or direct call can't send twice. Email wording is in `supabase/functions/_shared/
  report-email.ts` (pure, HTML-escaped, Vitest-tested). Resend when `RESEND_API_KEY` and `NOTIFY_FROM` are
  set, Mailpit when `MAILPIT_URL` is (local, in config.toml), otherwise it only logs. The webhook trigger
  can't live in a migration (its URL differs per project), so it's in the seed locally and made in the
  dashboard on staging and prod.

### 4.2 Pod formation (`scripts/form-pods.ts`)

- [x] Reads participants without a pod, grouped by segment, shuffled with a seed printed in the output
- [x] Packs into pods of 5. The remainder `r` is handled as: r = 1 → one pod of 6; r = 2 → two pods of 6;
      r = 3 or 4 → one pod of that size; segments with fewer than 4 people → flagged for manual placement
- [x] Picks one facilitator per pod at random; generates a friendly pod name from a fixed word list (for
      example "Rooftop", "Lantern", "Cedar") plus segment, unique
- [x] Dry run prints a CSV (pod, segment, name, facilitator) to review in a spreadsheet; `--commit` writes
      pods and members in one transaction; `--late` adds new sign-ups after Nov 13 to the smallest pod in
      their segment, up to 6
- [x] Vitest on the packing function for sizes 1 to 23
- [x] Planning numbers: 300 to 500 sign-ups means 60 to 100 pods

Build notes (Oct 31, overnight run):

- **Two cases the rule above doesn't cover cleanly, decided so every pod stays at 4 to 6 (confirm with the
  project lead):** r = 3 makes **two pods of 4** (one pod of 5 gives a person to the 3), because a pod of 3 is
  below the minimum. **Seven people** in a segment (one pod of 5 plus r = 2, with no second pod to make a 6)
  make one pod of 6 and leave **one person to place by hand**. Fewer than 4 are all placed by hand. All in
  `podSizes` (`scripts/lib/pods.ts`), with the expected pods for every size from 1 to 23 in the tests and
  the 4-to-6 rule checked up to 600.
- **Who's placed:** participants only (moderators and reviewers are left out), and only once they've
  confirmed their email with a code (read through the Auth admin API), and not already in a pod.
- **Repeatable:** people are sorted by id, then each segment is shuffled with the seed (mulberry32), so the
  same seed and the same people always give the same pods. The dry run prints the seed; `--commit --seed …`
  writes exactly what was reviewed, as long as sign-ups are frozen in between.
- **Names:** one word from a list of 110 (land, house and gospel words, including Iroko, Baobab and Rooftop),
  unique across all pods, ignoring case and skipping names already used. If they ever run out, names get a
  number ("Cedar 2"). The segment isn't in the name: it's stored on the pod and shown in the CSV, and members
  already know their stage.
- **CSV:** `pod,segment,name,email,facilitator` on standard output (email added so people with the same name
  can be told apart); the summary goes to standard error, so `pnpm -s pods:form > pods.csv` keeps a clean
  file. People to place by hand appear with the pod `(place by hand)`.
- **One transaction:** `form_pods(new_pods, joiners)` (service role only) writes every pod and member or
  nothing, and checks again: 4 to 6 per new pod, the facilitator is a member, everyone matches the pod's
  segment, nobody is in two pods, and late joiners never take a pod past 6. 13 pgTAP tests.
- **`--late`:** each new sign-up joins the smallest pod in their segment with room, ties at random; anyone
  with nowhere to go is listed for placing by hand (`pnpm pods:test` can't be used on prod, so that's done in
  Studio for now).
- `--commit` on prod also needs `--yes`. Checked locally: a dry run on 23 confirmed undergraduates gives
  5, 5, 5, 4, 4; the same seed gives the same CSV; `--commit` writes them; three late sign-ups fill the two
  pods of 4 first.

### 4.3 Emails

- [x] Edge function `welcome-email`, run once on Nov 13 after pods are formed: your pod's name, members'
      first names, Day 1 is tomorrow, link to the app
- [x] Edge function `daily-reminder` scheduled by pg_cron at 06:30 WAT: only users with
      `reminder_email = true` who haven't completed today's day; encouraging copy, varied across a few
      templates; an unsubscribe link using `unsubscribe_token` that works without signing in. Batched sends;
      skip on waiting days unless the project lead wants a pod nudge.
- [x] Copy review: no shame, no counts of missed days

Build notes (Oct 31, overnight run):

- **Who gets what is decided in SQL, and claimed as it's picked.** `claim_welcome_emails()` and
  `claim_daily_reminders(at)` (service role only) mark each person (`profiles.welcome_sent_at`,
  `profiles.last_reminded_on`) in the same statement that selects them. So the functions need no key
  (`verify_jwt = false`, like `notify-report`): any number of calls, from anyone, sends each person one welcome
  and at most one reminder a day. If sending fails, whoever wasn't emailed is released for the next call.
- **Welcome:** everyone in a pod with a confirmed email. Pod name, the others' first names (facilitator first),
  and a line that fits the day it's sent ("Day 1 opens tomorrow" on Nov 13; for late joiners, "start with
  Day 1 whenever you're ready"). The facilitator gets one extra paragraph saying what that means and that
  nothing extra is expected. Run it after `pods:form --commit`, and again after each `--late --commit`: it
  only emails people not yet welcomed. It goes to everyone in a pod, not only those who chose reminders: it's
  the one service email the privacy notice mentions.
- **Reminder:** pg_cron job `daily-reminder` at 05:30 UTC (06:30 in Lagos, which has no daylight saving)
  calls the function through `pg_net`, reading the project URL from the Vault secret `project_url` (set by hand
  on staging and prod; the seed sets it locally). It reminds people who asked, confirmed their email and haven't
  done today's day; nothing before Day 1, on waiting days (41 onwards) or if today's day isn't published. The
  function refuses outside 06:00 to 12:00 Lagos, so nobody can set reminders off at night; locally
  `ALLOW_AS_OF` lets the body pick the time.
- **Copy:** four wordings rotating by day and person (`_shared/reminder-email.ts`): the day's title and
  minutes, a gentle line, a button to the day. A Vitest test fails if any wording mentions missing, being
  behind, streaks, catching up or counts of days. The small print says why they're getting it and links to
  unsubscribe; a `List-Unsubscribe` header lets mail apps show their own link.
- **Unsubscribe:** `/unsubscribe?token=…` works signed out and turns reminders off only when "Stop reminder
  emails" is tapped (some email services open every link to scan it). `unsubscribe_reminders(token)` is the
  only function anon can call.
- **Sending:** `_shared/send-email.ts` (Resend batches of 100 with a pause between, else Mailpit, else log),
  now also used by `notify-report`. `REPLY_TO`, if set, is where replies go.
- 14 pgTAP tests, 14 Vitest tests for the templates. **Checked locally** with Mailpit: 10 welcomes once, a
  second call sends none; reminders on Day 1 go only to people who chose them and haven't done it, none twice,
  none on a waiting day or at night; `notify-report` still emails moderators once. In this cloud sandbox the
  edge-runtime container couldn't download `npm:@supabase/supabase-js` (the sandbox's proxy certificate), so
  the functions were run with Deno 2.9 on the host against the local database and Mailpit. On a normal machine
  `supabase start` serves them as before.

### 4.4 My journey (`/journey`)

- [x] Completed days grouped by module (module accent), each opening that day's reflections read-only with
      an edit option; share button per reflection; empty state for days not yet done

Build notes (Oct 31, overnight run):

- Each open module is a card with its accent on the left edge. A finished day expands in place to show its
  questions and your answers ("Only you can see these"); "Edit my answers" swaps in the day screen's own
  autosaving boxes, and "Open Day N" goes to the full day. Answers load when the day is opened, not with the
  list, and aren't saved on the phone (same rule as before), so offline they say they'll show when you're back.
- Open days you haven't done show as "Ready when you are" with a link, the same wording as home's catch-up
  list. Modules that haven't started show one line each with their opening date. Before Day 1 the screen says
  when it starts.
- The share sheet moved out of `ShareReflections` into `ShareSheet` and `ShareButton` (plus
  `use-share-state.ts`), so the day screen and My journey share it.
- `RouteStub` is gone: every route has its real screen.

**Acceptance:** a report on staging emails a test moderator within a minute and the moderator can hide the
message; the formation script dry run on 23 seeded users produces valid pods; a reminder reaches only a
consented, incomplete test user and the unsubscribe link works.

---

## Phase 5: Hardening and launch (Nov 11 to Nov 13)

- [ ] **Low-end QA:** a real low-cost Android phone (2 GB RAM class) on throttled data: sign-up, home, day,
      pod. Fix anything over 3s to interactive on repeat visits.
- [x] **Bundle check:** initial JS at most 200 KB gzipped (`rollup-plugin-visualizer`); everything optional
      is lazy
- [ ] **Text-only mode:** settings toggle, plus auto-on when `saveData` is set; no image or media requests
      when it's on
- [ ] **Accessibility:** axe in Playwright on every route; keyboard and screen-reader pass on the daily
      screen; contrast check on module accents (small text uses ink shades). **Axe and contrast are done;**
      the keyboard and screen-reader pass needs a person (docs/SETUP-TODO.md).
- [x] **Metrics:** `events (id, user_id, name, props jsonb, created_at)`, insert-only from the client for
      `day_opened`, `day_completed`, `pod_message_posted`, `reflection_shared`, `whatsapp_joined`. SQL views:
      sign-ups by day and segment, Day 1 and Day 8 completion, return after each module, pod participation
      (pods with at least one message per day), waiting-day pod activity. Read them in Supabase Studio; no
      third-party trackers.
- [ ] **Security pass:** every table has RLS (query `pg_tables` where `rowsecurity` is false and expect none);
      no service key in the client bundle (grep the build); auth rate limits set; storage bucket allows
      read-only public access to `media` only. **Done except the rate limits**, which are dashboard settings
      on staging and prod (docs/SETUP-TODO.md).
Build notes (Oct 31, overnight run):

- **Bundle:** `pnpm size` already enforces both budgets (signed-in app 185.7 kB of 200, landing 91.4 kB of
  100), and CI now runs it after a build, so the visualizer wasn't added. Lazy: day, journey, pod, settings,
  mod, preview, privacy, avatar, questions, unsubscribe, sign-up and verify. CI builds with placeholder
  Supabase values: without them the build drops the Supabase client and measures about 60 kB too little.
- **Metrics:** `events` is insert-only (the app can't read any back, even its own), limited to the five names
  by an enum, with small `props` (`{"day": 3}`; never text) and deleted with the account. `track()` in
  `src/lib/analytics.ts` is fire-and-forget: offline events are dropped, never retried, never shown. Called
  when a day loads (`day_opened`), on completing (`day_completed`), on sending (`pod_message_posted` with the
  kind, or `reflection_shared`) and on "Join on WhatsApp" (`whatsapp_joined`). The views live in an `analytics`
  schema the API doesn't expose, so only Studio reads them: `signups_by_day`, `day_completion` (every day;
  Day 1 and 8 included), `module_return` (finished a day in module m, then opened or finished one in m + 1),
  `pod_participation` (pods with a message, per day), `waiting_day_activity` (Dec 24 to Jan 1) and
  `events_by_day`. They count confirmed participants only and list no names. `/privacy` mentions the events.
  10 pgTAP tests.
- **Accessibility:** `e2e/a11y.spec.ts` runs axe (WCAG 2.1 AA) on the landing page, sign-up, sign-in,
  privacy, unsubscribe and not-found, and, signed in locally, on home, a lesson day (Encounter and
  Understand), the Day 8 template, My journey, the pod, settings, the avatar builder, the baseline questions
  and `/mod`. It found one real problem, now fixed: the four segment choices on sign-up had no accessible
  name (Radix's radio is a button, which a wrapping label doesn't name), so they now use `aria-labelledby`
  and `aria-describedby`. `/verify` and `/preview` aren't scanned yet (they need a pending code and a reviewer).
  Contrast is covered by `src/theme/tokens.test.ts`.
- **End-to-end:** `e2e/journey.spec.ts` signs up a new person, verifies with the code from Mailpit, makes an
  avatar, skips the questions, completes Day 1 (`?asOf=2026-11-14`), joins the seed's Rooftop pod (through the
  local service role, as `pods:form` would), posts, and reports Dayo's message; then deletes everything it
  made. Local-only helpers are in `e2e/support/local.ts` and reuse `scripts/lib/target.ts` for the key. CI
  doesn't run Playwright (it would need Supabase); run `pnpm test:e2e` with `supabase start` going.
- **Security pass:** `supabase/tests/security.test.sql` checks the whole database, so a future migration that
  slips fails it: RLS on every public table; no table or view privileges for signed-out visitors; every view
  is `security_invoker`; the only function signed-out visitors can call is `unsubscribe_reminders`; every
  security definer function fixes its `search_path`; `media` is the only public bucket (uploads were already
  refused, `storage.test.sql`). `pnpm check:bundle` scans the build for Supabase secret keys, service role
  JWTs, Resend keys and the variable names, and CI runs it (checked that it catches a planted key). CI also
  runs `pnpm format:check` now. Local `config.toml` has Auth rate limits; staging and prod set theirs in the
  dashboard.

- [x] **End-to-end smoke test** (Playwright, staging): sign up → verify (Mailpit locally) → avatar → home →
      complete day → post in pod → report a message. **Runs against local Supabase**; on staging the codes go
      to real inboxes, so with `E2E_BASE_URL` set it skips and only the public-page checks run.
- [x] **Runbook** `docs/RUNBOOK.md`: Nov 13 sequence (freeze sign-ups for 10 minutes, `pods:form` dry run,
      review CSV, `--commit`, trigger `welcome-email`, reopen); late joiners; how to load a module; how to
      hide content fast; rollback (Vercel instant rollback, migrations forward-only); who's on call Nov 13
      and 14. **The on-call names are placeholders** until the user sends them. It also covers the morning
      reminder check and a short "if something's wrong" table.
- [ ] Nov 12 final check against the brief's "Needed for Nov 13" list

**Launch (Nov 13):** run the runbook.

---

## Phase 6: After launch (Nov 14 to Jan 2)

- [ ] Load each curriculum module within a day of receiving it, then share preview links with the project lead:

      | Curriculum | Content due | Days | Live |
      | --- | --- | --- | --- |
      | Module 2 | Nov 13 | 9 to 16 | Nov 22 to 29 |
      | Module 3 | Nov 22 | 17 to 24 | Nov 30 to Dec 7 |
      | Module 4 | Nov 30 | 25 to 32 | Dec 8 to 15 |
      | Module 5 | Dec 8 | 33 to 40 | Dec 16 to 23 |

- [ ] Day 15 (Nov 28) is The Convergence, and the Day 16 synthesis is the natural place to reflect on it.
      Check that the content says so.
- [ ] **Waiting state by Dec 20:** after Day 40, home shows "Waiting together", the WOFBEC date and a
      countdown, the pod's latest activity, and a button to the pod chat. Catch-up stays available.
      No new content.
- [ ] **Day 40 baseline:** the `end` phase of the baseline questions is offered after completing Day 40
- [ ] **Day 50:** home shows a closing message and WOFBEC information
- [ ] Optional if time allows: web push (VAPID, service worker), with an iPhone prompt to add the app to the
      home screen first

---

## Content file format

See `content/module-1.template.json`. The template shows Day 1 and Day 8 only, to illustrate both kinds; a
real file has all eight days and the loader rejects anything less. Notes for whoever writes or pastes content:

- One file per curriculum module, eight days in order. Day 1 of the module is `intro`, days 2 to 7
  `developmental`, day 8 `synthesis`.
- `body_md` is Markdown: paragraphs, bold, italics, lists and links only.
- `reflection_prompts` takes one to three prompts; each gets its own private answer box.
- `action_dimension` is one of `career`, `character`, `community`.
- Leave `publish_at` out; the loader computes it from the day number.
- Media is optional. Images need `alt`; videos need `transcript`; everything needs `ai_generated`.
- `status: "draft"` lets the project lead preview a day before it goes live; switch to `"published"` and
  reload.

## Open items

- [ ] Names of the church leaders who act as moderators (needed by Nov 7)
- [ ] Confirm reports go to moderators as well as the facilitator (brief only names facilitators)
- [ ] Confirm email is required for sign-in, with WhatsApp number as an optional contact (the brief allows
      "WhatsApp number or email"; codes over WhatsApp or SMS would cost per message)
- [ ] Wording of the three baseline questions (needed by Nov 5)
- [ ] Data retention period after the programme
- [ ] Logo files (SVG) for icons and the logo strip. A 1080px graphic arrived Oct 29 and is in use; the
      original SVG (or a PNG at least 1024px wide) would make the large install icons sharper.
