-- 20260724_contents_general.sql
--
-- Evolução do módulo Conteúdo: hoje `contents.book_id` é obrigatório, então
-- só é possível cadastrar conteúdo vinculado a um livro. Nem todo conteúdo
-- do BookCringe é sobre um livro específico (ex.: "Como criar o hábito da
-- leitura", "Kindle vs Livro físico", "Bastidores do BookCringe") — em vez
-- de criar uma tabela paralela, esta migration estende a tabela existente
-- (mesmo padrão de `20260722_book_contents_extend.sql`):
--   1. `book_id` deixa de ser `not null` — conteúdo geral usa `book_id = null`.
--   2. Nova coluna `content_category`, com `default 'book'` para que todo o
--      histórico já cadastrado (que sempre tem livro) seja automaticamente
--      classificado como 'book' sem precisar de um `update` manual.
--   3. Constraint de consistência: só é permitido `content_category = 'book'`
--      quando há um `book_id` — protege a integridade editorial sem impedir
--      combinações livres nas categorias gerais.
--
-- Idempotente (add column if not exists / drop+recreate constraint).

alter table public.contents
  alter column book_id drop not null;

alter table public.contents
  add column if not exists content_category text not null default 'book';

comment on column public.contents.content_category is
  'Categoria editorial do conteúdo. ''book'' = conteúdo sobre um livro específico (exige book_id); as demais são conteúdo geral, sem livro associado.';

alter table public.contents
  drop constraint if exists contents_content_category_check;

alter table public.contents
  add constraint contents_content_category_check
  check (content_category in ('book','reading','productivity','community','opinion','other'));

alter table public.contents
  drop constraint if exists contents_book_category_consistency_check;

alter table public.contents
  add constraint contents_book_category_consistency_check
  check (content_category <> 'book' or book_id is not null);
