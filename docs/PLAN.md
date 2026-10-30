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
- [ ] Domain or subdomain for the app, which the Nov 8 QR code points at

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
- [ ] Custom SMTP set to Resend on staging and prod. The built-in sender is rate-limited and only for testing.
- [ ] `/signup`: name, segment (four large radio cards), email, WhatsApp number (optional), privacy
      acknowledgement (required), reminder consent (unticked by default). Calls `signInWithOtp` with
      `options.data` carrying the profile fields and `shouldCreateUser: true`.
- [ ] `/verify`: 6-digit input, `verifyOtp({ email, token, type: 'email' })`, resend after 60s, clear errors
- [ ] Returning users: "Sign in" reuses the same email-to-code flow
- [ ] Route guard: signed-out users go to `/`; signed-in users skip the landing and signup screens
- [ ] Locally, codes arrive in Mailpit (`supabase start` prints its URL)

### 1.4 Content format and loader

The content file format is in `content/module-1.template.json`. One file per curriculum module, eight days each.

- [ ] Zod schema `features/days/schema.ts`, shared by the loader and the app. Rules: day numbers are
      contiguous within the module; `kind` is `intro` for the first day, `synthesis` for the eighth and
      `developmental` otherwise; at least one reflection prompt; `est_minutes` between 5 and 20; every video
      has a `transcript`; every image has `alt`; `ai_generated` is present on every media item.
- [ ] `scripts/load-content.ts <file> --target local|staging|prod`: validates, fills `publish_at` from
      `publishAtFor` unless given, upserts by `day_number`, prints a summary table. Uses the service role key
      from `.env.<target>` (gitignored). `--dry-run` validates only.
- [ ] `scripts/compress-media.ts`: resizes images to at most 1200px wide as WebP (target 150 KB or less) with
      sharp; re-encodes audio to 64 kbps mono; uploads to the Storage bucket `media` (public read); rewrites
      URLs in the JSON
- [ ] Video: not self-hosted. Use an unlisted YouTube link rendered as a tap-to-load facade (thumbnail only
      until tapped), with the transcript beside it.
- [ ] Load Module 1 to local and staging as soon as the file arrives

### 1.5 Home (`/home`)

- [ ] `before`: welcome card, countdown to Day 1, "Your pod forms on Nov 13"
- [ ] `lesson`: today's card (module accent, day number, title, estimated minutes, Continue button); personal
      progress "Day 12 of 40" as a 40-dot strip grouped into five modules; a "Catch up" list of unlocked,
      uncompleted days, worded neutrally ("Ready when you are")
- [ ] `waiting`: a card that points to the pod chat (Phase 6 polishes it)
- [ ] Skeletons while loading. Works from cache when offline: the shell plus the last fetched day.

### 1.6 Daily screen (`/day/:n`)

- [ ] Five steps as a vertical stepper on one route (`?step=`), with back and next. Steps:
      **Encounter** (scripture reference and text, introduction, body markdown, optional media),
      **Understand** (reflection prompts, each a textarea that autosaves after 800 ms idle),
      **Apply** (practical action with its dimension badge: career, character, community),
      **Connect** (the pod prompt; links to the pod thread, and Phase 2 adds "Share a reflection"),
      **Complete** (button writes `progress`; confetti; shows the next step: tomorrow's unlock time, or the
      next catch-up day)
- [ ] `kind = 'synthesis'` uses a distinct template: no stepper, a calm layout with the logo strip, a
      "Look back on this module" list of the module's practical actions, and the pod prompt given most space.
      It must not look like a lesson.
- [ ] Body markdown through `react-markdown` (no raw HTML)
- [ ] Media respects text-only mode: images become their alt text; audio and video become their transcript
- [ ] Media flagged `ai_generated` shows an "AI-generated" label
- [ ] A day that isn't unlocked yet shows a friendly "Unlocks on <date>" (RLS returns nothing, so the UI
      handles the empty result)

### 1.7 Reviewer preview (`/preview/:n`)

- [ ] Reviewers (role set by hand in Studio) can open any day, draft or future, rendered exactly as
      participants will see it, with a "Preview" ribbon and a day picker. This is how the project lead reviews
      content without an admin.

### 1.8 Seed

- [ ] `supabase/seed.sql`: three participants, one reviewer, one moderator, and Module 1 sample days with
      `publish_at` in the past for local testing

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

- [ ] Helpers: `my_pod_id()`, `is_pod_member(pod uuid)`, `is_facilitator_of(pod uuid)`, all `security definer`
- [ ] RLS `pods`: members and moderators can select. Members can update only `whatsapp_invite_link`, and
      only if they're the facilitator (via RPC `set_whatsapp_link(link)`).
- [ ] RLS `pod_members`: select rows of my own pod (display names come through a view
      `pod_roster` that exposes only `display_name`, `avatar` and `is_facilitator`)
- [ ] RLS `messages`: select where `is_pod_member(pod_id)`, or `pod_id is null` (announcements), or
      moderator. Hidden messages return with their body replaced by "Message hidden" through a view, unless
      the reader is a moderator. Insert where `author_id = auth.uid()` and the user is a member, with `kind` in
      (`message`, `shared_reflection`). `pinned` is facilitator-only; `announcement` is moderator-only.
      No update or delete from the client.
- [ ] RPC `hide_message(id)`: facilitator of that pod or moderator
- [ ] RPC `pod_today_totals()`: returns `{ members, completed_today }` for my pod with no names, plus the
      same for a given day
- [ ] pgTAP: non-members can't read a pod's messages; a member can't post as someone else; a participant
      can't post an announcement; totals never return user ids
- [ ] Seed: two pods of five, a facilitator in each

### 2.2 Pod screen (`/pod`)

- [ ] Header: pod name, the five avatars (initials until Phase 3), "4 of 5 done today"
- [ ] Tabs: **Today** (day's pod prompt pinned at the top, then that day's thread), **Earlier** (list of past
      days with message counts; tap to open the thread), **General** (`day_number` null)
- [ ] Announcements from moderators pinned above the tabs; facilitator's pinned post at the top of Today
- [ ] Composer: textarea with send, optimistic insert, retry on failure, 2000-character limit
- [ ] Load the latest 30 messages, older ones on scroll up (keyset pagination on `created_at, id`)
- [ ] **Board first:** pull-to-refresh plus refetch on focus. **Then live:** Supabase Realtime
      `postgres_changes` on `messages` filtered by `pod_id`, subscribed only while `/pod` is open. If Realtime
      isn't stable by Nov 3, ship the board for the walkthrough.
- [ ] Message actions sheet: Report (Phase 4 wires the email), Hide (facilitator and moderator only)
- [ ] No pod yet (before Nov 13): "Your pod forms on Nov 13. Here's how pods work" (Mark 2:1 to 4)

### 2.3 Share a reflection

- [ ] On the Connect step and in My journey: "Share with my pod" on any saved reflection, with a preview and
      confirm. It inserts a `shared_reflection` message (a copy of the text) into that day's thread. The
      reflection itself stays private.

### 2.4 WhatsApp link

- [ ] Facilitator sees "Add your pod's WhatsApp group" with steps (create the group, copy the invite link,
      paste it here) and a download of the pod avatar as a PNG for the group icon
- [ ] Members see "Join the pod on WhatsApp" once a link exists, behind a notice: "Everyone in a WhatsApp
      group can see each other's phone numbers, and this app's moderation doesn't reach WhatsApp."
- [ ] Optional: a "Share to WhatsApp" button on the pod prompt (`https://wa.me/?text=` with the prompt)

**Acceptance (walkthrough, Nov 4):** two test phones in the same seeded pod post under the Day 1 prompt and
see each other's messages; one shares a reflection; totals update after completing the day; a third
account in another pod sees none of it. The flow is shown on staging with Module 1 loaded and the theme
applied.

---

## Phase 3: Public sign-up (Nov 4 to Nov 7) → QR live Nov 8

Goal: anyone scanning the QR code on Youth Sunday can sign up in under two minutes on weak data.

### 3.1 Landing (`/`)

- [ ] One screen: what the 40 days are (Acts 1:3), dates, pods of five (Mark 2:1 to 4), three dimensions
      (Romans 12:11), "Join" CTA, "Sign in" link. At most one illustration, lazy-loaded. Under 100 KB total
      on first load, excluding fonts.
- [ ] Open Graph image and description, for when the link is shared on WhatsApp

### 3.2 Privacy and consent

- [ ] `/privacy`: what's collected (name, segment, email, optional WhatsApp number, reflections, progress,
      pod messages), why, who can see what (reflections: only you; pod messages: your pod and moderators),
      where it's stored (hosting outside Nigeria), how long (delete 90 days after Jan 2 unless the project
      lead decides otherwise), how to delete your account, contact email
- [ ] Have the privacy notice checked against Nigeria's NDPA requirements, including cross-border transfer,
      before Nov 8. That's a human review, not code.
- [ ] Settings: change reminder consent; delete account (RPC removes profile, reflections, progress and
      memberships; messages become "Former member")

### 3.3 Avatars

- [ ] Choose one DiceBear style (try `adventurer`, `big-smile`, `fun-emoji`, `notionists`), check its licence
      and add the attribution to `/privacy` or a credits line if it's CC BY, and check its skin-tone and hair
      range before committing
- [ ] Background colours restricted to the five accent bases
- [ ] Builder after verify: skin, hair, outfit or accessory, background, each a row of tappable options with
      a live preview. "Surprise me" and "Skip" both work; a skipped profile gets a seeded random avatar.
      Lazy-loaded route.
- [ ] `<UserAvatar>` used in the pod header, roster and chat (small, memoised SVG data URI)
- [ ] Pod scene (stretch): the pod's avatars together on a simple themed scene beside the totals

### 3.4 Baseline questions (optional)

- [ ] After the avatar step: three optional questions (career, character, community), with wording from
      the project lead; 1 to 5 scale plus optional text; "Skip" is prominent
- [ ] Table `baseline_responses (user_id, phase 'start'|'end', career int, character int, community int,
      note text, created_at)`, own rows only

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

- [ ] `reports (id, message_id, reporter_id, reason text, status 'open'|'actioned'|'dismissed',
      handled_by, handled_at, created_at)`. Reporters insert; moderators select and update.
- [ ] Report sheet: reason chips (unkind, unsafe, spam, something else) plus optional text; confirmation copy
      tells the reporter a church leader will see it
- [ ] Database webhook on `reports` insert → edge function `notify-report` → email to every moderator
      through Resend, with the message, pod and a link to `/mod`
- [ ] Facilitator gets an in-app badge on reports from their pod, which satisfies the brief's "escalation
      path to facilitators". **Confirm with the project lead** that reports also going to church moderators
      is wanted. It's recommended because facilitators are randomly picked peers.
- [ ] `/mod` (moderators only): open reports, newest first; view message in context; hide or dismiss;
      post an announcement to all pods
- [ ] Moderators set by hand in Studio. List of names still needed from the project lead.

### 4.2 Pod formation (`scripts/form-pods.ts`)

- [ ] Reads participants without a pod, grouped by segment, shuffled with a seed printed in the output
- [ ] Packs into pods of 5. The remainder `r` is handled as: r = 1 → one pod of 6; r = 2 → two pods of 6;
      r = 3 or 4 → one pod of that size; segments with fewer than 4 people → flagged for manual placement
- [ ] Picks one facilitator per pod at random; generates a friendly pod name from a fixed word list (for
      example "Rooftop", "Lantern", "Cedar") plus segment, unique
- [ ] Dry run prints a CSV (pod, segment, name, facilitator) to review in a spreadsheet; `--commit` writes
      pods and members in one transaction; `--late` adds new sign-ups after Nov 13 to the smallest pod in
      their segment, up to 6
- [ ] Vitest on the packing function for sizes 1 to 23
- [ ] Planning numbers: 300 to 500 sign-ups means 60 to 100 pods

### 4.3 Emails

- [ ] Edge function `welcome-email`, run once on Nov 13 after pods are formed: your pod's name, members'
      first names, Day 1 is tomorrow, link to the app
- [ ] Edge function `daily-reminder` scheduled by pg_cron at 06:30 WAT: only users with
      `reminder_email = true` who haven't completed today's day; encouraging copy, varied across a few
      templates; an unsubscribe link using `unsubscribe_token` that works without signing in. Batched sends;
      skip on waiting days unless the project lead wants a pod nudge.
- [ ] Copy review: no shame, no counts of missed days

### 4.4 My journey (`/journey`)

- [ ] Completed days grouped by module (module accent), each opening that day's reflections read-only with
      an edit option; share button per reflection; empty state for days not yet done

**Acceptance:** a report on staging emails a test moderator within a minute and the moderator can hide the
message; the formation script dry run on 23 seeded users produces valid pods; a reminder reaches only a
consented, incomplete test user and the unsubscribe link works.

---

## Phase 5: Hardening and launch (Nov 11 to Nov 13)

- [ ] **Low-end QA:** a real low-cost Android phone (2 GB RAM class) on throttled data: sign-up, home, day,
      pod. Fix anything over 3s to interactive on repeat visits.
- [ ] **Bundle check:** initial JS at most 200 KB gzipped (`rollup-plugin-visualizer`); everything optional
      is lazy
- [ ] **Text-only mode:** settings toggle, plus auto-on when `saveData` is set; no image or media requests
      when it's on
- [ ] **Accessibility:** axe in Playwright on every route; keyboard and screen-reader pass on the daily
      screen; contrast check on module accents (small text uses ink shades)
- [ ] **Metrics:** `events (id, user_id, name, props jsonb, created_at)`, insert-only from the client for
      `day_opened`, `day_completed`, `pod_message_posted`, `reflection_shared`, `whatsapp_joined`. SQL views:
      sign-ups by day and segment, Day 1 and Day 8 completion, return after each module, pod participation
      (pods with at least one message per day), waiting-day pod activity. Read them in Supabase Studio; no
      third-party trackers.
- [ ] **Security pass:** every table has RLS (query `pg_tables` where `rowsecurity` is false and expect none);
      no service key in the client bundle (grep the build); auth rate limits set; storage bucket allows
      read-only public access to `media` only
- [ ] **End-to-end smoke test** (Playwright, staging): sign up → verify (Mailpit locally) → avatar → home →
      complete day → post in pod → report a message
- [ ] **Runbook** `docs/RUNBOOK.md`: Nov 13 sequence (freeze sign-ups for 10 minutes, `pods:form` dry run,
      review CSV, `--commit`, trigger `welcome-email`, reopen); late joiners; how to load a module; how to
      hide content fast; rollback (Vercel instant rollback, migrations forward-only); who's on call Nov 13
      and 14
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
