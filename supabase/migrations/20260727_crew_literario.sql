-- 20260727_crew_literario.sql
--
-- Fase 3A: rebrand do "Clube dos Leitores BookCringe" para "Crew Literário"
-- e preparação de `newsletter_subscribers` para uma futura integração de
-- envio (Resend, Brevo ou Mailchimp). Nenhum envio de e-mail é implementado
-- nesta fase — só a infraestrutura de dados.
--
-- 1) `confirmed_at`: quando a futura integração de double opt-in existir,
--    passa a ser preenchido na confirmação do e-mail. `null` = não
--    confirmado (todo inscrito atual e futuro, até a integração existir).
--    Sem trigger/default — fica sempre `null` até haver um fluxo de
--    confirmação de verdade, propositalmente (nenhuma confirmação é
--    fabricada nesta fase).
--
-- 2) `source`: adiciona `crew_literario` à lista de origens permitidas —
--    novo valor emitido pela landing page dedicada `/crew-literario`
--    (Fase 3A). Precisa reaproveitar o mesmo texto em
--    `src/lib/validations/newsletter.ts` (`NEWSLETTER_SOURCES`) e
--    `src/lib/types/cms.ts` (`NewsletterSource`) — este `check` é a
--    validação de último nível (defesa em profundidade), a validação de
--    verdade acontece em `newsletterSubscribeSchema` antes do insert.

alter table public.newsletter_subscribers
  add column if not exists confirmed_at timestamptz null;

comment on column public.newsletter_subscribers.confirmed_at is
  'Preenchido quando o e-mail é confirmado (double opt-in) — null até a integração de envio (Resend/Brevo/Mailchimp) existir.';

alter table public.newsletter_subscribers
  drop constraint if exists newsletter_subscribers_source_check;

alter table public.newsletter_subscribers
  add constraint newsletter_subscribers_source_check
  check (source in ('home', 'recommendations', 'book', 'contents', 'crew_literario'));

comment on table public.newsletter_subscribers is
  'Base de e-mails do "Crew Literário" (ex-"Clube dos Leitores BookCringe") — captação e infraestrutura de audiência; sem envio de e-mails nesta fase.';
