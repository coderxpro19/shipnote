-- Shipnote initial schema
-- Run in the Supabase SQL editor (or via the Supabase CLI).

create extension if not exists "pgcrypto";

-- Projects: a GitHub repo connected by a user
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  github_repo text not null,          -- "owner/repo"
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

-- Releases: AI-written notes for a batch of changes
create table public.releases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  raw_changes jsonb not null default '[]'::jsonb,  -- source PRs
  notes_md text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now()
);

-- Subscribers: people who receive emails (double opt-in)
create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  email text not null,
  confirmed boolean not null default false,
  token uuid not null default gen_random_uuid(),   -- confirm/unsubscribe link
  created_at timestamptz not null default now(),
  unique (project_id, email)
);

create index on public.projects (owner_id);
create index on public.releases (project_id);
create index on public.subscribers (project_id);

-- Row Level Security
alter table public.projects enable row level security;
alter table public.releases enable row level security;
alter table public.subscribers enable row level security;

-- Projects: owners manage their own; anyone can read public ones
create policy "owners manage own projects"
  on public.projects for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "public projects are readable"
  on public.projects for select
  using (is_public);

-- Releases: owners manage; anyone can read published releases of public projects
create policy "owners manage own releases"
  on public.releases for all
  using (exists (
    select 1 from public.projects p
    where p.id = releases.project_id and p.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.projects p
    where p.id = releases.project_id and p.owner_id = auth.uid()
  ));

create policy "published releases are public"
  on public.releases for select
  using (
    status = 'published' and exists (
      select 1 from public.projects p
      where p.id = releases.project_id and p.is_public
    )
  );

-- Subscribers: owners can view their project's subscribers.
-- Inserts and confirmations happen only through the Worker (service role),
-- which bypasses RLS, so no public insert policy on purpose.
create policy "owners view own subscribers"
  on public.subscribers for select
  using (exists (
    select 1 from public.projects p
    where p.id = subscribers.project_id and p.owner_id = auth.uid()
  ));
