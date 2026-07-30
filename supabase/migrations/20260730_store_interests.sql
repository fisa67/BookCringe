-- 20260730_store_interests.sql
--
-- Interesses da BookCringe Store. Esta tabela registra validação de demanda;
-- não representa pedido, pagamento, estoque reservado ou lista de espera.

create table if not exists public.store_interests (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.store_collections(id) on delete restrict,
  product_id uuid not null references public.store_products(id) on delete restrict,
  name text not null,
  email text not null,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists store_interests_collection_created_idx
  on public.store_interests (collection_id, created_at desc);

create index if not exists store_interests_product_created_idx
  on public.store_interests (product_id, created_at desc);

create index if not exists store_interests_created_idx
  on public.store_interests (created_at desc);

alter table public.store_interests enable row level security;

drop policy if exists "Service role access to store_interests"
  on public.store_interests;
create policy "Service role access to store_interests"
  on public.store_interests
  for all
  to service_role
  using (true)
  with check (true);

-- Não há policy pública de leitura ou inserção. O formulário e o painel usam
-- o service role. Isso evita expor nomes e e-mails no client.
