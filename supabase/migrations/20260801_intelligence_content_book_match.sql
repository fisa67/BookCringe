-- 20260801_intelligence_content_book_match.sql
--
-- Sprint 7: matching assistido entre Content do Intelligence e Livro do
-- CMS. Guarda só a referência (book_id) — nunca copia autor, editora,
-- gênero, país etc. do Livro para dentro do Intelligence. Ver
-- docs/content-matching.md para o conceito completo.
--
-- `on delete set null` (não `cascade`): se um Livro for removido do CMS, o
-- Content e todo o histórico de Metric continuam existindo — só perdem o
-- vínculo. O dado analítico tem valor mesmo sem o Livro associado.

alter table public.intelligence_contents
  add column if not exists book_id uuid references public.books(id) on delete set null;

create index if not exists intelligence_contents_book_idx
  on public.intelligence_contents (book_id);
