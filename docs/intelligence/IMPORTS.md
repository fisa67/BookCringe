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
├── index.ts              # Barrel público do módulo
├── preview.ts            # Dispatcher genérico: detecta a plataforma e delega
│                          # ao adapter correspondente (hoje só YouTube)
├── preview.test.ts
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
│   │   ├── columns.ts          # Schema esqueleto (padrão pronto; adapter ainda não)
│   │   └── parser.ts
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
    ├── instagram/instagram-reels-insights.csv
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

Instagram/TikTok/Meta Ads/Google Analytics já têm `columns.ts` esqueleto
(aliases iniciais das fixtures atuais). Ainda usam detector por
palavras-chave até a sprint do adapter respectivo — nessa sprint, basta
trocar para `createCanonicalColumnDetector({ schema: ... })` e implementar
o parser com `matchColumns`.

### `src/lib/intelligence/session/` — Import Session

Camada que existe entre o pipeline (`imports/`) e a UI: representa o
progresso do usuário pelo fluxo de importação (arquivo → preview →
validação → pronto), inteiramente em memória, sem depender de React.

```
session/
├── types.ts        # ImportSession, ImportSessionStage, ImportSessionSummary
├── summary.ts        # achata um ImportPreviewResult no formato da sessão
├── validation.ts      # deriva os 4 critérios de Validação a partir do preview
├── stepper.ts          # mapeia o stage da sessão pro status visual de cada etapa
├── index.ts             # barrel público do módulo
└── *.test.ts             # um teste por arquivo acima
```

Nenhum arquivo deste módulo persiste dado algum nem reprocessa o arquivo —
tudo é derivado do `ImportPreviewResult` que o pipeline já calculou.

---

## Persistência

Implementada apenas para o YouTube — o mínimo necessário para o botão
**Importar** gravar de verdade, seguindo a filosofia de "uma funcionalidade
completa por sprint" em vez de tabelas para todas as plataformas futuras.
Migration: `supabase/migrations/20260801_intelligence_datasets.sql`.

### Tabelas

| Tabela | Por que existe |
|---|---|
| `intelligence_datasets` | O recipiente de longo prazo de uma origem de dados (`DATASETS.md`). Nasce implicitamente no primeiro Import bem-sucedido de uma Platform — nunca é criada manualmente. Hoje, 1 linha por Platform (`unique(platform)`). |
| `intelligence_imports` | O registro auditável de um evento de importação: qual arquivo, quando, quantos registros aceitos/rejeitados. |
| `intelligence_contents` | Uma peça de conteúdo com métricas (aqui, um vídeo). Deduplicada por `(dataset_id, title)` via `upsert` — o CSV do YouTube Studio não traz um ID/URL estável de vídeo. |
| `intelligence_metrics` | Os fatos numéricos em si (views, watch time, impressions, subscribers), sempre amarrados ao `import_id` que os gerou. Nunca são atualizadas — cada Import insere linhas novas, preservando o histórico. |

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
  Qualquer adapter futuro (Instagram, TikTok...) reusa estas mesmas funções.
- `src/lib/intelligence/imports/platforms/youtube/persistence.ts` —
  implementa `ImportPersistence<YouTubeNormalizedRecord>`
  (`imports/contracts.ts`, já definida desde a Sprint 3): só esta camada
  sabe que o payload do YouTube tem `title`/`publishedAt`/`metrics`, e
  mapeia cada registro para 1 Content + N Metrics.

### Fluxo ao clicar em "Importar"

1. `useImportSession.confirmImport` chama a Server Action
   `importYouTubeDatasetAction` (`app/admin/intelligence/importacoes/actions.ts`),
   reenviando o mesmo arquivo.
2. A action refaz o parse + normalize (`normalizeYouTubeStudioCsv`) — a
   Detection Preview só guarda o resumo, não os
   `NormalizedImportRecord[]` completos — e chama
   `youtubeStudioPersistence.persist(records, batch)`.
3. `persist` encontra ou cria o Dataset do YouTube, cria o Import, e para
   cada registro faz upsert do Content e insere suas 4 Metrics.
4. O resultado (`PersistenceReceipt`: aceitos, rejeitados, issues) volta
   para a sessão, que passa para `imported` ou `import_error`.

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
**em memória**, sem persistir nada:

1. `ImportCenter` (`components/admin/intelligence/ImportCenter.tsx`) usa o
   hook `useImportSession`, que mantém a Import Session (`lib/intelligence/session`)
   no cliente.
2. Ao selecionar um arquivo (`FileDropzone`), a sessão entra em `detecting`
   e chama a Server Action `previewYouTubeImportAction`
   (`src/app/admin/intelligence/importacoes/actions.ts`) — a mesma da Sprint 2,
   inalterada.
3. A action delega para `previewImportFile` (`lib/intelligence/imports/preview.ts`),
   que roda o `intelligenceFileDetector` e, se a plataforma for `youtube`,
   o parser + normalizer do YouTube Studio (`buildYouTubeImportPreview`).
4. Com o resultado em mãos, a sessão passa por `validating`
   (`validateImportPreview`, hoje um cálculo local simulado — sem nova
   chamada) e chega em `ready` (4 critérios ok) ou `blocked` (algum falhou).
5. `ImportStepper` mostra as 4 etapas com status (concluída/atual/bloqueada/
   pendente); `ImportValidationChecklist` lista os critérios com mensagens
   amigáveis.
6. O botão **Importar** só habilita quando a sessão chega em `ready`. Ao ser
   clicado, a sessão passa por `importing` e chama de verdade
   `importYouTubeDatasetAction` (ver seção "Persistência" acima), chegando
   em `imported` (com o resumo do que foi salvo) ou `import_error` (com a
   mensagem do problema).

Qualquer outra plataforma detectada (ou nenhuma) mantém a sessão em
`blocked`, com a Validação explicando que o adapter daquela plataforma
ainda não foi implementado.

---

## Estado por plataforma

| Plataforma | `columns.ts` | Detector | Adapter (parser + normalizer) | Preview | Persistência |
|---|---|---|---|---|---|
| YouTube | ✅ (en/pt/es) | ✅ canônico | ✅ | ✅ | ✅ |
| Instagram | ✅ esqueleto | ✅ keyword (legado) | ⏳ tipos | ❌ | ❌ |
| TikTok | ✅ esqueleto | ✅ keyword (legado) | ⏳ tipos | ❌ | ❌ |
| Meta Ads | ✅ esqueleto | ✅ keyword (legado) | ⏳ tipos | ❌ | ❌ |
| Google Analytics | ✅ esqueleto | ❌ | ⏳ tipos | ❌ | ❌ |
| Manual | ❌ | ❌ | ⏳ tipos | ❌ | ❌ |

"Detector canônico" = `createCanonicalColumnDetector` + schema compartilhado.
"Keyword (legado)" = pontuação por substrings; deve migrar para o padrão
canônico na sprint do adapter respectivo.

Ordem de implementação definida em `AGENTS.md`: YouTube primeiro, depois
Instagram, TikTok, Meta Ads e Google Analytics.

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
- Os próximos adapters, na ordem definida em `AGENTS.md`: Instagram, TikTok,
  Meta Ads, Google Analytics — cada um com detector, parser/normalizer,
  preview e persistence próprios, reusando `intelligenceDatasetService.ts`
  para a parte agnóstica de plataforma. Matching, Dashboard e Insights já
  funcionam para qualquer plataforma futura sem alteração — Insights só
  precisa que a nova plataforma entre em `PLATFORMS_WITH_PERSISTENCE`
  (`insights/rules/platformWithoutDataset.ts`) quando seu `persistence.ts`
  existir.
