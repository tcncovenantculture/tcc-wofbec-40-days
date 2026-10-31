-- Writes the pods planned by scripts/form-pods.ts (PLAN.md 4.2) in one transaction: either every pod and
-- member is written, or nothing is. Only the service role (the script) can call it.
--
--   new_pods: [{ "name": text, "segment": segment, "facilitator": uuid, "members": [uuid, ...] }, ...]
--   joiners:  [{ "pod_id": uuid, "user_id": uuid }, ...]   -- late sign-ups joining existing pods
--
-- The script plans; this checks the rules again so a bad plan can't get in: pods of 4 to 6, the facilitator
-- is a member, everyone is in the pod's segment, nobody is in two pods (the table's unique user_id), and a
-- late joiner never takes a pod past 6.

create function public.form_pods(new_pods jsonb default '[]', joiners jsonb default '[]')
returns void
language plpgsql
set search_path = ''
as $$
declare
  pod jsonb;
  new_id uuid;
  size int;
  touched uuid[] := '{}';
begin
  for pod in select value from jsonb_array_elements(new_pods) loop
    size := jsonb_array_length(pod -> 'members');
    if size not between 4 and 6 then
      raise exception 'Pod "%" has % members; pods have 4 to 6', pod ->> 'name', size using errcode = '22023';
    end if;
    if not (pod -> 'members') ? (pod ->> 'facilitator') then
      raise exception 'The facilitator of "%" must be one of its members', pod ->> 'name' using errcode = '22023';
    end if;

    insert into public.pods (name, segment)
    values (pod ->> 'name', (pod ->> 'segment')::public.segment)
    returning id into new_id;

    insert into public.pod_members (pod_id, user_id, is_facilitator)
    select new_id, member::uuid, member = pod ->> 'facilitator'
    from jsonb_array_elements_text(pod -> 'members') as member;

    touched := touched || new_id;
  end loop;

  insert into public.pod_members (pod_id, user_id)
  select (j ->> 'pod_id')::uuid, (j ->> 'user_id')::uuid
  from jsonb_array_elements(joiners) as j;

  touched := touched || array(select (j ->> 'pod_id')::uuid from jsonb_array_elements(joiners) as j);

  if exists (
    select 1
    from public.pod_members pm
    join public.pods p on p.id = pm.pod_id
    join public.profiles pr on pr.id = pm.user_id
    where pm.pod_id = any (touched) and pr.segment <> p.segment
  ) then
    raise exception 'Everyone in a pod must be from the pod''s segment' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.pod_members pm where pm.pod_id = any (touched) group by pm.pod_id having count(*) > 6
  ) then
    raise exception 'A pod can''t have more than 6 members' using errcode = '22023';
  end if;
end;
$$;

revoke execute on function public.form_pods(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.form_pods(jsonb, jsonb) to service_role;
