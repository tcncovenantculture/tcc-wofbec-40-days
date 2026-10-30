-- Core tables for Phase 1: profiles, days, progress, reflections.
-- RLS is switched on for every table here, before any policy exists, so a table is never readable by
-- accident. Policies live in the next migration.

create type public.segment as enum ('undergrad', 'early_career', 'experienced_professional', 'entrepreneur');
create type public.user_role as enum ('participant', 'moderator', 'reviewer');
create type public.day_kind as enum ('intro', 'developmental', 'synthesis');
create type public.dimension as enum ('career', 'character', 'community');

-- Keeps updated_at current on every update.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  segment public.segment not null,
  email text not null,
  -- Optional contact in E.164 form, e.g. +2348031234567
  whatsapp_number text check (whatsapp_number is null or whatsapp_number ~ '^\+[1-9][0-9]{6,14}$'),
  role public.user_role not null default 'participant',
  avatar jsonb, -- DiceBear options
  reminder_email boolean not null default false, -- consent, off unless ticked
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table public.days (
  day_number int primary key check (day_number between 1 and 40),
  module_number int not null check (module_number between 1 and 5),
  kind public.day_kind not null,
  title text not null,
  introduction text not null,
  scripture_ref text not null,
  scripture_text text,
  scripture_url text,
  body_md text not null,
  -- [{type: 'image'|'audio'|'video', url, alt?, caption?, transcript?, ai_generated}]
  media jsonb not null default '[]' check (jsonb_typeof(media) = 'array'),
  reflection_prompts text[] not null check (cardinality(reflection_prompts) between 1 and 3),
  practical_action text not null,
  action_dimension public.dimension not null,
  pod_prompt text not null,
  est_minutes int not null check (est_minutes between 5 and 20),
  publish_at timestamptz not null,
  status text not null check (status in ('draft', 'published')),
  updated_at timestamptz not null default now(),
  -- Eight days per curriculum module: days 1 to 8 are module 1, 9 to 16 module 2, and so on.
  check (module_number = (day_number - 1) / 8 + 1)
);

create table public.progress (
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  day_number int not null references public.days,
  completed_at timestamptz not null default now(),
  primary key (user_id, day_number)
);

create table public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  day_number int not null references public.days,
  prompt_index int not null check (prompt_index between 0 and 2),
  body text not null check (char_length(body) <= 5000),
  updated_at timestamptz not null default now(),
  unique (user_id, day_number, prompt_index)
);

create trigger days_set_updated_at
before update on public.days
for each row execute function public.set_updated_at();

create trigger reflections_set_updated_at
before update on public.reflections
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.days enable row level security;
alter table public.progress enable row level security;
alter table public.reflections enable row level security;
