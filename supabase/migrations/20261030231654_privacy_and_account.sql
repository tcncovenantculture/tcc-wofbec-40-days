-- Privacy and consent (PLAN.md 3.2): a record of when someone accepted the privacy notice, and a way for
-- people to delete their own account.

-- When the person ticked "I've read how my information is used and kept" on the sign-up form. Null for
-- accounts made before this column existed (the form has always required the tick).
alter table public.profiles add column privacy_accepted_at timestamptz;

-- Same as before, plus the privacy record. The form sends privacy_accepted: true; the time is the server's.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id, display_name, segment, email, whatsapp_number, reminder_email, privacy_accepted_at
  )
  values (
    new.id,
    btrim(new.raw_user_meta_data ->> 'display_name'),
    (new.raw_user_meta_data ->> 'segment')::public.segment,
    new.email,
    nullif(btrim(new.raw_user_meta_data ->> 'whatsapp_number'), ''),
    coalesce((new.raw_user_meta_data ->> 'reminder_email')::boolean, false),
    case when coalesce((new.raw_user_meta_data ->> 'privacy_accepted')::boolean, false) then now() end
  );
  return new;
end;
$$;

-- Deletes the signed-in person's account, straight away and for good. Removing the auth user cascades to
-- the profile and from there to progress, reflections and pod membership. Messages they posted stay in
-- their pod's threads with no author (the app shows "Former member"), and so do reports they made, with no
-- reporter, so moderators can still act on them.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'Sign in to delete your account' using errcode = '42501';
  end if;
  delete from auth.users where id = me;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
