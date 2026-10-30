-- The media bucket: anyone can read files by URL, nobody can upload from the app. Run with `supabase test db`.
begin;
create extension if not exists pgtap with schema extensions;

select plan(3);

select is(
  (select public from storage.buckets where id = 'media'),
  true,
  'the media bucket is public, so the day screen can load files by URL'
);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "a0000000-0000-0000-0000-000000000001", "role": "authenticated"}', true);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('media', 'module-1/sneaky.webp') $$,
  '42501',
  null,
  'signed-in people cannot upload media'
);

reset role;
set local role anon;
select set_config('request.jwt.claims', '', true);

select throws_ok(
  $$ insert into storage.objects (bucket_id, name) values ('media', 'module-1/sneaky.webp') $$,
  '42501',
  null,
  'signed-out visitors cannot upload media'
);

select * from finish();
rollback;
