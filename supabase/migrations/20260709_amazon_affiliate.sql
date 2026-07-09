-- 20260709_amazon_affiliate.sql
alter table public.settings
  add column if not exists amazon_associate_id text;
