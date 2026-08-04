# Audience Persistence — Sprint 14 (Design)

> **Atualização — implementação concluída.** Este documento nasceu como a
> etapa de design da Sprint 14 (texto original abaixo, preservado como
> registro histórico). A implementação seguiu **exatamente** a recomendação
> da seção 7, na mesma Sprint 14 — ver
> [`IMPORTS.md`](IMPORTS.md#sprint-14--instagram-persistence) para o que
> mudou de fato (`platforms/instagram/persistence.ts`, `PLATFORMS_WITH_PERSISTENCE`,
> `confirmImportAction`) e `ADR-009` (agora registrado em
> [`DECISIONS.md`](DECISIONS.md#adr-009)). As referências abaixo a "proposto,
> ainda não registrado" e a listas do que "este documento não faz" descrevem
> o estado no momento do design, não o estado atual.

**Esta era uma etapa de design, anterior à implementação.** Nenhum código
tinha sido alterado, nenhuma migration criada, nenhum `persistence.ts`
escrito. Este documento respondia às 6 perguntas colocadas para a Sprint 14
e terminava com uma recomendação final — a implementação seguiu essa
recomendação ao pé da letra, na mesma sprint (mesmo padrão já usado por
[`DATASETS.md`](DATASETS.md) (Sprint 5, design) → persistência real
(Sprint 6)).

## Contexto

A Sprint 13 ("Instagram UI Integration", [`IMPORTS.md`](IMPORTS.md#sprint-13--instagram-ui-integration))
implementou o Adapter completo do Instagram Audience — 4 formatos, cada um
com seu próprio `datasetKind`
(`src/lib/intelligence/imports/platforms/instagram/audienceTypes.ts`):

| `datasetKind` | Nome de produto | Formato do dado |
|---|---|---|
| `audience_history` | FollowerHistory | série temporal diária: seguidores totais + variação líquida |
| `audience_activity` | FollowerActivity | série temporal por (dia, hora): seguidores ativos |
| `audience_demographics` | FollowerGender | distribuição num instante: um valor por gênero (Male/Female/Other) |
| `audience_territories` | FollowerTopTerritories | distribuição num instante: um valor por território |

Nenhum dos 4 tem um "título" ou identificador de item individual — a
diferença estrutural que motivou esta sprint. O modelo canônico hoje é:

```
Dataset ──▶ Import ──▶ Content ──▶ Metric
```

e foi desenhado, até agora, só a partir do YouTube: cada linha do CSV do
Studio *é* um vídeo (um Content) com métricas (views, watch time...). O
Instagram Audience não tem "vídeos" — tem fatos sobre a conta como um todo,
ao longo do tempo ou distribuídos por categoria.

Este documento usa como base [`DATA_MODEL.md`](DATA_MODEL.md) (modelo
conceitual), [`DATASETS.md`](DATASETS.md) (ciclo de vida do Dataset),
[`MATCHING.md`](MATCHING.md), [`DASHBOARD.md`](DASHBOARD.md),
[`INSIGHTS.md`](INSIGHTS.md), [`QUESTIONS.md`](QUESTIONS.md),
[`DECISIONS_ENGINE.md`](DECISIONS_ENGINE.md),
[`ARCHITECTURE_FREEZE_v0.1.md`](ARCHITECTURE_FREEZE_v0.1.md) e o schema real
em `supabase/migrations/20260801_intelligence_datasets.sql`.

---

## 1. Como o Instagram Audience deve ser persistido?

**Recomendação: reaproveitar exatamente o schema e os services que já
existem, sem Content, sem migration.** O achado central desta análise é que
isso já é suportado hoje, sem qualquer alteração:

- `intelligence_metrics.content_id` já é **nullable** na migration original
  (`content_id uuid references public.intelligence_contents(id) on delete
  cascade` — sem `not null`).
- `DATA_MODEL.md#metric` já previa exatamente este caso, desde a Sprint 3:
  > "quando o dado é do nível do próprio Dataset — sem um item individual
  > sendo medido, como **métricas agregadas de audiência de um canal** —
  > associa-se diretamente ao Dataset, sem Content."
- `insertMetrics`/`IntelligenceMetricCreate` (`intelligenceDatasetService.ts`)
  já aceitam `content_id` como campo opcional — nenhuma assinatura de função
  muda.
- `DATASETS.md#53-estado-vazio` já previa uma aba "Conteúdos" vazia para um
  Dataset "que só trouxe métricas agregadas, sem itens individuais".

Ou seja: o modelo canônico **já tinha um encaixe pronto** para este caso —
Sprint 13 só foi a primeira vez que um Adapter real bateu nele.

### 1.1 Dataset — uma única linha, sem migration

Um único Dataset `platform: "instagram"`, nome `"Instagram — Audiência"`,
cobre os 4 formatos. Eles não competem pela mesma identidade de dado: são
quatro *famílias de métrica* dentro do mesmo domínio ("audiência da conta"),
não quatro relatórios sobre coisas diferentes. Isso significa que a
constraint atual, `unique(platform)`, **não precisa mudar** para esta
sprint — `findOrCreateDataset({ platform: "instagram", name: "Instagram —
Audiência" })` funciona sem alteração alguma no service.

> Isso revisa a expectativa registrada em `IMPORTS.md` ("Sprint 14 ...
> provavelmente o primeiro caso real de `(platform, kind)` como chave do
> Dataset") — ver seção 4 abaixo para onde `(platform, kind)` continua sendo
> necessário no futuro, só que por um motivo diferente do que se imaginava.

### 1.2 Metric — convenção de `key` por formato, sem Content

Cada formato mapeia para uma ou mais linhas de `Metric` com `content_id:
null`, usando `measured_at` para carregar a dimensão temporal e `key` para
carregar a dimensão categórica (gênero, território):

| `datasetKind` | `key` sugerida | `measured_at` | `value` |
|---|---|---|---|
| `audience_history` | `followers` | data do dia (meia-noite) | seguidores totais naquele dia |
| `audience_history` | `followersDelta` | data do dia | variação líquida naquele dia |
| `audience_activity` | `activeFollowers` | timestamp do (dia, hora) | seguidores ativos naquela hora |
| `audience_demographics` | `gender:<label>` (ex. `gender:male`) | data/hora do Import | fração de distribuição (0–1) |
| `audience_territories` | `territory:<código>` (ex. `territory:BR`) | data/hora do Import | fração de distribuição (0–1) |

`gender:<label>`/`territory:<código>` usam o mesmo princípio já aplicado
pelo YouTube (uma `key` por métrica reportada, sem enum fixo no banco — `key
text not null`, sem `check`) — só que com a categoria embutida na própria
`key`, já que a tabela não tem uma coluna de dimensão separada (ver
discussão de trade-off na seção 3).

### 1.3 Esboço ilustrativo (não implementado)

Só para tornar concreto o que a seção 1.1/1.2 descreve — **pseudocódigo,
não escrito nesta sprint**, no mesmo formato de
`platforms/youtube/persistence.ts`:

```ts
// ILUSTRATIVO — não criado nesta sprint.
export const instagramAudiencePersistence: ImportPersistence<InstagramAudienceNormalizedRecord> = {
  async persist(records, batch) {
    const dataset = await findOrCreateDataset({
      platform: "instagram",
      name: "Instagram — Audiência",
    });
    const importRow = await createImport({ dataset_id: dataset.id, file_name: batch.files[0]?.name });

    const metrics = records.flatMap((record) => toAudienceMetrics(record, dataset.id, importRow.id));
    // toAudienceMetrics: 1 função pura por datasetKind, devolvendo
    // IntelligenceMetricCreate[] sem content_id — a única peça de código
    // realmente nova, análoga ao "Object.entries(payload.metrics)" do YouTube.
    await insertMetrics(metrics);
    await finalizeImport({ id: importRow.id, status: "completed", ... });
  },
};
```

Note que **nenhuma chamada a `upsertContent` existe** — essa é a mudança
central em relação ao YouTube.

---

## 2. É possível reutilizar `intelligence_metrics` sem criar Contents artificiais?

**Sim, integralmente, sem qualquer alteração de schema ou de service.**
Já demonstrado na seção 1: `content_id` é opcional na tabela e nas funções
de escrita/leitura desde a Sprint 6. A pergunta original nasceu de um medo
razoável (forçar 4 formatos sem "título" dentro de um modelo pensado para
vídeos), mas o próprio modelo já reservava esse caminho — só nunca tinha
sido exercitado por nenhum Adapter até a Sprint 13.

Consequência prática relevante: **nenhum Content artificial deve ser
criado** (ex.: um Content fake por dia, "Instagram — 2026-07-25", só para
pendurar a métrica `followers`). Isso seria estritamente pior que a solução
proposta:

- Poluiria a tela de Matching (`/admin/intelligence/conteudos`,
  [`MATCHING.md`](MATCHING.md)) com centenas de linhas sem sentido pedindo
  "que Livro é esta linha de 2026-07-25?".
- Poluiria o Top 10 do Dashboard (`views` por Content) com itens que não são
  "conteúdo" nenhum.
- Violaria a definição de `Content` em `DATA_MODEL.md`: "uma peça de
  conteúdo do BookCringe sobre a qual existem métricas" — um dia do
  calendário não é uma peça de conteúdo.

---

## 3. O modelo Audience deve ser paralelo ao modelo Content?

**Não como tabela/módulo novo. Sim como convenção de uso, dentro do modelo
já existente.**

A pergunta tem duas leituras possíveis, e vale a pena separá-las:

### 3.1 Um novo par de tabelas paralelo (`intelligence_audience_snapshots` ou similar)?

**Rejeitado.** Considerado e descartado pelos motivos abaixo:

| | Reaproveitar `Metric` sem Content (recomendado) | Tabela paralela nova |
|---|---|---|
| Migration | Nenhuma | Nova tabela + índices + RLS |
| Services | Reusa `insertMetrics`/`listMetrics` como já existem | Novo service espelhado |
| Dashboard/Questions/Decisions | Leem `intelligence_metrics` como já leem hoje (filtrando `content_id is null`) | Precisam aprender uma segunda fonte de dado |
| ADR | Discutível, mas defensável sem (§6) | Exige ADR (nova tabela no core congelado) |
| Coerência com `DATA_MODEL.md` | Já era o caso previsto para "métricas agregadas de audiência de um canal" | Contradiz o que já estava desenhado |
| Alinhamento com o princípio do projeto | "Simplicidade sobre abstração antecipada" (`AGENTS.md`, citado em `DATASETS.md`) | Abstração antecipada sem uso que a justifique ainda |

Não há, hoje, nenhum dado que o modelo atual não consiga representar. Criar
uma entidade paralela agora seria abstração especulativa — o mesmo tipo de
decisão que `DATASETS.md` já evitou explicitamente para versionamento
(seção 4: "sem tabela de versão") e estado (seção 7.4: "sem tabela de
estado do Dataset").

### 3.2 Um "conceito" de Audience paralelo ao de Content, sem tabela própria?

**Sim, e vale nomear isso explicitamente** para orientar quem for
implementar: um Dataset pode ser de dois **formatos**, sem que isso exija
uma tabela nova —

- **Dataset content-shaped**: tem Contents (ex.: YouTube — cada vídeo é um
  Content, com Metrics associadas a ele). `Content` participa de Matching.
- **Dataset audience-shaped** (ou, mais genericamente, **metric-only**): não
  tem Contents; toda Metric aponta direto para o Dataset (`content_id:
  null`). Matching **não se aplica** — não é uma lacuna, é a consequência
  correta de não existir "a coisa medida" como um item individual (ver
  seção 5).

Essa distinção já é 100% suportada por `content_id` ser nullable — não
precisa de um campo `Dataset.shape` ou similar; é derivável (`SELECT
count(*) FROM intelligence_contents WHERE dataset_id = ...`, ou
equivalentemente, todo Metric daquele dataset tem `content_id is null`).
Não introduzir esse campo agora é consistente com o mesmo princípio da
seção 3.1 — só materializar quando um consumidor real precisar (ex.: o
Dashboard da Sprint 15, seção 5, pode precisar saber "este Dataset é
audience-shaped?" para decidir que card desenhar — nesse momento, a query
acima resolve, sem coluna nova).

---

## 4. Como a solução suportaria futuramente TikTok Audience, Meta Audience, Google Analytics?

O mesmo padrão se generaliza porque a escolha entre os dois formatos
(seção 3.2) não depende da **plataforma**, depende de **o dado ter ou não
um item individual identificável**:

| Fonte futura | Tem item individual? | Formato | Contents? |
|---|---|---|---|
| TikTok Audience (hipotético) | Não — agregados/distribuições da conta | Metric-only, igual ao Instagram Audience | Não |
| TikTok Promotions (citado em `IMPORTS.md`, ainda não implementado) | Sim — cada campanha/anúncio | Content-shaped, igual ao YouTube | Sim |
| Meta Audience (hipotético) | Não — agregados de página/conta | Metric-only | Não |
| Meta Ads — Campanhas (citado em `DATA_MODEL.md`) | Sim — cada campanha | Content-shaped | Sim |
| Google Analytics — Tráfego do site (agregado) | Não — sessões/usuários do site como um todo | Metric-only | Não |
| Google Analytics — por página (se importado nesse nível) | Sim — cada página é o item | Content-shaped | Sim |

Cada nova plataforma/relatório continua precisando só de:

1. Seu próprio Adapter (`imports/platforms/<plataforma>/`), já exigido pela
   Architecture Freeze ("Toda plataforma possui Adapter").
2. Seu próprio `persistence.ts`, decidindo — com base na natureza do dado,
   não por convenção nova — se chama `upsertContent` (content-shaped) ou
   só `insertMetrics` com `content_id: null` (metric-only).
3. Sua própria convenção de `key` (ex.: `activeFollowers` para Instagram,
   `sessionsByDevice:mobile` para GA) — local ao Adapter, sem precisar de
   um enum global de `key`s (o mesmo já vale hoje para o YouTube).

Nenhum desses três pontos exige tocar em `intelligenceDatasetService.ts`,
`dashboard/`, `insights/`, `questions/` ou `decisions/` — todos já operam
sobre o modelo genérico (Dataset/Import/Content?/Metric).

### Quando `(platform, kind)` realmente vai ser necessário

A composição `(platform, kind)` prevista no comentário da migration
(`supabase/migrations/20260801_intelligence_datasets.sql`) **não é
disparada** pelos 4 formatos de audiência (resolvidos pela `key`, seção
1.2) — é disparada no dia em que **a mesma plataforma** produzir **dois
Datasets de formatos diferentes** (ex.: se o Instagram um dia ganhar um
Adapter de "Reels", content-shaped, coexistindo com "Instagram —
Audiência", metric-only). Hoje isso não acontece (só existe um Adapter de
Instagram, o de Audiência) — então esta sprint **não precisa** adicionar
`kind` a `intelligence_datasets`. Quando o segundo Adapter da mesma
plataforma chegar, essa migration (aditiva: nova coluna `kind`, backfill dos
Datasets existentes, troca de `unique(platform)` para `unique(platform,
kind)`) é isolada e pequena — mas é, aí sim, uma alteração ao core
congelado, e deveria vir acompanhada de ADR (ver seção 6).

---

## 5. Como Dashboard, Questions e Decisions consumiriam esses dados?

Resumo por módulo — nenhum deles precisa de mudança estrutural, mas todos
precisam de **código aditivo** para dar sentido a um Dataset metric-only:

### Dashboard (`lib/intelligence/dashboard/summary.ts`)

- **Não usar como está.** Hoje ele já é agnóstico de plataforma
  (`DASHBOARD.md#5`), mas não é agnóstico de *formato*: "Top 10 conteúdos
  por views" e "Distribuição por plataforma" (contagem de Contents) ficam
  mudos para um Dataset sem Content nenhum — corretamente mudos, não
  quebrados (não há `NaN`/erro, só zero linhas contribuídas).
- **Aditivo necessário** (proposta para uma sprint futura, ex. "Sprint 15 —
  Instagram Dataset + Dashboard", já prevista em `IMPORTS.md#próxima-sprint`):
  uma nova função pura, ex. `buildAudienceOverview(dataset, metrics)`, que
  filtra `metrics.filter(m => m.content_id == null && m.dataset_id ===
  dataset.id)` e monta um card próprio ("Instagram — 12.480 seguidores,
  +180 essa semana"). Não toca no Top 10 nem na distribuição por plataforma
  existentes.

### Insights (`lib/intelligence/insights/`)

- **Atenção — 2 das 5 regras vão disparar incorretamente** se um Dataset
  audience-shaped simplesmente entrar no `RuleContext` sem ajuste:
  - `low-content-volume` (`rules/lowContentVolume.ts`): conta Contents por
    Dataset e dispara se `< 3`. Um Dataset audience-shaped tem **sempre**
    0 Contents — a regra dispararia "Instagram tem só 0 conteúdo(s)
    importado(s)" para sempre, um falso positivo permanente, não um aviso
    real.
  - `unmatched-content` (`rules/unmatchedContent.ts`): opera sobre
    `contents` global, não por Dataset — um Dataset sem Contents não
    contribui `unmatched`, então **não** distorce a razão global (fica
    neutro, não precisa de ajuste).
  - As outras 3 (`stale-dataset`, `no-recent-import`,
    `platform-without-dataset`) já operam só sobre Dataset/Import, sem
    depender de Content — continuam corretas sem ajuste.
- **Ajuste necessário** (mesma sprint futura do Dashboard): `low-content-volume`
  precisa aprender a pular Datasets audience-shaped — por exemplo, só
  avaliar Datasets que já têm ao menos 1 Content histórico, ou (mais
  explícito) checar se todas as Metrics daquele Dataset têm `content_id
  null` antes de aplicar o limiar. Isso é uma mudança pequena e local a um
  arquivo já isolado (`INSIGHTS.md#2`: "zero dependência entre regras") —
  não exige tocar no motor (`engine.ts`) nem nas outras regras.

### Questions (`lib/intelligence/questions/`)

- Nenhuma mudança no contrato (`Question<TContext, TData>`). Uma nova
  pergunta (ex. `audienceGrowth.ts`, "Minha audiência do Instagram está
  crescendo?") seguiria exatamente o mesmo padrão de `bestContent.ts`:
  busca `listMetrics()` (já existente), filtra por `dataset` +
  `content_id == null` + `key === "followers"`, compara o valor mais
  recente com o de N dias atrás, e devolve `QuestionAnswer<AudienceGrowthAnswerData>`.
- Mesmo princípio já registrado em `QUESTIONS.md#8`: pequenas duplicações
  locais (ex.: filtrar Metrics por Dataset/`key`) são preferíveis a
  refatorar `dashboard/summary.ts` — o módulo continua congelado.

### Decisions (`lib/intelligence/decisions/`)

- Nenhuma mudança estrutural — a regra central (ADR-007) é que uma Decision
  só enxerga `QuestionAnswer`, nunca dado bruto. No dia em que
  `audienceGrowth` (Questions) existir, uma nova `DecisionRule` (ex.:
  "audiência estagnada, considere um Reel novo") consome
  `QuestionAnswer<AudienceGrowthAnswerData>` exatamente como
  `importStaleDataset.ts` já consome `StaleDatasetAnswerData` hoje.

### Matching (`lib/intelligence/matching/`)

- **Não se aplica**, por design — não é um módulo "não implementado ainda"
  para Audience, é um módulo que **corretamente não tem o que fazer** aqui,
  porque não existe `Content` para sugerir Livro. Nenhuma tela de Matching
  precisa saber que Datasets audience-shaped existem.

---

## 6. A proposta exige ADR ou cabe dentro do Architecture Freeze?

Resposta em duas partes, porque a pergunta mistura duas decisões de
tamanhos diferentes:

### 6.1 "Instagram Audience persiste como Metric sem Content" — cabe no Freeze, ADR opcional (recomendado)

Conferindo contra cada regra de `ARCHITECTURE_FREEZE_v0.1.md`:

| Regra do Freeze | Esta proposta |
|---|---|
| Toda plataforma possui Adapter | ✅ já existe (Sprint 12/13) |
| Todo Adapter produz `NormalizedImportRecord` | ✅ já existe — persistência só consome o que o Adapter já produz |
| Dashboard nunca acessa arquivos | ✅ inalterado — Dashboard continua só lendo Dataset/Import/Content/Metric |
| Toda Persistência acontece via Services | ✅ `persistence.ts` chamaria só `intelligenceDatasetService.ts`, como o YouTube |
| Nenhuma Sprint quebra funcionalidades existentes | ✅ zero mudança de schema, zero mudança de assinatura — só um novo arquivo `persistence.ts` e uma nova linha em `PLATFORMS_WITH_PERSISTENCE` |
| Toda alteração arquitetural exige ADR | ⚠️ ver abaixo — depende de quão "arquitetural" se considera *usar* um caminho já modelado |

Não há alteração de schema, de contrato compartilhado (`imports/contracts.ts`,
`imports/types.ts`) ou de service — o que está sendo decidido é **uma
interpretação/uso** de algo que `DATA_MODEL.md` já previa desde a Sprint 3.
Por esse critério estrito, não seria tecnicamente obrigatório um ADR — mesmo
padrão de ADR-006/007/008 (Questions, Decisions, Workspace: módulos novos
que não tocam o core congelado e ainda assim ganharam ADR, por registrar uma
decisão de arquitetura que orienta o futuro, não por exigência de schema).

**Recomendação: registrar um ADR curto mesmo assim** — feito: ver `ADR-009`
em [`DECISIONS.md`](DECISIONS.md#adr-009) (texto final, ligeiramente
adaptado do proposto abaixo). Motivo: assim como o ADR-004 ("Content
Intelligence ≠ CMS Content") documentou uma distinção conceitual sem
nenhuma migration, esta decisão ("Audience ≠ Content; Metric sem Content é
o caminho canônico para dado sem item individual") é exatamente o tipo de
precedente que TikTok/Meta/GA vão precisar consultar depois — sem ADR, a
pergunta "por que não criamos um Content por dia?" seria refeita do zero a
cada nova plataforma.

> #### ADR-009 (texto original proposto nesta etapa de design — registrado em `DECISIONS.md`)
>
> **Audience-shaped Datasets persistem como Metric sem Content — sem modelo
> paralelo.**
>
> Motivo
>
> Datasets de audiência (ex.: Instagram Audience) não têm um item individual
> identificável — só fatos agregados/distribuídos sobre a conta como um
> todo. `intelligence_metrics.content_id` já é nullable desde a Sprint 6
> especificamente para este caso (`DATA_MODEL.md#metric`). Criar um Content
> artificial por linha, ou uma tabela paralela nova, contradiria a definição
> de Content e adicionaria abstração sem necessidade real
> (`AUDIENCE_PERSISTENCE.md`).
>
> Consequências
>
> Todo Adapter cujo dado não tem item individual grava Metrics direto no
> Dataset (`content_id: null`), usando uma convenção de `key` própria da
> plataforma para carregar a dimensão categórica (ex. `gender:male`,
> `territory:BR`). Matching não se aplica a esses Datasets. Dashboard,
> Questions, Decisions e Insights precisam tratar explicitamente o caso
> "Dataset sem Content" ao invés de assumir Content sempre presente — em
> particular, a regra `low-content-volume` (Insights) precisa aprender a
> pular Datasets deste tipo.

### 6.2 "`(platform, kind)` em `intelligence_datasets`" — exige ADR, quando acontecer

Diferente do caso acima, essa é uma mudança à **identidade de uma entidade
canônica já persistida e já lida por Dashboard/Questions/Decisions**
(mudaria a constraint de unicidade e o significado de "qual é o Dataset
deste registro"). Isso é uma alteração arquitetural por qualquer critério —
deve vir com seu próprio ADR **no momento em que for implementada** (seção
4: só quando um segundo formato colidir com a mesma `platform`). Não é
necessária, nem deve ser feita, nesta sprint.

---

## 7. Recomendação final

1. **Persistir Instagram Audience como `Metric` sem `Content`**, associada
   direto ao Dataset — reaproveitando 100% do schema e dos services
   existentes (`findOrCreateDataset`, `createImport`, `insertMetrics`,
   `finalizeImport`). Nenhum `upsertContent` é chamado por este Adapter.
2. **Um único Dataset** (`platform: "instagram"`, nome `"Instagram —
   Audiência"`) cobre os 4 formatos (`audience_history`,
   `audience_activity`, `audience_demographics`, `audience_territories`),
   diferenciados por uma convenção de `key` em `Metric` (seção 1.2) — **não**
   por `(platform, kind)`.
3. **Não criar tabela paralela para Audience.** O modelo já suporta o caso
   (`content_id` nullable); uma entidade nova seria abstração antecipada sem
   necessidade concreta hoje.
4. **Não adicionar `kind` a `intelligence_datasets` nesta sprint.** Só será
   necessário quando uma mesma plataforma tiver dois formatos de Dataset
   coexistindo (ex.: um futuro "Instagram Reels" ao lado de "Instagram —
   Audiência") — nesse momento, com ADR próprio (seção 6.2).
5. **Generalizar via uma regra, não uma lista por plataforma:** a escolha
   entre "Content-shaped" e "metric-only" depende de o dado ter ou não um
   item individual identificável — vale para TikTok, Meta e Google
   Analytics igualmente (seção 4).
6. **Zero mudança em Dashboard/Insights/Questions/Decisions/Matching nesta
   sprint** — mas registrar, para a sprint que implementar o Dashboard de
   Audiência (já prevista como "Sprint 15" em `IMPORTS.md`), que a regra de
   Insight `low-content-volume` precisa de um ajuste para não disparar falso
   positivo em Datasets audience-shaped (seção 5).
7. **ADR: recomendado, não obrigatório**, para a decisão central — feito,
   `ADR-009` (`DECISIONS.md`); **obrigatório, mas não agora**, no dia em que
   `(platform, kind)` for implementado (seção 6.2).

### O que esta etapa de design, por si só, não fazia (histórico)

Os itens abaixo descrevem o estado no momento em que só o design (este
documento) existia — todos foram concluídos na implementação que seguiu, na
mesma Sprint 14 (ver [`IMPORTS.md`](IMPORTS.md#sprint-14--instagram-persistence)):

- ~~Não altera nenhum arquivo de código.~~ Implementado.
- ~~Não cria nenhuma migration.~~ Confirmado como desnecessária — nenhuma
  migration foi criada, exatamente como a recomendação previa.
- ~~Não cria `platforms/instagram/persistence.ts`.~~ Criado.
- ~~Não adiciona `instagram` a `PLATFORMS_WITH_PERSISTENCE`~~
  (`imports/platformCapabilities.ts` / `insights/rules/platformWithoutDataset.ts`) — adicionado.
- ~~Não registra o `ADR-009` proposto em `DECISIONS.md`~~ — registrado.
- ~~Não altera `IMPORTS.md`/`CHANGELOG.md`~~ — ambos atualizados (seção
  "Sprint 14 — Instagram Persistence" e `v0.7.0`, respectivamente).

O único ponto da seção 5/6.2 que **continua** deliberadamente fora de
escopo (não uma pendência esquecida): o ajuste da regra `low-content-volume`
para não disparar falso positivo em Datasets audience-shaped, e a chave
composta `(platform, kind)` — ambos permanecem para quando a Sprint 15
("Instagram Dataset + Dashboard") ou uma futura segunda família de dados do
Instagram (ex.: Reels) chegarem, exatamente como recomendado nos itens 4 e 6
acima.
