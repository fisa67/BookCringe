-- 20260728_newsletter_double_optin.sql
--
-- Fase 3C: double opt-in completo do "Crew Literário". Até aqui
-- `confirmed_at` existia (Fase 3A) mas nada o preenchia — esta migration
-- adiciona as duas colunas que faltam para o fluxo real de confirmação por
-- e-mail (ver `subscriberService.createSubscriber`/`confirmSubscriberByToken`
-- e a rota `/crew-literario/confirmar`).
--
-- 1) `confirmation_token`: token opaco (hex de 32 bytes aleatórios, gerado
--    em `generateConfirmationToken`) enviado por e-mail para o inscrito
--    confirmar. `null` quando não há confirmação pendente (inscrito já
--    confirmado, com o token já limpo em `confirmSubscriberByToken`).
--    Índice único parcial (só considera linhas com token) — garante que
--    dois inscritos nunca compartilhem o mesmo token, sem impedir vários
--    `null` simultâneos (comportamento padrão de índice único no Postgres,
--    mas explícito aqui via `where` por clareza).
--
-- 2) `confirmation_sent_at`: quando o e-mail de confirmação foi enviado
--    (ou reenviado) pela última vez. Não há expiração de token
--    implementada nesta fase, mas esta coluna é exatamente o que uma
--    futura regra de expiração (ex.: "token inválido após 7 dias") vai
--    precisar — guardada desde já por previsão, sem lógica de rejeição
--    ainda.

alter table public.newsletter_subscribers
  add column if not exists confirmation_token text null;

alter table public.newsletter_subscribers
  add column if not exists confirmation_sent_at timestamptz null;

comment on column public.newsletter_subscribers.confirmation_token is
  'Token opaco enviado no e-mail de confirmação (double opt-in) — null quando não há confirmação pendente. Limpo ao confirmar.';

comment on column public.newsletter_subscribers.confirmation_sent_at is
  'Data/hora do último envio (ou reenvio) do e-mail de confirmação — base para uma futura regra de expiração de token.';

drop index if exists newsletter_subscribers_confirmation_token_key;

create unique index newsletter_subscribers_confirmation_token_key
  on public.newsletter_subscribers (confirmation_token)
  where confirmation_token is not null;
