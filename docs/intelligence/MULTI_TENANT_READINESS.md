# Multi-Tenant Readiness — Intelligence

Análise que motivou a Sprint "Multi-Tenant Foundation". Registra o estado
**antes** da sprint (para referência histórica) e a decisão de design
adotada. Ver `20260805_intelligence_owner.sql` para a migration e
`intelligenceDatasetService.ts` para a implementação.

## Estado antes da sprint

Nenhuma tabela do Intelligence (`intelligence_datasets`,
`intelligence_imports`, `intelligence_contents`, `intelligence_metrics`)
tinha `user_id`/`owner_id`. `intelligence_datasets` tinha
`unique (platform)` — um único Dataset por Platform, **globalmente**: o
segundo criador a importar um CSV do YouTube reutilizaria (ou colidiria
com) o Dataset do primeiro. A autenticação (`lib/auth/config.ts`) também
era single-user (`ADMIN_GITHUB_LOGIN`, allowlist de 1 login).

## Decisão de design

`owner_id` só existe em `intelligence_datasets`. As outras 3 tabelas
continuam sem coluna própria — todas alcançam o dono por `dataset_id`,
e toda leitura/escrita passa por `intelligenceDatasetService.ts`, único
ponto de acesso ao Supabase do módulo. Isso evita duplicar a mesma coluna
em 4 tabelas para representar um único fato ("de quem é este dado").

`owner_id` guarda o mesmo valor de `session.user.login` (username do
GitHub) já usado pelo allowlist — nenhuma tabela de usuários nova foi
criada. Resolvido por `lib/auth/ownerId.ts` (`getOwnerId`/`requireOwnerId`).

### Dois tipos de proteção, dependendo de quem fornece o id

1. **Filtro de leitura** — `listDatasets`/`listImports`/`listContents`/
   `listMetrics` recebem `ownerId` e sempre filtram por ele (diretamente em
   `intelligence_datasets`, ou via `dataset_id in (...)` para as 3 tabelas
   filhas).
2. **Validação de escrita** — depende de quem forneceu o id envolvido:
   - `findOrCreateDataset(ownerId, payload)` é o **único** ponto que
     decide a quem um Dataset pertence. Todo adapter de persistência
     (YouTube/Instagram/TikTok) chama esta função com o `ownerId` do
     criador autenticado antes de gravar qualquer coisa.
   - `createImport`/`upsertContent`/`insertMetrics` recebem um
     `dataset_id`/`import_id` que **sempre** vem de um Dataset já resolvido
     por `findOrCreateDataset` na mesma chamada de `persist()` — fluxo
     interno, confiável, sem input do usuário. Por isso não precisaram
     ganhar `ownerId` nem validação extra.
   - `linkContentToBook`/`unlinkContentFromBook` recebem um `contentId`
     que vem **direto de um `<form>`** (`conteudos/actions.ts`) — sem
     nenhum Dataset resolvido antes. Estas duas funções validam a posse
     (`content → dataset_id → owner_id`) antes de escrever; sem isso, um
     segundo criador poderia vincular/desvincular Content de outro dono só
     adivinhando o id (IDOR).

### Fora de escopo desta sprint

- APIs das plataformas (YouTube/Instagram/TikTok) — inalteradas.
- Books multi-tenant (`public.books` continua global).
- RLS avançado — `intelligence_*` continua com policy só de `service_role`;
  o isolamento é garantido na camada de aplicação
  (`intelligenceDatasetService.ts`), não no banco.
- Convites/gestão de múltiplos administradores — `ADMIN_GITHUB_LOGIN`
  continua sendo o único mecanismo de autenticação; o que muda é que, uma
  vez autenticado, cada login passa a ter seus próprios dados no
  Intelligence.

## Migration

`20260805_intelligence_owner.sql`: adiciona `owner_id` (nullable → backfill
→ `not null`), substitui `unique (platform)` por
`unique (owner_id, platform)` e cria um índice em `owner_id`.
