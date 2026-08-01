-- 20260801_promotional_campaign_items_book_link.sql
--
-- Evolução do módulo Campanhas: até aqui, todo item de
-- `promotional_campaign_items` duplicava manualmente título/imagem/link
-- afiliado/descrição, mesmo quando `item_type = 'book'` — não havia nenhuma
-- referência real a `books`. Isso contraria o Princípio do Modelo Canônico
-- (a Biblioteca é a única fonte de verdade sobre um livro, ver AGENTS.md) e
-- gera dados divergentes sempre que o livro é atualizado na Biblioteca mas
-- a campanha não.
--
-- Mesma receita já usada em `contents.book_id` (`20260724_contents_general.sql`)
-- e no mesmo espírito de `bookclub_month_books` (tabela de junção pura, sem
-- duplicar dados do livro):
--   1. `book_id` nullable, referenciando `books` — quando presente, o item é
--      "vinculado ao CMS": capa, título, autor, slug e link afiliado são
--      resolvidos via join (`src/lib/campaigns.ts#resolveCampaignItem`),
--      nunca mais digitados aqui.
--   2. `title`/`image_url`/`affiliate_url` deixam de ser `not null` — só são
--      obrigatórios para itens manuais (sem `book_id`) — ver
--      `promotionalCampaignItemFormSchema`.
--   3. Constraint de consistência: ou o item tem `book_id`, ou tem os 3
--      campos manuais preenchidos — nunca os dois ausentes (mesmo padrão de
--      `contents_book_category_consistency_check`).
--
-- Extensibilidade (sem implementar agora): para vincular uma futura
-- entidade do CMS (ex.: Autor, Coleção) a uma campanha, basta repetir esta
-- receita — uma nova coluna nullable com FK própria (ex.: `author_id`) — em
-- vez de um `entity_type`/`entity_id` genérico, que exigiria um resolver
-- por `switch` e não tem precedente no restante do schema.
--
-- Compatibilidade: nenhuma linha existente é alterada. Itens com
-- `item_type = 'book'` cadastrados manualmente antes desta migration
-- continuam funcionando exatamente como estão (título/imagem/link próprios)
-- até que um admin abra o item em `/admin/campaigns/[id]/items/[itemId]/edit`
-- e troque "Como deseja cadastrar este item?" para "Selecionar um livro da
-- Biblioteca" — só nesse momento os campos manuais são zerados. Não há
-- script de migração automática de dados: não existe garantia de que o
-- título digitado bata exatamente com um registro da Biblioteca, então essa
-- decisão fica com o editor, item a item.
--
-- Idempotente (add column if not exists / drop+recreate constraint).

alter table public.promotional_campaign_items
  add column if not exists book_id uuid references public.books(id) on delete cascade;

comment on column public.promotional_campaign_items.book_id is
  'Quando presente, o item é vinculado a um livro da Biblioteca — capa/título/autor/slug/link afiliado são resolvidos via join, nunca duplicados aqui. null = item manual (title/image_url/affiliate_url próprios).';

alter table public.promotional_campaign_items
  alter column title drop not null;

alter table public.promotional_campaign_items
  alter column image_url drop not null;

alter table public.promotional_campaign_items
  alter column affiliate_url drop not null;

alter table public.promotional_campaign_items
  drop constraint if exists promotional_campaign_items_source_check;

alter table public.promotional_campaign_items
  add constraint promotional_campaign_items_source_check
  check (
    book_id is not null
    or (title is not null and image_url is not null and affiliate_url is not null)
  );

create index if not exists promotional_campaign_items_book_id_idx
  on public.promotional_campaign_items (book_id);
