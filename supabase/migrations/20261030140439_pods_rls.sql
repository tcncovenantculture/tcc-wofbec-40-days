-- Row-level security for pods, pod membership and messages.
--
-- Same approach as Phase 1: revoke everything, then grant back only what the app uses. Checks that need to
-- see other people's rows (membership, the roster, totals, hiding) go through security definer functions
-- with an empty search_path.

revoke all on public.pods, public.pod_members, public.messages from anon, authenticated;

-- Helpers -----------------------------------------------------------------------------------------------

-- The signed-in person's pod, or null before pods are formed. One pod per person (unique user_id).
create function public.my_pod_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select pod_id from public.pod_members where user_id = (select auth.uid());
$$;

create function public.is_pod_member(pod uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.pod_members where pod_id = pod and user_id = (select auth.uid())
  );
$$;

create function public.is_facilitator_of(pod uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.pod_members
    where pod_id = pod and user_id = (select auth.uid()) and is_facilitator
  );
$$;

-- pods --------------------------------------------------------------------------------------------------

grant select on public.pods to authenticated;

create policy "Members and moderators read a pod"
on public.pods for select
to authenticated
using (public.is_pod_member(id) or (select public.is_role('moderator')));

-- The facilitator adds, changes or clears the pod's WhatsApp invite link. Nothing else about a pod can be
-- changed from the app. The table's check constraint rejects anything that isn't a WhatsApp group link.
create function public.set_whatsapp_link(link text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  pod uuid := public.my_pod_id();
begin
  if pod is null or not public.is_facilitator_of(pod) then
    raise exception 'Only the pod facilitator can set the WhatsApp link' using errcode = '42501';
  end if;
  update public.pods set whatsapp_invite_link = nullif(btrim(link), '') where id = pod;
end;
$$;

-- pod_members -------------------------------------------------------------------------------------------

grant select on public.pod_members to authenticated;

create policy "Read my pod's members"
on public.pod_members for select
to authenticated
using (pod_id = (select public.my_pod_id()));

-- Who's in my pod: display name, avatar and the facilitator flag, never email, phone, segment or role.
-- A function rather than a view because it reads other people's profiles, and Supabase flags security
-- definer views. user_id is included so the app can put names on messages.
create function public.pod_roster()
returns table (user_id uuid, display_name text, avatar jsonb, is_facilitator boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select pm.user_id, p.display_name, p.avatar, pm.is_facilitator
  from public.pod_members pm
  join public.profiles p on p.id = pm.user_id
  where pm.pod_id = public.my_pod_id()
  order by pm.is_facilitator desc, p.display_name;
$$;

-- How many people are in my pod and how many have completed a given day: counts only, never names or ids
-- (no leaderboards). The app passes today's day number from src/lib/programme.ts, so ?asOf works.
create function public.pod_today_totals(for_day int)
returns table (members int, completed int)
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int, count(p.user_id)::int
  from public.pod_members pm
  left join public.progress p on p.user_id = pm.user_id and p.day_number = for_day
  where pm.pod_id = public.my_pod_id();
$$;

-- messages ----------------------------------------------------------------------------------------------

-- The body isn't granted: the app reads messages through the pod_messages view below, which hides the
-- body of a hidden message. Nor is hidden_by, so members can't see who hid what.
grant select (id, pod_id, day_number, author_id, kind, hidden_at, created_at) on public.messages to authenticated;
-- author_id isn't insertable: it defaults to the signed-in person, so nobody can post as someone else.
-- id is, so the app can retry a send without posting twice. No update or delete from the app.
grant insert (id, pod_id, day_number, kind, body) on public.messages to authenticated;

create policy "Read my pod's messages and announcements; moderators read all"
on public.messages for select
to authenticated
using (
  pod_id is null
  or public.is_pod_member(pod_id)
  or (select public.is_role('moderator'))
);

-- Members post messages and shared reflections in their own pod; only the facilitator posts a pinned
-- message. Day threads open with the day, like progress and reflections.
create policy "Members post in their own pod"
on public.messages for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and public.is_pod_member(pod_id)
  and (kind in ('message', 'shared_reflection') or (kind = 'pinned' and public.is_facilitator_of(pod_id)))
  and (day_number is null or exists (select 1 from public.days d where d.day_number = messages.day_number))
);

-- Announcements (pod_id null, enforced by a table check) go to every pod.
create policy "Moderators post announcements"
on public.messages for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and kind = 'announcement'
  and (select public.is_role('moderator'))
);

-- A message's body as the reader may see it: "Message hidden" once it's hidden, except to moderators.
-- Null when the reader can't see the message at all.
create function public.message_body(message_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when m.hidden_at is not null and not public.is_role('moderator') then 'Message hidden'
    else m.body
  end
  from public.messages m
  where m.id = message_id
    and (m.pod_id is null or public.is_pod_member(m.pod_id) or public.is_role('moderator'));
$$;

-- What the pod screen reads. security_invoker, so the select policy above decides which rows come back.
create view public.pod_messages
with (security_invoker = true)
as
select
  m.id,
  m.pod_id,
  m.day_number,
  m.author_id,
  m.kind,
  public.message_body(m.id) as body,
  m.hidden_at is not null as hidden,
  m.created_at
from public.messages m;

revoke all on public.pod_messages from anon, authenticated;
grant select on public.pod_messages to authenticated;

-- Hide a message: the facilitator of its pod, or a moderator. It stays in the thread as "Message hidden".
create function public.hide_message(message_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_pod uuid;
begin
  select m.pod_id into target_pod from public.messages m where m.id = message_id;
  if not found or not (
    public.is_role('moderator') or (target_pod is not null and public.is_facilitator_of(target_pod))
  ) then
    raise exception 'Only the pod facilitator or a moderator can hide this message' using errcode = '42501';
  end if;
  update public.messages
  set hidden_at = coalesce(hidden_at, now()), hidden_by = coalesce(hidden_by, (select auth.uid()))
  where id = message_id;
end;
$$;

-- Function access: signed-in people only ---------------------------------------------------------------

revoke execute on function
  public.my_pod_id(),
  public.is_pod_member(uuid),
  public.is_facilitator_of(uuid),
  public.set_whatsapp_link(text),
  public.pod_roster(),
  public.pod_today_totals(int),
  public.message_body(uuid),
  public.hide_message(uuid)
from public, anon;

grant execute on function
  public.my_pod_id(),
  public.is_pod_member(uuid),
  public.is_facilitator_of(uuid),
  public.set_whatsapp_link(text),
  public.pod_roster(),
  public.pod_today_totals(int),
  public.message_body(uuid),
  public.hide_message(uuid)
to authenticated;

-- Realtime ----------------------------------------------------------------------------------------------
-- Live updates on the pod screen. Realtime applies the select policy to each change and sends only the
-- granted columns, so a body never goes out this way; the app refetches through pod_messages.
alter publication supabase_realtime add table public.messages;
