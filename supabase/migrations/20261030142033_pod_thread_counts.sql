-- How many messages each day's thread in my pod has, for the pod screen's Earlier tab. A few dozen counts
-- instead of every message, which matters on weak data. Runs as the caller (security invoker), so the
-- messages select policy decides what's counted.
create function public.pod_thread_counts()
returns table (day_number int, messages int)
language sql
stable
set search_path = ''
as $$
  select m.day_number, count(*)::int
  from public.messages m
  where m.pod_id = public.my_pod_id() and m.day_number is not null
  group by m.day_number
  order by m.day_number;
$$;

revoke execute on function public.pod_thread_counts() from public, anon;
grant execute on function public.pod_thread_counts() to authenticated;
