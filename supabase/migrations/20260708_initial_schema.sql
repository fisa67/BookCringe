-- 20260708_initial_schema.sql
create extension if not exists "pgcrypto";

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  author text not null,
  publisher text,
  publication_year int,
  isbn text,
  page_count int,
  format text,
  language text,
  country text,
  genres text[] not null default '{}',
  amazon_url text,
  cover_path text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_readings (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  rating numeric(2,1) check (rating >= 0 and rating <= 5),
  review text,
  started_at date,
  finished_at date,
  status text not null default 'not_started',
  format text,
  favorite boolean not null default false,
  would_recommend boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contents (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  platform text not null check (platform in ('instagram','tiktok','youtube','spotify','podcast','blog')),
  content_type text not null check (content_type in ('reel','short','video','podcast','article','other')),
  url text not null,
  is_featured boolean not null default false,
  published_at timestamptz,
  thumbnail_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookclub_years (
  id uuid primary key default gen_random_uuid(),
  year int not null unique,
  title text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookclub_months (
  id uuid primary key default gen_random_uuid(),
  year_id uuid not null references public.bookclub_years(id) on delete cascade,
  month int not null check (month >= 1 and month <= 12),
  theme text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (year_id, month)
);

create table if not exists public.bookclub_month_books (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references public.bookclub_months(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (month_id, book_id)
);

create table if not exists public.statistics (
  id uuid primary key default gen_random_uuid(),
  year int not null unique,
  annual_goal int not null default 0,
  books_read int not null default 0,
  pages_read int not null default 0,
  hours_read int not null default 0,
  authors_read int not null default 0,
  genres_read int not null default 0,
  countries_read int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  project_name text not null default 'BookCringe',
  slogan text,
  email text,
  instagram_url text,
  tiktok_url text,
  youtube_url text,
  spotify_url text,
  amazon_url text,
  goodreads_url text,
  threads_url text,
  logo_path text,
  favicon_path text,
  annual_goal int not null default 52,
  home_text text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
