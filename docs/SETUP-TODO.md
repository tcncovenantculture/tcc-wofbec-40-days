# Things to do by hand

Accounts, dashboards and DNS: the parts of the build only you can do. Tick items as you go. API keys and
passwords go straight into the dashboard or your `.env.*` files, never into chat or this file.

Last updated Oct 31.

## Now: for the Nov 1 working version

### Vercel

- [ ] Settings → Environment Variables: add `VITE_ENABLE_AS_OF` = `true` for **Production** and
      **Preview**, then redeploy the latest commit. This turns on the `?asOf=` test date on the live site.

### Supabase staging (`tccwofbec-40-staging`) → Authentication

- [ ] Emails → Templates → **Confirm signup**: subject `{{ .Token }} is your 40 Days code`, body copied
      from `supabase/templates/sign-in-code.html`
- [ ] Emails → Templates → **Magic Link**: the same subject and body
- [ ] Sign In / Providers → Email: OTP length `6`, OTP expiry `3600`
- [ ] URL Configuration → Site URL: `https://tcc-wofbec-40-days.vercel.app`

Until Resend is connected, staging sends codes through Supabase's built-in sender: only a few an hour, and
as far as we know only to members of your Supabase organisation. That's enough for your own test.

### Phone test (Phase 1 acceptance)

On an Android phone, on the live site:

- [ ] Sign up with your email and the code
- [ ] Open `/home?asOf=2026-11-14`, do Day 1's five steps, and see Day 1 marked done on home
- [ ] Reopen Day 1: your answers are still there
- [ ] Open `/day/8?asOf=2026-11-21`: the calm Day 8 layout, not a lesson
- [ ] Supabase → Table Editor → `profiles` → your row → `role` = `reviewer`. Then `/preview/1` opens and
      you can step through every day.

### Other

- [ ] Tell OyinDamola about the Nov 1 re-baseline in today's progress note (the plan asks for this)

## Pods and chat: for the Nov 2 leaders' test and the Nov 4 walkthrough

Built Oct 30 and pushed: the pod screen with live chat, sharing a reflection, and the WhatsApp link.

- [ ] Vercel: deploy the latest commit by hand (as usual after a push)
- [ ] The testers sign up on the live site (each needs their own email; see the Resend section for why the
      built-in sender may not reach everyone yet)
- [ ] Put them in a test pod: send Claude their emails, or run
      `pnpm pods:test --target staging --name "Leaders" first@… second@… third@…` yourself. The first email
      becomes the facilitator. For the "other pod", make a second one (one person is enough).
      `pnpm pods:test --target staging --list` shows the pods.
- [ ] Walkthrough check (the plan's Phase 2 acceptance), on two phones in the same pod, using
      `/pod?asOf=2026-11-14`: both post under Day 1's question and see each other's messages appear; one
      shares a reflection from Day 1's Connect step; "done today" goes up after finishing Day 1; a third
      account in another pod sees none of it.

## Domain and email: before the Nov 2 leaders' test

### Names (proposed, not yet agreed)

| What | Proposal |
| --- | --- |
| Website (the QR code points here) | `https://40days.tcnikeja.org` |
| Emails come from | `hello@40days.tcnikeja.org`, shown as **Covenant Culture 40 Days** |
| Replies go to | An existing church Zoho inbox: pick one (no DNS needed) |

- [ ] Agree the names. If the church prefers another subdomain, swap it in everywhere below.

Why one name for both: the church already uses Resend on tcnikeja.org itself (probably for the app at
`242.tcnikeja.org`), and `mail.tcnikeja.org` is taken by that setup. Putting everything under `40days` keeps
this project's records together and leaves the church's existing records alone. Use your own Resend
account rather than theirs: you control it, and Nov 8 sign-ups won't use up their daily limit.

### 1. Resend (about 10 minutes)

- [ ] Sign up at resend.com, ideally with a church email address so access isn't tied to one person
- [ ] Domains → Add domain → `40days.tcnikeja.org`, region **Ireland (eu-west-1)**
- [ ] Leave open and click tracking off
- [ ] Keep the records page open (or screenshot it). Expect three records: a TXT named
      `resend._domainkey.40days`, plus either two CNAMEs (`send.40days`, `rsend.40days`) or an MX and a
      TXT on `send.40days`. **Skip the optional DMARC row**: tcnikeja.org already has one, and a second
      would break the church's email checks.

### 2. Vercel domain (2 minutes)

- [ ] Project → Settings → Domains → Add Domain → `40days.tcnikeja.org`, connected to Production
- [ ] Note the CNAME it shows for `40days` (a value like `….vercel-dns-017.com`). If it also asks for a
      TXT record at `_vercel`, note that too: it's added next to the existing `_vercel` record, never over
      it.

### 3. One message to the DNS manager

- [ ] Send this with screenshots of the Resend and Vercel pages, or paste the values to Claude to fill in
      the brackets (they aren't secret; they end up in public DNS):

> Hi [name], for the Covenant Culture 40 Days app (Youth Sunday QR code, Nov 8), could you add these
> records to tcnikeja.org in Namecheap → Advanced DNS? They're all new, all under a new `40days`
> subdomain. Nothing existing changes.
>
> Website (Vercel):
> • CNAME · Host `40days` · Value `[from Vercel]`
> • TXT · Host `_vercel` · Value `[from Vercel]` (only if Vercel asks. Please add it as a second record and
> keep the existing `vc-domain-verify=242…` one.)
>
> Email sending (Resend):
> • TXT · Host `resend._domainkey.40days` · Value `[from Resend]`
> • The `send.40days` record(s), exactly as in the attached Resend screenshot
>
> Please don't add a DMARC record. The one on tcnikeja.org already covers this.
>
> Also, FYI: `mail.tcnikeja.org` currently has both an A record and a CNAME (to Resend), which conflict.
> Worth a look when you have a moment. Thanks!

### 4. Once the records are in

- [ ] Resend → Domains → **Verify** (usually green within an hour)
- [ ] Vercel shows the domain as valid and sets up HTTPS by itself. `https://40days.tcnikeja.org` then
      opens the app (pointing at staging until production is set up).

### 5. Send staging sign-in codes through Resend

- [ ] Resend → API Keys → Create: name `staging-auth`, **Sending access**, domain `40days.tcnikeja.org`.
      It's shown once, so paste it straight into the next step.
- [ ] Supabase staging → Authentication → Emails → SMTP Settings → enable custom SMTP:
  - Sender email `hello@40days.tcnikeja.org`, sender name `Covenant Culture 40 Days`
  - Host `smtp.resend.com`, port `465`
  - Username `resend`, password: the API key
  - Minimum interval: leave it at 60 seconds (it matches the app's "resend code" timer)
- [ ] Authentication → Rate Limits: emails per hour drops to 30 when custom SMTP goes on. Set it to `100`.
- [ ] Test: sign up on staging with your own email. The code comes from `hello@40days.tcnikeja.org`, and
      Resend → Emails shows it delivered.

## Reporting and moderation (built Oct 30)

- [ ] Ask Claude (in a local session) to deploy the `notify-report` function to staging. It's built and
      tested, just not deployed.
- [ ] Supabase staging → Database → Webhooks (turn webhooks on if asked) → Create a new hook: name
      `notify-report`, table `reports`, event **Insert**, type **Supabase Edge Functions** → `notify-report`,
      method POST, timeout 5000. No headers needed.
- [ ] Supabase staging → Edge Functions → Secrets: `SITE_URL` = `https://tcc-wofbec-40-days.vercel.app`.
      Once Resend works, also `RESEND_API_KEY` (a sending key) and
      `NOTIFY_FROM` = `Covenant Culture 40 Days <hello@40days.tcnikeja.org>`.
- [ ] After church leaders sign up: Table Editor → `profiles` → their row → `role` = `moderator`. They then
      get every report by email, and Settings shows them "Moderation".
- [ ] Ask the project lead: should reports also go to church moderators, not only the pod's facilitator?
      (Built that way; the plan recommends it.)

## Landing page (built Oct 30)

- [ ] After the next deploy, open the live site's home page on your phone while signed out and read it through.
      The words are a first draft for you (and Pastor Yemi) to change.
- [ ] Paste the site's link into a WhatsApp chat (to yourself) and check the preview shows the "40 Days"
      picture. Once `40days.tcnikeja.org` is added in Vercel, redeploy so the preview uses that address.

## Privacy notice (built Oct 31, overnight)

- [ ] Choose the contact email for privacy questions and account requests (it could be the same church
      inbox as the email reply-to). Tell Claude, or replace `[contact email to come]` in
      `src/routes/privacy.tsx`.
- [ ] Have someone check `/privacy` against Nigeria's NDPA before Nov 8, especially the cross-border
      transfer (data in London), the lawful basis (consent), and whether it should name the church as the
      organisation responsible for the data. The words are a first draft.
- [ ] Confirm the retention period with the project lead. The notice says everything is deleted 90 days after
      Jan 2, by 2 April 2027.
- [ ] Once production Supabase exists, check it's in London too, or tell Claude to change "Where it's kept".

## Baseline questions (built Oct 31 with sample wording)

- [ ] Get the three questions' wording from the project lead (career, character, community; by Nov 5), and
      what 1 and 5 should mean. Send it to Claude, or put it in `src/features/baseline/questions.ts` in place
      of the "Sample:" questions.

## Emails: welcome and morning reminders (built Oct 31, overnight)

- [ ] Read the wording: `supabase/functions/_shared/welcome-email.ts` and `reminder-email.ts` (or run them
      locally and look in Mailpit). Pastor Yemi or the project lead may want to change it.
- [ ] Ask the project lead: should waiting days (Dec 24 to Jan 1) get a gentle "your pod is still open"
      email? Built without one, as the plan says.
- [ ] Pick the church inbox for replies, then add the secret `REPLY_TO` = that address (Edge Functions →
      Secrets) on staging and prod.
- [ ] After the next `supabase db push` to staging (the emails migration turns on pg_cron and pg_net), in the
      SQL editor run, with your project's URL:
      `select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');`
      Without it the 06:30 job does nothing. Do the same on prod.
- [ ] Ask Claude (in a local session) to deploy `welcome-email` and `daily-reminder` along with
      `notify-report`. They need the same secrets (`RESEND_API_KEY`, `NOTIFY_FROM`, `SITE_URL`).

## Before Nov 8 (public sign-up)

- [ ] Upgrade Resend to **Pro** ($20 a month). The free plan stops at 100 emails a day, and Youth Sunday
      sign-ups could pass that within an hour.
- [ ] Remove `VITE_ENABLE_AS_OF` from Vercel **Production** (keep it on Preview)
- [ ] Prod Supabase → Authentication → Rate Limits: check the limits for sign-ups, code verifications and
      emails per hour suit a Youth Sunday rush (the security pass in the plan lists this)
- [ ] Production Supabase (Phase 3, with Claude): a separate org on the Pro plan, its own Resend API key and
      SMTP settings, a higher email rate limit, and Vercel Production pointed at it

## Things to get from the church

- [ ] Real Module 1 content (it replaces the samples; Claude loads it)
- [ ] Original logo file (SVG, or a PNG at least 1024px wide)
- [ ] Baseline question wording (by Nov 5)
- [ ] Moderator names: the church leaders who receive reports (by Nov 7)
- [ ] Whether reports go to moderators as well as the pod facilitator
- [ ] How long data is kept after the programme

## Reference: tcnikeja.org DNS as of Oct 30

- DNS is hosted at **Namecheap** (BasicDNS). The website is on Namecheap hosting; church email is on
  **Zoho**.
- DMARC is already on the root (`p=none`), and it covers subdomains.
- Another church team's **Resend** account uses the root domain (`resend._domainkey`, `send`, `rsend`), with
  link tracking on `mail.tcnikeja.org`.
- `242.tcnikeja.org` is a **Vercel** project on another team (a `_vercel` TXT record exists for it).
- `mail.tcnikeja.org` has conflicting A and CNAME records.
- There are no CAA records, so Vercel can issue the HTTPS certificate.
- `40days.tcnikeja.org` is free.
