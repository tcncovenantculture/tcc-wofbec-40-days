# Overnight run: instructions for Claude Code

You're continuing the Covenant Culture 40-Day build unattended. Nobody can answer questions until morning,
so make sensible calls within the plan, write down why, and keep going. Quality over quantity: three tasks
done properly beat six half-done.

## Read first

1. `docs/HANDOFF.md`: the current state, decisions so far and watch-outs. Then `CLAUDE.md` (the project's
   rules, which override defaults) and `docs/PLAN.md` (tasks, with build notes under each section).
2. `docs/SETUP-TODO.md` is the user's own by-hand checklist. Add new by-hand steps to it; never do its steps.

## Where to work

- Work on a new branch, `overnight/2026-10-31`, from `main`. Commit there: small commits, one task each,
  with the task's `docs/PLAN.md` checkbox ticked in the same commit. Push the branch after each task if
  pushing works. **Never push to `main`** and never force-push: the user reviews the branch in the morning.
- Commit messages end with: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

## Never, even if it seems helpful

- Touch staging or prod: no `supabase db push --linked`, `supabase functions deploy`, `supabase secrets
  set`, `content:load` or `pods:test` with `--target staging|prod`, and don't read `.env.staging`.
- Print or commit secrets, or commit any `.env*` file.
- Stop or change anything outside this repo (the user's other app runs on port 5173).
- Add features the plan leaves out (its omissions are deliberate), delete data, or rewrite git history.
- Leave the build broken: if a task can't be finished, revert it or leave it out of the branch, and
  write down why.

## Checks before every commit

`pnpm typecheck && pnpm lint && pnpm test`, then `pnpm format:check` **on its own** (never piped through
`tail`). After SQL changes: `supabase test db`. After UI changes: `pnpm build && pnpm size`.

If the local database can't run (no Docker, e.g. in a cloud session), still write the SQL and its pgTAP
tests, but mark them **unverified** in the commit message and in `docs/HANDOFF.md`. Don't stack more SQL on
top of unverified SQL; move on to tasks that don't need the database.

Local setup when starting fresh: `corepack enable && pnpm install`, then `supabase start` and
`supabase db reset` (needs Docker), and `.env.local` with `VITE_SUPABASE_URL=http://127.0.0.1:54321` and
`VITE_SUPABASE_ANON_KEY` from `supabase status` (the local publishable key, which isn't secret).

## Order of work

1. **3.2 Privacy and consent.** Write `/privacy` from the plan's list. The contact email isn't decided:
   write "[contact email to come]" and add a SETUP-TODO item. Keep the 90-day retention the plan states.
   Settings: change reminder consent, and delete account (an RPC per the plan; their messages become
   "Former member"). Record consent at sign-up (`privacy_accepted_at`) if it fits cleanly.
2. **3.3 Avatars.** Choose the DiceBear style as the plan says: check the licence (add attribution if CC BY)
   and the skin-tone and hair range, and record the reasons in the build notes. Builder after verify
   (lazy route), "Surprise me" and "Skip" (seeded random avatar), backgrounds limited to the five accents,
   `<UserAvatar>` replacing the initials in the pod header and chat. Keep `pnpm size` within budget.
3. **4.4 My journey.**
4. **4.2 Pod formation script**, with the Vitest packing tests for sizes 1 to 23.
5. **3.4 Baseline questions.** The wording hasn't arrived: build it with clearly marked sample wording
   (starting "Sample:", like the sample content), and add a SETUP-TODO item for the real wording.
6. **4.3 Emails** (welcome-email, daily-reminder with pg_cron, unsubscribe without signing in), tested locally
   with Mailpit. Copy rules are in CLAUDE.md: encourage, never shame.
7. **Phase 5** items that don't need staging, real phones or the user.

Skip 3.5 (needs Resend and staging) and anything that needs the user's accounts.

## Before you stop

Update `docs/HANDOFF.md`: put a short "Overnight run" section at the top saying what got done, what's
unverified, what to check first, and decisions the user should confirm. Add new by-hand steps to
`docs/SETUP-TODO.md`. Commit and push the branch.
