# v0.7.0

Instagram Persistence (Sprint 14) — a persistência real dos 4 formatos de
audiência do Instagram (`FollowerHistory`, `FollowerActivity`,
`FollowerGender`, `FollowerTopTerritories`), seguindo a recomendação de
[`AUDIENCE_PERSISTENCE.md`](AUDIENCE_PERSISTENCE.md) (etapa de design da
mesma sprint): **Metric sem Content**, um único Dataset, zero migration.
Registrada como `ADR-009` em [`DECISIONS.md`](DECISIONS.md). O botão
Importar, bloqueado para o Instagram desde a Sprint 13, agora completa o
fluxo de ponta a ponta.

## Added

- `platforms/instagram/persistence.ts` — `instagramAudiencePersistence`,
  implementando `ImportPersistence<InstagramAudienceNormalizedRecord>`.
  Nunca chama `upsertContent`; mapeia cada registro para 1-2 `Metric` com
  `content_id` ausente, usando a convenção de `key` por `datasetKind`
  (`followers`/`followersDelta`, `activeFollowers`, `gender:<label>`,
  `territory:<código>`). Um único Dataset (`platform: "instagram"`, nome
  `"Instagram — Audiência"`) cobre os 4 formatos
- `app/.../actions.ts` — `importInstagramAudienceDatasetAction` (parse +
  normalize do `.xlsx` + `instagramAudiencePersistence.persist`, mesma forma
  de `importYouTubeDatasetAction`) e `confirmImportAction` (novo
  dispatcher, despacha pela extensão do arquivo — mesma decisão que
  `previewImportAction` já toma)
- `ADR-009` (`DECISIONS.md`) — "Datasets em formato de audiência persistem
  como Metric sem Content"
- Testes novos: `platforms/instagram/persistence.test.ts` (unitário, 4
  `datasetKind`, falhas parciais), `platforms/instagram/persistence.endToEnd.test.ts`
  (roda os 4 `.xlsx` reais de `test-data/instagram/` através do dispatcher
  de produção `previewImportFile` + `instagramAudiencePersistence.persist`
  de verdade, só a rede é mockada — confirma 30/144/3/6 registros aceitos e
  as linhas de Metric exatas gravadas para cada formato)

## Changed

- `imports/platformCapabilities.ts` e
  `insights/rules/platformWithoutDataset.ts` — `PLATFORMS_WITH_PERSISTENCE`
  passou de `["youtube"]` para `["youtube", "instagram"]` nas duas listas
- `session/validation.ts` — a checagem "persistence" passou a exigir também
  `structureOk` (não só `PLATFORMS_WITH_PERSISTENCE.includes(platform)`):
  sem isso, um CSV de Instagram Reels (mesma `platform`, sem Adapter) seria
  incorretamente aprovado só por "instagram" ter entrado na lista
- `useImportSession.ts` — `confirmImport` chama `confirmImportAction` em
  vez de `importYouTubeDatasetAction` diretamente
- `ImportCenter.tsx`/`FileDropzone.tsx` — textos que assumiam "só o YouTube
  confirma a importação até o fim" generalizados para as duas plataformas
- Testes atualizados: `session/validation.test.ts` (Instagram passa nos 5
  critérios), `insights/engine.test.ts` e
  `insights/rules/platformWithoutDataset.test.ts` (`platform-without-dataset`
  agora considera as 2 plataformas), `useImportSession.test.tsx` (describe
  "Instagram — Sprint 13, sem persistência" → "Instagram — Sprint 14, com
  persistência": a sessão chega em `ready`/`imported`, não mais `blocked`)

## Não incluído nesta sprint (de propósito)

- Dashboard não sabe exibir um Dataset "em formato de audiência" (Top 10
  por Content continua pensado para vídeos) — Sprint 15.
- Regra de Insight `low-content-volume` ainda não ignora Datasets
  audience-shaped — vai apontar um falso positivo real assim que o primeiro
  Import de audiência acontecer em produção; ajuste também fica para a
  Sprint 15.
- `(platform, kind)` como chave composta de `intelligence_datasets` — não
  necessário nesta sprint (`ADR-009`); só quando uma segunda família de
  dados do Instagram "em formato de conteúdo" (ex.: Reels) precisar do
  próprio Dataset.
- Matching (Content ↔ Livro) — não se aplica à audiência do Instagram.

---

# v0.6.0

Instagram UI Integration (Sprint 13) — o Adapter de audiência do Instagram
(v0.5.0) sai do "backend only" e passa pelo fluxo real da UI de
Importações, lado a lado com o YouTube: `FileDropzone` → Detection Preview
→ Preview → Validação. Persistência continua fora de escopo (Sprint 14) —
a Validação ganha um 5º critério dedicado para deixar isso explícito na
própria tela, em vez de deixar o botão Importar falhar silenciosamente.

## Added

- `imports/platformCapabilities.ts` — `PLATFORMS_WITH_PERSISTENCE`, fonte
  usada pelo novo critério de Validação `persistence`
- `session/validation.ts` — 5º critério de Validação, `persistence`: passa
  só quando a plataforma detectada já tem `persistence.ts` implementado
  (hoje só YouTube); Instagram passa nos outros 4 e fica bloqueado só nesse
- `audiencePreview.ts` — `InstagramAudiencePreview.metrics` (+
  `summarizeInstagramAudienceMetrics`), computado por `datasetKind`:
  seguidores mais recentes/variação (`audience_history`), pico/média de
  seguidores ativos (`audience_activity`), uma métrica por linha para
  gênero/território — mesmo papel de `YouTubeImportPreview.metrics`
- `ImportCenter.tsx` — `InstagramAudienceReadyPreview`, espelhando
  `YouTubeReadyPreview` (plataforma, tipo do arquivo, tipo de dataset,
  período, quantidade de registros, confiança, métricas encontradas)
- Testes novos: `preview.test.ts` (Instagram via `buffer`),
  `validation.test.ts`/`summary.test.ts` (caso Instagram pronto, bloqueado
  em `persistence`), `actions.test.ts` (novo arquivo — `previewImportAction`
  lendo `.csv` e `.xlsx` reais), `useImportSession.test.tsx` (novo describe
  "Instagram — Sprint 13, sem persistência": fluxo real do hook, arquivo →
  Detection Preview → Preview → Validação → `blocked`, `confirmImport`
  nunca chama Server Action de persistência)

## Changed

- `FileDropzone` — aceita `.xlsx` além de `.csv`; texto de instrução
  generalizado (sem quebrar o fluxo/testes existentes do YouTube)
- `imports/preview.ts` — `previewImportFile` aceita `{ file, buffer }`
  além de `{ file, content }`; `ImportPreviewReady` virou união
  discriminada por `platform` (`ImportPreviewReadyYouTube |
  ImportPreviewReadyInstagram`)
- `session/summary.ts` — `summarizeImportPreview` achata a preview pronta
  do Instagram (mesmos campos genéricos já usados pelo YouTube)
- `app/.../importacoes/actions.ts` — `previewYouTubeImportAction` renomeada
  para `previewImportAction` (decide texto vs. bytes pela extensão);
  `importYouTubeDatasetAction` inalterada
- `useImportSession.ts` — usa a action renomeada; mensagem de erro
  generalizada para mencionar `.csv` e `.xlsx`

## Por que a persistência do Instagram não entrou nesta sprint

Mapear os 4 formatos de audiência do Instagram (séries temporais e
distribuições, sem um "título" natural) para o modelo `Content`/`Metric`
atual — pensado para peças de conteúdo como um vídeo, identificadas por
`(dataset_id, title)` — é uma decisão de design própria: forçar isso sem
pensar faria o Dashboard e o Matching (Content ↔ Livro) exibirem entradas
sem sentido para dados de audiência. Fica para a Sprint 14 ("Instagram
Persistence"), como já estava no roadmap.

## Não incluído nesta sprint (de propósito)

- Persistência do Instagram — `platforms/instagram/persistence.ts` não
  existe; `intelligenceDatasetService.ts` e o Dataset Model não mudaram
- Nenhuma mudança em Dashboard, Questions, Decisions, Workspace, Rules
  Engine ou Matching (inclusive `insights/rules/platformWithoutDataset.ts`
  mantém sua própria lista de plataformas com persistência, deliberadamente
  não unificada com `platformCapabilities.ts` — o Rules Engine está fora
  de escopo)
- Nenhuma mudança no Dataset Model/Supabase — mesmas tabelas e mesma
  constraint `unique(platform)` de antes

## Testes

- 378 testes passando (367 + 11 novos).
- TypeScript sem erros.
- Lint sem erros.

---

# v0.5.0

Instagram Adapter (Audiência) — primeiro adapter além do YouTube com
Detection Preview + parser + normalizer completos, cobrindo os 4 exports de
audiência (`FollowerHistory`, `FollowerActivity`, `FollowerGender`,
`FollowerTopTerritories`). Backend/lib apenas: sem persistência nova, sem
mudança de Dashboard, sem mudança de UI (o preview fica standalone, ainda
não plugado no dispatcher compartilhado).

## Added

- `imports/xlsx.ts` — leitor de `.xlsx` (bytes → `string[][]`) usando
  `exceljs` (o pacote `xlsx`/SheetJS do npm tem 2 vulnerabilidades altas
  sem correção disponível — ver `npm audit`)
- `platforms/instagram/columns.ts` — 4 novos schemas de colunas canônicas:
  `INSTAGRAM_AUDIENCE_HISTORY_SCHEMA`, `_ACTIVITY_SCHEMA`,
  `_DEMOGRAPHICS_SCHEMA`, `_TERRITORY_SCHEMA`
- `platforms/instagram/audienceDate.ts` — parse de datas pt-BR sem ano
  (`"31 de julho"`) e inferência do ano andando de trás para frente a
  partir de uma `referenceDate` (parametrizável, default "agora")
- `platforms/instagram/audienceTypes.ts` — `InstagramDatasetKind`
  (`audience_history | audience_activity | audience_demographics |
  audience_territories`), um `datasetKind` explícito por platform,
  propositalmente local ao Instagram (nunca um enum global entre
  plataformas — ver seção "Dataset kind" abaixo)
- `platforms/instagram/audienceHistory.ts`, `audienceActivity.ts`,
  `audienceDemographics.ts`, `audienceTerritories.ts` — parser +
  normalizer de cada um dos 4 formatos
- `platforms/instagram/audienceParser.ts` — Adapter único do Instagram
  para audiência (`instagramAudienceImporter`): reconhece qual dos 4
  formatos recebeu pelo formato dos cabeçalhos e delega, sem nenhum
  parser genérico entre plataformas
- `platforms/instagram/audiencePreview.ts` — `buildInstagramAudiencePreview`,
  preview em memória standalone (não plugado em `imports/preview.ts`
  ainda — decisão desta sprint, ver "Próxima sprint")
- 4 novos detectores canônicos em `detection/platformDetectors.ts`
  (`instagramAudienceHistoryDetector` e os outros 3) — coexistem com o
  `instagramDetector` legado (Reels) sob o mesmo `platform: "instagram"`
- Fixtures reais (trimadas) em `test-data/instagram/*.xlsx`, incluindo uma
  janela do `FollowerHistory` com uma virada de ano real (dez→jan)
- 56 novos testes cobrindo leitor de xlsx, inferência de data/ano, os 4
  parsers/normalizers, o Adapter composto, o preview standalone e
  detecção sem colisão entre os 4 formatos

## Dataset kind — decisão de design

O pedido desta sprint incluiu suportar múltiplos "dataset kinds" por
plataforma (a mesma plataforma pode produzir mais de uma família de
dados — ex.: o Instagram tem audiência, e um futuro TikTok "Promotions"
seria baseado em campanhas pagas, um domínio bem diferente), sem que o
desenho do Instagram assumisse "toda plataforma produz audience_metric".

Decisão: `InstagramDatasetKind` é um tipo **local ao Instagram**
(`platforms/instagram/audienceTypes.ts`), não um campo novo em
`imports/types.ts`/`contracts.ts` nem uma tabela nova. Cada
`NormalizedImportRecord.payload` do Instagram carrega
`datasetKind: InstagramDatasetKind` explícito. Isso:

- Não toca nenhum tipo/contrato compartilhado entre plataformas — sem
  ADR, sem migration.
- Generaliza para "múltiplos dataset kinds por plataforma": qualquer
  plataforma futura define seu próprio tipo assim (`TikTokDatasetKind`,
  quando existir), sem um enum global compartilhado para colidir.
- Já é exatamente o campo que uma sprint futura de persistência do
  Instagram usaria para implementar a chave composta `(platform, kind)`
  em `intelligence_datasets`, já prevista no comentário da própria
  migration (`supabase/migrations/20260801_intelligence_datasets.sql`) —
  sem precisar redesenhar o Adapter quando essa sprint chegar.

## Changed

- `platforms/instagram/columns.ts` — comentário de topo atualizado (não é
  mais só um esqueleto; os 4 schemas de audiência têm Adapter completo)
- `detection/platformDetectors.ts` — comentário atualizado refletindo que
  o Instagram já tem detectores canônicos (audiência), além do legado
  (Reels)
- `package.json` — nova dependência `exceljs`

## Não incluído nesta sprint (de propósito)

- Nenhuma tabela/coluna nova no Supabase — persistência do Instagram
  fica para uma sprint futura
- Nenhuma mudança em Dashboard, Questions, Decisions ou Workspace —
  nenhum desses consumidores conhece arquivos do Instagram (verificado:
  zero import de `imports/platforms/instagram/` fora do próprio módulo
  de imports)
- Nenhuma mudança de UI — `FileDropzone`, `ImportCenter.tsx`,
  `useImportSession.ts`, `importacoes/actions.ts` e o dispatcher
  compartilhado `imports/preview.ts` continuam intocados; o preview do
  Instagram existe e é testado, mas ainda não está plugado neles
- Nenhum código de TikTok — a existência do export "TikTok Promotions"
  só influenciou o desenho do `datasetKind` (acima), não gerou nenhum
  detector/parser/columns.ts de TikTok

## Testes

- 367 testes passando (311 + 56 novos).
- TypeScript sem erros.
- Lint sem erros.

---

# v0.4.1

Padrão oficial de **colunas canônicas** para todos os importadores do
Intelligence — detector e parser compartilham a mesma fonte de verdade,
independente do idioma da conta da plataforma.

## Added

- `imports/columns.ts` — `CanonicalColumnSchema`, `matchColumns`, `getColumnValue`
- `detection/canonicalColumnDetector.ts` — factory de detecção por colunas canônicas
- `platforms/youtube/columns.ts` com aliases en/pt/es; parser e detector do YouTube migrados
- Esqueletos `columns.ts` para Instagram, TikTok, Meta Ads e Google Analytics
- Fixtures pt-BR do YouTube Studio (`youtube-studio-report-pt.csv`, `youtube-studio-table-data-pt.csv`)

## Changed

- Detection Preview do YouTube reconhece exports em português (ex.: `Table data.csv`)
- Parser do YouTube ignora linha agregada `Total` e colunas extras; métricas opcionais ausentes viram 0
- Documentação em `IMPORTS.md` atualizada com o guia do padrão canônico

---

# v0.4.0

Épico Workspace — Decisions viram ações clicáveis, transformando o
Dashboard numa central de trabalho diário, sem IA e sem alterar a Decision
Engine ou as Questions.

## Added

- Módulo `lib/intelligence/actions/` (contrato `WorkspaceAction`/`ActionBuilder`)

- 3 Action Builders: `repeatBestThemeActionBuilder`, `updateDatasetActionBuilder`, `completeMatchingActionBuilder`

- `workspaceService.getWorkspaceActions`

## Changed

- Dashboard: a seção "Próximas ações recomendadas" (v0.3.0) foi substituída pela seção "Hoje", no topo da tela, com botões funcionais para Livros, Importações e Matching

---

# v0.3.0

Épico Decision Engine — primeira camada de recomendações, sem IA e sem
LLM, construída sobre a arquitetura v0.1 já congelada e sobre a biblioteca
de Questions (v0.2.0), sem alterar nenhuma delas.

## Added

- Módulo `lib/intelligence/decisions/` (contrato `Decision`/`DecisionRule`/`DecisionContext`)

- 3 primeiras Decisions: `repeat-best-theme`, `import-stale-dataset`, `complete-matching`

- `intelligenceDecisionsService.getRecommendedDecisions`

- 2 novas perguntas de negócio: `staleDatasetQuestion` ("Qual é o Dataset mais desatualizado?") e `unmatchedContentQuestion` ("Quanto do meu conteúdo ainda não foi vinculado a um Livro?")

- Seção "Próximas ações recomendadas" no Dashboard

---

# v0.2.0

Épico Questions — biblioteca de perguntas de negócio, construída sobre a
arquitetura v0.1 já congelada, sem alterá-la.

## Added

- Módulo `lib/intelligence/questions/` (contrato `Question`/`QuestionAnswer`)

- Primeira pergunta: "Qual foi meu melhor conteúdo?" (`bestContentQuestion`)

- `intelligenceQuestionsService.getBestContentAnswer`

---

# v0.1.0

Primeira versão funcional do Intelligence.

## Added

- Pipeline

- Detection Preview

- Import Session

- Persistência

- Dataset

- Dashboard

- Matching

- Rules Engine

# v0.4.1

## Fixed

- Corrigido bug que deixava Import Session permanentemente em `importing`.
- Causa raiz identificada em `useImportSession.confirmImport()`.
- A Server Action não era executada devido à leitura síncrona de estado após `setSession()`.

## Added

- Testes de regressão para `useImportSession`.
- Cobertura para transições da Import Session.

## Validated

- Pipeline completo do YouTube validado utilizando CSV real:

Detection Preview
→ Import Session
→ Persistência
→ Dataset
→ Matching
→ Dashboard
→ Questions
→ Decisions
→ Workspace

## Testes

- 312 testes passando.
- TypeScript sem erros.
- Lint sem erros.