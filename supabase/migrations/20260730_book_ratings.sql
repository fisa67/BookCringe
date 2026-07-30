-- 20260730_book_ratings.sql
--
-- Avaliações da comunidade do Crew Literário. Uma avaliação é vinculada a
-- um assinante confirmado e a um livro; não representa a avaliação editorial
-- interna em `book_readings`.

create table if not exists public.book_ratings (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  subscriber_id uuid not null references public.newsletter_subscribers(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_ratings_subscriber_book_key unique (subscriber_id, book_id)
);

create index if not exists book_ratings_book_updated_idx
  on public.book_ratings (book_id, updated_at desc);

create index if not exists book_ratings_subscriber_idx
  on public.book_ratings (subscriber_id);

alter table public.book_ratings enable row level security;

drop policy if exists "Service role access to book_ratings"
  on public.book_ratings;
create policy "Service role access to book_ratings"
  on public.book_ratings
  for all
  to service_role
  using (true)
  with check (true);

-- Não há acesso público direto: a página pública recebe somente média, total
-- e comentários sem qualquer identificador ou dado do assinante.
