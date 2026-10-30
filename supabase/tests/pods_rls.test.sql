-- RLS tests for pods, pod membership and messages. Run with `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(47);

-- Setup, as postgres ----------------------------------------------------------------------------------

-- Start from no pods and no content (the seed adds both). All of this is rolled back at the end.
delete from public.messages;
delete from public.pod_members;
delete from public.pods;
delete from public.reflections;
delete from public.progress;
delete from public.days;

-- Ada facilitates pod A (Rooftop) and Bola is in it. Chidi facilitates pod B (Lantern) and Dayo is in it.
-- Nia has no pod yet. Mo is a moderator.
insert into auth.users (id, email, raw_user_meta_data) values
  ('aa000000-0000-0000-0000-000000000001', 'ada@pods.test', '{"display_name": "Ada", "segment": "undergrad"}'),
  ('bb000000-0000-0000-0000-000000000002', 'bola@pods.test', '{"display_name": "Bola", "segment": "undergrad"}'),
  ('cc000000-0000-0000-0000-000000000003', 'chidi@pods.test', '{"display_name": "Chidi", "segment": "early_career"}'),
  ('dd000000-0000-0000-0000-000000000004', 'dayo@pods.test', '{"display_name": "Dayo", "segment": "early_career"}'),
  ('ee000000-0000-0000-0000-000000000005', 'nia@pods.test', '{"display_name": "Nia", "segment": "entrepreneur"}'),
  ('ff000000-0000-0000-0000-000000000006', 'mo@pods.test', '{"display_name": "Mo", "segment": "experienced_professional"}');

update public.profiles set role = 'moderator' where id = 'ff000000-0000-0000-0000-000000000006';

insert into public.pods (id, name, segment) values
  ('a0d00000-0000-0000-0000-00000000000a', 'Rooftop', 'undergrad'),
  ('b0d00000-0000-0000-0000-00000000000b', 'Lantern', 'early_career');

insert into public.pod_members (pod_id, user_id, is_facilitator) values
  ('a0d00000-0000-0000-0000-00000000000a', 'aa000000-0000-0000-0000-000000000001', true),
  ('a0d00000-0000-0000-0000-00000000000a', 'bb000000-0000-0000-0000-000000000002', false),
  ('b0d00000-0000-0000-0000-00000000000b', 'cc000000-0000-0000-0000-000000000003', true),
  ('b0d00000-0000-0000-0000-00000000000b', 'dd000000-0000-0000-0000-000000000004', false);

-- Day 1 is unlocked, day 2 unlocks next week.
insert into public.days (day_number, module_number, kind, title, introduction, scripture_ref, body_md,
  reflection_prompts, practical_action, action_dimension, pod_prompt, est_minutes, publish_at, status)
values
  (1, 1, 'intro', 'Day 1', 'Intro', 'Acts 1:3', 'Body', '{"Prompt"}', 'Act', 'character', 'Pod?', 12,
   now() - interval '1 day', 'published'),
  (2, 1, 'developmental', 'Day 2', 'Intro', 'Ref', 'Body', '{"Prompt"}', 'Act', 'career', 'Pod?', 12,
   now() + interval '7 days', 'published');

-- Ada and Chidi have finished day 1.
insert into public.progress (user_id, day_number) values
  ('aa000000-0000-0000-0000-000000000001', 1),
  ('cc000000-0000-0000-0000-000000000003', 1);

insert into public.messages (id, pod_id, day_number, author_id, kind, body) values
  ('a1e00000-0000-0000-0000-000000000001', 'a0d00000-0000-0000-0000-00000000000a', 1,
   'bb000000-0000-0000-0000-000000000002', 'message', 'Bola in pod A'),
  ('a1e00000-0000-0000-0000-000000000002', 'a0d00000-0000-0000-0000-00000000000a', null,
   'bb000000-0000-0000-0000-000000000002', 'message', 'Something unkind'),
  ('b1e00000-0000-0000-0000-000000000003', 'b0d00000-0000-0000-0000-00000000000b', 1,
   'dd000000-0000-0000-0000-000000000004', 'message', 'Dayo in pod B'),
  ('f1e00000-0000-0000-0000-000000000004', null, null,
   'ff000000-0000-0000-0000-000000000006', 'announcement', 'Welcome, everyone');

-- Table rules ------------------------------------------------------------------------------------------

select throws_ok(
  $$ insert into public.pod_members (pod_id, user_id)
     values ('b0d00000-0000-0000-0000-00000000000b', 'bb000000-0000-0000-0000-000000000002') $$,
  '23505',
  null,
  'a person can only be in one pod'
);

select throws_ok(
  $$ update public.pod_members set is_facilitator = true
     where user_id = 'bb000000-0000-0000-0000-000000000002' $$,
  '23505',
  null,
  'a pod has at most one facilitator'
);

select throws_ok(
  $$ insert into public.messages (pod_id, author_id, body)
     values (null, 'bb000000-0000-0000-0000-000000000002', 'Lost') $$,
  '23514',
  null,
  'only an announcement can go to every pod'
);

select ok(
  exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ),
  'messages are published to Realtime for live updates'
);

-- As Bola, a member of pod A ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "bb000000-0000-0000-0000-000000000002", "role": "authenticated"}', true);

select results_eq(
  $$ select body from public.pod_messages where pod_id = 'a0d00000-0000-0000-0000-00000000000a' order by body $$,
  array['Bola in pod A', 'Something unkind'],
  'a member reads their pod''s messages'
);

select is_empty(
  $$ select 1 from public.pod_messages where pod_id = 'b0d00000-0000-0000-0000-00000000000b' $$,
  'a member cannot read another pod''s messages'
);

select is(
  public.message_body('b1e00000-0000-0000-0000-000000000003'),
  null::text,
  'a member cannot read another pod''s message by id'
);

select results_eq(
  $$ select body from public.pod_messages where kind = 'announcement' $$,
  array['Welcome, everyone'],
  'a member reads announcements'
);

select throws_ok(
  'select body from public.messages',
  '42501',
  null,
  'message bodies can only be read through pod_messages'
);

select lives_ok(
  $$ insert into public.messages (pod_id, day_number, body)
     values ('a0d00000-0000-0000-0000-00000000000a', 1, 'Hello pod') $$,
  'a member can post in their pod''s day thread'
);

select is(
  (select author_id from public.pod_messages where body = 'Hello pod'),
  'bb000000-0000-0000-0000-000000000002'::uuid,
  'a new message carries the poster''s id'
);

select throws_ok(
  $$ insert into public.messages (pod_id, author_id, body)
     values ('a0d00000-0000-0000-0000-00000000000a', 'aa000000-0000-0000-0000-000000000001', 'Pretending to be Ada') $$,
  '42501',
  null,
  'a member cannot post as someone else'
);

select throws_ok(
  $$ insert into public.messages (pod_id, body) values ('b0d00000-0000-0000-0000-00000000000b', 'Wrong pod') $$,
  '42501',
  null,
  'a member cannot post in another pod'
);

select throws_ok(
  $$ insert into public.messages (kind, body) values ('announcement', 'Hear ye') $$,
  '42501',
  null,
  'a participant cannot post an announcement'
);

select throws_ok(
  $$ insert into public.messages (pod_id, kind, body)
     values ('a0d00000-0000-0000-0000-00000000000a', 'pinned', 'Read me first') $$,
  '42501',
  null,
  'only the facilitator can post a pinned message'
);

select throws_ok(
  $$ insert into public.messages (pod_id, day_number, body)
     values ('a0d00000-0000-0000-0000-00000000000a', 2, 'Too early') $$,
  '42501',
  null,
  'a member cannot post under a day before it unlocks'
);

select throws_ok(
  $$ update public.messages set kind = 'pinned' where id = 'a1e00000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'messages cannot be edited from the app'
);

select throws_ok(
  $$ delete from public.messages where id = 'a1e00000-0000-0000-0000-000000000001' $$,
  '42501',
  null,
  'messages cannot be deleted from the app'
);

select throws_ok(
  $$ select public.hide_message('a1e00000-0000-0000-0000-000000000002') $$,
  '42501',
  null,
  'a member who is not the facilitator cannot hide a message'
);

select throws_ok(
  $$ select public.set_whatsapp_link('https://chat.whatsapp.com/AbCdEf123') $$,
  '42501',
  null,
  'a member who is not the facilitator cannot set the WhatsApp link'
);

select results_eq(
  'select name from public.pods',
  array['Rooftop'],
  'a member reads only their own pod'
);

select results_eq(
  'select user_id::text from public.pod_members order by user_id',
  array['aa000000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000002'],
  'a member reads only their own pod''s membership'
);

select results_eq(
  'select display_name, is_facilitator from public.pod_roster()',
  $$ values ('Ada', true), ('Bola', false) $$,
  'the roster lists my pod, facilitator first'
);

select results_eq(
  'select members, completed from public.pod_today_totals(1)',
  $$ values (2, 1) $$,
  'pod totals count the members and how many finished the day'
);

select is(
  pg_get_function_result('public.pod_today_totals(integer)'::regprocedure),
  'TABLE(members integer, completed integer)',
  'pod totals return counts only, never user ids'
);

select is(
  pg_get_function_result('public.pod_roster()'::regprocedure),
  'TABLE(user_id uuid, display_name text, avatar jsonb, is_facilitator boolean)',
  'the roster never returns email, phone, segment or role'
);

-- As Ada, the facilitator of pod A ---------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub": "aa000000-0000-0000-0000-000000000001", "role": "authenticated"}', true);

select lives_ok(
  $$ insert into public.messages (pod_id, day_number, kind, body)
     values ('a0d00000-0000-0000-0000-00000000000a', 1, 'pinned', 'Read me first') $$,
  'the facilitator can post a pinned message'
);

select lives_ok(
  $$ select public.hide_message('a1e00000-0000-0000-0000-000000000002') $$,
  'the facilitator can hide a message in their pod'
);

select throws_ok(
  $$ select public.hide_message('b1e00000-0000-0000-0000-000000000003') $$,
  '42501',
  null,
  'a facilitator cannot hide a message in another pod'
);

select throws_ok(
  $$ select public.hide_message('f1e00000-0000-0000-0000-000000000004') $$,
  '42501',
  null,
  'a facilitator cannot hide an announcement'
);

select lives_ok(
  $$ select public.set_whatsapp_link('https://chat.whatsapp.com/AbCdEf123') $$,
  'the facilitator can add the WhatsApp link'
);

select throws_ok(
  $$ select public.set_whatsapp_link('https://example.com/not-whatsapp') $$,
  '23514',
  null,
  'the WhatsApp link must be a WhatsApp group invite'
);

select is(
  (select whatsapp_invite_link from public.pods),
  'https://chat.whatsapp.com/AbCdEf123',
  'the pod row carries the WhatsApp link'
);

-- Back as Bola -----------------------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub": "bb000000-0000-0000-0000-000000000002", "role": "authenticated"}', true);

select results_eq(
  $$ select body, hidden from public.pod_messages where id = 'a1e00000-0000-0000-0000-000000000002' $$,
  $$ values ('Message hidden', true) $$,
  'members see a hidden message as "Message hidden"'
);

-- As Mo, a moderator -----------------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub": "ff000000-0000-0000-0000-000000000006", "role": "authenticated"}', true);

select is(
  (select body from public.pod_messages where id = 'a1e00000-0000-0000-0000-000000000002'),
  'Something unkind',
  'a moderator still reads a hidden message'
);

select results_eq(
  'select count(*)::int from public.pod_messages where pod_id is not null',
  array[5],
  'a moderator reads every pod''s messages'
);

select lives_ok(
  $$ insert into public.messages (kind, body) values ('announcement', 'Day 1 starts tomorrow') $$,
  'a moderator can post an announcement'
);

select lives_ok(
  $$ select public.hide_message('b1e00000-0000-0000-0000-000000000003') $$,
  'a moderator can hide any message'
);

select throws_ok(
  $$ insert into public.messages (pod_id, body)
     values ('a0d00000-0000-0000-0000-00000000000a', 'Hello from a leader') $$,
  '42501',
  null,
  'a moderator posts announcements, not messages inside a pod'
);

-- As Nia, who has no pod yet ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub": "ee000000-0000-0000-0000-000000000005", "role": "authenticated"}', true);

select is(public.my_pod_id(), null::uuid, 'someone without a pod has no pod id');

select results_eq(
  'select members, completed from public.pod_today_totals(1)',
  $$ values (0, 0) $$,
  'someone without a pod gets zero totals'
);

select results_eq(
  'select kind::text from public.pod_messages',
  array['announcement', 'announcement'],
  'someone without a pod sees only announcements'
);

select is_empty(
  'select 1 from public.pod_roster()',
  'someone without a pod has an empty roster'
);

-- Signed out --------------------------------------------------------------------------------------------

reset role;
set local role anon;
select set_config('request.jwt.claims', '', true);

select throws_ok('select * from public.pods', '42501', null, 'signed-out visitors cannot read pods');
select throws_ok('select * from public.pod_messages', '42501', null, 'signed-out visitors cannot read messages');
select throws_ok('select * from public.pod_roster()', '42501', null, 'signed-out visitors cannot read a roster');

-- Back as postgres --------------------------------------------------------------------------------------

reset role;

select is(
  (select hidden_by from public.messages where id = 'a1e00000-0000-0000-0000-000000000002'),
  'aa000000-0000-0000-0000-000000000001'::uuid,
  'hiding records who hid the message'
);

select * from finish();
rollback;
