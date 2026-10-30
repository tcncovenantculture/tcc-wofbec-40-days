-- RLS and function tests for reports and moderation. Run with `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(27);

-- Setup, as postgres ----------------------------------------------------------------------------------

delete from public.reports;
delete from public.messages;
delete from public.pod_members;
delete from public.pods;

-- Pod A (Rooftop): Ada facilitates, Bola and Efe are members. Pod B (Lantern): Chidi facilitates, Dayo is a
-- member. Mo is a moderator.
insert into auth.users (id, email, raw_user_meta_data) values
  ('aa000000-0000-0000-0000-000000000001', 'ada@reports.test', '{"display_name": "Ada", "segment": "undergrad"}'),
  ('bb000000-0000-0000-0000-000000000002', 'bola@reports.test', '{"display_name": "Bola", "segment": "undergrad"}'),
  ('cc000000-0000-0000-0000-000000000003', 'chidi@reports.test', '{"display_name": "Chidi", "segment": "early_career"}'),
  ('dd000000-0000-0000-0000-000000000004', 'dayo@reports.test', '{"display_name": "Dayo", "segment": "early_career"}'),
  ('ee000000-0000-0000-0000-000000000005', 'efe@reports.test', '{"display_name": "Efe", "segment": "undergrad"}'),
  ('ff000000-0000-0000-0000-000000000006', 'mo@reports.test', '{"display_name": "Mo", "segment": "experienced_professional"}');

update public.profiles set role = 'moderator' where id = 'ff000000-0000-0000-0000-000000000006';

insert into public.pods (id, name, segment) values
  ('a0d00000-0000-0000-0000-00000000000a', 'Rooftop', 'undergrad'),
  ('b0d00000-0000-0000-0000-00000000000b', 'Lantern', 'early_career');

insert into public.pod_members (pod_id, user_id, is_facilitator) values
  ('a0d00000-0000-0000-0000-00000000000a', 'aa000000-0000-0000-0000-000000000001', true),
  ('a0d00000-0000-0000-0000-00000000000a', 'bb000000-0000-0000-0000-000000000002', false),
  ('a0d00000-0000-0000-0000-00000000000a', 'ee000000-0000-0000-0000-000000000005', false),
  ('b0d00000-0000-0000-0000-00000000000b', 'cc000000-0000-0000-0000-000000000003', true),
  ('b0d00000-0000-0000-0000-00000000000b', 'dd000000-0000-0000-0000-000000000004', false);

-- General chat in each pod. Bola's second message is the reported one; the others give it context.
insert into public.messages (id, pod_id, author_id, body, created_at) values
  ('a1e00000-0000-0000-0000-000000000001', 'a0d00000-0000-0000-0000-00000000000a',
   'ee000000-0000-0000-0000-000000000005', 'Morning all', now() - interval '3 minutes'),
  ('a1e00000-0000-0000-0000-000000000002', 'a0d00000-0000-0000-0000-00000000000a',
   'bb000000-0000-0000-0000-000000000002', 'Something unkind', now() - interval '2 minutes'),
  ('a1e00000-0000-0000-0000-000000000003', 'a0d00000-0000-0000-0000-00000000000a',
   'aa000000-0000-0000-0000-000000000001', 'Let us keep it kind', now() - interval '1 minute'),
  ('b1e00000-0000-0000-0000-000000000004', 'b0d00000-0000-0000-0000-00000000000b',
   'cc000000-0000-0000-0000-000000000003', 'Buy my course!!!', now() - interval '1 minute');

-- As Efe, a member of pod A ----------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "ee000000-0000-0000-0000-000000000005", "role": "authenticated"}', true);

select lives_ok(
  $$ insert into public.reports (message_id, reason, details)
     values ('a1e00000-0000-0000-0000-000000000002', 'unkind', 'It was aimed at me') $$,
  'a member can report a message in their pod'
);

select throws_ok(
  $$ insert into public.reports (message_id, reason) values ('a1e00000-0000-0000-0000-000000000002', 'spam') $$,
  '23505',
  null,
  'the same person cannot report the same message twice'
);

select throws_ok(
  $$ insert into public.reports (message_id, reason) values ('b1e00000-0000-0000-0000-000000000004', 'spam') $$,
  '42501',
  null,
  'a member cannot report a message from another pod'
);

select throws_ok(
  $$ insert into public.reports (message_id, reporter_id, reason)
     values ('a1e00000-0000-0000-0000-000000000001', 'bb000000-0000-0000-0000-000000000002', 'spam') $$,
  '42501',
  null,
  'a member cannot report in someone else''s name'
);

select throws_ok('select * from public.reports', '42501', null, 'reports cannot be read directly');

select is_empty('select * from public.moderation_queue()', 'a member gets an empty moderation queue');

select is_empty('select * from public.moderation_context(''a1e00000-0000-0000-0000-000000000002'')',
  'a member cannot read moderation context');

select is_empty('select * from public.pod_reported_messages()', 'a member who isn''t the facilitator sees no reports');

select throws_ok(
  $$ select public.resolve_reports('a1e00000-0000-0000-0000-000000000002', 'dismiss') $$,
  '42501',
  null,
  'a member cannot resolve reports'
);

-- As Ada, the facilitator of pod A ---------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub": "aa000000-0000-0000-0000-000000000001", "role": "authenticated"}', true);

select results_eq(
  'select message_id::text, day_number, reasons::text[] from public.pod_reported_messages()',
  $$ values ('a1e00000-0000-0000-0000-000000000002', null::int, array['unkind']) $$,
  'the facilitator sees which message in their pod was reported, and why'
);

select is(
  pg_get_function_result('public.pod_reported_messages()'::regprocedure),
  'TABLE(message_id uuid, day_number integer, reasons report_reason[])',
  'the facilitator never gets the reporter or their words'
);

select lives_ok(
  $$ insert into public.reports (message_id, reason) values ('a1e00000-0000-0000-0000-000000000002', 'unsafe') $$,
  'a second person can report the same message'
);

-- As Chidi, the facilitator of pod B, and Dayo in pod B -------------------------------------------------

select set_config('request.jwt.claims', '{"sub": "cc000000-0000-0000-0000-000000000003", "role": "authenticated"}', true);

select is_empty('select * from public.pod_reported_messages()', 'another pod''s facilitator sees nothing');

select set_config('request.jwt.claims', '{"sub": "dd000000-0000-0000-0000-000000000004", "role": "authenticated"}', true);

select lives_ok(
  $$ insert into public.reports (message_id, reason) values ('b1e00000-0000-0000-0000-000000000004', 'spam') $$,
  'a member of pod B can report a message in pod B'
);

-- As Mo, a moderator -----------------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub": "ff000000-0000-0000-0000-000000000006", "role": "authenticated"}', true);

select results_eq(
  $$ select message_id::text, pod_name, author_name, body, hidden, reports, reasons::text[], details
     from public.moderation_queue() order by pod_name desc $$,
  $$ values
       ('a1e00000-0000-0000-0000-000000000002', 'Rooftop', 'Bola', 'Something unkind', false, 2,
        array['unkind', 'unsafe'], array['It was aimed at me']),
       ('b1e00000-0000-0000-0000-000000000004', 'Lantern', 'Chidi', 'Buy my course!!!', false, 1,
        array['spam'], array[]::text[]) $$,
  'the moderator sees one row per reported message, with the count, reasons and words'
);

select results_eq(
  $$ select body from public.moderation_context('a1e00000-0000-0000-0000-000000000002') $$,
  array['Morning all', 'Something unkind', 'Let us keep it kind'],
  'the moderator sees the reported message in its thread'
);

select throws_ok(
  $$ select public.resolve_reports('a1e00000-0000-0000-0000-000000000002', 'delete') $$,
  '22023',
  null,
  'only hide or dismiss are accepted'
);

select lives_ok(
  $$ select public.resolve_reports('a1e00000-0000-0000-0000-000000000002', 'hide') $$,
  'the moderator can hide a reported message'
);

select lives_ok(
  $$ select public.resolve_reports('b1e00000-0000-0000-0000-000000000004', 'dismiss') $$,
  'the moderator can dismiss reports'
);

select is_empty('select * from public.moderation_queue()', 'resolved messages leave the queue');

-- As Ada again --------------------------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub": "aa000000-0000-0000-0000-000000000001", "role": "authenticated"}', true);

select is_empty('select * from public.pod_reported_messages()', 'a hidden message drops off the facilitator''s list');

select results_eq(
  $$ select body, hidden from public.pod_messages where id = 'a1e00000-0000-0000-0000-000000000002' $$,
  $$ values ('Message hidden', true) $$,
  'the pod sees the hidden message as "Message hidden"'
);

-- Signed out --------------------------------------------------------------------------------------------

reset role;
set local role anon;
select set_config('request.jwt.claims', '', true);

select throws_ok(
  $$ insert into public.reports (message_id, reason) values ('a1e00000-0000-0000-0000-000000000001', 'spam') $$,
  '42501',
  null,
  'signed-out visitors cannot report'
);

select throws_ok('select * from public.moderation_queue()', '42501', null, 'signed-out visitors cannot see the queue');

-- Back as postgres: what was recorded ------------------------------------------------------------------

reset role;

select results_eq(
  $$ select status::text, count(*)::int from public.reports
     where message_id = 'a1e00000-0000-0000-0000-000000000002' group by status $$,
  $$ values ('actioned', 2) $$,
  'hiding closes every open report on the message as actioned'
);

select results_eq(
  $$ select status::text, handled_by::text from public.reports
     where message_id = 'b1e00000-0000-0000-0000-000000000004' $$,
  $$ values ('dismissed', 'ff000000-0000-0000-0000-000000000006') $$,
  'dismissing records who decided'
);

select is(
  (select reporter_id from public.reports where reason = 'unkind'),
  'ee000000-0000-0000-0000-000000000005'::uuid,
  'a report records who made it, for the moderators'' records only'
);

select * from finish();
rollback;
