# Modelo de Dados do Intelligence

Este documento define, **conceitualmente**, as entidades principais do
Intelligence. Não fala de Supabase, tabelas, migrations ou qualquer detalhe
de persistência — isso é assunto de uma sprint futura, que vai *derivar* seu
desenho a partir do que está descrito aqui (mesmo padrão já usado no resto do
CMS: `src/lib/types/cms.ts` define o domínio, `src/lib/types/database.ts`
deriva o schema do Supabase a partir dele).

## Princípio

**O Intelligence não pertence a nenhuma plataforma.** YouTube, Instagram,
TikTok, Meta Ads e Google Analytics são apenas origens de dados. Cada uma
tem seu próprio adapter (`src/lib/intelligence/imports/platforms/*`) cuja
única responsabilidade é traduzir o formato daquela plataforma para o
modelo interno descrito abaixo. Nenhuma entidade canônica deste documento
sabe o que é um "CSV do YouTube Studio" ou um "Ads Manager export" — isso é
problema do adapter, não do modelo.

## Visão geral

Seis entidades, em duas camadas: de onde o dado vem (**origem**) e o que o
dado significa para o BookCringe (**conhecimento**).

```
Origem                         Conhecimento

Platform ──┐
           ├─▶ Dataset ──▶ Import        Content ──▶ Metric ──▶ Insight
           │                  │              ▲           │
           └──────────────────┴──────────────┘           │
                    (todo Import produz Content/Metric) ──┘
```

Em uma frase por entidade: uma **Platform** é uma origem; um **Dataset** é
uma coleção de dados com formato estável vinda de uma Platform; um
**Import** é um evento específico de carregar arquivos num Dataset; um
**Content** é uma peça de conteúdo do BookCringe sobre a qual existem
métricas; uma **Metric** é um fato numérico; um **Insight** é a
interpretação de uma ou mais métricas.

---

## Platform

### Finalidade
Representa uma origem externa de dados — de onde os arquivos importados
vêm. É a entidade mais estável e com menos atributos: existe para dar nome e
identidade a "de onde isso veio", nada além disso.

### Relacionamento com as demais
- Uma Platform tem vários Datasets (ex.: o YouTube pode ter, no futuro, um
  Dataset de "desempenho de vídeos" e outro de "comentários").
- Content e Metric referenciam uma Platform indiretamente, através do
  Dataset ao qual pertencem — Platform nunca é referenciada diretamente por
  Content/Metric/Insight.

### Exemplos reais
YouTube, Instagram, TikTok, Meta Ads, Google Analytics, Manual (entrada
editorial sem plataforma automatizada).

### Responsabilidades
- Dar um identificador estável e um nome de exibição para a origem.
- Servir de agrupador para os Datasets daquela origem.

### O que NÃO pertence a Platform
- Formato de arquivo, lógica de parsing ou de detecção — isso é do adapter
  (`src/lib/intelligence/imports/platforms/<plataforma>/parser.ts`), um
  conceito de código, não uma entidade de dados.
- Credenciais/API keys de integração futura (se um dia houver importação via
  API em vez de upload manual) — isso é configuração de infraestrutura, não
  modelo de domínio.

---

## Dataset

### Finalidade
Uma coleção nomeada de dados de uma Platform, com um formato consistente ao
longo do tempo. É o "recipiente" de longo prazo: existe antes do primeiro
Import e continua existindo entre um Import e outro, acumulando histórico.

### Relacionamento com as demais
- Pertence a uma Platform.
- Recebe vários Imports ao longo do tempo (cada novo CSV do YouTube Studio é
  um novo Import dentro do mesmo Dataset "YouTube — Desempenho de vídeos").
- Content e Metric pertencem a um Dataset — é o Dataset que dá contexto ao
  que aquele número significa.

### Exemplos reais
"YouTube Studio — Desempenho de vídeos", "Meta Ads — Campanhas", "Google
Analytics — Tráfego do site", "Manual — Anotações editoriais".

### Responsabilidades
- Definir que *tipo* de Content/Metric aquele conjunto de dados representa
  (ex.: vídeos com views/watch time, ou campanhas com custo/CTR).
- Ser o ponto de referência para "o que já foi importado até agora" daquela
  origem — a base para o Dashboard consultar dados normalizados sem nunca
  tocar em arquivos.

### O que NÃO pertence a Dataset
- O conteúdo de um arquivo específico — isso é o Import.
- Regras de negócio sobre como calcular um Insight — isso é do Insight.

> Ciclo de vida completo (nascimento, arquivamento, versionamento) e as
> telas que o usuário vê para gerenciar Datasets estão em
> [`DATASETS.md`](DATASETS.md) — este documento cobre só a definição
> conceitual da entidade.

---

## Import

### Finalidade
Um evento específico: "este arquivo foi trazido para este Dataset, nesta
data, com este resultado". É o registro histórico/auditável de uma execução
do pipeline (Detection Preview → Adapter → Normalização), correspondendo,
depois de persistido, ao que hoje circula em memória como `ImportBatch`
(`src/lib/intelligence/imports/types.ts`).

### Relacionamento com as demais
- Pertence a um Dataset (e, transitivamente, a uma Platform).
- Produz Content/Metric — cada linha aceita durante o processamento vira (ou
  atualiza) um Content e um ou mais Metric associados a este Import.

### Exemplos reais
"Import #482 — youtube-studio-report-julho.csv — 2026-08-01 — 2 vídeos
aceitos, 0 rejeitados", "Import #483 — mesma origem, arquivo de agosto".

### Responsabilidades
- Guardar o resultado da Detection Preview (plataforma detectada, confiança,
  formato do arquivo) e o nome do arquivo original.
- Guardar status do processamento (pendente, detectado, normalizado,
  persistido, falhou) e as issues encontradas linha a linha.
- Ser a unidade de "desfazer"/auditoria: se algo deu errado, é o Import que
  se investiga.

### O que NÃO pertence a Import
- O valor das métricas em si — isso vive em Metric (o Import só referencia
  quais Metrics ele produziu).
- Qualquer interpretação do resultado ("esse mês foi bom") — isso é Insight.

---

## Content

### Finalidade
Uma peça de conteúdo do BookCringe sobre a qual existem métricas — um vídeo
do YouTube, um Reel, um vídeo do TikTok, um anúncio, uma página do site.
Dá identidade estável a "a coisa que está sendo medida", independente de
quantos Imports trouxeram métricas atualizadas para ela.

### Relacionamento com as demais
- Pertence a um Dataset (e, transitivamente, a uma Platform).
- Tem várias Metrics ao longo do tempo (o mesmo vídeo aparece em vários
  Imports sucessivos, cada um atualizando suas métricas).
- Pode ser referenciada por um ou mais Insights.
- Pode ser associado, por matching assistido (nunca automático), a um Livro
  do CMS (`books`) — só a referência (`book_id`), nunca uma cópia de
  autor/editora/gênero/país. Ver [`MATCHING.md`](MATCHING.md).

### Exemplos reais
O vídeo "Como ler mais em 2026" no YouTube; o Reel de lançamento de uma
resenha no Instagram; a campanha "Setembro — Clube de Leitura" no Meta Ads
(campanhas também contam como Content para este modelo: são "a coisa medida").

### Responsabilidades
- Identificar de forma estável um item, tipicamente pela URL/ID externo da
  plataforma.
- Guardar atributos descritivos e imutáveis (título, data de publicação,
  link) — não os números de desempenho.

### O que NÃO pertence a Content
- Números de desempenho (views, alcance, gasto) — isso é Metric.
- **Não é o mesmo que `CmsContentRecord`** (tabela `contents`, usada por
  `/admin/content` para curadoria editorial — "quais conteúdos aparecem no
  site público"). São conceitos relacionados, mas distintos: um Content do
  Intelligence existe porque uma plataforma reportou métricas sobre ele,
  independente de ter sido curado editorialmente; um `CmsContentRecord`
  existe porque um editor decidiu destacá-lo no site, independente de ter
  métricas importadas. A reconciliação entre os dois (ex.: casar um vídeo
  importado com um `CmsContentRecord` já cadastrado, pela URL) continua uma
  possível evolução futura, não uma equivalência — ver seção
  [Relação com tipos já existentes no CMS](#relação-com-tipos-já-existentes-no-cms).
  O matching implementado na Sprint 7 é outro, e não substitui este: casa
  Content com **Livro** (`books`), por **título**, para permitir análises
  como "desempenho por autor/gênero/país" — ver
  [`MATCHING.md`](MATCHING.md).

---

## Metric

### Finalidade
Um fato numérico normalizado: um valor, uma chave/unidade e um instante de
tempo. É o dado bruto — o que efetivamente foi medido, sem interpretação.

### Relacionamento com as demais
- Pertence a um Dataset e a um Import (de onde veio).
- Normalmente associada a um Content (views de um vídeo específico); quando
  o dado é do nível do próprio Dataset — sem um item individual sendo
  medido, como métricas agregadas de audiência de um canal — associa-se
  diretamente ao Dataset, sem Content.
- É a base sobre a qual um ou mais Insights são calculados.

### Exemplos reais
"views = 15420, vídeo = Como ler mais em 2026, data = 2026-01-02",
"watch_time_hours = 892.5", "amount_spent = 340.50, campanha = Setembro".

### Responsabilidades
- Guardar o número exato reportado pela plataforma, já convertido para um
  formato comum (mesma unidade, mesmo formato de data) pelo adapter.
- Manter rastreabilidade até o Import de origem (para auditoria/reprocessamento).

### O que NÃO pertence a Metric
- Comparações, tendências ou julgamentos ("cresceu 40%") — isso é Insight.
- Dados ainda não normalizados (uma linha crua de CSV) — isso é
  `ParsedImportRecord`/`NormalizedImportRecord`, tipos de processo, não o
  modelo canônico (ver próxima seção).

---

## Insight

### Finalidade
Uma interpretação derivada de uma ou mais Metrics — o "e daí" da métrica.
Pode ser gerado manualmente (um editor observa e anota) ou por IA (área já
reservada em `/admin/intelligence/ia`). É a camada mais próxima do que o
Dashboard efetivamente exibe como destaque.

### Relacionamento com as demais
- Referencia uma ou mais Metrics (e, por consequência, os Content/Dataset
  envolvidos).
- É a única entidade que pode cruzar Datasets diferentes (ex.: "o
  crescimento de inscritos no YouTube coincide com o pico de gasto em Meta
  Ads em setembro").

### Exemplos reais
"Views do canal cresceram 40% em relação ao mês anterior", "Este vídeo
teve o dobro do watch time médio dos últimos 3 meses", "Recomendação: repetir
o formato do vídeo X, que teve o melhor CTR do trimestre".

### Responsabilidades
- Guardar o texto/resultado da interpretação e quais Metrics a embasam.
- Registrar a origem (manual, IA ou **regra** — ver nota da Sprint 9 abaixo)
  e quando foi gerado.

> **Atualização (Sprint 9):** a primeira origem real de Insight foi
> implementada — **regra**, não IA. Um pequeno Rules Engine
> (`lib/intelligence/insights/`) computa recomendações (ex.: "Dataset
> desatualizado", "Conteúdos sem Livro") sob demanda, a partir de
> Dataset/Import/Content já persistidos. Nenhuma tabela: um Insight de
> regra nunca é "guardado" (a Responsabilidade acima, de registrar
> origem/data, ainda vale só para uma futura persistência de Insight — que
> continua não existindo). Ver
> [`INSIGHTS.md`](INSIGHTS.md).

### O que NÃO pertence a Insight
- Coleta ou normalização de dados — Insight só lê Metrics já existentes,
  nunca arquivos.
- Ser a única fonte de verdade dos números — os valores exatos sempre vêm de
  Metric; Insight é interpretação, não substituto do dado bruto.

---

## Relação com os tipos de importação atuais

Os tipos de `src/lib/intelligence/imports/types.ts`
(`ImportFileDescriptor`, `DetectionResult`, `ParsedImportRecord`,
`NormalizedImportRecord`, `ImportBatch`, `PersistenceReceipt` etc.) descrevem
o **processo** de trazer um arquivo para dentro do sistema — são efêmeros,
existem apenas durante uma execução do pipeline (Detection Preview → Adapter
→ Normalização). Nenhum deles é, hoje, uma entidade canônica:

| Tipo de processo (`imports/types.ts`) | Papel | Contraparte canônica (este documento) |
|---|---|---|
| `ImportFileDescriptor`, `DetectionResult` | Metadados do arquivo e do resultado da detecção | Guardados dentro de um `Import`, não são entidades próprias |
| `ParsedImportRecord` | Linha crua já lida do arquivo, ainda no formato da plataforma | Não tem contraparte — é interno ao adapter, nunca sai dele |
| `NormalizedImportRecord` | Envelope comum pós-adapter, pronto para a etapa de Persistência | Fonte de onde `Content`/`Metric` serão derivados quando a Persistência existir |
| `ImportBatch` | Execução em memória de um import (id, plataforma, status, arquivos) | Contraparte em memória do `Import` — quando a Persistência existir, um `ImportBatch` processado com sucesso vira um `Import` histórico |
| `PersistenceReceipt` | Resultado de uma tentativa de persistência (ainda não implementada) | Resumo que atualizará o `Import.status`/contagens |

**Sobre o nome `NormalizedImportRecord`:** o nome já está consolidado no
próprio fluxo descrito em `AGENTS.md` ("Adapter da Plataforma →
NormalizedImportRecord → Persistência") — trocá-lo não agrega valor e
quebraria esse vocabulário compartilhado. A decisão desta sprint foi
**mantê-lo como está**, mas deixar explícito (aqui e em comentário no
próprio arquivo de tipos) que ele é um artefato de **processo**, não uma
entidade do modelo canônico: seu campo `entityType` é uma dica de para qual
entidade canônica aquele registro será mapeado (`"content"` → vira um
`Content` com sua(s) `Metric`; `"platform_metric"`/`"campaign_metric"`/
`"audience_metric"` → vira `Metric`(s) sem `Content` associado, ligado
direto ao `Dataset`; `"manual_entry"` → entrada editorial manual). Nenhum
outro tipo de `imports/types.ts` precisou de ajuste — todos já são
corretamente escopados como tipos de processo, distintos do modelo.

## Relação com tipos já existentes no CMS

- **`Content` (Intelligence) vs. `CmsContentRecord`** (`src/lib/types/cms.ts`,
  tabela `contents`): conceitos vizinhos, não equivalentes — ver a seção
  [Content](#content) acima. Ao codificar isso (sprint futura), preferir
  sempre qualificar em conversas/commits como "Content do Intelligence" para
  evitar ambiguidade com o "Conteúdo" já existente no admin.
- **`Platform` (Intelligence) vs. `CmsContentPlatform`**: `CmsContentPlatform`
  é um enum menor e com propósito diferente — classifica em qual rede social
  um `CmsContentRecord` foi publicado (inclui `spotify`, `podcast`, `blog`,
  `website`, que não têm importador no Intelligence). `ImportPlatform`
  (`imports/types.ts`) é o identificador técnico usado pelo pipeline e deve
  se tornar `Platform.id` quando a entidade for persistida. Os dois enums
  não devem ser unificados à força — servem domínios diferentes.
- **`Metric`/`Insight`**: sem sobreposição com tipos existentes no CMS —
  `CmsStatisticsRecord` (metas de leitura anuais) é um conceito
  completamente diferente, não uma métrica de plataforma.

## Persistência (fora de escopo desta sprint)

Quando a Persistência for implementada, o padrão a seguir é o mesmo já usado
no resto do projeto: tipos de domínio (este documento + `model.ts`) primeiro,
depois um schema derivado (`src/lib/types/database.ts` como referência) e um
service por entidade em `src/lib/services/` — nunca o contrário. Esta sprint
não cria nenhuma tabela, migration ou `ImportPersistence` real; apenas o
vocabulário e os tipos que a próxima sprint vai implementar em cima.
