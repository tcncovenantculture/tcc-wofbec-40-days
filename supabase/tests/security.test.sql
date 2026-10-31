-- Database-wide security checks (PLAN.md Phase 5, security pass). These look at every table, view, function
-- and bucket, so a new migration that forgets a rule fails here. Run with `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(6);

select is_empty(
  $$ select tablename from pg_tables where schemaname = 'public' and not rowsecurity $$,
  'every table in public has row-level security on (CLAUDE.md rule 4)'
);

select is_empty(
  $$ select table_name, privilege_type from information_schema.role_table_grants
     where table_schema = 'public' and grantee = 'anon' $$,
  'signed-out visitors have no privileges on any table or view'
);

select is_empty(
  $$ select c.relname from pg_class c
     where c.relnamespace = 'public'::regnamespace and c.relkind = 'v'
       and not coalesce(c.reloptions @> array['security_invoker=true'], false) $$,
  'every view runs as the reader (security_invoker), so RLS still applies'
);

-- Trigger functions can't be called directly, so they're left out.
select results_eq(
  $$ select p.proname::text collate "default" from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and p.prorettype <> 'trigger'::regtype
       and has_function_privilege('anon', p.oid, 'execute')
     order by p.proname $$,
  array['unsubscribe_reminders'],
  'the only function signed-out visitors can call is the unsubscribe link'
);

select results_eq(
  $$ select p.proname::text collate "default" from pg_proc p
     where p.pronamespace = 'public'::regnamespace
       and p.prosecdef
       and not exists (
         select 1 from unnest(coalesce(p.proconfig, '{}')) as setting where setting like 'search_path=%'
       ) $$,
  array[]::text[],
  'every security definer function fixes its search_path'
);

select results_eq(
  'select id from storage.buckets where public order by id',
  array['media'],
  'media is the only public storage bucket'
);

select * from finish();
rollback;
