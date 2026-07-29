-- 20260729_newsletter_images.sql
--
-- Bucket público de leitura para imagens usadas dentro de newsletters.
-- Os buckets existentes (covers/assets/thumbnails/logos) são privados e não
-- oferecem uma URL estável para clientes de e-mail. A escrita continua
-- restrita ao service_role; "public" aqui significa apenas leitura pública
-- do arquivo pela URL HTTPS gerada pelo Supabase Storage.
--
-- O app valida novamente MIME, assinatura binária e tamanho no
-- `newsletterImageService` antes do upload. O limite do bucket é uma segunda
-- camada de proteção.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'newsletter-images',
  'newsletter-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
