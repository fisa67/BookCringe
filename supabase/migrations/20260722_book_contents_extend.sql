-- 20260722_book_contents_extend.sql
--
-- Fase 1 de "BookCringe como plataforma de conteúdo literário": a tabela
-- `contents` (20260708_initial_schema.sql) já cobre praticamente tudo que
-- seria uma nova entidade "book_contents" (id, book_id FK, platform,
-- content_type, url, thumbnail, published_at, is_featured) — em vez de
-- criar uma tabela paralela duplicada, esta migration apenas ESTENDE a
-- existente com o que faltava:
--   1. `title` — título editorial do conteúdo (ex.: "Reel de recomendação"),
--      exibido nos cards públicos. Antes só existia platform/content_type.
--   2. Novos valores de `content_type`: 'youtube', 'carousel', 'review'
--      (os antigos 'video', 'podcast', 'article', 'other' são mantidos
--      para não quebrar linhas já cadastradas — nenhum dado é migrado).
--   3. Novo valor de `platform`: 'website' (para reviews publicadas no
--      próprio site, sem link externo de rede social).
--
-- Idempotente (add column if not exists / drop+recreate constraint).

alter table public.contents
  add column if not exists title text;

comment on column public.contents.title is
  'Título editorial do conteúdo (ex.: "Reel de recomendação"). Opcional — cards públicos caem para o título do livro quando ausente.';

alter table public.contents
  drop constraint if exists contents_content_type_check;

alter table public.contents
  add constraint contents_content_type_check
  check (content_type in ('reel','short','video','podcast','article','other','youtube','carousel','review'));

alter table public.contents
  drop constraint if exists contents_platform_check;

alter table public.contents
  add constraint contents_platform_check
  check (platform in ('instagram','tiktok','youtube','spotify','podcast','blog','website'));
