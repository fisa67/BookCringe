# Dashboard — Sprint 8

A primeira tela do Intelligence que existe para ser usada, não para
configurar nada: `/admin/intelligence`. Lê exclusivamente dados já
persistidos (Dataset, Import, Content, Metric — Sprint 6 — e o `book_id` do
Matching — Sprint 7). Nunca lê arquivo, nunca chama IA, nunca faz uma
pergunta que dependa de uma plataforma ainda não implementada.

---

## 1. Arquitetura: onde cada responsabilidade mora

```
Supabase (intelligence_datasets, _imports, _contents, _metrics, books)
  ↓
Services (I/O puro — já existiam a maior parte)
  intelligenceDatasetService.ts  → listDatasets, listImports, listContents, listMetrics
  bookService.ts                 → getBooks (mesmo usado pelo Matching, Sprint 7)
  ↓
intelligenceDashboardService.ts  (novo — orquestra os services acima)
  getIntelligenceDashboardData()
  ↓
lib/intelligence/dashboard/summary.ts  (novo — puro, sem I/O)
  buildIntelligenceDashboardData(datasets, imports, contents, metrics, books)
  ↓
app/admin/intelligence/page.tsx  (só desenha o que já veio pronto)
```

A página chama **uma única função**, `getIntelligenceDashboardData()`. Ela
nunca importa `supabaseAdminClient`, nunca monta uma query, nunca sabe o
nome de uma tabela — exatamente a regra da sprint ("nenhuma query SQL na
UI", "nenhum acesso direto ao Supabase pelos componentes").

## 2. Services criados/estendidos

| Função | Onde | Status |
|---|---|---|
| `listDatasets` | `intelligenceDatasetService.ts` | já existia (Sprint 7, Matching) |
| `listContents` | `intelligenceDatasetService.ts` | já existia (Sprint 7, Matching) |
| `getBooks` | `bookService.ts` | já existia (CMS) |
| `listImports` | `intelligenceDatasetService.ts` | **novo** — todos os Imports, mais recente primeiro |
| `listMetrics` | `intelligenceDatasetService.ts` | **novo** — todas as Metrics, sem agregação |
| `getIntelligenceDashboardData` | `intelligenceDashboardService.ts` (**novo arquivo**) | orquestra os 5 acima com `Promise.all` e delega a agregação |

Só duas funções de busca são genuinamente novas (`listImports`,
`listMetrics`) — o resto é reaproveitamento direto do que a Persistência
(Sprint 6) e o Matching (Sprint 7) já mantinham. Nenhuma delas agrega nada:
seguem exatamente o mesmo padrão das funções vizinhas no arquivo (buscar,
tratar erro, devolver `T[] | null`).

## 3. Onde vive a agregação (e por que não é um service)

`src/lib/intelligence/dashboard/summary.ts` — `buildIntelligenceDashboardData`
recebe os arrays já buscados e calcula tudo em memória: contagens, a última
importação, o Top 10 por views, a distribuição por plataforma e a taxa de
matching. É uma função **pura** (sem `await`, sem Supabase) — mesmo padrão
já usado por `lib/intelligence/session/summary.ts` desde a Sprint 4.

Separar assim (I/O no service, cálculo aqui) significa que todo o cálculo é
testável sem mockar o Supabase (`summary.test.ts`, 7 casos: vazio, resumo
geral, última importação, Top 10, limite do Top 10, distribuição,
matching) — e que adicionar uma métrica nova nunca exige tocar em código de
banco.

### Por que "views" usa a leitura mais recente, não a soma

Metrics são imutáveis — cada Import insere uma linha nova por
`(content, chave)`, preservando o histórico (`IMPORTS.md#persistência`).
O CSV do YouTube Studio reporta o total acumulado de views até a data do
relatório, não um delta do período. Somar todas as leituras contaria a
mesma visualização várias vezes a cada reimportação; por isso o Top 10 usa
a leitura de `measured_at` mais recente por Content, não `sum()`.

## 4. O que a tela mostra

1. **Resumo geral** — 4 cards: Datasets, Imports, Conteúdos, Livros
   associados (Livros **distintos** que já têm ao menos um Content
   vinculado — não o total de Livros do CMS).
2. **Última importação** — plataforma, data, arquivo, registros aceitos/
   rejeitados e status, do Import mais recente entre todos os Datasets.
3. **Top 10 conteúdos por views** — ordenado por `views`, mostra
   plataforma e, se já vinculado, o título do Livro (reforça visualmente o
   valor do Matching).
4. **Distribuição por plataforma** — um card por plataforma com Contents,
   contagem e percentual do total.
5. **Taxa de matching** — vinculados x não vinculados, com atalho para
   `/admin/intelligence/conteudos` quando sobrar trabalho.
6. **Estado vazio** — se não existe nenhum Import ainda, a tela inteira vira
   uma chamada para `/admin/intelligence/importacoes`, em vez de mostrar
   cards zerados.

## 5. Métricas futuras sem alterar a estrutura

Qualquer métrica nova segue o mesmo caminho: **nenhuma** exige nova
migration, novo service de I/O, ou mudar a página. Só uma nova função pura
em `dashboard/summary.ts` (ou um novo campo em `IntelligenceDashboardData`)
consumindo os mesmos arrays que `getIntelligenceDashboardData` já busca:

- **Top 10 por outra métrica** (watch time, impressions, subscribers): já
  são chaves existentes em `intelligence_metrics.key` — troca só o
  parâmetro `key` de `latestMetricValueByContent`.
- **Séries temporais / tendência** (`DATASETS.md` seção 4, versionamento):
  os dados já existem — cada `measured_at` é um ponto no tempo. Falta só uma
  função que agrupe por Import em vez de pegar só o mais recente.
- **Análises por Livro** (`MATCHING.md` seção 5: autor,
  editora, gênero, país, nacionais, clássicos): assim que houver Contents
  suficientes vinculados, uma nova função cruza `topContents`/Metrics com
  os campos de `CmsBookRecord` já disponíveis em `books` (já buscado pelo
  service) — sem nenhuma nova tabela.
- **Novas plataformas** (Instagram, TikTok...): o Dashboard já é agnóstico
  de plataforma — `platform` vem do Dataset de cada Content, nunca é
  hardcoded. No dia em que a persistência de outra plataforma existir, ela
  aparece aqui automaticamente, sem alterar este código.

## 6. O que fica de fora, de propósito

- Sem filtros de período/Dataset na UI — o Dashboard mostra o estado atual
  agregado de tudo. Filtros são aditivos sobre a mesma base, não uma
  mudança de arquitetura.
- Sem cache/materialização — os services buscam tudo a cada carregamento da
  página. Aceitável no volume atual (poucas dezenas de Contents); se
  crescer, a otimização (paginação, contagens via `count: "exact"` no
  Supabase em vez de trazer as linhas) fica isolada dentro dos services,
  sem tocar na página nem em `summary.ts`.
- Sem gráficos — os cards e listas atuais bastam para a primeira versão
  "realmente útil"; visualizações (linha do tempo, barras) são evolução de
  UI sobre os mesmos dados já calculados.
