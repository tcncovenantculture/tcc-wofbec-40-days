-- form_pods(): the one-transaction write behind `pnpm pods:form --commit` (PLAN.md 4.2).
begin;
create extension if not exists pgtap with schema extensions;

select plan(13);

-- Setup, as postgres ----------------------------------------------------------------------------------

delete from public.reports;
delete from public.messages;
delete from public.pod_members;
delete from public.pods;

-- Ten undergraduates (u01 to u10) and one entrepreneur (e01).
insert into auth.users (id, email, raw_user_meta_data)
select
  ('f0000000-0000-0000-0000-0000000000' || lpad(n::text, 2, '0'))::uuid,
  'u' || n || '@pods.test',
  '{"display_name": "U", "segment": "undergrad"}'
from generate_series(1, 10) as n;
insert into auth.users (id, email, raw_user_meta_data) values
  ('fe000000-0000-0000-0000-000000000001', 'e1@pods.test', '{"display_name": "E", "segment": "entrepreneur"}');

-- Signed-in people can't call it ----------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "f0000000-0000-0000-0000-000000000001", "role": "authenticated"}', true);

select throws_ok(
  $$ select public.form_pods('[]', '[]') $$,
  '42501',
  null,
  'participants cannot form pods'
);

reset role;
set local role anon;
select set_config('request.jwt.claims', '', true);

select throws_ok($$ select public.form_pods('[]', '[]') $$, '42501', null, 'signed-out visitors cannot form pods');

-- The script (service role) ---------------------------------------------------------------------------

reset role;
set local role service_role;

select lives_ok(
  $$ select public.form_pods('[
       {"name": "Cedar", "segment": "undergrad", "facilitator": "f0000000-0000-0000-0000-000000000001",
        "members": ["f0000000-0000-0000-0000-000000000001", "f0000000-0000-0000-0000-000000000002",
                    "f0000000-0000-0000-0000-000000000003", "f0000000-0000-0000-0000-000000000004",
                    "f0000000-0000-0000-0000-000000000005"]},
       {"name": "Olive", "segment": "undergrad", "facilitator": "f0000000-0000-0000-0000-000000000009",
        "members": ["f0000000-0000-0000-0000-000000000006", "f0000000-0000-0000-0000-000000000007",
                    "f0000000-0000-0000-0000-000000000008", "f0000000-0000-0000-0000-000000000009"]}
     ]') $$,
  'the script can write planned pods'
);

select results_eq(
  $$ select p.name, count(*)::int, count(*) filter (where pm.is_facilitator)::int
     from public.pods p join public.pod_members pm on pm.pod_id = p.id group by p.name order by p.name $$,
  $$ values ('Cedar', 5, 1), ('Olive', 4, 1) $$,
  'each pod has its members and exactly one facilitator'
);

select is(
  (select pm.is_facilitator from public.pod_members pm where pm.user_id = 'f0000000-0000-0000-0000-000000000009'),
  true,
  'the planned facilitator is the facilitator'
);

select throws_ok(
  $$ select public.form_pods('[{"name": "Tiny", "segment": "undergrad", "facilitator": "f0000000-0000-0000-0000-000000000010",
       "members": ["f0000000-0000-0000-0000-000000000010"]}]') $$,
  '22023',
  null,
  'a pod of fewer than 4 is refused'
);

select throws_ok(
  $$ select public.form_pods('[{"name": "Odd", "segment": "undergrad", "facilitator": "fe000000-0000-0000-0000-000000000001",
       "members": ["f0000000-0000-0000-0000-000000000010", "f0000000-0000-0000-0000-000000000001",
                   "f0000000-0000-0000-0000-000000000002", "f0000000-0000-0000-0000-000000000003"]}]') $$,
  '22023',
  null,
  'the facilitator must be a member'
);

select throws_ok(
  $$ select public.form_pods('[{"name": "Again", "segment": "undergrad", "facilitator": "f0000000-0000-0000-0000-000000000010",
       "members": ["f0000000-0000-0000-0000-000000000010", "f0000000-0000-0000-0000-000000000001",
                   "f0000000-0000-0000-0000-000000000002", "f0000000-0000-0000-0000-000000000003"]}]') $$,
  '23505',
  null,
  'nobody can be put in a second pod'
);

select throws_ok(
  $$ select public.form_pods('[]', ('[{"pod_id": "' || (select id from public.pods where name = 'Olive') ||
       '", "user_id": "fe000000-0000-0000-0000-000000000001"}]')::jsonb) $$,
  '22023',
  null,
  'a late joiner must be in the pod''s segment'
);

select is(
  (select count(*)::int from public.pods where name in ('Tiny', 'Odd', 'Again')),
  0,
  'a refused plan writes nothing'
);

select lives_ok(
  $$ select public.form_pods('[]', ('[{"pod_id": "' || (select id from public.pods where name = 'Olive') ||
       '", "user_id": "f0000000-0000-0000-0000-000000000010"}]')::jsonb) $$,
  'a late sign-up can join a pod in their segment'
);

-- Cedar has 5; make room for a test of the limit by freeing two people from Olive.
delete from public.pod_members where user_id in ('f0000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000007');

select throws_ok(
  $$ select public.form_pods('[]', ('[
       {"pod_id": "' || (select id from public.pods where name = 'Cedar') || '", "user_id": "f0000000-0000-0000-0000-000000000006"},
       {"pod_id": "' || (select id from public.pods where name = 'Cedar') || '", "user_id": "f0000000-0000-0000-0000-000000000007"}
     ]')::jsonb) $$,
  '22023',
  null,
  'late joiners never take a pod past 6'
);

select is(
  (select count(*)::int from public.pod_members where pod_id = (select id from public.pods where name = 'Cedar')),
  5,
  'and nothing is written when they would'
);

select * from finish();
rollback;
