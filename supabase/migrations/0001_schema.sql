-- ThatImault Studio : schéma de base de données
create extension if not exists pgcrypto;

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  features text[] not null default '{}',
  category text not null default '',
  technologies text[] not null default '{}',
  cover_image text,
  gallery text[] not null default '{}',
  external_url text check (external_url is null or external_url ~ '^https?://'),
  status text not null default 'draft' check (status in ('draft','published')),
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_public_idx on public.projects (status, display_order);
create trigger projects_updated before update on public.projects for each row execute function public.set_updated_at();

create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '',
  capabilities text[] not null default '{}',
  category text not null default '',
  icon text,
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index services_public_idx on public.services (is_active, display_order);
create trigger services_updated before update on public.services for each row execute function public.set_updated_at();

-- Avis : les e-mails privés sont dans une table séparée, jamais exposée au public.
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  rating smallint not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 10 and 2000),
  public_name text not null check (char_length(public_name) between 2 and 60),
  project_id uuid references public.projects(id) on delete set null,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified')),
  moderation_status text not null default 'pending' check (moderation_status in ('pending','published','rejected','hidden','flagged')),
  created_at timestamptz not null default now(),
  published_at timestamptz
);
create index reviews_public_idx on public.reviews (moderation_status, published_at desc);

create table public.review_contacts (
  review_id uuid primary key references public.reviews(id) on delete cascade,
  private_email text not null
);

create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  service_category text not null,
  project_title text not null check (char_length(project_title) between 3 and 160),
  description text not null check (char_length(description) between 20 and 5000),
  budget_range text,
  desired_deadline text,
  reference_links text[] not null default '{}',
  status text not null default 'new' check (status in ('new','in_review','replied','accepted','declined','done','archived')),
  internal_notes text not null default '',
  notified_at timestamptz,
  archive_after date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quote_status_idx on public.quote_requests (status, created_at desc);
create trigger quotes_updated before update on public.quote_requests for each row execute function public.set_updated_at();

create table public.quote_events (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quote_requests(id) on delete cascade,
  kind text not null check (kind in ('note','email_in','email_out','status')),
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index quote_events_idx on public.quote_events (quote_id, created_at);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  message text not null check (char_length(message) between 10 and 5000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

-- Journal minimal pour la limitation de débit (aucune donnée en clair : hash uniquement).
create table public.submission_log (
  id bigserial primary key,
  kind text not null,
  subject_hash text not null,
  created_at timestamptz not null default now()
);
create index submission_log_idx on public.submission_log (kind, subject_hash, created_at);
