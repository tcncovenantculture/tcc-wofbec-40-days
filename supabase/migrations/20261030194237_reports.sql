-- Reports and moderation (PLAN.md 4.1, built early so it exists before sign-up opens on Nov 8).
--
-- Anyone can report a message they can see. Reports are read and resolved only through security definer
-- functions: moderators get the queue and decide, a pod's facilitator sees which of their pod's messages
-- have open reports (never who reported them), and nobody else can read reports at all.

create type public.report_reason as enum ('unkind', 'unsafe', 'spam', 'other');
create type public.report_status as enum ('open', 'actioned', 'dismissed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages on delete cascade,
  -- Null once the reporter deletes their account.
  reporter_id uuid default auth.uid() references public.profiles on delete set null,
  reason public.report_reason not null,
  -- Optional words from the reporter ("something else", or more about what happened).
  details text check (details is null or char_length(details) between 1 and 1000),
  status public.report_status not null default 'open',
  handled_by uuid references public.profiles on delete set null,
  handled_at timestamptz,
  -- Set by the notify-report edge function once the moderators have been emailed.
  notified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (message_id, reporter_id) -- one report per person per message
);

create index reports_open on public.reports (message_id) where status = 'open';

alter table public.reports enable row level security;

revoke all on public.reports from anon, authenticated;

-- Reporting. reporter_id isn't insertable (it defaults to the signed-in person), and the message must be one
-- the reporter can see: the subquery runs under the messages select policy. No reads, updates or deletes
-- from the app; everything else goes through the functions below.
grant insert (message_id, reason, details) on public.reports to authenticated;

create policy "Report a message I can see"
on public.reports for insert
to authenticated
with check (
  reporter_id = (select auth.uid())
  and exists (select 1 from public.messages m where m.id = reports.message_id)
);

-- Moderators -------------------------------------------------------------------------------------------

-- The queue: one row per message with open reports, most recently reported first, with the real body
-- (even if hidden), the author's display name and the pod. Empty for anyone who isn't a moderator.
create function public.moderation_queue()
returns table (
  message_id uuid,
  pod_name text,
  day_number int,
  author_name text,
  body text,
  hidden boolean,
  sent_at timestamptz,
  reports int,
  reasons public.report_reason[],
  details text[],
  last_reported_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    m.id, p.name, m.day_number, a.display_name, m.body, m.hidden_at is not null, m.created_at,
    count(*)::int, array_agg(distinct r.reason), array_remove(array_agg(r.details), null), max(r.created_at)
  from public.reports r
  join public.messages m on m.id = r.message_id
  left join public.pods p on p.id = m.pod_id
  left join public.profiles a on a.id = m.author_id
  where r.status = 'open' and public.is_role('moderator')
  group by m.id, p.name, a.display_name
  order by max(r.created_at) desc;
$$;

-- A reported message in its thread: up to three messages before it and three after, for moderators.
create function public.moderation_context(message_id uuid)
returns table (id uuid, author_name text, body text, hidden boolean, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  with target as (
    select m.pod_id, m.day_number, m.created_at
    from public.messages m
    where m.id = moderation_context.message_id and public.is_role('moderator')
  ),
  thread as (
    select
      m.id, a.display_name as author_name, m.body, m.hidden_at is not null as hidden, m.created_at,
      m.created_at <= t.created_at as up_to_target
    from public.messages m
    join target t on m.pod_id is not distinct from t.pod_id and m.day_number is not distinct from t.day_number
    left join public.profiles a on a.id = m.author_id
  )
  select id, author_name, body, hidden, created_at
  from (
    (select * from thread where up_to_target order by created_at desc limit 4)
    union all
    (select * from thread where not up_to_target order by created_at limit 3)
  ) nearby
  order by created_at;
$$;

-- A moderator's decision on a reported message. 'hide' hides it and closes its open reports as actioned;
-- 'dismiss' closes them as dismissed and leaves the message as it is.
create function public.resolve_reports(message_id uuid, outcome text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_role('moderator') then
    raise exception 'Only moderators can resolve reports' using errcode = '42501';
  end if;
  if outcome is null or outcome not in ('hide', 'dismiss') then
    raise exception 'outcome must be hide or dismiss' using errcode = '22023';
  end if;

  if outcome = 'hide' then
    update public.messages m
    set hidden_at = coalesce(m.hidden_at, now()), hidden_by = coalesce(m.hidden_by, (select auth.uid()))
    where m.id = resolve_reports.message_id;
  end if;

  update public.reports r
  set
    status = (case when outcome = 'hide' then 'actioned' else 'dismissed' end)::public.report_status,
    handled_by = (select auth.uid()),
    handled_at = now()
  where r.message_id = resolve_reports.message_id and r.status = 'open';
end;
$$;

-- Facilitators -----------------------------------------------------------------------------------------

-- The brief's "escalation path to facilitators": a facilitator sees which of their pod's messages have open
-- reports and the reasons given, never who reported them or what they wrote. Hidden messages drop off.
create function public.pod_reported_messages()
returns table (message_id uuid, day_number int, reasons public.report_reason[])
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.day_number, array_agg(distinct r.reason)
  from public.reports r
  join public.messages m on m.id = r.message_id
  where r.status = 'open'
    and m.hidden_at is null
    and m.pod_id = public.my_pod_id()
    and public.is_facilitator_of(m.pod_id)
  group by m.id, m.day_number;
$$;

-- Function access: signed-in people only ---------------------------------------------------------------

revoke execute on function
  public.moderation_queue(),
  public.moderation_context(uuid),
  public.resolve_reports(uuid, text),
  public.pod_reported_messages()
from public, anon;

grant execute on function
  public.moderation_queue(),
  public.moderation_context(uuid),
  public.resolve_reports(uuid, text),
  public.pod_reported_messages()
to authenticated;
