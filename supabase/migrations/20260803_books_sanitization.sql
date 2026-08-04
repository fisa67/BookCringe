-- Sprint de Saneamento Arquitetural / Books
--
-- Migration final. Não executar antes de:
--   1. revisar docs/books-sanitization-audit.sql;
--   2. executar/revisar docs/books-sanitization-repair.sql, se necessário;
--   3. coordenar a compatibilidade da aplicação descrita na documentação.
--
-- Esta migration falha de forma atômica se encontrar dados incompatíveis.

begin;

-- ---------------------------------------------------------------------------
-- 1. Preflight: monthly_recommendations
-- ---------------------------------------------------------------------------

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
      'Migration bloqueada: monthly_recommendations possui book_id/book_reading_id inconsistente ou órfão.';
  end if;
end
$$;

-- Backup persistente do vínculo removido. Sem FK propositalmente, para que o
-- rollback continue possível mesmo se uma linha histórica for excluída depois.
create table if not exists public._books_sanitation_monthly_backup (
  monthly_recommendation_id uuid primary key,
  book_reading_id uuid not null,
  backed_up_at timestamptz not null default now()
);

insert into public._books_sanitation_monthly_backup (
  monthly_recommendation_id,
  book_reading_id
)
select
  id,
  book_reading_id
from public.monthly_recommendations
on conflict (monthly_recommendation_id) do nothing;

alter table public.monthly_recommendations
  drop column book_reading_id;

-- ---------------------------------------------------------------------------
-- 2. Preflight + constraint formal: promotional_campaign_items
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (
    select 1
    from public.promotional_campaign_items
    where not (
      (
        book_id is not null
        and title is null
        and image_url is null
        and description is null
        and affiliate_url is null
      )
      or (
        book_id is null
        and title is not null
        and image_url is not null
        and affiliate_url is not null
      )
    )
  ) then
    raise exception
      'Migration bloqueada: promotional_campaign_items viola a regra de origem exclusiva.';
  end if;
end
$$;

-- A constraint nova é adicionada antes de remover a antiga, mantendo a
-- validação ativa durante toda a transação.
alter table public.promotional_campaign_items
  drop constraint if exists promotional_campaign_items_book_source_check;

alter table public.promotional_campaign_items
  add constraint promotional_campaign_items_book_source_check
  check (
    (
      book_id is not null
      and title is null
      and image_url is null
      and description is null
      and affiliate_url is null
    )
    or (
      book_id is null
      and title is not null
      and image_url is not null
      and affiliate_url is not null
    )
  );

alter table public.promotional_campaign_items
  drop constraint if exists promotional_campaign_items_source_check;

-- ---------------------------------------------------------------------------
-- 3. Preflight + unicidade: books.isbn
-- ---------------------------------------------------------------------------

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
      'Migration bloqueada: books.isbn possui duplicidade após normalização.';
  end if;
end
$$;

-- Índice único por expressão:
--   - ignora NULL e strings vazias;
--   - remove espaços, hífens e demais separadores;
--   - normaliza x/X do ISBN-10 para X;
--   - não altera o valor original armazenado em books.isbn.
create unique index books_isbn_normalized_unique_idx
  on public.books (
    regexp_replace(upper(btrim(isbn)), '[^0-9X]', '', 'g')
  )
  where nullif(
    regexp_replace(upper(btrim(isbn)), '[^0-9X]', '', 'g'),
    ''
  ) is not null;

commit;
