-- 20260729_monthly_recommendations.sql
--
-- Histórico editorial permanente da "Recomendação do mês" — até aqui,
-- `book_readings.is_recommendation_of_month` (20260723_book_readings_editorial.sql)
-- só guardava o destaque ATUAL; trocar de livro sobrescrevia o anterior sem
-- deixar rastro de quando cada um começou/terminou. Esta tabela é só um
-- log — `book_readings.is_recommendation_of_month` continua sendo a única
-- fonte de verdade para o destaque atual (página pública, curadoria etc.
-- não mudam nada aqui).
--
-- Colunas:
--   - `book_reading_id`/`book_id`: ambas guardadas (redundante — `book_id`
--     dá pra derivar via join com `book_readings`) para permitir consultas
--     futuras de repetição de livro (ver seção FUTURO abaixo) sem precisar
--     de join.
--   - `started_at`: quando o livro assumiu o destaque.
--   - `ended_at`: quando deixou de ser o destaque; `null` = é o atual.
--
-- Regra "no máximo 1 ativa" (ended_at is null): garantida por um índice
-- único parcial, mesma técnica do índice
-- `book_readings_one_recommendation_of_month` — como o índice cobre uma
-- expressão constante (`true`) só para as linhas com `ended_at is null`,
-- só pode existir 1 linha indexada (= 1 linha ativa) por vez.
-- `monthlyRecommendationService.syncRecommendationHistory` encerra a
-- recomendação ativa (ended_at = now()) ANTES de abrir a próxima, para
-- nunca colidir com esse índice.
--
-- Segurança: mesmo padrão de `newsletter_campaigns` — tabela só usada pelo
-- admin (`/admin/recommendations`, via `supabaseAdminClient`/service_role);
-- sem policy de leitura pública ainda (reservado para a futura página
-- pública de histórico, ver seção FUTURO).
--
-- FUTURO (schema já preparado, nada disso implementado agora):
--   - página pública de histórico de recomendações;
--   - disparo automático de e-mail (Crew Literário) quando a recomendação troca;
--   - relatórios (dias em destaque por livro/autor/gênero);
--   - evitar repetir um livro que já foi recomendação recentemente
--     (consulta por `book_id` + `started_at`, índice já criado abaixo).

create table if not exists public.monthly_recommendations (
  id uuid primary key default gen_random_uuid(),
  book_reading_id uuid not null references public.book_readings(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz null,
  created_at timestamptz not null default now()
);

comment on table public.monthly_recommendations is
  'Histórico editorial da "Recomendação do mês" — 1 linha por período em que um livro ficou em destaque. ended_at null = recomendação atual.';

create unique index if not exists monthly_recommendations_one_active
  on public.monthly_recommendations ((true))
  where ended_at is null;

create index if not exists monthly_recommendations_started_at_idx
  on public.monthly_recommendations (started_at desc);

create index if not exists monthly_recommendations_book_id_idx
  on public.monthly_recommendations (book_id);

alter table public.monthly_recommendations enable row level security;

drop policy if exists "Service role access to monthly_recommendations"
  on public.monthly_recommendations;

create policy "Service role access to monthly_recommendations"
  on public.monthly_recommendations
  for all
  to service_role
  using (true)
  with check (true);

grant select, insert, update
  on table public.monthly_recommendations
  to service_role;
