-- Metrics: events are insert-only for their owner, and the analytics views are for the team only.
begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

delete from public.reports;
delete from public.messages;
delete from public.pod_members;
delete from public.pods;
delete from public.progress;
delete from public.days;
-- Start from no people (the local seed adds some). Rolled back at the end, like everything here.
delete from auth.users;

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('a5000000-0000-0000-0000-000000000001', 'ada@metrics.test', now(), '{"display_name": "Ada", "segment": "undergrad"}'),
  ('b5000000-0000-0000-0000-000000000002', 'bola@metrics.test', now(), '{"display_name": "Bola", "segment": "undergrad"}'),
  ('c5000000-0000-0000-0000-000000000003', 'cy@metrics.test', null, '{"display_name": "Cy", "segment": "entrepreneur"}');

insert into public.days (day_number, module_number, kind, title, introduction, scripture_ref, body_md,
  reflection_prompts, practical_action, action_dimension, pod_prompt, est_minutes, publish_at, status)
select n, (n - 1) / 8 + 1, case when n % 8 = 1 then 'intro' when n % 8 = 0 then 'synthesis' else 'developmental' end::public.day_kind,
  'Day ' || n, 'Intro', 'Ref', 'Body', '{"Prompt"}', 'Act', 'career', 'Pod?', 10, now() - interval '1 day', 'published'
from generate_series(1, 9) as n;

-- Ada finished days 1 and 8 and opened day 9 (module 2); Bola finished day 1 only.
insert into public.progress (user_id, day_number) values
  ('a5000000-0000-0000-0000-000000000001', 1),
  ('a5000000-0000-0000-0000-000000000001', 8),
  ('b5000000-0000-0000-0000-000000000002', 1);

-- As Ada ----------------------------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "a5000000-0000-0000-0000-000000000001", "role": "authenticated"}', true);

select lives_ok(
  $$ insert into public.events (name, props) values ('day_opened', '{"day": 9}') $$,
  'the app records an event for the signed-in person'
);

select throws_ok('select * from public.events', '42501', null, 'nobody can read events from the app, not even their own');

select throws_ok(
  $$ insert into public.events (user_id, name) values ('b5000000-0000-0000-0000-000000000002', 'day_opened') $$,
  '42501',
  null,
  'nobody can record an event as someone else'
);

select throws_ok(
  $$ insert into public.events (name) values ('page_viewed') $$,
  '22P02',
  null,
  'only the five agreed events can be recorded'
);

select throws_ok(
  $$ insert into public.events (name, props) values ('day_opened', '"not an object"') $$,
  '23514',
  null,
  'event details must be a small object'
);

select throws_ok('select * from analytics.day_completion', '42501', null, 'participants cannot read the analytics views');

-- As postgres (Studio) ---------------------------------------------------------------------------------

reset role;

select results_eq(
  $$ select day_number, completed, participants, percent from analytics.day_completion where day_number in (1, 8) $$,
  $$ values (1, 2, 2, 100.0), (8, 1, 2, 50.0) $$,
  'Day 1 and Day 8 completion count confirmed participants only'
);

select results_eq(
  $$ select module, active, came_back_for_next from analytics.module_return where module = 1 $$,
  $$ values (1, 2, 1) $$,
  'return after module 1 counts opening a module 2 day'
);

select results_eq(
  $$ select segment::text, signups from analytics.signups_by_day where segment = 'undergrad' $$,
  $$ values ('undergrad', 2) $$,
  'sign-ups leave out people who never confirmed their email'
);

reset role;
set local role anon;
select throws_ok('select * from analytics.signups_by_day', '42501', null, 'signed-out visitors cannot read them either');

select * from finish();
rollback;
