-- Creates the profiles row when someone signs up. The sign-up form passes the profile fields as user
-- metadata (signInWithOtp options.data). A sign-up without a name or a valid segment fails here, so
-- there's never an account without a profile. Role is never read from metadata.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, segment, email, whatsapp_number, reminder_email)
  values (
    new.id,
    btrim(new.raw_user_meta_data ->> 'display_name'),
    (new.raw_user_meta_data ->> 'segment')::public.segment,
    new.email,
    nullif(btrim(new.raw_user_meta_data ->> 'whatsapp_number'), ''),
    coalesce((new.raw_user_meta_data ->> 'reminder_email')::boolean, false)
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
