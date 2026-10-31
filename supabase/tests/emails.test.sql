-- Who gets the welcome and reminder emails, and unsubscribing (PLAN.md 4.3). Run with `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

-- Setup, as postgres ----------------------------------------------------------------------------------

delete from public.reports;
delete from public.messages;
delete from public.pod_members;
delete from public.pods;
delete from public.reflections;
delete from public.progress;
delete from public.days;

-- Ada and Bola want reminders; Bola has done Day 1. Cy doesn't want them. Dee wants them but never
-- confirmed her email. Ada, Bola and Fola (the facilitator) share a pod; Dee is in it too, unconfirmed.
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  ('a4000000-0000-0000-0000-000000000001', 'ada@emails.test', now(), '{"display_name": "Ada Obi", "segment": "undergrad", "reminder_email": true}'),
  ('b4000000-0000-0000-0000-000000000002', 'bola@emails.test', now(), '{"display_name": "Bola", "segment": "undergrad", "reminder_email": true}'),
  ('c4000000-0000-0000-0000-000000000003', 'cy@emails.test', now(), '{"display_name": "Cy", "segment": "undergrad"}'),
  ('d4000000-0000-0000-0000-000000000004', 'dee@emails.test', null, '{"display_name": "Dee", "segment": "undergrad", "reminder_email": true}'),
  ('f4000000-0000-0000-0000-000000000006', 'fola@emails.test', now(), '{"display_name": "Fola", "segment": "undergrad"}');

insert into public.days (day_number, module_number, kind, title, introduction, scripture_ref, body_md,
  reflection_prompts, practical_action, action_dimension, pod_prompt, est_minutes, publish_at, status)
values
  (1, 1, 'intro', 'Day one', 'Intro', 'Acts 1:3', 'Body', '{"Prompt"}', 'Act', 'character', 'Pod?', 11,
   '2026-11-13 23:00+00', 'published'),
  (2, 1, 'developmental', 'Day two', 'Intro', 'Ref', 'Body', '{"Prompt"}', 'Act', 'career', 'Pod?', 12,
   '2026-11-14 23:00+00', 'published'),
  (3, 1, 'developmental', 'Day three', 'Intro', 'Ref', 'Body', '{"Prompt"}', 'Act', 'career', 'Pod?', 12,
   '2026-11-15 23:00+00', 'draft');

insert into public.progress (user_id, day_number) values ('b4000000-0000-0000-0000-000000000002', 1);

insert into public.pods (id, name, segment) values ('a4d00000-0000-0000-0000-00000000000a', 'Cedar', 'undergrad');
insert into public.pod_members (pod_id, user_id, is_facilitator) values
  ('a4d00000-0000-0000-0000-00000000000a', 'f4000000-0000-0000-0000-000000000006', true),
  ('a4d00000-0000-0000-0000-00000000000a', 'a4000000-0000-0000-0000-000000000001', false),
  ('a4d00000-0000-0000-0000-00000000000a', 'b4000000-0000-0000-0000-000000000002', false),
  ('a4d00000-0000-0000-0000-00000000000a', 'd4000000-0000-0000-0000-000000000004', false);

-- Signed-in people can't claim emails -----------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "a4000000-0000-0000-0000-000000000001", "role": "authenticated"}', true);

select throws_ok('select * from public.claim_daily_reminders()', '42501', null, 'participants cannot claim reminders');
select throws_ok('select * from public.claim_welcome_emails()', '42501', null, 'participants cannot claim welcome emails');

-- The edge functions (service role) -------------------------------------------------------------------

reset role;
set local role service_role;

select results_eq(
  $$ select email, day_number, title, est_minutes from public.claim_daily_reminders('2026-11-14 06:30+01') $$,
  $$ values ('ada@emails.test', 1, 'Day one', 11) $$,
  'on Day 1 only Ada is reminded: Bola is done, Cy said no, Dee never confirmed her email'
);

select is_empty(
  $$ select * from public.claim_daily_reminders('2026-11-14 09:00+01') $$,
  'nobody is reminded twice on the same day'
);

select is_empty(
  $$ select * from public.claim_daily_reminders('2026-11-13 23:30+00') $$,
  'Lagos dates, not UTC: 00:30 on 14 Nov in Lagos is Day 1, already sent'
);

select results_eq(
  $$ select email from public.claim_daily_reminders('2026-11-15 06:30+01') order by email $$,
  array['ada@emails.test', 'bola@emails.test'],
  'the next day, everyone who wants it and hasn''t done that day'
);

select is_empty(
  $$ select * from public.claim_daily_reminders('2026-11-16 06:30+01') $$,
  'no reminder when today''s day isn''t published'
);

select is_empty(
  $$ select * from public.claim_daily_reminders('2026-11-10 06:30+01') $$,
  'no reminders before Day 1'
);

select is_empty(
  $$ select * from public.claim_daily_reminders('2026-12-26 06:30+01') $$,
  'no reminders on waiting days'
);

select results_eq(
  $$ select email, pod_name, is_facilitator, pod_mates from public.claim_welcome_emails() order by email $$,
  $$ values
       ('ada@emails.test', 'Cedar', false, array['Fola', 'Bola', 'Dee']),
       ('bola@emails.test', 'Cedar', false, array['Fola', 'Ada Obi', 'Dee']),
       ('fola@emails.test', 'Cedar', true, array['Ada Obi', 'Bola', 'Dee']) $$,
  'everyone confirmed in a pod is welcomed once, with the others in their pod, facilitator first'
);

select is_empty('select * from public.claim_welcome_emails()', 'nobody is welcomed twice');

-- Unsubscribing, signed out ---------------------------------------------------------------------------

reset role;
select set_config('test.ada_token',
  (select unsubscribe_token::text from public.profiles where id = 'a4000000-0000-0000-0000-000000000001'), true);
set local role anon;
select set_config('request.jwt.claims', '', true);

select is(
  public.unsubscribe_reminders(current_setting('test.ada_token')::uuid),
  true,
  'the link in the email unsubscribes without signing in'
);

select is(public.unsubscribe_reminders(gen_random_uuid()), false, 'an unknown token changes nothing');

reset role;

select results_eq(
  $$ select email from public.profiles where reminder_email order by email $$,
  array['bola@emails.test', 'dee@emails.test'],
  'only the person who unsubscribed stops getting reminders'
);

select * from finish();
rollback;
