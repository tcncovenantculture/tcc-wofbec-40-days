-- Baseline questions (PLAN.md 3.4): three optional 1-to-5 answers (career, character, community) and an
-- optional note, once at the start and once after Day 40 (Phase 6). Every answer is optional, so any of them
-- can be null. Own rows only; the project team reads them in Studio, as totals.

create type public.baseline_phase as enum ('start', 'end');

create table public.baseline_responses (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  phase public.baseline_phase not null,
  career int check (career between 1 and 5),
  character int check (character between 1 and 5),
  community int check (community between 1 and 5),
  note text check (note is null or char_length(note) between 1 and 1000),
  created_at timestamptz not null default now(),
  primary key (user_id, phase)
);

alter table public.baseline_responses enable row level security;

revoke all on public.baseline_responses from anon, authenticated;

-- Answered once per phase: no updates or deletes from the app. user_id isn't insertable (it defaults to the
-- signed-in person), so nobody can answer for someone else.
grant select on public.baseline_responses to authenticated;
grant insert (phase, career, character, community, note) on public.baseline_responses to authenticated;

create policy "Read my own baseline answers"
on public.baseline_responses for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Answer for myself"
on public.baseline_responses for insert
to authenticated
with check (user_id = (select auth.uid()));
