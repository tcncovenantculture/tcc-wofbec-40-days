-- Row-level security for the Phase 1 tables.
--
-- Supabase grants every privilege on new public tables to anon and authenticated. Start from nothing and
-- grant back only what the app uses, so a missing policy can never be the only thing standing in the way.

revoke all on public.profiles, public.days, public.progress, public.reflections from anon, authenticated;

grant select on public.profiles, public.days to authenticated;
-- Column-level grant: people can edit these fields of their own profile, and never role, email, segment
-- (pods are formed by segment) or the unsubscribe token.
grant update (display_name, whatsapp_number, avatar, reminder_email) on public.profiles to authenticated;
grant select, insert, update, delete on public.progress, public.reflections to authenticated;

-- True when the signed-in person has role r. Security definer so policies can check the role without
-- the caller needing to read profiles.
create function public.is_role(r public.user_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = r
  );
$$;

revoke execute on function public.is_role(public.user_role) from public, anon;
grant execute on function public.is_role(public.user_role) to authenticated;

-- profiles ----------------------------------------------------------------------------------------------

create policy "Read own profile"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

create policy "Update own profile"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Moderators see the display name (and nothing else) of anyone, for handling reports.
create function public.moderator_display_names(user_ids uuid[])
returns table (id uuid, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name
  from public.profiles p
  where p.id = any (user_ids)
    and public.is_role('moderator');
$$;

revoke execute on function public.moderator_display_names(uuid[]) from public, anon;
grant execute on function public.moderator_display_names(uuid[]) to authenticated;

-- days --------------------------------------------------------------------------------------------------
-- Read-only from the client. Content is written by scripts/load-content.ts with the service role.

create policy "Read unlocked days; reviewers and moderators read all"
on public.days for select
to authenticated
using (
  (status = 'published' and publish_at <= now())
  or (select public.is_role('reviewer'))
  or (select public.is_role('moderator'))
);

-- progress and reflections ------------------------------------------------------------------------------
-- Owner only, for every operation. Writes are also limited to days the person can see, so nobody can
-- complete or answer a day before it unlocks. The subquery on days runs under the days policy above.

create policy "Own progress, on days I can see"
on public.progress for all
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.days d where d.day_number = progress.day_number)
);

create policy "Own reflections, on days I can see"
on public.reflections for all
to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (select 1 from public.days d where d.day_number = reflections.day_number)
);
