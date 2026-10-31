-- Metrics (PLAN.md Phase 5): a few usage events from the app, and views over them and the other tables for
-- the project team to read in Studio. No third-party trackers. Everything is counts: nothing here is shown
-- to participants, and the views list no names.

create type public.event_name as enum (
  'day_opened', 'day_completed', 'pod_message_posted', 'reflection_shared', 'whatsapp_joined'
);

create table public.events (
  id bigint generated always as identity primary key,
  -- Deleted with the account, like everything else of theirs.
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  name public.event_name not null,
  -- Small details such as {"day": 3}. Never message text or answers.
  props jsonb not null default '{}' check (jsonb_typeof(props) = 'object' and pg_column_size(props) <= 500),
  created_at timestamptz not null default now()
);

create index events_name_time on public.events (name, created_at);

alter table public.events enable row level security;

revoke all on public.events from anon, authenticated;

-- Insert only: the app can record an event for the signed-in person and never read any back.
grant insert (name, props) on public.events to authenticated;

create policy "Record my own events"
on public.events for insert
to authenticated
with check (user_id = (select auth.uid()));

-- Views for the project team ----------------------------------------------------------------------------
-- In their own schema, which the API doesn't expose, so only Studio (and the service role) can read them.
-- Dates are Lagos dates. Participants means role 'participant' with a confirmed email.

create schema analytics;
revoke all on schema analytics from public, anon, authenticated;

create view analytics.participants as
select p.id, p.segment, p.created_at
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'participant' and u.email_confirmed_at is not null;

-- Sign-ups by day and segment.
create view analytics.signups_by_day as
select (created_at at time zone 'Africa/Lagos')::date as day, segment, count(*)::int as signups
from analytics.participants
group by 1, 2
order by 1, 2;

-- How many participants finished each day (Day 1 and Day 8 are the ones the brief asks about).
create view analytics.day_completion as
select
  d.day_number,
  count(pr.user_id)::int as completed,
  (select count(*) from analytics.participants)::int as participants,
  round(100.0 * count(pr.user_id) / nullif((select count(*) from analytics.participants), 0), 1) as percent
from public.days d
left join public.progress pr on pr.day_number = d.day_number and pr.user_id in (select id from analytics.participants)
group by d.day_number
order by d.day_number;

-- Return after each module: of those who finished at least one day in module m, how many opened or finished
-- a day in module m + 1.
create view analytics.module_return as
with active as (
  select pr.user_id, (pr.day_number - 1) / 8 + 1 as module
  from public.progress pr
  where pr.user_id in (select id from analytics.participants)
  union
  select e.user_id, ((e.props ->> 'day')::int - 1) / 8 + 1
  from public.events e
  where e.name = 'day_opened' and e.props ? 'day' and e.user_id in (select id from analytics.participants)
)
select
  m.module,
  count(distinct a.user_id) filter (where a.module = m.module)::int as active,
  count(distinct a.user_id) filter (
    where a.module = m.module
      and exists (select 1 from active b where b.user_id = a.user_id and b.module = m.module + 1)
  )::int as came_back_for_next
from generate_series(1, 4) as m(module)
left join active a on a.module = m.module
group by m.module
order by m.module;

-- Pod participation: per day, how many pods had at least one message from a member.
create view analytics.pod_participation as
select
  (m.created_at at time zone 'Africa/Lagos')::date as day,
  count(distinct m.pod_id)::int as pods_with_messages,
  (select count(*) from public.pods)::int as pods,
  count(*)::int as messages
from public.messages m
where m.pod_id is not null and m.kind <> 'announcement'
group by 1
order by 1;

-- The waiting days (24 Dec to 1 Jan): is the chat still alive?
create view analytics.waiting_day_activity as
select
  (m.created_at at time zone 'Africa/Lagos')::date as day,
  count(distinct m.pod_id)::int as pods_with_messages,
  count(distinct m.author_id)::int as people_posting,
  count(*)::int as messages
from public.messages m
where m.pod_id is not null
  and m.kind <> 'announcement'
  and (m.created_at at time zone 'Africa/Lagos')::date between date '2026-12-24' and date '2027-01-01'
group by 1
order by 1;

-- App events per day, for anything the views above don't cover.
create view analytics.events_by_day as
select (created_at at time zone 'Africa/Lagos')::date as day, name, count(*)::int as events
from public.events
group by 1, 2
order by 1, 2;

revoke all on all tables in schema analytics from public, anon, authenticated;
