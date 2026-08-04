-- Rollback — Sprint de Saneamento Arquitetural / Books
--
-- Executar somente se a migration final já tiver sido aplicada e após revisar
-- o impacto de reintroduzir book_reading_id no runtime.
--
-- O rollback é transacional e falha se não conseguir reconstruir todos os
-- vínculos. Nesse caso, a transação é abortada sem remover os backups.

begin;

-- ---------------------------------------------------------------------------
-- 1. Restaurar monthly_recommendations.book_reading_id
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('public._books_sanitation_monthly_backup') is null then
    raise exception
      'Rollback bloqueado: backup de monthly_recommendations não existe.';
  end if;
end
$$;

alter table public.monthly_recommendations
  add column if not exists book_reading_id uuid;

do $$
declare
  missing_backup_rows bigint;
begin
  select count(*)
  into missing_backup_rows
  from public._books_sanitation_monthly_backup as backup
  left join public.monthly_recommendations as mr
    on mr.id = backup.monthly_recommendation_id
  where mr.id is null;

  if missing_backup_rows > 0 then
    raise exception
      'Rollback bloqueado: % recomendações históricas foram excluídas após a migration.',
      missing_backup_rows;
  end if;
end
$$;

update public.monthly_recommendations as mr
set book_reading_id = backup.book_reading_id
from public._books_sanitation_monthly_backup as backup
where backup.monthly_recommendation_id = mr.id;

-- Para linhas criadas depois da migration, tenta reconstruir o vínculo apenas
-- quando existe exatamente uma leitura para o Book.
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
where mr.book_reading_id is null
  and unique_reading_by_book.book_id = mr.book_id;

do $$
begin
  if exists (
    select 1
    from public.monthly_recommendations as mr
    left join public.book_readings as br
      on br.id = mr.book_reading_id
    where mr.book_reading_id is null
       or br.id is null
       or mr.book_id is distinct from br.book_id
  ) then
    raise exception
      'Rollback bloqueado: não foi possível reconstruir todos os vínculos de monthly_recommendations.';
  end if;
end
$$;

alter table public.monthly_recommendations
  drop constraint if exists monthly_recommendations_book_reading_id_fkey;

alter table public.monthly_recommendations
  alter column book_reading_id set not null;

alter table public.monthly_recommendations
  add constraint monthly_recommendations_book_reading_id_fkey
  foreign key (book_reading_id)
  references public.book_readings(id)
  on delete cascade;

-- ---------------------------------------------------------------------------
-- 2. Restaurar dados manuais e a constraint anterior de campanhas
-- ---------------------------------------------------------------------------

alter table public.promotional_campaign_items
  drop constraint if exists promotional_campaign_items_book_source_check;

do $$
declare
  missing_backup_rows bigint;
begin
  if to_regclass('public._books_sanitation_campaign_item_backup') is not null then
    execute
      'select count(*)
       from public._books_sanitation_campaign_item_backup as backup
       left join public.promotional_campaign_items as item
         on item.id = backup.item_id
       where item.id is null'
    into missing_backup_rows;

    if missing_backup_rows > 0 then
      raise exception
        'Rollback bloqueado: % itens de campanha foram excluídos após a correção.',
        missing_backup_rows;
    end if;

    execute
      'update public.promotional_campaign_items as item
       set
         title = backup.title,
         image_url = backup.image_url,
         description = backup.description,
         affiliate_url = backup.affiliate_url
       from public._books_sanitation_campaign_item_backup as backup
       where backup.item_id = item.id';
  end if;
end
$$;

alter table public.promotional_campaign_items
  drop constraint if exists promotional_campaign_items_source_check;

alter table public.promotional_campaign_items
  add constraint promotional_campaign_items_source_check
  check (
    book_id is not null
    or (
      title is not null
      and image_url is not null
      and affiliate_url is not null
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Remover a unicidade de ISBN e restaurar strings vazias, se aplicável
-- ---------------------------------------------------------------------------

drop index if exists public.books_isbn_normalized_unique_idx;

do $$
declare
  missing_backup_rows bigint;
begin
  if to_regclass('public._books_sanitation_isbn_backup') is not null then
    execute
      'select count(*)
       from public._books_sanitation_isbn_backup as backup
       left join public.books as book
         on book.id = backup.book_id
       where book.id is null'
    into missing_backup_rows;

    if missing_backup_rows > 0 then
      raise exception
        'Rollback bloqueado: % Books com ISBN vazio foram excluídos após a correção.',
        missing_backup_rows;
    end if;

    execute
      'update public.books as book
       set isbn = backup.isbn
       from public._books_sanitation_isbn_backup as backup
       where backup.book_id = book.id';
  end if;
end
$$;

-- Os backups deixam de ser necessários somente após o rollback concluído.
drop table if exists public._books_sanitation_monthly_backup;
drop table if exists public._books_sanitation_campaign_item_backup;
drop table if exists public._books_sanitation_isbn_backup;

commit;
