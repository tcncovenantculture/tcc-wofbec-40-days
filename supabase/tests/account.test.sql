-- Privacy record at sign-up and deleting your own account (PLAN.md 3.2). Run with `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

-- Setup, as postgres ----------------------------------------------------------------------------------

delete from public.reports;
delete from public.messages;
delete from public.pod_members;
delete from public.pods;
delete from public.reflections;
delete from public.progress;
delete from public.days;

-- Ada and Bola share a pod; Ada is leaving. Cy signed up before the privacy record existed.
insert into auth.users (id, email, raw_user_meta_data) values
  ('a2000000-0000-0000-0000-000000000001', 'ada@account.test',
   '{"display_name": "Ada", "segment": "undergrad", "privacy_accepted": true}'),
  ('b2000000-0000-0000-0000-000000000002', 'bola@account.test',
   '{"display_name": "Bola", "segment": "undergrad", "privacy_accepted": true}'),
  ('c2000000-0000-0000-0000-000000000003', 'cy@account.test',
   '{"display_name": "Cy", "segment": "undergrad"}');

insert into public.days (day_number, module_number, kind, title, introduction, scripture_ref, body_md,
  reflection_prompts, practical_action, action_dimension, pod_prompt, est_minutes, publish_at, status)
values (1, 1, 'intro', 'Day 1', 'Intro', 'Acts 1:3', 'Body', '{"Prompt"}', 'Act', 'character', 'Pod?', 12,
  now() - interval '1 day', 'published');

insert into public.pods (id, name, segment) values ('a2d00000-0000-0000-0000-00000000000a', 'Cedar', 'undergrad');
insert into public.pod_members (pod_id, user_id, is_facilitator) values
  ('a2d00000-0000-0000-0000-00000000000a', 'a2000000-0000-0000-0000-000000000001', true),
  ('a2d00000-0000-0000-0000-00000000000a', 'b2000000-0000-0000-0000-000000000002', false);

insert into public.progress (user_id, day_number) values
  ('a2000000-0000-0000-0000-000000000001', 1),
  ('b2000000-0000-0000-0000-000000000002', 1);
insert into public.reflections (user_id, day_number, prompt_index, body) values
  ('a2000000-0000-0000-0000-000000000001', 1, 0, 'Ada''s private answer'),
  ('b2000000-0000-0000-0000-000000000002', 1, 0, 'Bola''s private answer');

insert into public.messages (id, pod_id, day_number, author_id, body) values
  ('a2e00000-0000-0000-0000-000000000001', 'a2d00000-0000-0000-0000-00000000000a', 1,
   'a2000000-0000-0000-0000-000000000001', 'Ada says hello'),
  ('a2e00000-0000-0000-0000-000000000002', 'a2d00000-0000-0000-0000-00000000000a', 1,
   'b2000000-0000-0000-0000-000000000002', 'Bola says hello');
-- Ada reported Bola's message before leaving.
insert into public.reports (message_id, reporter_id, reason)
values ('a2e00000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000001', 'spam');

-- Privacy record --------------------------------------------------------------------------------------

select isnt(
  (select privacy_accepted_at from public.profiles where id = 'a2000000-0000-0000-0000-000000000001'),
  null,
  'ticking the privacy notice at sign-up is recorded with a time'
);

select is(
  (select privacy_accepted_at from public.profiles where id = 'c2000000-0000-0000-0000-000000000003'),
  null,
  'no privacy record without the tick'
);

-- Signed out ------------------------------------------------------------------------------------------

set local role anon;
select set_config('request.jwt.claims', '', true);

select throws_ok(
  'select public.delete_my_account()',
  '42501',
  null,
  'signed-out visitors cannot call delete_my_account'
);

-- As Ada ----------------------------------------------------------------------------------------------

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "a2000000-0000-0000-0000-000000000001", "role": "authenticated"}', true);

select throws_ok(
  $$ update public.profiles set privacy_accepted_at = null where id = 'a2000000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'nobody can change their own privacy record'
);

select lives_ok('select public.delete_my_account()', 'a participant can delete their own account');

-- Back as postgres to see what's left -----------------------------------------------------------------

reset role;

select is_empty(
  $$ select 1 from auth.users where id = 'a2000000-0000-0000-0000-000000000001' $$,
  'the sign-in account is gone'
);

select is_empty(
  $$ select 1 from public.profiles where id = 'a2000000-0000-0000-0000-000000000001' $$,
  'the profile is gone'
);

select is_empty(
  $$ select 1 from public.reflections where user_id = 'a2000000-0000-0000-0000-000000000001' $$,
  'their reflections are gone'
);

select is_empty(
  $$ select 1 from public.progress where user_id = 'a2000000-0000-0000-0000-000000000001' $$,
  'their progress is gone'
);

select is_empty(
  $$ select 1 from public.pod_members where user_id = 'a2000000-0000-0000-0000-000000000001' $$,
  'their pod membership is gone'
);

select results_eq(
  $$ select author_id, body from public.messages where id = 'a2e00000-0000-0000-0000-000000000001' $$,
  $$ values (null::uuid, 'Ada says hello') $$,
  'their messages stay in the thread with no author ("Former member")'
);

select results_eq(
  $$ select reporter_id, status::text from public.reports
     where message_id = 'a2e00000-0000-0000-0000-000000000002' $$,
  $$ values (null::uuid, 'open') $$,
  'their reports stay open for moderators, with no reporter'
);

select results_eq(
  $$ select
       (select count(*)::int from public.reflections where user_id = 'b2000000-0000-0000-0000-000000000002'),
       (select count(*)::int from public.progress where user_id = 'b2000000-0000-0000-0000-000000000002'),
       (select count(*)::int from public.pod_members where pod_id = 'a2d00000-0000-0000-0000-00000000000a') $$,
  $$ values (1, 1, 1) $$,
  'the rest of the pod is untouched'
);

-- As Bola, still in the pod ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "b2000000-0000-0000-0000-000000000002", "role": "authenticated"}', true);

select results_eq(
  $$ select author_id, body from public.pod_messages where id = 'a2e00000-0000-0000-0000-000000000001' $$,
  $$ values (null::uuid, 'Ada says hello') $$,
  'the rest of the pod still reads the message, with no author'
);

select results_eq(
  'select count(*)::int from public.pod_roster()',
  array[1],
  'the roster no longer lists the person who left'
);

select lives_ok('select public.delete_my_account()', 'the last member can leave too');

select * from finish();
rollback;
