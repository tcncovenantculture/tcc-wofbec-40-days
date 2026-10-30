-- RLS for baseline_responses (PLAN.md 3.4). Run with `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email, raw_user_meta_data) values
  ('a3000000-0000-0000-0000-000000000001', 'ada@baseline.test', '{"display_name": "Ada", "segment": "undergrad"}'),
  ('b3000000-0000-0000-0000-000000000002', 'bola@baseline.test', '{"display_name": "Bola", "segment": "undergrad"}'),
  ('d3000000-0000-0000-0000-000000000004', 'mo@baseline.test', '{"display_name": "Mo", "segment": "early_career"}');
update public.profiles set role = 'moderator' where id = 'd3000000-0000-0000-0000-000000000004';

insert into public.baseline_responses (user_id, phase, career, character, community, note)
values ('b3000000-0000-0000-0000-000000000002', 'start', 2, 3, 4, 'Bola''s note');

select is(
  (select rowsecurity from pg_tables where schemaname = 'public' and tablename = 'baseline_responses'),
  true,
  'baseline_responses has RLS on'
);

-- As Ada -----------------------------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "a3000000-0000-0000-0000-000000000001", "role": "authenticated"}', true);

select lives_ok(
  $$ insert into public.baseline_responses (phase, career, community) values ('start', 4, 5) $$,
  'a participant can answer some questions and skip others'
);

select results_eq(
  $$ select career, character, community, note from public.baseline_responses $$,
  $$ values (4, null::int, 5, null::text) $$,
  'a participant reads only their own answers'
);

select throws_ok(
  $$ insert into public.baseline_responses (phase, career) values ('start', 3) $$,
  '23505',
  null,
  'each phase is answered once'
);

select throws_ok(
  $$ insert into public.baseline_responses (phase, career) values ('end', 6) $$,
  '23514',
  null,
  'answers are on a 1 to 5 scale'
);

select throws_ok(
  $$ insert into public.baseline_responses (user_id, phase, career)
     values ('b3000000-0000-0000-0000-000000000002', 'end', 3) $$,
  '42501',
  null,
  'nobody can answer for someone else'
);

select throws_ok(
  $$ update public.baseline_responses set career = 1 $$,
  '42501',
  null,
  'answers cannot be changed from the app'
);

-- As Mo, a moderator -----------------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub": "d3000000-0000-0000-0000-000000000004", "role": "authenticated"}', true);

select is_empty('select 1 from public.baseline_responses', 'moderators cannot read anyone''s answers');

-- Signed out ------------------------------------------------------------------------------------------

reset role;
set local role anon;
select set_config('request.jwt.claims', '', true);

select throws_ok(
  $$ insert into public.baseline_responses (phase, career) values ('start', 3) $$,
  '42501',
  null,
  'signed-out visitors cannot answer'
);

-- Deleting an account takes the answers with it --------------------------------------------------------

reset role;
delete from auth.users where id = 'b3000000-0000-0000-0000-000000000002';

select is_empty(
  $$ select 1 from public.baseline_responses where user_id = 'b3000000-0000-0000-0000-000000000002' $$,
  'answers go when the account is deleted'
);

select * from finish();
rollback;
