-- 20260805_intelligence_owner.sql
--
-- Sprint "Multi-Tenant Foundation": introduz a fronteira de tenant do
-- Intelligence — `owner_id` em `intelligence_datasets`. Ver
-- `docs/intelligence/MULTI_TENANT_READINESS.md` para a análise que motivou
-- esta migration.
--
-- Decisão de design: só `intelligence_datasets` recebe `owner_id`.
-- `intelligence_imports`/`intelligence_contents`/`intelligence_metrics`
-- continuam sem coluna própria — todas alcançam o dono por `dataset_id`,
-- e toda leitura/escrita passa por `intelligenceDatasetService.ts`, que
-- sempre resolve o dono a partir do Dataset. Isso evita duplicar a coluna
-- em 4 tabelas para o mesmo dado.
--
-- `owner_id` guarda o mesmo valor de `session.user.login` (username do
-- GitHub) já usado pelo allowlist em `lib/auth/config.ts` — nenhuma tabela
-- de usuários nova é necessária para esta sprint.

-- 1. Coluna nullable primeiro, para permitir backfill sem quebrar linhas
--    já existentes (todos os Datasets de hoje pertencem ao único admin
--    atual, `ADMIN_GITHUB_LOGIN`).
alter table public.intelligence_datasets
  add column if not exists owner_id text;

-- 2. Backfill: todo Dataset existente pertence ao criador atual do
--    workspace. Ajuste o login abaixo antes de rodar em produção, caso o
--    valor de `ADMIN_GITHUB_LOGIN` seja outro.
update public.intelligence_datasets
  set owner_id = coalesce(owner_id, 'filipe-santos')
  where owner_id is null;

-- 3. Torna a coluna obrigatória — todo Dataset novo precisa de um dono.
alter table public.intelligence_datasets
  alter column owner_id set not null;

-- 4. A constraint global (1 Dataset por Platform, para todo o sistema)
--    impedia um segundo criador de ter seu próprio Dataset da mesma
--    Platform. Substituída por uma constraint por dono.
alter table public.intelligence_datasets
  drop constraint if exists intelligence_datasets_platform_key;

alter table public.intelligence_datasets
  add constraint intelligence_datasets_owner_platform_key
  unique (owner_id, platform);

-- 5. Índice para o filtro mais comum (todas as leituras do módulo passam
--    a filtrar por owner_id primeiro).
create index if not exists intelligence_datasets_owner_idx
  on public.intelligence_datasets (owner_id);
