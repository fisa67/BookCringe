-- 20260727_newsletter_campaigns.sql
--
-- Fase 3B do Crew Literário: transforma a base captada
-- (`newsletter_subscribers`) em audiência ativa — criação/edição de
-- campanhas de e-mail, envio de teste e envio em massa via Resend. Sem
-- automações, agendamento real, segmentação avançada ou estatísticas de
-- abertura nesta fase (ver `campaignEmailService`).
--
-- `status`:
--   - `draft`: editável livremente, nunca enviada.
--   - `scheduled`: reservado para uma futura Fase 3C (agendamento real) —
--     nenhum código escreve esse valor ainda nesta fase.
--   - `sent`: enviada para o Crew (`recipients_count`/`sent_at` preenchidos
--     por `campaignService.markCampaignAsSent`); imobilizada — a UI do
--     admin não permite mais editar depois disso (ver `updateCampaignAction`).
--
-- `content`: texto simples (textarea, sem editor rico nesta fase) — vira
-- HTML no envio via `campaignEmailService.buildCampaignHtml` (mesma
-- estratégia de `escapeHtml` + quebra de linha de `send-form-email.ts`).
--
-- Segurança: mesma política de `newsletter_subscribers` — sem policy de
-- select para anon/authenticated (nenhuma página pública lê campanhas);
-- toda leitura/escrita passa por `campaignService.ts` (service_role).

create table if not exists public.newsletter_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  content text not null,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sent')),
  recipients_count integer not null default 0,
  sent_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.newsletter_campaigns is
  'Campanhas de e-mail do Crew Literário (Fase 3B) — rascunho, envio de teste e envio em massa via Resend para inscritos confirmados.';

create index if not exists newsletter_campaigns_created_at_idx
  on public.newsletter_campaigns (created_at desc);

alter table public.newsletter_campaigns enable row level security;

drop policy if exists "Service role access to newsletter_campaigns" on public.newsletter_campaigns;

create policy "Service role access to newsletter_campaigns" on public.newsletter_campaigns
  for all to service_role using (true) with check (true);
