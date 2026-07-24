-- 20260724_newsletter_subscribers.sql
--
-- Fase 2A do BookCringe: captação de e-mails para o "Clube dos Leitores
-- BookCringe" — sem avaliações da comunidade nesta fase (poucos usuários
-- recorrentes ainda); o foco agora é construir uma base própria de leitores.
--
-- Tabela nova (não é extensão de nenhuma existente — não há entidade
-- parecida no schema atual):
--   - `email`: obrigatório, único (case-insensitive via índice em
--     `lower(email)`, para "Nome@x.com" e "nome@x.com" contarem como o
--     mesmo inscrito).
--   - `source`: de onde veio a inscrição — home, recommendations, book,
--     contents (mesmas 4 páginas com formulário nesta fase).
--
-- Segurança: diferente das demais tabelas do CMS (leitura pública +
-- escrita só via service_role, ver `20260710_rls_hardening.sql`), esta
-- tabela guarda e-mails (PII) e não tem nenhum caso de uso de leitura
-- pública — por isso NÃO recebe policy de select para anon/authenticated.
-- Toda leitura/escrita (formulários públicos e admin) passa por
-- `subscriberService.ts`, que usa `supabaseAdminClient` (service_role).

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null check (source in ('home','recommendations','book','contents')),
  created_at timestamptz not null default now()
);

comment on table public.newsletter_subscribers is
  'Base de e-mails do "Clube dos Leitores BookCringe" — captação simples, sem integração de envio nesta fase.';

create unique index if not exists newsletter_subscribers_email_key
  on public.newsletter_subscribers (lower(email));

create index if not exists newsletter_subscribers_created_at_idx
  on public.newsletter_subscribers (created_at desc);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Service role access to newsletter_subscribers" on public.newsletter_subscribers;

create policy "Service role access to newsletter_subscribers" on public.newsletter_subscribers
  for all to service_role using (true) with check (true);
