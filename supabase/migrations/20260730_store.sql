-- 20260730_store.sql
--
-- Catálogo permanente da BookCringe Store. A Store não é um e-commerce:
-- não há carrinho, checkout, pagamento ou frete. Coleções e produtos são
-- publicados como uma vitrine editorial de pequenas tiragens.

create table if not exists public.store_collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default false,
  total_quantity integer not null default 0 check (total_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_products (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.store_collections(id) on delete cascade,
  name text not null,
  description text,
  image_url text not null,
  price numeric(10, 2) not null check (price >= 0),
  quantity integer not null default 0 check (quantity >= 0),
  is_active boolean not null default true,
  crew_exclusive boolean not null default false,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_collections_active_idx
  on public.store_collections (is_active, created_at desc);

create index if not exists store_products_collection_position_idx
  on public.store_products (collection_id, position, created_at);

alter table public.store_collections enable row level security;
alter table public.store_products enable row level security;

drop policy if exists "Public can read active store collections"
  on public.store_collections;
create policy "Public can read active store collections"
  on public.store_collections
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Public can read active store products"
  on public.store_products;
create policy "Public can read active store products"
  on public.store_products
  for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1
      from public.store_collections collection
      where collection.id = store_products.collection_id
        and collection.is_active = true
    )
  );
