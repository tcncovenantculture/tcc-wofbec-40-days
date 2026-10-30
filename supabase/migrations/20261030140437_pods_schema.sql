-- Phase 2 tables: pods, pod membership and pod messages.
-- RLS is switched on here, before any policy exists. Policies, helpers and RPCs live in the next migration.

create type public.message_kind as enum ('message', 'shared_reflection', 'pinned', 'announcement');

-- About five people from the same segment (Mark 2:1 to 4), formed by scripts/form-pods.ts.
create table public.pods (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  segment public.segment not null,
  avatar_seed text not null default gen_random_uuid()::text,
  whatsapp_invite_link text check (
    whatsapp_invite_link is null or whatsapp_invite_link like 'https://chat.whatsapp.com/%'
  ),
  created_at timestamptz not null default now()
);

create table public.pod_members (
  pod_id uuid not null references public.pods on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  is_facilitator boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (pod_id, user_id),
  unique (user_id) -- one pod per person
);

-- One facilitator per pod.
create unique index pod_members_one_facilitator on public.pod_members (pod_id) where is_facilitator;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid references public.pods on delete cascade, -- null for an announcement to all pods
  day_number int references public.days, -- null for general chat
  -- Null once the author deletes their account; the app shows "Former member".
  author_id uuid default auth.uid() references public.profiles on delete set null,
  kind public.message_kind not null default 'message',
  body text not null check (char_length(body) between 1 and 2000),
  hidden_at timestamptz,
  hidden_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  -- Announcements go to every pod; everything else belongs to one pod.
  check ((kind = 'announcement') = (pod_id is null)),
  -- A shared reflection always sits in its day's thread.
  check (kind <> 'shared_reflection' or day_number is not null)
);

-- Threads load newest first, 30 at a time, by pod and day (null day = general chat).
create index messages_thread on public.messages (pod_id, day_number, created_at desc, id desc);

alter table public.pods enable row level security;
alter table public.pod_members enable row level security;
alter table public.messages enable row level security;
