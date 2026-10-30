-- RLS tests for the Phase 1 tables. Run with `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(23);

-- Setup, as postgres ----------------------------------------------------------------------------------

-- Start from no content (the seed and local loads add days). All of this is rolled back at the end.
delete from public.reflections;
delete from public.progress;
delete from public.days;

-- Ada and Bola are participants, Rev is a reviewer, Mo is a moderator.
insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-0000-0000-000000000001', 'ada@test.local',
   '{"display_name": " Ada ", "segment": "undergrad", "whatsapp_number": "+2348031234567"}'),
  ('b0000000-0000-0000-0000-000000000002', 'bola@test.local',
   '{"display_name": "Bola", "segment": "entrepreneur", "reminder_email": true}'),
  ('c0000000-0000-0000-0000-000000000003', 'rev@test.local',
   '{"display_name": "Rev", "segment": "early_career"}'),
  ('d0000000-0000-0000-0000-000000000004', 'mo@test.local',
   '{"display_name": "Mo", "segment": "experienced_professional"}');

update public.profiles set role = 'reviewer' where id = 'c0000000-0000-0000-0000-000000000003';
update public.profiles set role = 'moderator' where id = 'd0000000-0000-0000-0000-000000000004';

-- Day 1 is unlocked, day 2 unlocks next week, day 3 is a draft.
insert into public.days (day_number, module_number, kind, title, introduction, scripture_ref, body_md,
  reflection_prompts, practical_action, action_dimension, pod_prompt, est_minutes, publish_at, status)
values
  (1, 1, 'intro', 'Day 1', 'Intro', 'Acts 1:3', 'Body', '{"Prompt"}', 'Act', 'character', 'Pod?', 12,
   now() - interval '1 day', 'published'),
  (2, 1, 'developmental', 'Day 2', 'Intro', 'Ref', 'Body', '{"Prompt"}', 'Act', 'career', 'Pod?', 12,
   now() + interval '7 days', 'published'),
  (3, 1, 'developmental', 'Day 3', 'Intro', 'Ref', 'Body', '{"Prompt"}', 'Act', 'community', 'Pod?', 12,
   now() - interval '1 day', 'draft');

insert into public.reflections (user_id, day_number, prompt_index, body)
values ('b0000000-0000-0000-0000-000000000002', 1, 0, 'Bola''s private answer');

-- Sign-up trigger ------------------------------------------------------------------------------------

select results_eq(
  $$ select display_name, segment::text, email, whatsapp_number, reminder_email, role::text
     from public.profiles where id = 'a0000000-0000-0000-0000-000000000001' $$,
  $$ values ('Ada', 'undergrad', 'ada@test.local', '+2348031234567', false, 'participant') $$,
  'sign-up creates a trimmed profile, reminders off by default, role participant'
);

select is(
  (select reminder_email from public.profiles where id = 'b0000000-0000-0000-0000-000000000002'),
  true,
  'reminder consent from the sign-up form is stored'
);

select throws_ok(
  $$ insert into auth.users (id, email, raw_user_meta_data)
     values ('e0000000-0000-0000-0000-000000000005', 'x@test.local', '{"display_name": "X"}') $$,
  '23502',
  null,
  'sign-up without a segment fails, so there is never an account without a profile'
);

insert into auth.users (id, email, raw_user_meta_data)
values ('e0000000-0000-0000-0000-000000000006', 'sly@test.local',
        '{"display_name": "Sly", "segment": "undergrad", "role": "moderator"}');

select is(
  (select role::text from public.profiles where id = 'e0000000-0000-0000-0000-000000000006'),
  'participant',
  'role is never taken from sign-up metadata'
);

-- As Ada, a participant -------------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}', true);

select results_eq(
  'select day_number from public.days order by day_number',
  array[1],
  'a participant reads only unlocked, published days'
);

select is_empty(
  'select 1 from public.days where day_number = 2',
  'a participant cannot read a future day'
);

select is_empty(
  'select 1 from public.days where day_number = 3',
  'a participant cannot read a draft day'
);

select is_empty(
  $$ select 1 from public.reflections where user_id = 'b0000000-0000-0000-0000-000000000002' $$,
  'a participant cannot read another user''s reflections'
);

select lives_ok(
  $$ insert into public.reflections (day_number, prompt_index, body) values (1, 0, 'My answer') $$,
  'a participant can save a reflection on an unlocked day'
);

select throws_ok(
  $$ insert into public.reflections (user_id, day_number, prompt_index, body)
     values ('b0000000-0000-0000-0000-000000000002', 1, 1, 'Pretending to be Bola') $$,
  '42501',
  null,
  'a participant cannot write a reflection as someone else'
);

select throws_ok(
  $$ insert into public.reflections (day_number, prompt_index, body) values (2, 0, 'Too early') $$,
  '42501',
  null,
  'a participant cannot answer a day before it unlocks'
);

select lives_ok(
  'insert into public.progress (day_number) values (1)',
  'a participant can complete an unlocked day'
);

select throws_ok(
  'insert into public.progress (day_number) values (2)',
  '42501',
  null,
  'a participant cannot complete a day before it unlocks'
);

select throws_ok(
  $$ update public.profiles set role = 'moderator' where id = 'a0000000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'a participant cannot set their own role'
);

select throws_ok(
  $$ update public.profiles set segment = 'entrepreneur' where id = 'a0000000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'a participant cannot change their segment'
);

select lives_ok(
  $$ update public.profiles set display_name = 'Ada O', reminder_email = true
     where id = 'a0000000-0000-0000-0000-000000000001' $$,
  'a participant can edit their name and reminder consent'
);

update public.profiles set display_name = 'Hacked' where id = 'b0000000-0000-0000-0000-000000000002';

select results_eq(
  'select id::text from public.profiles',
  array['a0000000-0000-0000-0000-000000000001'],
  'a participant reads only their own profile'
);

select is_empty(
  $$ select * from public.moderator_display_names(array['b0000000-0000-0000-0000-000000000002'::uuid]) $$,
  'a participant cannot look up other people''s names'
);

-- As Rev, a reviewer ------------------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub": "c0000000-0000-0000-0000-000000000003", "role": "authenticated"}', true);

select results_eq(
  'select day_number from public.days order by day_number',
  array[1, 2, 3],
  'a reviewer can read draft and future days'
);

select is_empty(
  'select 1 from public.reflections',
  'a reviewer cannot read anyone''s reflections'
);

-- As Mo, a moderator ------------------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub": "d0000000-0000-0000-0000-000000000004", "role": "authenticated"}', true);

select results_eq(
  $$ select display_name from public.moderator_display_names(
       array['a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002']::uuid[])
     order by display_name $$,
  array['Ada O', 'Bola'],
  'a moderator can look up display names'
);

-- Signed out --------------------------------------------------------------------------------------------

reset role;
set local role anon;
select set_config('request.jwt.claims', '', true);

select throws_ok(
  'select * from public.days',
  '42501',
  null,
  'signed-out visitors cannot read days'
);

-- Back as postgres: check the blocked update above changed nothing -------------------------------------

reset role;

select is(
  (select display_name from public.profiles where id = 'b0000000-0000-0000-0000-000000000002'),
  'Bola',
  'a participant cannot edit someone else''s profile'
);

select * from finish();
rollback;
