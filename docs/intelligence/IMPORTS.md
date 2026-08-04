# Intelligence — Pipeline de Importações

Módulo responsável por centralizar as métricas de todas as plataformas do
BookCringe (`/admin/intelligence`). Este documento cobre a arquitetura do
pipeline de importações e o estado atual da implementação — ver
[`AGENTS.md`](../../AGENTS.md) para a filosofia geral do projeto e
[`DATA_MODEL.md`](DATA_MODEL.md) para o modelo canônico de dados
(`Platform`, `Dataset`, `Import`, `Content`, `Metric`, `Insight`) que este
pipeline alimenta.

---

## Fluxo do pipeline

```
Arquivo
  ↓
Detection Preview   (detector genérico, todas as plataformas)
  ↓
Adapter da Plataforma   (parser + normalizer, um por plataforma, independente)
  ↓
NormalizedImportRecord
  ↓
Persistência   (implementada para o YouTube — ver seção "Persistência" abaixo)
  ↓
Matching   (Content ↔ Livro do CMS, assistido — ver seção "Matching" abaixo)
  ↓
Dashboard + Insights   (números + recomendações por regra, nunca IA — ver seções "Dashboard" e "Insights" abaixo)
```

Cada plataforma é **completamente independente**: seu próprio detector de
sinais, seu próprio parser, seu próprio normalizer. Não existe (e não deve
existir) um parser genérico que tente interpretar arquivos de todas as
plataformas.

---

## Estrutura de código

```
src/lib/intelligence/imports/
├── contracts.ts        # Interfaces do pipeline (ImportDetector, PlatformParser,
│                        # ImportNormalizer, ImportPersistence, ImporterDefinition)
├── types.ts             # Tipos de dados (ImportPlatform, NormalizedImportRecord, ...)
├── columns.ts           # Padrão oficial: CanonicalColumnSchema + matchColumns
│                        # (fonte única de verdade compartilhada entre detector e parser)
├── columns.test.ts
├── xlsx.ts               # Leitor de .xlsx (bytes -> string[][]), via `exceljs`
├── xlsx.test.ts
├── index.ts              # Barrel público do módulo
├── preview.ts            # Dispatcher genérico: detecta a plataforma e delega
│                          # ao adapter correspondente (YouTube via `content`,
│                          # Instagram/audiência via `buffer`)
├── preview.test.ts
├── platformCapabilities.ts   # PLATFORMS_WITH_PERSISTENCE — usado pelo
│                              # critério "persistence" da Validação (session/)
│
├── detection/
│   ├── fileDetector.ts              # IntelligenceFileDetector — escolhe a melhor plataforma
│   ├── canonicalColumnDetector.ts   # Factory oficial: pontua por colunas canônicas
│   ├── platformDetectors.ts         # Um detector por plataforma (YouTube usa o factory)
│   ├── utils.ts                     # Normalização de texto, inferência de formato
│   └── *.test.ts
│
├── platforms/
│   ├── shared.ts               # `PlatformParserContract` — só o tipo comum
│   ├── youtube/
│   │   ├── columns.ts           # Schema canônico + aliases (en/pt/es) — fonte única
│   │   ├── columns.test.ts
│   │   ├── parser.ts           # Parser + normalizer (resolve por chave canônica)
│   │   ├── parser.test.ts
│   │   ├── preview.ts
│   │   ├── preview.test.ts
│   │   ├── persistence.ts
│   │   └── persistence.test.ts
│   ├── instagram/
│   │   ├── columns.ts                  # Schema Reels (esqueleto) + 4 schemas de audiência (completos)
│   │   ├── columns.test.ts
│   │   ├── parser.ts                   # Stub do parser de Reels (ainda não implementado)
│   │   ├── audienceTypes.ts             # InstagramDatasetKind + payloads dos 4 formatos de audiência
│   │   ├── audienceDate.ts              # Datas pt-BR sem ano + inferência de ano
│   │   ├── audienceDate.test.ts
│   │   ├── audienceNumber.ts            # parseAudienceNumber (mesmo padrão do parseNumber do YouTube)
│   │   ├── audienceHistory.ts           # FollowerHistory — parser + normalizer
│   │   ├── audienceHistory.test.ts
│   │   ├── audienceActivity.ts          # FollowerActivity — parser + normalizer
│   │   ├── audienceActivity.test.ts
│   │   ├── audienceDemographics.ts      # FollowerGender — parser + normalizer
│   │   ├── audienceDemographics.test.ts
│   │   ├── audienceTerritories.ts       # FollowerTopTerritories — parser + normalizer
│   │   ├── audienceTerritories.test.ts
│   │   ├── audienceParser.ts            # Adapter único de audiência (dispatch pelos 4 formatos)
│   │   ├── audienceParser.test.ts
│   │   ├── audiencePreview.ts           # Preview — plugado em imports/preview.ts desde a Sprint 13
│   │   └── audiencePreview.test.ts
│   ├── tiktok/
│   │   ├── columns.ts
│   │   └── parser.ts
│   ├── meta-ads/
│   │   ├── columns.ts
│   │   └── parser.ts
│   ├── google-analytics/
│   │   ├── columns.ts
│   │   └── parser.ts
│   └── manual/parser.ts
│
└── test-data/                  # Fixtures de teste, organizadas por plataforma
    ├── youtube/
    │   ├── youtube-studio-report.csv          # inglês
    │   ├── youtube-studio-report-pt.csv       # português
    │   └── youtube-studio-table-data-pt.csv   # export real (linha Total + colunas extras)
    ├── instagram/
    │   ├── instagram-reels-insights.csv
    │   ├── FollowerHistory.xlsx      # janela real com 1 virada de ano (dez→jan)
    │   ├── FollowerActivity.xlsx     # export real (144 linhas, 6 dias)
    │   ├── FollowerGender.xlsx       # export real (3 linhas)
    │   └── FollowerTopTerritories.xlsx  # export real (6 linhas)
    ├── tiktok/tiktok-creator-analytics.csv
    ├── meta-ads/meta-ads-campaigns.csv
    └── generic/generic-report.csv
```

```
src/lib/intelligence/matching/    # Matching Content ↔ Livro do CMS — ver seção "Matching"
├── similarity.ts                 # titleSimilarity — coeficiente de Dice sobre bigramas
├── suggest.ts                    # findBookMatchCandidates / suggestBookMatch
├── index.ts                      # barrel público do módulo
└── *.test.ts
```

```
src/lib/intelligence/dashboard/   # Agregação pura do Dashboard — ver seção "Dashboard"
├── types.ts                      # IntelligenceDashboardData e afins
├── summary.ts                    # buildIntelligenceDashboardData — sem I/O
├── index.ts                      # barrel público do módulo
└── summary.test.ts
```

```
src/lib/intelligence/insights/    # Rules Engine — ver seção "Insights"
├── types.ts                      # Insight, Rule, RuleContext
├── engine.ts                     # INTELLIGENCE_RULES, runIntelligenceRules
├── index.ts                      # barrel público do módulo
└── rules/
    ├── dateUtils.ts                # helpers puros compartilhados
    ├── staleDataset.ts             # "Dataset desatualizado"
    ├── lowContentVolume.ts         # "Pouco conteúdo associado"
    ├── noRecentImport.ts           # "Nenhuma importação recente"
    ├── unmatchedContent.ts         # "Conteúdos sem Livro"
    ├── platformWithoutDataset.ts   # "Plataforma sem Dataset"
    └── *.test.ts
```

### `test-data/`

Fixtures reais (CSV) usadas tanto pelos testes de detecção
(`detection/fileDetector.test.ts`) quanto pelos testes do adapter de cada
plataforma (ex. `platforms/youtube/parser.test.ts`,
`platforms/youtube/preview.test.ts`) e da Import Session
(`session/validation.test.ts`, `session/summary.test.ts`). Organizadas por
plataforma para deixar claro, ao adicionar um novo adapter, onde colocar
seus arquivos de exemplo — basta criar `test-data/<plataforma>/` com um CSV
representativo.

### Colunas canônicas (padrão oficial de todos os importadores)

Esta é a **fonte única de verdade** para cabeçalhos de CSV no Intelligence.
Não é um ajuste específico do YouTube em português — é o padrão que
Instagram, TikTok, Meta Ads e Google Analytics devem seguir quando seus
adapters forem implementados.

#### Por que existe

As plataformas exportam CSVs com cabeçalhos localizados pelo idioma da
conta (`"Video title"` / `"Título do vídeo"` / `"Título del video"`).
Comparar strings literais em inglês quebra a Detection Preview e o
parser. Manter duas listas (uma no detector, outra no parser) também
quebra — elas inevitavelmente divergem.

#### Contrato

```
imports/columns.ts
  CanonicalColumnSchema<TColumn>   # aliases + required + optional
  matchColumns(schema, headers)    # resolve índices por chave canônica
  getColumnValue(row, match, col)  # lê célula pelo índice resolvido

imports/detection/canonicalColumnDetector.ts
  createCanonicalColumnDetector({ platform, schema, brandHints? })
  # pontua confiança: colunas obrigatórias (peso alto) > opcionais >
  # marca no nome/conteúdo > formato do arquivo

platforms/<plataforma>/columns.ts
  <PLATAFORMA>_COLUMN_SCHEMA       # o único mapa de aliases da plataforma
```

Regras:

1. **Uma plataforma = um `columns.ts`.** Detector e parser consomem
   exatamente o mesmo schema. Nunca listas duplicadas de cabeçalhos.
2. **Comparação por igualdade exata normalizada** (sem acento, minúscula),
   nunca substring solta — evita falso positivo (`"Views"` ≠ `"Video views"`
   do TikTok).
3. **Ordem das colunas não importa.** Colunas extras/desconhecidas são
   ignoradas. Colunas opcionais ausentes degradam graciosamente (ex.:
   métrica = 0 no parser do YouTube).
4. **Linhas agregadas** (ex.: `"Total"` do `Table data.csv`) são
   ignoradas quando faltam as colunas de identidade obrigatórias.

#### Como adicionar um novo idioma

Edite **somente** `platforms/<plataforma>/columns.ts` e acrescente o
alias ao array da coluna canônica correspondente:

```ts
videoTitle: ["Video title", "Título do vídeo", "Título del video", "Titre de la vidéo"],
```

Nenhum outro arquivo (detector, parser, testes de UI) precisa mudar.

#### Como o YouTube aplica o padrão hoje

- Schema: `platforms/youtube/columns.ts` (`YOUTUBE_COLUMN_SCHEMA`).
  Obrigatórias: `videoTitle`, `videoPublishTime`. Opcionais: as 4 métricas.
- Detector: `youtubeDetector = createCanonicalColumnDetector({ schema: YOUTUBE_COLUMN_SCHEMA, ... })`.
- Parser: `matchColumns(YOUTUBE_COLUMN_SCHEMA, headers)` + `getColumnValue`.
- Fixtures: `youtube-studio-report.csv` (en), `youtube-studio-report-pt.csv`
  (pt), `youtube-studio-table-data-pt.csv` (export real com linha `Total`).

TikTok/Meta Ads/Google Analytics já têm `columns.ts` esqueleto (aliases
iniciais das fixtures atuais). Ainda usam detector por palavras-chave até
a sprint do adapter respectivo — nessa sprint, basta trocar para
`createCanonicalColumnDetector({ schema: ... })` e implementar o parser
com `matchColumns`. O Instagram já fez essa migração para os 4 formatos de
audiência (`platforms/instagram/columns.ts` + `audience*.ts` — ver seção
"Instagram — Audiência"); o Reels do Instagram continua no detector
legado, sem Adapter ainda.

### `src/lib/intelligence/session/` — Import Session

Camada que existe entre o pipeline (`imports/`) e a UI: representa o
progresso do usuário pelo fluxo de importação (arquivo → preview →
validação → pronto), inteiramente em memória, sem depender de React.

```
session/
├── types.ts        # ImportSession, ImportSessionStage, ImportSessionSummary
├── summary.ts        # achata um ImportPreviewResult no formato da sessão
├── validation.ts      # deriva os 5 critérios de Validação a partir do preview
│                        # (o 5º, "persistence", consulta PLATFORMS_WITH_PERSISTENCE)
├── stepper.ts          # mapeia o stage da sessão pro status visual de cada etapa
├── index.ts             # barrel público do módulo
└── *.test.ts             # um teste por arquivo acima
```

Nenhum arquivo deste módulo persiste dado algum nem reprocessa o arquivo —
tudo é derivado do `ImportPreviewResult` que o pipeline já calculou.

---

## Persistência

Implementada para YouTube e, desde a Sprint 14 ("Instagram Persistence",
[`AUDIENCE_PERSISTENCE.md`](AUDIENCE_PERSISTENCE.md)), também para o
Instagram (audiência) — sempre a mesma filosofia de "uma funcionalidade
completa por sprint" em vez de tabelas para todas as plataformas futuras.
Migration: `supabase/migrations/20260801_intelligence_datasets.sql` (nenhuma
migration nova foi necessária para o Instagram — ver seção dedicada abaixo).

### Tabelas

| Tabela | Por que existe |
|---|---|
| `intelligence_datasets` | O recipiente de longo prazo de uma origem de dados (`DATASETS.md`). Nasce implicitamente no primeiro Import bem-sucedido de uma Platform — nunca é criada manualmente. Hoje, 1 linha por Platform (`unique(platform)`) — o Instagram (audiência) usa uma única linha para os 4 formatos, ver "Sprint 14" abaixo. |
| `intelligence_imports` | O registro auditável de um evento de importação: qual arquivo, quando, quantos registros aceitos/rejeitados. |
| `intelligence_contents` | Uma peça de conteúdo com métricas (aqui, um vídeo do YouTube). Deduplicada por `(dataset_id, title)` via `upsert` — o CSV do YouTube Studio não traz um ID/URL estável de vídeo. O Instagram (audiência) nunca grava nesta tabela — ver `ADR-009`. |
| `intelligence_metrics` | Os fatos numéricos em si (views/watch time/... para o YouTube; seguidores/atividade/gênero/território para o Instagram), sempre amarrados ao `import_id` que os gerou. Nunca são atualizadas — cada Import insere linhas novas, preservando o histórico. `content_id` é opcional desde a migration original — é essa opcionalidade que a Sprint 14 usa para o Instagram, sem precisar de nenhuma mudança de schema. |

Todas com RLS habilitado e acesso só via `service_role` (mesmo padrão de
`newsletter_subscribers`) — são dados administrativos, sem nenhum caso de
uso de leitura pública.

**Ainda não existem**: tabela de `Platform` (continua um enum em código,
`KnownImportPlatform`) e de `Insight` — nenhuma sprint até agora precisou
gravar uma interpretação de métricas. Também não existe nenhuma tabela de
"versão" — o versionamento (`DATASETS.md` seção 4) é derivado da
cadeia `Metric.import_id` → `Import.started_at`, de propósito, para não
manter uma segunda fonte de verdade sincronizada à mão.

### Camadas de código

- `src/lib/types/intelligence.ts` — tipos de linha (snake_case, iguais às
  colunas), registrados em `src/lib/types/database.ts`. Equivalente, para o
  Intelligence, do que `cms.ts` é para o resto do CMS.
- `src/lib/services/intelligenceDatasetService.ts` — CRUD genérico e
  **agnóstico de plataforma** contra o Supabase: encontrar/criar Dataset,
  criar Import, fechar Import, fazer upsert de Content, inserir Metrics.
  Reaproveitado sem nenhuma mudança de assinatura pelo YouTube e, desde a
  Sprint 14, pelo Instagram.
- `src/lib/intelligence/imports/platforms/youtube/persistence.ts` —
  implementa `ImportPersistence<YouTubeNormalizedRecord>`
  (`imports/contracts.ts`, já definida desde a Sprint 3): só esta camada
  sabe que o payload do YouTube tem `title`/`publishedAt`/`metrics`, e
  mapeia cada registro para 1 Content + N Metrics.
- `src/lib/intelligence/imports/platforms/instagram/persistence.ts`
  (Sprint 14) — implementa `ImportPersistence<InstagramAudienceNormalizedRecord>`:
  mapeia cada registro para N Metrics **sem Content** (`upsertContent` nunca
  é chamado). Ver seção "Sprint 14 — Instagram Persistence" abaixo.

### Fluxo ao clicar em "Importar"

1. `useImportSession.confirmImport` chama a Server Action
   `confirmImportAction` (`app/admin/intelligence/importacoes/actions.ts`),
   reenviando o mesmo arquivo — desde a Sprint 14, este é um dispatcher: pela
   extensão do arquivo, delega para `importYouTubeDatasetAction` (`.csv`) ou
   `importInstagramAudienceDatasetAction` (`.xlsx`), mesma decisão que
   `previewImportAction` já toma para a Detection Preview.
2. Cada action refaz o parse + normalize do arquivo (`normalizeYouTubeStudioCsv`
   ou `normalizeInstagramAudienceRows`) — a Detection Preview só guarda o
   resumo, não os `NormalizedImportRecord[]` completos — e chama a
   respectiva `*.persist(records, batch)`.
3. YouTube: encontra ou cria o Dataset, cria o Import, e para cada registro
   faz upsert do Content e insere suas 4 Metrics. Instagram: encontra ou cria
   o Dataset único de audiência, cria o Import, e para cada registro insere
   1-2 Metrics **sem Content** (`content_id` ausente).
4. O resultado (`PersistenceReceipt`: aceitos, rejeitados, issues) volta
   para a sessão, que passa para `imported` ou `import_error` — igual para
   as duas plataformas, a UI (`ImportCenter.tsx`) não precisa saber qual foi
   usada além de ajustar o texto exibido.

---

## Matching

Conecta o Intelligence ao CMS existente: cada `Content` pode ser associado a
um `Livro` (`public.books`) cadastrado em `/admin/books`. Documento completo
(conceito, algoritmo, o que fica de fora de propósito, análises futuras
desbloqueadas): [`MATCHING.md`](MATCHING.md). Resumo:

- **Assistido, não automático** — o sistema só sugere (por similaridade de
  título, `titleSimilarity`/`suggestBookMatch` em
  `lib/intelligence/matching/`), uma pessoa sempre confirma.
- **Sem IA, sem busca semântica** — coeficiente de Dice sobre bigramas de
  caracteres, puro texto.
- **Só a referência é salva** — `intelligence_contents.book_id`, uma FK para
  `public.books.id` (`on delete set null`), nunca uma cópia de
  autor/editora/gênero/país. Migration:
  `supabase/migrations/20260801_intelligence_content_book_match.sql`.
- **UI**: `/admin/intelligence/conteudos` — lista Contents por Dataset,
  mostra "Livro sugerido" quando aplicável, com confirmação ou escolha
  manual (`src/app/admin/intelligence/conteudos/`).
- **Serviço**: `listContents`/`linkContentToBook`/`unlinkContentFromBook`
  em `intelligenceDatasetService.ts` — mesmo service genérico da
  persistência, sem duplicar acesso a dado.

---

## Dashboard

`/admin/intelligence` — a primeira tela do módulo pensada para uso, não para
configuração. Documento completo (arquitetura em camadas, por que "views"
usa a leitura mais recente e não soma, quais métricas futuras cabem sem
mudar a estrutura): [`DASHBOARD.md`](DASHBOARD.md).
Resumo:

- Um único ponto de entrada, `getIntelligenceDashboardData()`
  (`lib/services/intelligenceDashboardService.ts`), que busca tudo via
  services existentes (`listDatasets`, `listImports`, `listContents`,
  `listMetrics`, `getBooks`) e delega a agregação a uma função pura
  (`buildIntelligenceDashboardData`, `lib/intelligence/dashboard/summary.ts`).
- A página nunca importa o Supabase nem monta uma query — só chama essa
  função e desenha o resultado.
- Mostra: resumo geral (Datasets/Imports/Conteúdos/Livros associados),
  última importação, Top 10 conteúdos por views, distribuição por
  plataforma, taxa de matching (Sprint 7) e um estado vazio quando não há
  nenhum Import ainda.

---

## Insights

`/admin/intelligence` — card **"Insights"**, logo abaixo do resumo geral: o
Dashboard deixa de só mostrar números e passa a orientar o usuário, com
recomendações geradas por um pequeno **Rules Engine** — nunca IA, nunca
LLM. Documento completo (contrato `Rule`, as 5 regras iniciais, por que
`stale-dataset` e `no-recent-import` são regras diferentes, por que nada é
persistido): [`INSIGHTS.md`](INSIGHTS.md).
Resumo:

- `lib/intelligence/insights/` — módulo independente do Dashboard, uma
  regra por arquivo (`insights/rules/`), cada uma isolada, testável (função
  pura `evaluate`) e reutilizável.
- `runIntelligenceRules` roda todas as regras sobre os mesmos dados que o
  Dashboard já busca (Datasets, Imports, Contents, Metrics) — nenhuma
  consulta nova, nenhuma tabela nova, nenhum `Insight` persistido: sempre
  computado sob demanda.
- As 5 regras iniciais: Dataset desatualizado, pouco conteúdo associado,
  nenhuma importação recente, conteúdos sem Livro, plataforma sem Dataset.
- `buildIntelligenceDashboardData` já inclui `insights` no resultado —
  `intelligenceDashboardService.ts` não precisou de nenhuma mudança.

---

## UI: `/admin/intelligence/importacoes` — Import Center

A tela é o **Import Center**: um fluxo em 4 etapas visuais (Selecionar
arquivo → Detection Preview → Validação → Pronto para importar), tudo
**em memória** exceto o clique em "Importar" (que persiste de verdade —
desde a Sprint 14, para YouTube e Instagram/audiência):

1. `ImportCenter` (`components/admin/intelligence/ImportCenter.tsx`) usa o
   hook `useImportSession`, que mantém a Import Session (`lib/intelligence/session`)
   no cliente.
2. `FileDropzone` aceita `.csv` (YouTube Studio) e, desde a Sprint 13,
   `.xlsx` (audiência do Instagram) — sem distinguir plataforma na UI, quem
   decide é a Detection Preview. Ao selecionar um arquivo, a sessão entra em
   `detecting` e chama a Server Action `previewImportAction`
   (`src/app/admin/intelligence/importacoes/actions.ts`), que lê o arquivo
   como texto (`.csv`) ou como bytes binários (`.xlsx`) de acordo com a
   extensão.
3. A action delega para `previewImportFile` (`lib/intelligence/imports/preview.ts`),
   que roda o `intelligenceFileDetector` e delega ao adapter da plataforma
   detectada: `buildYouTubeImportPreview` para `youtube` (via `content`),
   `buildInstagramAudiencePreview` para `instagram` (via `buffer`).
4. Com o resultado em mãos, a sessão passa por `validating`
   (`validateImportPreview`, hoje um cálculo local simulado — sem nova
   chamada) e chega em `ready` (5 critérios ok, incluindo "persistence") ou
   `blocked` (algum falhou).
5. `ImportStepper` mostra as 4 etapas com status (concluída/atual/bloqueada/
   pendente); `ImportValidationChecklist` lista os 5 critérios com
   mensagens amigáveis; `DetectionPreviewPanel` (`ImportCenter.tsx`) mostra
   um card de preview específico por plataforma pronta —
   `YouTubeReadyPreview` ou `InstagramAudienceReadyPreview` (plataforma,
   tipo do arquivo, tipo de dataset/período quando existir, quantidade de
   registros, confiança, métricas encontradas).
6. O botão **Importar** só habilita quando a sessão chega em `ready` — o que
   inclui passar na checagem "persistence"
   (`PLATFORMS_WITH_PERSISTENCE`, `imports/platformCapabilities.ts`), desde
   a Sprint 14 verdadeira para YouTube **e** Instagram. Ao ser clicado, a
   sessão passa por `importing` e chama de verdade `confirmImportAction`
   (ver seção "Persistência" acima, que despacha para a plataforma certa),
   chegando em `imported` (com o resumo do que foi salvo) ou `import_error`
   (com a mensagem do problema).

Uma plataforma sem Adapter conectado (ou nenhuma detectada) mantém a sessão
em `blocked`, com a Validação explicando que o adapter daquela plataforma
ainda não foi implementado. O Instagram (audiência) passa nas 5 checagens
desde a Sprint 14 — Detection Preview, Preview e persistência funcionam de
ponta a ponta (ver "Sprint 14 — Instagram Persistence" abaixo). A checagem
"persistence" olha o `status` da Detection Preview além da plataforma
(`session/validation.ts`), justamente para não confundir o Instagram
Audiência (persistência real) com um eventual CSV de Instagram Reels
(mesma `platform`, sem Adapter — continua `blocked`).

---

## Estado por plataforma

| Plataforma | `columns.ts` | Detector | Adapter (parser + normalizer) | Preview | UI (Import Center) | Persistência |
|---|---|---|---|---|---|---|
| YouTube | ✅ (en/pt/es) | ✅ canônico | ✅ | ✅ (no dispatcher) | ✅ (ponta a ponta, incl. Importar) | ✅ |
| Instagram — Audiência (History/Activity/Gender/Territories) | ✅ (4 schemas) | ✅ canônico (4 detectores) | ✅ | ✅ (no dispatcher, desde a Sprint 13) | ✅ (ponta a ponta, incl. Importar, desde a Sprint 14) | ✅ (Sprint 14, Metric sem Content) |
| Instagram — Reels | ✅ esqueleto | ✅ keyword (legado) | ⏳ tipos | ❌ | ❌ | ❌ |
| TikTok | ✅ esqueleto | ✅ keyword (legado) | ⏳ tipos | ❌ | ❌ | ❌ |
| Meta Ads | ✅ esqueleto | ✅ keyword (legado) | ⏳ tipos | ❌ | ❌ | ❌ |
| Google Analytics | ✅ esqueleto | ❌ | ⏳ tipos | ❌ | ❌ | ❌ |
| Manual | ❌ | ❌ | ⏳ tipos | ❌ | ❌ | ❌ |

"Detector canônico" = `createCanonicalColumnDetector` + schema compartilhado.
"Keyword (legado)" = pontuação por substrings; deve migrar para o padrão
canônico na sprint do adapter respectivo.

Ordem de implementação definida em `AGENTS.md`: YouTube primeiro, depois
Instagram, TikTok, Meta Ads e Google Analytics. O Instagram, ao contrário
das demais, já tem duas famílias de arquivo tratadas de forma
independente (Reels ainda esqueleto; Audiência com Adapter completo) — ver
seção dedicada abaixo.

---

## Instagram — Audiência (`platforms/instagram/audience*.ts`)

Segundo Adapter completo do Intelligence, depois do YouTube. Cobre os 4
exports de audiência do Instagram — `FollowerHistory.xlsx`,
`FollowerActivity.xlsx`, `FollowerGender.xlsx`,
`FollowerTopTerritories.xlsx` — e é **independente** do
`instagramDetector`/`parser.ts` legado de Reels (mesma plataforma, dois
adapters diferentes, sem relação entre si).

### Leitura de `.xlsx`

Os 4 exports do Instagram são `.xlsx`, não CSV — `imports/xlsx.ts` lê a
primeira planilha e devolve `string[][]` (cabeçalho + linhas), usando
`exceljs` (não `xlsx`/SheetJS: a versão publicada no npm tem 2
vulnerabilidades altas sem correção — `npm audit`). O parser do Instagram
recebe essas linhas do mesmo jeito que receberia linhas de um CSV — não
sabe (e não precisa saber) de onde vieram.

### Um Adapter, 4 formatos

"Toda plataforma possui Adapter" (singular, `ARCHITECTURE_FREEZE_v0.1.md`)
continua valendo: por fora, `instagramAudienceImporter` é só um
`parser` + `normalizer`, como qualquer outro `ImporterDefinition`. Por
dentro, como os 4 exports têm cabeçalhos bem diferentes,
`instagramAudienceParser.parse()` reconhece qual dos 4 recebeu pelo
formato dos cabeçalhos (mesma `matchColumns` que o detector usa) e delega
para o módulo daquele formato (`audienceHistory.ts`, `audienceActivity.ts`,
`audienceDemographics.ts`, `audienceTerritories.ts`) — nenhum parser
genérico entre plataformas, só dispatch dentro do próprio Adapter do
Instagram.

Os 4 novos detectores em `detection/platformDetectors.ts`
(`instagramAudienceHistoryDetector` e os outros 3) compartilham
`platform: "instagram"` com o `instagramDetector` legado de Reels —
`PlatformFileDetector.platform` não tem restrição de unicidade
(`detection/types.ts`), então isso não exige nenhuma mudança no motor de
detecção (`IntelligenceFileDetector` já pontua todos e escolhe o melhor).

### Datas pt-BR sem ano

`FollowerHistory` e `FollowerActivity` trazem datas como `"31 de julho"` —
pt-BR, sem ano. `audienceDate.ts` resolve o ano andando de trás para
frente a partir de uma `referenceDate` (default "agora", parametrizável
para os testes): ancora a última linha (mais recente) ao ano da
referência e decrementa o ano de cada linha anterior sempre que o mês
"voltar" (a virada dezembro→janeiro no meio do arquivo).

### Dataset kind — `InstagramDatasetKind`

Cada um dos 4 formatos gera um `datasetKind` explícito no `payload` do
`NormalizedImportRecord` (`audience_history | audience_activity |
audience_demographics | audience_territories`,
`platforms/instagram/audienceTypes.ts`). Deliberadamente:

- É um tipo **local ao Instagram**, não um campo novo em
  `imports/types.ts`/`contracts.ts` — nenhuma mudança em tipo/contrato
  compartilhado entre plataformas, sem ADR.
- Generaliza "múltiplos dataset kinds por plataforma": uma plataforma
  futura com mais de uma família de dados (ex.: um TikTok com audiência
  **e** campanhas pagas) define seu próprio tipo assim
  (`TikTokDatasetKind`), sem um enum global compartilhado entre
  plataformas para colidir.
- Era, ao ser desenhado (Sprint 12/13), visto como o campo que uma sprint
  futura de persistência do Instagram usaria para implementar a chave
  composta `(platform, kind)` em `intelligence_datasets`, prevista no
  comentário da própria migration
  (`supabase/migrations/20260801_intelligence_datasets.sql`). A análise da
  Sprint 14 ([`AUDIENCE_PERSISTENCE.md`](AUDIENCE_PERSISTENCE.md) seção 1.1)
  concluiu que isso **não** é necessário enquanto os 4 formatos coexistem
  sob a mesma `platform: "instagram"` sem colidir entre si — `datasetKind`
  segue existindo e sendo usado, só que como parte da convenção de `Metric.key`
  (`persistence.ts`) em vez de uma chave do Dataset. `(platform, kind)`
  continua reservado para o dia em que uma segunda família "em formato de
  conteúdo" (ex.: Reels) precisar de um Dataset próprio ao lado da
  Audiência — ver `ADR-009`.

### Preview plugado no dispatcher e na UI (Sprint 13)

`buildInstagramAudiencePreview()` (`audiencePreview.ts`) roda o fluxo
completo (Detection Preview → Adapter → `NormalizedImportRecord[]` →
resumo) inteiramente em memória, do mesmo jeito que
`buildYouTubeImportPreview`. Desde a Sprint 13 ("Instagram UI
Integration") está registrado em `previewImportFile`
(`imports/preview.ts`, o dispatcher que a tela de Importações chama) e
visível de ponta a ponta na UI — ver seção dedicada abaixo.

O preview também ganhou `metrics: InstagramAudienceMetricSummary[]`
(computado por `summarizeInstagramAudienceMetrics`, dentro do próprio
`audiencePreview.ts`) — mesmo papel que `YouTubeImportPreview.metrics`
cumpre para o YouTube, mas com um cálculo por `datasetKind` já que cada
formato é um domínio diferente: seguidores mais recentes + variação
líquida (`audience_history`), pico/média de seguidores ativos
(`audience_activity`), ou uma métrica por linha sem agregação (gênero/
território, que já são um pequeno conjunto de valores).

### Fora do escopo desta sprint (de propósito)

- Persistência (`platforms/instagram/persistence.ts` não existe;
  `intelligenceDatasetService.ts` não mudou).
- UI (`FileDropzone`, `ImportCenter.tsx`, `useImportSession.ts`,
  `importacoes/actions.ts`, e o dispatcher `imports/preview.ts` continuam
  intocados).
- Dashboard, Questions, Decisions e Workspace — nenhum deles conhece
  arquivos do Instagram (nem sabe que existem); todos operam sobre o
  modelo canônico (`Dataset`/`Content`/`Metric`), que só passa a existir
  quando uma sprint futura implementar a persistência.
- TikTok — a existência do export "TikTok Promotions" só influenciou o
  desenho do `datasetKind` acima; nenhum detector/parser/`columns.ts` de
  TikTok foi criado.

(Esta lista descreve o estado ao fim da sprint "Instagram Audience
Adapter" — ver "Sprint 13 — Instagram UI Integration" abaixo para o que
mudou a seguir: UI e dispatcher deixaram de estar fora de escopo; e
"Sprint 14 — Instagram Persistence" para quando a persistência, adiada
aqui, finalmente foi implementada.)

---

## Sprint 13 — Instagram UI Integration

Conecta o Instagram (audiência) ao fluxo real de importação da UI — sem
alterar Dashboard, Questions, Decisions, Workspace, Rules Engine, Matching,
o Dataset Model ou a Architecture Freeze.

### O que mudou

- **`FileDropzone`** aceita `.xlsx` além de `.csv` (`accept` do `<input>` +
  texto de instrução), sem alterar o comportamento existente do YouTube.
- **`imports/preview.ts`** (`previewImportFile`) passou a aceitar
  `{ file, buffer }` além de `{ file, content }`: quando recebe `buffer`,
  delega inteiramente a `buildInstagramAudiencePreview` (que já faz sua
  própria detecção a partir do cabeçalho extraído do `.xlsx`).
  `ImportPreviewReady` virou uma união discriminada por `platform`
  (`ImportPreviewReadyYouTube | ImportPreviewReadyInstagram`).
- **`session/validation.ts`** ganhou um 5º critério, `persistence`: passa
  só quando a plataforma detectada está em `PLATFORMS_WITH_PERSISTENCE`
  (novo `imports/platformCapabilities.ts`) — hoje só o YouTube. Structure e
  metrics continuam avaliando exclusivamente se o Adapter conseguiu
  processar o arquivo (verdadeiro para o Instagram desde esta sprint).
- **`session/summary.ts`** achata a preview pronta do Instagram do mesmo
  jeito que já fazia para o YouTube (`platform`, `confidence`, `period`,
  `recordCount`, `metrics`), lendo os novos campos de
  `InstagramAudiencePreview` sem nenhum cálculo próprio.
- **`app/.../actions.ts`**: `previewYouTubeImportAction` virou
  `previewImportAction` — decide ler o arquivo como texto (`.csv`) ou como
  bytes binários (`.xlsx`) pela extensão antes de chamar
  `previewImportFile`. `importYouTubeDatasetAction` (a persistência real)
  não mudou.
- **`ImportCenter.tsx`** ganhou `InstagramAudienceReadyPreview`, espelhando
  `YouTubeReadyPreview` — plataforma, tipo do arquivo, tipo de dataset
  (`INSTAGRAM_DATASET_KIND_LABELS`), período (quando existe), quantidade de
  registros, confiança e métricas encontradas.

### Por que o botão Importar ficou bloqueado para o Instagram (nesta sprint)

O roadmap tratou "Instagram UI Integration" (Sprint 13) e "Instagram
Persistence" (Sprint 14) como sprints separadas. Mapear os 4 formatos de
audiência (séries temporais e distribuições, sem um "título" natural) para
o modelo `Content`/`Metric` atual — pensado para peças de conteúdo como um
vídeo — era uma decisão de design própria, não um simples "reusar como
está": por isso persistência ficou fora desta sprint, e a checagem
"persistence" comunicava isso explicitamente na própria tela
(`ImportValidationChecklist`) em vez de deixar o usuário achar que a
importação ia funcionar e falhar silenciosamente. **Resolvido na Sprint 14**
— ver seção dedicada abaixo.

### Evidência do fluxo completo (nesta sprint)

- `previewImportFile`/`previewImportAction`: `imports/preview.test.ts`,
  `app/admin/intelligence/importacoes/actions.test.ts` — um `.xlsx` real
  (`FollowerHistory.xlsx`) chega em `ready`/`platform: "instagram"` pela
  mesma fronteira que a UI chama.
- `validateImportPreview`/`summarizeImportPreview`:
  `session/validation.test.ts`, `session/summary.test.ts` — o Instagram
  passa em `file`/`platform`/`structure`/`metrics` e reprovava só em
  `persistence` (Sprint 14 atualizou estes mesmos testes para refletir que
  os 5 critérios passam agora).
- `useImportSession.test.tsx` (describe original "Instagram — Sprint 13,
  sem persistência"): renderizava o hook real (React + jsdom), selecionava
  um `.xlsx` de audiência, e confirmava que a sessão chegava em `blocked`
  (nunca `ready`), e que `confirmImport()` não chamava nenhuma Server
  Action de persistência. Esse describe foi **substituído** na Sprint 14
  por "Instagram — Sprint 14, com persistência" (mesmo arquivo) — ver
  seção dedicada abaixo para a evidência atualizada.

---

## Sprint 14 — Instagram Persistence

Implementa a persistência real dos 4 formatos de audiência do Instagram
(`FollowerHistory`, `FollowerActivity`, `FollowerGender`,
`FollowerTopTerritories`), seguindo ao pé da letra a recomendação de
[`AUDIENCE_PERSISTENCE.md`](AUDIENCE_PERSISTENCE.md) (etapa de design da
mesma sprint): **Metric sem Content**, um único Dataset, zero migration,
zero tabela nova. Registrada como `ADR-009` em
[`DECISIONS.md`](DECISIONS.md#adr-009).

### O que mudou

- **`platforms/instagram/persistence.ts`** (novo) — `instagramAudiencePersistence`,
  implementando `ImportPersistence<InstagramAudienceNormalizedRecord>`.
  Reaproveita `findOrCreateDataset`/`createImport`/`insertMetrics`/`finalizeImport`
  de `intelligenceDatasetService.ts` sem nenhuma mudança de assinatura; nunca
  chama `upsertContent`. Um único Dataset (`platform: "instagram"`, nome
  `"Instagram — Audiência"`) cobre os 4 `datasetKind`, diferenciados pela
  `key` de cada `Metric`:

  | `datasetKind` | `key` | `measured_at` |
  |---|---|---|
  | `audience_history` | `followers`, `followersDelta` | a própria data do dia (meia-noite UTC) |
  | `audience_activity` | `activeFollowers` | data + hora do registro |
  | `audience_demographics` | `gender:<label>` (ex.: `gender:Male`) | `batch.createdAt` (data do Import — é um retrato, sem data própria) |
  | `audience_territories` | `territory:<código>` (ex.: `territory:BR`) | `batch.createdAt` |

- **`imports/platformCapabilities.ts`** e
  **`insights/rules/platformWithoutDataset.ts`** — `PLATFORMS_WITH_PERSISTENCE`
  passou de `["youtube"]` para `["youtube", "instagram"]` nas duas listas
  (mantidas propositalmente separadas desde a Sprint 13).
- **`session/validation.ts`** — a checagem "persistence" passou a depender
  também de `structureOk` (não só da `platform`), não só de
  `PLATFORMS_WITH_PERSISTENCE`: o Instagram tem duas famílias de arquivo sob
  a mesma `platform` (Reels, sem Adapter, e Audiência, com persistência) —
  sem essa correção um CSV de Reels seria incorretamente aprovado na
  checagem de persistência só por "instagram" estar na lista.
- **`app/.../actions.ts`** — `confirmImportAction` (novo, dispatcher):
  decide pela extensão do arquivo se chama `importYouTubeDatasetAction`
  (inalterada) ou `importInstagramAudienceDatasetAction` (novo — mesma
  forma da action do YouTube, mas lê `.xlsx` via `parseXlsxToRows` e chama
  `instagramAudiencePersistence.persist`).
- **`useImportSession.ts`** — `confirmImport` passou a chamar
  `confirmImportAction` em vez de `importYouTubeDatasetAction` diretamente;
  o hook não precisa saber qual plataforma está em jogo.
- **`ImportCenter.tsx`** / **`FileDropzone.tsx`** — textos que assumiam
  "só o YouTube confirma a importação até o fim" generalizados; o resumo
  final ("Importação concluída") e a mensagem de "Salvando..." agora variam
  por plataforma (`"vídeo(s) salvos no Dataset do YouTube"` vs.
  `"registro(s) de audiência salvos no Dataset do Instagram"`).

### Por que nenhuma migration foi necessária

`intelligence_metrics.content_id` já era `nullable` desde a migration
original (`20260801_intelligence_datasets.sql`) e `DATA_MODEL.md` já previa
esse caso ("quando o dado é do nível do próprio Dataset... associa-se
diretamente ao Dataset, sem Content") desde a Sprint 3 — o achado central de
`AUDIENCE_PERSISTENCE.md`. `(platform, kind)` como chave composta do
Dataset, cogitado desde a Sprint 12, **não** foi necessário: os 4 formatos
não competem pela mesma identidade de dado, só diferem na convenção de
`Metric.key` acima.

### O que continua fora de escopo (de propósito)

- **Dashboard** — o Instagram (audiência) ainda não aparece em nenhuma
  leitura do Dashboard (`Top 10 por Content`, distribuição por plataforma
  já mostra o Dataset, mas sem Contents); adaptar essas leituras para um
  Dataset "em formato de audiência" é a **Sprint 15 — Instagram Dataset +
  Dashboard**, já prevista no roadmap.
- **Regra de Insight `low-content-volume`** — vai apontar "Instagram tem só
  0 conteúdo(s) importado(s)" permanentemente, um falso positivo, assim que
  o primeiro Import de audiência acontecer de verdade (antes desta sprint
  isso era só uma preocupação teórica, sem Dataset real para disparar).
  Ajustar a regra é trabalho da Sprint 15 (`AUDIENCE_PERSISTENCE.md` seção 5).
- **`(platform, kind)` em `intelligence_datasets`** — continua não
  implementado; só necessário se o Instagram ganhar um segundo Adapter "em
  formato de conteúdo" (ex.: Reels) que precise de um Dataset próprio ao
  lado da Audiência (`ADR-009`).
- **Matching (Content ↔ Livro)** — não se aplica: o Instagram (audiência)
  nunca cria `Content`.

### Evidência do fluxo completo

Para os 4 arquivos `.xlsx` reais (`test-data/instagram/`):

- `platforms/instagram/persistence.test.ts` — testes unitários de
  `instagramAudiencePersistence.persist` com dados sintéticos, cobrindo os 4
  `datasetKind`, falha ao criar Dataset/Import, e registros individuais que
  falham sem interromper os demais (mesmo padrão de
  `youtube/persistence.test.ts`).
- `platforms/instagram/persistence.endToEnd.test.ts` (novo) — roda o
  dispatcher de produção `previewImportFile` sobre os 4 `.xlsx` reais
  (`FollowerHistory.xlsx`, `FollowerActivity.xlsx`, `FollowerGender.xlsx`,
  `FollowerTopTerritories.xlsx`) e entrega os `NormalizedImportRecord[]`
  resultantes para `instagramAudiencePersistence.persist` de verdade — só a
  fronteira de rede (`intelligenceDatasetService`) é mockada, sem Supabase
  local disponível neste ambiente. Confirma, com os números reais das
  fixtures: 30/144/3/6 registros aceitos, 60/144/3/6 linhas de Metric
  gravadas (History gera 2 métricas por dia), nenhuma com `content_id`, um
  único `findOrCreateDataset` por arquivo, e `PersistenceReceipt.status ===
  "persisted"` em todos os 4 casos.
- `session/validation.test.ts` — o Instagram passa nos 5 critérios
  (`file`/`platform`/`structure`/`metrics`/`persistence`), mantendo a
  cobertura de que um CSV de Reels (mesma `platform`, sem Adapter) continua
  reprovando em `structure`/`persistence`.
- `insights/engine.test.ts`, `insights/rules/platformWithoutDataset.test.ts`
  — `platform-without-dataset` agora dispara para YouTube **e** Instagram
  quando nenhum Dataset existe ainda, e para nenhum dos dois quando os dois
  já têm Dataset.
- `useImportSession.test.tsx` (describe "Instagram — Sprint 14, com
  persistência") — renderiza o hook real (React + jsdom), seleciona um
  `.xlsx` de audiência usando o `previewImportAction` real de produção (só
  `confirmImportAction` é mockada), confirma que a sessão chega em `ready`
  (não mais `blocked`), e que `confirmImport()` chama a Server Action e
  chega em `imported`.

Rodado ao final da sprint: `npx tsc --noEmit` sem erros, `npx eslint .` sem
erros (3 warnings pré-existentes, não relacionados), `npx vitest run` — 394
testes passando em 76 arquivos (0 falhas).

---

## Como adicionar uma nova plataforma (quando chegar a vez)

Siga o padrão de **colunas canônicas** (seção acima). O YouTube é a
referência completa; Instagram/TikTok/Meta Ads/GA já têm `columns.ts`
esqueleto.

1. **`platforms/<plataforma>/columns.ts`** — complete o
   `CanonicalColumnSchema` (aliases por idioma, `required`, `optional`).
   Este é o único mapa de cabeçalhos da plataforma.
2. **Detector** em `detection/platformDetectors.ts`:
   `createCanonicalColumnDetector({ platform, schema, brandHints })`
   apontando para o schema do passo 1 — nunca uma lista de strings
   paralela.
3. **Fixtures** em `test-data/<plataforma>/` (pelo menos um CSV no idioma
   principal da conta; idealmente também um em outro idioma).
4. **Parser + normalizer** em `platforms/<plataforma>/parser.ts` —
   resolva índices com `matchColumns(schema, headers)` e leia células com
   `getColumnValue`. Ignore colunas desconhecidas e linhas agregadas
   (sem identidade). Implemente `PlatformParserContract` +
   `ImportNormalizer` só dessa plataforma.
5. **Preview** (`preview.ts`) específico, se a UI precisar de resumo
   amigável antes de persistir.
6. Registrar em `previewImportFile` (`imports/preview.ts`) para o
   dispatcher chamar o novo adapter em vez de retornar `unsupported`.
7. **`persistence.ts`** implementando `ImportPersistence` — mapeia o
   payload normalizado para Content/Metric, reusando
   `intelligenceDatasetService.ts`. Ver `platforms/youtube/persistence.ts`.
8. **Testes** cobrindo: CSV em inglês e em outro idioma, ordem diferente
   das colunas, colunas extras, linha agregada (quando existir), ausência
   de coluna obrigatória, aliases misturados, detector usando o mesmo
   schema.

---

## Próxima sprint

O modelo canônico, o Import Center, o design da experiência de Dataset
([`DATASETS.md`](DATASETS.md)), a primeira persistência real (Dataset
+ Import + Content + Metric do YouTube), o Matching assistido Content ↔
Livro ([`MATCHING.md`](MATCHING.md)), o primeiro
Dashboard funcional ([`DASHBOARD.md`](DASHBOARD.md))
e o Rules Engine de Insights
([`INSIGHTS.md`](INSIGHTS.md)) já estão
prontos. Falta:

- A tela `/admin/intelligence/importacoes` evoluir para a Lista de Datasets
  desenhada em [`DATASETS.md`](DATASETS.md#51-lista-de-datasets) e o
  Dataset Detail ([`DATASETS.md`](DATASETS.md#52-dataset-detail)),
  passando a mostrar os Datasets/Imports reais em vez de placeholders — a
  tabela "Histórico de importações" hoje sempre vazia nesta página já pode
  ser preenchida a partir de `intelligence_imports`. A tela de Matching
  (`/admin/intelligence/conteudos`) provavelmente vira uma aba desse Dataset
  Detail, em vez de uma lista plana entre todos os Datasets.
- Análises cruzadas com metadados do Livro (autor, editora, gênero, país,
  nacionais, clássicos —
  `MATCHING.md#5-que-análises-isso-desbloqueia`), agora que o
  Dashboard já tem a estrutura (`dashboard/summary.ts`) pronta para receber
  novas funções puras de agregação sem alterar services nem página.
- Novas regras no Rules Engine à medida que surgir necessidade real (ex.:
  cruzando Metric histórico para "queda de desempenho", ou usando
  `Content.book_id` para regras por autor/gênero) — a estrutura
  (`insights/rules/`) já comporta sem mudar o motor.
- ~~Sprint 14 — Instagram Persistence~~ — **concluída** (ver seção dedicada
  acima): `platforms/instagram/persistence.ts`, reusando
  `intelligenceDatasetService.ts`. Ao contrário do que se cogitava em
  sprints anteriores, **não** usou `(platform, kind)` como chave do Dataset
  — `AUDIENCE_PERSISTENCE.md` concluiu que isso não era necessário (ver
  `ADR-009`). A checagem "persistence" (`session/validation.ts`) já passa
  para o Instagram e o botão Importar saiu do bloqueio descrito em "Sprint
  13 — Instagram UI Integration" acima.
- **Sprint 15 — Instagram Dataset + Dashboard**: agora que o Instagram tem
  um Dataset real de audiência (Metric sem Content), ensinar o Dashboard a
  exibir esse tipo de Dataset sem quebrar a leitura atual (Top 10 por
  Content/views, etc.), pensada para o YouTube — e ajustar a regra de
  Insight `low-content-volume` para não apontar falso positivo em Datasets
  audience-shaped (`AUDIENCE_PERSISTENCE.md` seção 5).
- Reels do Instagram (`platforms/instagram/parser.ts`, hoje só stub) e os
  próximos adapters na ordem definida em `AGENTS.md`: TikTok, Meta Ads,
  Google Analytics — cada um com detector, parser/normalizer, preview e
  persistence próprios. Matching, Dashboard e Insights já funcionam para
  qualquer plataforma futura sem alteração — Insights só precisa que a
  nova plataforma entre em `PLATFORMS_WITH_PERSISTENCE`
  (`insights/rules/platformWithoutDataset.ts`) quando seu `persistence.ts`
  existir.
