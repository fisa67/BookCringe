-- 20260730_promotional_campaigns.sql
--
-- Campanhas promocionais públicas e reutilizáveis (Kindle Day, Prime Day,
-- Black Friday etc.). A tabela é independente de newsletter_campaigns:
-- newsletters são e-mails; estas campanhas são vitrines temporárias do site.
--
-- Apenas uma campanha pode estar ativa por vez. O conteúdo público é lido
-- pelo servidor com service_role, enquanto as policies também deixam a
-- leitura pública segura para uma futura leitura com a chave anon.

create table if not exists public.promotional_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  is_active boolean not null default false,
  banner_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotional_campaign_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.promotional_campaigns(id) on delete cascade,
  title text not null,
  image_url text not null,
  description text,
  affiliate_url text not null,
  price numeric(10, 2),
  position integer not null default 0,
  is_active boolean not null default true,
  item_type text not null default 'other'
    check (item_type in ('book', 'kindle', 'accessory', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists promotional_campaigns_one_active_idx
  on public.promotional_campaigns (is_active)
  where is_active = true;

create index if not exists promotional_campaign_items_campaign_position_idx
  on public.promotional_campaign_items (campaign_id, position, created_at);

alter table public.promotional_campaigns enable row level security;
alter table public.promotional_campaign_items enable row level security;

drop policy if exists "Public can read active promotional campaigns"
  on public.promotional_campaigns;
create policy "Public can read active promotional campaigns"
  on public.promotional_campaigns
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Public can read active promotional campaign items"
  on public.promotional_campaign_items;
create policy "Public can read active promotional campaign items"
  on public.promotional_campaign_items
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.promotional_campaigns campaign
      where campaign.id = campaign_id
        and campaign.is_active = true
    )
  );
