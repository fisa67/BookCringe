-- Auditoria somente leitura — Sprint de Saneamento Arquitetural / Books
--
-- Este arquivo NÃO altera dados nem schema.
-- Execute-o antes de qualquer reparo ou migration.
--
-- Resultado esperado para liberar a migration final:
--   1. monthly_recommendations: 0 linhas inconsistentes.
--   2. promotional_campaign_items: 0 linhas que violem a regra final.
--   3. ISBN normalizado duplicado: 0 grupos.
--   4. ISBN nulo/vazio: permitido e reportado separadamente.

-- ---------------------------------------------------------------------------
-- 1. monthly_recommendations
-- Fonte canônica planejada: monthly_recommendations.book_id.
-- book_reading_id é legado/redundante e será removido somente após a
-- confirmação de que aponta para uma leitura do mesmo Book.
-- ---------------------------------------------------------------------------

select
  count(*) as total_monthly_recommendations
from public.monthly_recommendations;

-- Deve retornar 0 linhas.
select
  mr.id,
  mr.book_id,
  mr.book_reading_id,
  br.book_id as reading_book_id,
  case
    when br.id is null then 'book_reading_id órfão'
    when mr.book_id is distinct from br.book_id then 'Book divergente'
    else 'consistente'
  end as issue
from public.monthly_recommendations as mr
left join public.book_readings as br
  on br.id = mr.book_reading_id
where br.id is null
   or mr.book_id is distinct from br.book_id
order by mr.started_at, mr.id;

-- Consulta informativa para avaliar a reversibilidade de linhas futuras.
-- Não bloqueia a remoção quando a auditoria de consistência acima retorna 0:
-- uma recomendação histórica já possui seu vínculo explícito validado.
-- Se houver correção de divergências, as linhas com 0 ou múltiplas candidatas
-- exigem decisão manual antes do reparo.
select
  mr.id as monthly_recommendation_id,
  mr.book_id,
  count(br.id) as readings_for_book
from public.monthly_recommendations as mr
left join public.book_readings as br
  on br.book_id = mr.book_id
group by mr.id, mr.book_id
having count(br.id) <> 1
order by mr.id;

-- ---------------------------------------------------------------------------
-- 2. promotional_campaign_items
--
-- Regra final:
--   book_id IS NOT NULL
--     => title, image_url, description, affiliate_url são NULL
--   book_id IS NULL
--     => item manual; title, image_url e affiliate_url continuam obrigatórios
--        para preservar a regra de validade já existente.
-- ---------------------------------------------------------------------------

select
  count(*) as total_campaign_items
from public.promotional_campaign_items;

-- Deve retornar 0 linhas.
-- Detecta coexistência de Book vinculado com campos manuais.
select
  id,
  campaign_id,
  book_id,
  title,
  image_url,
  description,
  affiliate_url,
  item_type
from public.promotional_campaign_items
where book_id is not null
  and (
    title is not null
    or image_url is not null
    or description is not null
    or affiliate_url is not null
  )
order by campaign_id, position, id;

-- Deve retornar 0 linhas.
-- Detecta item manual que já viola a exigência mínima da constraint antiga.
select
  id,
  campaign_id,
  book_id,
  title,
  image_url,
  description,
  affiliate_url,
  item_type
from public.promotional_campaign_items
where book_id is null
  and (
    title is null
    or image_url is null
    or affiliate_url is null
  )
order by campaign_id, position, id;

-- Resumo por origem para conferência operacional.
select
  case when book_id is null then 'manual' else 'book' end as source_type,
  count(*) as total
from public.promotional_campaign_items
group by 1
order by 1;

-- ---------------------------------------------------------------------------
-- 3. books.isbn
--
-- Chave de comparação:
--   upper(trim(isbn)), removendo espaços, hífens e demais separadores.
--   O X do ISBN-10 é normalizado para X maiúsculo.
--
-- NULL, string vazia e string composta apenas por separadores são tratados
-- como "sem ISBN" e não bloqueiam a unicidade.
-- ---------------------------------------------------------------------------

select
  count(*) as total_books,
  count(*) filter (where isbn is null) as isbn_null,
  count(*) filter (where isbn is not null and btrim(isbn) = '') as isbn_blank,
  count(*) filter (
    where isbn is not null
      and btrim(isbn) <> ''
      and nullif(regexp_replace(upper(btrim(isbn)), '[^0-9X]', '', 'g'), '') is null
  ) as isbn_empty_after_normalization,
  count(*) filter (
    where nullif(regexp_replace(upper(btrim(isbn)), '[^0-9X]', '', 'g'), '') is not null
  ) as books_with_normalized_isbn
from public.books;

-- Informativo: reporta valores que não têm formato de ISBN-10/ISBN-13 após
-- a normalização. Esta migration não valida dígito verificador nem bloqueia
-- esses valores; a decisão de validação semântica fica fora deste pacote.
with normalized_books as (
  select
    id,
    isbn,
    regexp_replace(upper(btrim(isbn)), '[^0-9X]', '', 'g') as normalized_isbn
  from public.books
  where nullif(regexp_replace(upper(btrim(isbn)), '[^0-9X]', '', 'g'), '') is not null
)
select
  id,
  isbn,
  normalized_isbn,
  char_length(normalized_isbn) as normalized_length
from normalized_books
where char_length(normalized_isbn) not in (10, 13)
order by normalized_length, id;

-- Deve retornar 0 linhas.
-- Cada grupo representa um ISBN lógico repetido, mesmo que a formatação
-- armazenada seja diferente.
select
  regexp_replace(upper(btrim(isbn)), '[^0-9X]', '', 'g') as normalized_isbn,
  count(*) as total,
  array_agg(id order by id) as book_ids,
  array_agg(isbn order by id) as stored_values
from public.books
where nullif(regexp_replace(upper(btrim(isbn)), '[^0-9X]', '', 'g'), '') is not null
group by 1
having count(*) > 1
order by total desc, normalized_isbn;

-- Deve retornar somente public.books.isbn, ou 0 linhas se o catálogo não
-- possuir outras colunas com esse nome.
select
  table_schema,
  table_name,
  column_name,
  data_type
from information_schema.columns
where lower(column_name) like '%isbn%'
order by table_schema, table_name, column_name;

-- ---------------------------------------------------------------------------
-- 4. Estado das constraints/indexes atuais
-- ---------------------------------------------------------------------------

select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('books', 'promotional_campaign_items', 'monthly_recommendations')
order by tablename, indexname;

select
  conrelid::regclass as table_name,
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid in (
  'public.books'::regclass,
  'public.promotional_campaign_items'::regclass,
  'public.monthly_recommendations'::regclass
)
order by conrelid::regclass::text, conname;
