-- Reparo de dados — Sprint de Saneamento Arquitetural / Books
--
-- Este arquivo NÃO deve ser executado sem revisar o resultado da auditoria.
-- Ele faz apenas correções determinísticas e mantém backup persistente para
-- rollback. Não inventa ISBN, título, capa, URL ou dados de campanha.
--
-- Execute como uma única transação. Qualquer inconsistência não determinística
-- gera RAISE EXCEPTION e impede o COMMIT.

begin;

-- ---------------------------------------------------------------------------
-- 0. Backups de dados que poderão ser alterados
-- ---------------------------------------------------------------------------

create table if not exists public._books_sanitation_monthly_backup (
  monthly_recommendation_id uuid primary key,
  book_reading_id uuid not null,
  backed_up_at timestamptz not null default now()
);

create table if not exists public._books_sanitation_campaign_item_backup (
  item_id uuid primary key,
  book_id uuid not null,
  title text,
  image_url text,
  description text,
  affiliate_url text,
  backed_up_at timestamptz not null default now()
);

create table if not exists public._books_sanitation_isbn_backup (
  book_id uuid primary key,
  isbn text,
  backed_up_at timestamptz not null default now()
);

comment on table public._books_sanitation_monthly_backup is
  'Backup temporário da Sprint de Saneamento Books. Remover após janela de rollback.';

comment on table public._books_sanitation_campaign_item_backup is
  'Backup temporário da Sprint de Saneamento Books. Remover após janela de rollback.';

comment on table public._books_sanitation_isbn_backup is
  'Backup temporário da Sprint de Saneamento Books. Remover após janela de rollback.';

-- ---------------------------------------------------------------------------
-- 1. monthly_recommendations
--
-- book_id é canônico. Quando há exatamente uma leitura para o Book, qualquer
-- book_reading_id divergente pode ser corrigido deterministicamente para essa
-- leitura. Se a divergência envolver um órfão ou múltiplas leituras, ela fica
-- bloqueada para decisão manual.
-- ---------------------------------------------------------------------------

insert into public._books_sanitation_monthly_backup (
  monthly_recommendation_id,
  book_reading_id
)
select
  id,
  book_reading_id
from public.monthly_recommendations
on conflict (monthly_recommendation_id) do nothing;

with unique_reading_by_book as (
  select
    book_id,
    min(id) as book_reading_id
  from public.book_readings
  group by book_id
  having count(*) = 1
)
update public.monthly_recommendations as mr
set book_reading_id = unique_reading_by_book.book_reading_id
from unique_reading_by_book
where unique_reading_by_book.book_id = mr.book_id
  and mr.book_reading_id is distinct from unique_reading_by_book.book_reading_id;

do $$
begin
  if exists (
    select 1
    from public.monthly_recommendations as mr
    left join public.book_readings as br
      on br.id = mr.book_reading_id
    where br.id is null
       or mr.book_id is distinct from br.book_id
  ) then
    raise exception
      'Saneamento abortado: monthly_recommendations possui book_id/book_reading_id inconsistente ou órfão. Revisar a auditoria antes de continuar.';
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 2. promotional_campaign_items
--
-- Quando book_id existe, os dados manuais são inequivocamente descartáveis:
-- o resolver público já usa books exclusivamente. Antes de limpar, os valores
-- originais ficam preservados no backup.
--
-- Item manual sem title/image_url/affiliate_url não pode ser corrigido sem
-- decisão editorial e bloqueia o restante da transação.
-- ---------------------------------------------------------------------------

insert into public._books_sanitation_campaign_item_backup (
  item_id,
  book_id,
  title,
  image_url,
  description,
  affiliate_url
)
select
  id,
  book_id,
  title,
  image_url,
  description,
  affiliate_url
from public.promotional_campaign_items
where book_id is not null
  and (
    title is not null
    or image_url is not null
    or description is not null
    or affiliate_url is not null
  )
on conflict (item_id) do nothing;

update public.promotional_campaign_items
set
  title = null,
  image_url = null,
  description = null,
  affiliate_url = null
where book_id is not null
  and (
    title is not null
    or image_url is not null
    or description is not null
    or affiliate_url is not null
  );

do $$
begin
  if exists (
    select 1
    from public.promotional_campaign_items
    where book_id is null
      and (
        title is null
        or image_url is null
        or affiliate_url is null
      )
  ) then
    raise exception
      'Saneamento abortado: item manual de campanha sem title, image_url ou affiliate_url. Corrigir editorialmente antes de continuar.';
  end if;

  if exists (
    select 1
    from public.promotional_campaign_items
    where book_id is not null
      and (
        title is not null
        or image_url is not null
        or description is not null
        or affiliate_url is not null
      )
  ) then
    raise exception
      'Saneamento abortado: ainda existe item de campanha com book_id e dados manuais.';
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 3. books.isbn
--
-- A migration final usa um índice por expressão e preserva NULL. Aqui só
-- convertemos strings vazias/espaços em NULL, sem alterar ISBNs informados.
-- Duplicidades lógicas continuam bloqueando a migration final para decisão
-- humana — nunca são resolvidas descartando ISBN automaticamente.
-- ---------------------------------------------------------------------------

insert into public._books_sanitation_isbn_backup (book_id, isbn)
select
  id,
  isbn
from public.books
where isbn is not null
  and btrim(isbn) = ''
on conflict (book_id) do nothing;

update public.books
set isbn = null
where isbn is not null
  and btrim(isbn) = '';

do $$
begin
  if exists (
    select 1
    from public.books
    where nullif(regexp_replace(upper(btrim(isbn)), '[^0-9X]', '', 'g'), '') is not null
    group by regexp_replace(upper(btrim(isbn)), '[^0-9X]', '', 'g')
    having count(*) > 1
  ) then
    raise exception
      'Saneamento abortado: existem ISBNs logicamente duplicados. Escolher o registro canônico antes de criar a unicidade.';
  end if;
end
$$;

commit;
