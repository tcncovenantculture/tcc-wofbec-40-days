# Runbook: launch and running the 40 days

For whoever is on duty. Commands run from the repo on a laptop with `.env.prod` filled in (never paste its
values anywhere). Times are Lagos time.

## On call

| When | Who | Backup |
| --- | --- | --- |
| Fri Nov 13 (launch) | [name to come] | [name to come] |
| Sat Nov 14 (Day 1) | [name to come] | [name to come] |

Church moderators get every report by email and act in the app at `/mod`.

## Nov 13: forming pods

Do this in the evening, after the last Nov 13 sign-ups are in. It takes about 20 minutes.

1. **Freeze sign-ups.** Prod Supabase → Authentication → Sign In / Providers → turn off "Allow new users to
   sign up". People already signed up can still sign in. (While it's off, someone trying to join sees "We
   couldn't find an account for that email". Keep it short.)
2. **Dry run.**
   ```bash
   pnpm -s pods:form --target prod > pods.csv
   ```
   The summary on screen shows the seed (for example `seed 3f9a1c2e`), pods per segment and anyone to place
   by hand. Nothing is written.
3. **Review** `pods.csv` in a spreadsheet: pods of 4 to 6, one facilitator each, names that read well.
   People listed as `(place by hand)` are in a segment too small for a pod (or one left over from seven):
   decide with the project lead, then add them in Studio (`pod_members`: pod, person) after step 4.
4. **Write the pods**, with the same seed so they match the CSV exactly:
   ```bash
   pnpm -s pods:form --target prod --seed <seed> --commit --yes > /dev/null
   ```
   It writes everything or nothing.
5. **Send the welcome email.**
   ```bash
   curl -X POST https://<prod-project-ref>.supabase.co/functions/v1/welcome-email
   ```
   It answers with how many were sent. Running it again only sends to people not yet welcomed.
6. **Reopen sign-ups** (the same switch as step 1).
7. **Check**: sign in as a test participant and open `/pod`; Resend → Emails shows the welcomes delivered.

## After Nov 13: late sign-ups

Once a day (or when a few have joined):

```bash
pnpm -s pods:form --target prod --late
pnpm -s pods:form --target prod --late --seed <seed> --commit --yes > /dev/null
curl -X POST https://<prod-project-ref>.supabase.co/functions/v1/welcome-email
```

Each person joins the smallest pod in their segment that has room (up to 6). Anyone with no pod to join is
listed: place them by hand in Studio.

## Every morning

- 06:30: the reminder job runs. To check it did, in the SQL editor:
  ```sql
  select status, return_message, start_time from cron.job_run_details order by start_time desc limit 3;
  ```
  and Resend → Emails. If it failed, fix the cause and run it again before noon:
  `curl -X POST https://<prod-project-ref>.supabase.co/functions/v1/daily-reminder` (nobody gets two).
- Glance at `/mod` for open reports (moderators also get each one by email).

## Loading a module

When a module's file arrives (`content/module-N.json`):

```bash
pnpm content:load content/module-N.json --dry-run
pnpm media:compress content/module-N.json --target prod     # only if it has media
pnpm content:load content/module-N.json --target prod --yes
```

Days unlock on their own at midnight. Load to staging first if there's time, and send the project lead
preview links (`/preview/9` and so on; their profile needs `role = reviewer`).

## Taking something down fast

- **A message:** a moderator opens `/mod` and hides it (or the pod's facilitator hides it from the message's
  options). Hidden messages show "Message hidden" to everyone else at once.
- **A day's content:** Studio → Table Editor → `days` → that day → `status` = `draft`. It disappears for
  participants straight away. Fix the file, then `content:load` it again (with `"status": "published"`).
- **A person:** Supabase → Authentication → Users → find them → ban or delete. Deleting removes their
  profile, reflections and pod place; their messages stay as "Former member", and a moderator can hide them.
- **The WhatsApp link** for a pod: the facilitator can remove it on `/pod`, or clear `pods.whatsapp_invite_link`
  in Studio.
- **An announcement to every pod:** a moderator posts it from `/mod`.

## Rolling back

- **The app:** Vercel → Deployments → the last good deployment → Promote to Production. Instant.
- **The database:** migrations only go forward. Never edit one that's been applied; write a new migration
  that undoes the change, run `supabase test db` locally, then push it.
- **Content:** load the previous version of the module file again.

## If something's wrong

| Symptom | First check |
| --- | --- |
| Sign-in codes not arriving | Resend → Emails (bounces, limits); Supabase → Authentication → Rate Limits |
| Nobody got the morning reminder | `cron.job_run_details` (above); the Vault secret `project_url`; function logs |
| A report email didn't arrive | Database → Webhooks → `notify-report`; Edge Functions → `notify-report` → Logs |
| The app won't load | Vercel status and the latest deployment; roll back if it was a new deploy |
| Someone's in the wrong pod | Studio → `pod_members`: change their `pod_id` (same segment, no more than 6) |
