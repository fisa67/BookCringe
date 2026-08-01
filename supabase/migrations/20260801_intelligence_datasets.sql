-- 20260801_intelligence_datasets.sql
--
-- Primeira persistência real do módulo Intelligence (Sprint 6). Implementa
-- apenas o mínimo necessário para importar um Dataset do YouTube de
-- verdade — Platform e Insight continuam sem tabela própria por enquanto.
-- Ver docs/data-model.md e docs/datasets.md para a definição conceitual
-- completa; os comentários abaixo explicam só as decisões de schema.
--
-- Dados administrativos/analíticos, sem nenhum caso de uso de leitura
-- pública — RLS segue o mesmo padrão de `newsletter_subscribers`
-- (20260724_newsletter_subscribers.sql): acesso só via service_role.

-- Dataset: o "recipiente" de longo prazo de uma origem de dados (ex.:
-- "YouTube Studio — Desempenho de vídeos"). Existe antes do primeiro Import
-- e continua entre um Import e outro, acumulando Content/Metric.
create table if not exists public.intelligence_datasets (
  id uuid primary key default gen_random_uuid(),
  -- Enumerado com as plataformas já conhecidas pelo pipeline
  -- (`KnownImportPlatform`, src/lib/intelligence/imports/types.ts).
  platform text not null check (
    platform in ('youtube', 'instagram', 'tiktok', 'meta_ads', 'google_analytics', 'manual')
  ),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Hoje, 1 Dataset por Platform: cada adapter só produz um formato de
  -- relatório. Nasce implicitamente no primeiro Import bem-sucedido
  -- daquela plataforma (docs/datasets.md seção 2.1) — nunca por uma ação
  -- explícita do usuário. Quando um adapter passar a produzir mais de um
  -- tipo de relatório, esta constraint evolui para uma chave composta
  -- (platform, kind).
  unique (platform)
);

-- Import: um evento específico de "este arquivo foi trazido para este
-- Dataset, nesta data, com este resultado" — o registro auditável de uma
-- execução do pipeline (Detection Preview → Adapter → Normalização →
-- Persistência).
create table if not exists public.intelligence_imports (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references public.intelligence_datasets(id) on delete cascade,
  status text not null default 'processing' check (
    status in ('pending', 'processing', 'completed', 'failed')
  ),
  file_name text not null,
  accepted_records integer not null default 0 check (accepted_records >= 0),
  rejected_records integer not null default 0 check (rejected_records >= 0),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

-- Content: uma peça de conteúdo do BookCringe sobre a qual existem métricas
-- (aqui, um vídeo do canal). Pertence a um Dataset para sempre.
create table if not exists public.intelligence_contents (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references public.intelligence_datasets(id) on delete cascade,
  title text not null,
  external_url text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- O CSV do YouTube Studio não traz um ID/URL estável de vídeo — por
  -- enquanto, (dataset_id, title) é a chave de deduplicação usada no
  -- upsert. Reimportar o mesmo vídeo atualiza este Content, não duplica.
  -- Revisitar quando um adapter puder fornecer um identificador melhor.
  unique (dataset_id, title)
);

-- Metric: um fato numérico normalizado, associado a um Content quando há um
-- item específico sendo medido. Nunca é atualizada — cada Import insere
-- novas linhas, preservando o histórico (é essa cadeia Import → Metric que
-- sustenta o versionamento descrito em docs/datasets.md seção 4, sem
-- precisar de uma tabela de versão separada).
create table if not exists public.intelligence_metrics (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references public.intelligence_datasets(id) on delete cascade,
  import_id uuid not null references public.intelligence_imports(id) on delete cascade,
  content_id uuid references public.intelligence_contents(id) on delete cascade,
  key text not null,
  value numeric not null,
  unit text,
  measured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists intelligence_imports_dataset_idx
  on public.intelligence_imports (dataset_id, started_at desc);

create index if not exists intelligence_metrics_content_idx
  on public.intelligence_metrics (content_id);

create index if not exists intelligence_metrics_dataset_key_idx
  on public.intelligence_metrics (dataset_id, key, measured_at desc);

alter table public.intelligence_datasets enable row level security;
alter table public.intelligence_imports enable row level security;
alter table public.intelligence_contents enable row level security;
alter table public.intelligence_metrics enable row level security;

drop policy if exists "Service role access to intelligence_datasets" on public.intelligence_datasets;
create policy "Service role access to intelligence_datasets" on public.intelligence_datasets
  for all to service_role using (true) with check (true);

drop policy if exists "Service role access to intelligence_imports" on public.intelligence_imports;
create policy "Service role access to intelligence_imports" on public.intelligence_imports
  for all to service_role using (true) with check (true);

drop policy if exists "Service role access to intelligence_contents" on public.intelligence_contents;
create policy "Service role access to intelligence_contents" on public.intelligence_contents
  for all to service_role using (true) with check (true);

drop policy if exists "Service role access to intelligence_metrics" on public.intelligence_metrics;
create policy "Service role access to intelligence_metrics" on public.intelligence_metrics
  for all to service_role using (true) with check (true);
