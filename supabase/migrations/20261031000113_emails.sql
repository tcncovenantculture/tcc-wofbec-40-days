-- Emails (PLAN.md 4.3): the welcome email when pods form, the morning reminder, and unsubscribing without
-- signing in.
--
-- The edge functions don't pick who to email themselves: they "claim" people through the functions below,
-- which mark each person as emailed in the same statement. So whoever calls a function, and however often,
-- each person gets one welcome, and at most one reminder a day. A function releases its claim if sending
-- fails, so a later call can try again.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- When the welcome email went out, and the Lagos date of the last reminder.
alter table public.profiles
  add column welcome_sent_at timestamptz,
  add column last_reminded_on date;

-- Welcome emails -----------------------------------------------------------------------------------------

-- Everyone in a pod who has confirmed their email and hasn't been welcomed: marks them welcomed and returns
-- what the email needs, including the others in their pod (facilitator first). Run again after
-- `pnpm pods:form --late --commit` and it welcomes only the new people.
create function public.claim_welcome_emails()
returns table (
  user_id uuid,
  email text,
  display_name text,
  pod_name text,
  is_facilitator boolean,
  pod_mates text[]
)
language sql
security definer
set search_path = ''
as $$
  with claimed as (
    update public.profiles p
    set welcome_sent_at = now()
    from public.pod_members pm, auth.users u
    where pm.user_id = p.id
      and u.id = p.id
      and u.email_confirmed_at is not null
      and p.welcome_sent_at is null
    returning p.id, p.email, p.display_name, pm.pod_id, pm.is_facilitator
  )
  select
    c.id, c.email, c.display_name, pod.name, c.is_facilitator,
    array(
      select o.display_name
      from public.pod_members om
      join public.profiles o on o.id = om.user_id
      where om.pod_id = c.pod_id and om.user_id <> c.id
      order by om.is_facilitator desc, o.display_name
    )
  from claimed c
  join public.pods pod on pod.id = c.pod_id;
$$;

-- Morning reminders --------------------------------------------------------------------------------------

-- People to remind on the morning of `at`: they asked for reminders, confirmed their email, haven't done
-- today's day and haven't had a reminder today. Marks them reminded. Nothing outside days 1 to 40 (no new
-- content on waiting days), and nothing if today's day isn't published yet. Day 1 is 14 Nov 2026 in Lagos,
-- as in src/lib/programme.ts.
create function public.claim_daily_reminders(at timestamptz default now())
returns table (
  user_id uuid,
  email text,
  display_name text,
  unsubscribe_token uuid,
  day_number int,
  title text,
  est_minutes int
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  local_date date := (at at time zone 'Africa/Lagos')::date;
  today int := local_date - date '2026-11-13';
  day_title text;
  day_minutes int;
begin
  if today not between 1 and 40 then
    return;
  end if;

  select d.title, d.est_minutes into day_title, day_minutes
  from public.days d
  where d.day_number = today and d.status = 'published' and d.publish_at <= at;
  if not found then
    return;
  end if;

  return query
  with claimed as (
    update public.profiles p
    set last_reminded_on = local_date
    from auth.users u
    where u.id = p.id
      and u.email_confirmed_at is not null
      and p.reminder_email
      and p.last_reminded_on is distinct from local_date
      and not exists (select 1 from public.progress pr where pr.user_id = p.id and pr.day_number = today)
    returning p.id, p.email, p.display_name, p.unsubscribe_token
  )
  select c.id, c.email, c.display_name, c.unsubscribe_token, today, day_title, day_minutes
  from claimed c;
end;
$$;

revoke execute on function public.claim_welcome_emails(), public.claim_daily_reminders(timestamptz)
from public, anon, authenticated;
grant execute on function public.claim_welcome_emails(), public.claim_daily_reminders(timestamptz)
to service_role;

-- Unsubscribing ------------------------------------------------------------------------------------------

-- The link in every reminder: turns reminders off for whoever the token belongs to, without signing in.
-- The token is a random uuid only that person's emails carry. True if it matched someone.
create function public.unsubscribe_reminders(token uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set reminder_email = false where unsubscribe_token = token;
  return found;
end;
$$;

revoke execute on function public.unsubscribe_reminders(uuid) from public;
grant execute on function public.unsubscribe_reminders(uuid) to anon, authenticated;

-- The 06:30 run ------------------------------------------------------------------------------------------

-- Calls the daily-reminder edge function at 06:30 in Lagos (05:30 UTC; WAT has no daylight saving). The
-- project's URL differs between local, staging and prod, so it's read from the Vault secret `project_url`
-- (set by hand on staging and prod, see docs/SETUP-TODO.md; by supabase/seed.sql locally). Without it the
-- job fails quietly and sends nothing.
select cron.schedule(
  'daily-reminder',
  '30 5 * * *',
  $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
      || '/functions/v1/daily-reminder',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $job$
);
