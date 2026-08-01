# Questions — Biblioteca de Perguntas de Negócio (Sprint 10)

Épico novo, construído **sobre** a arquitetura v0.1 já congelada
([`ARCHITECTURE_FREEZE_v0.1.md`](ARCHITECTURE_FREEZE_v0.1.md)) — nenhum
módulo existente (`imports/`, `dashboard/`, `matching/`, `insights/`,
`services/`) foi alterado para isso. Ver [`DECISIONS.md`](DECISIONS.md#adr-006)
para o registro dessa decisão.

O objetivo do Épico Questions é construir uma **biblioteca de perguntas de
negócio reutilizáveis**: em vez de cada tela calcular seus próprios números
do zero, uma pergunta ("Qual foi meu melhor conteúdo?", e outras que virão)
é implementada uma única vez e pode ser consumida por qualquer lugar —
Dashboard, a área de IA (`/admin/intelligence/ia`) ou uma futura API —, sem
que o consumidor precise saber como o dado foi buscado ou calculado.

---

## 1. Onde vive

```
src/lib/intelligence/questions/
├── types.ts                  # Question<TContext, TData>, QuestionAnswer<TData>
├── bestContent.ts             # Pergunta 1: "Qual foi meu melhor conteúdo?"
├── bestContent.test.ts
├── staleDataset.ts             # Pergunta 2: "Qual é o Dataset mais desatualizado?" (Sprint 11)
├── staleDataset.test.ts
├── unmatchedContent.ts          # Pergunta 3: "Quanto do meu conteúdo ainda não foi vinculado a um Livro?" (Sprint 11)
├── unmatchedContent.test.ts
└── index.ts                      # barrel público do módulo
```

```
src/lib/services/
└── intelligenceQuestionsService.ts   # I/O: busca dados via services existentes e chama cada Question
    intelligenceQuestionsService.test.ts
```

Mesma divisão de responsabilidade já usada pelo Dashboard (Sprint 8) e
pelos Insights (Sprint 9): **I/O fica no service, cálculo puro fica no
módulo de domínio**. Nenhuma pergunta importa o Supabase; nenhum service
novo foi criado — `intelligenceQuestionsService.ts` reutiliza
exclusivamente `listDatasets`, `listContents`, `listMetrics`, `listImports`
(`intelligenceDatasetService.ts`) e `getBooks` (`bookService.ts`), as
mesmas funções que já alimentam o Dashboard.

As perguntas 2 e 3 foram adicionadas na Sprint 11 especificamente para
alimentar a Decision Engine (`docs/intelligence/DECISIONS_ENGINE.md`), que
só pode consumir `QuestionAnswer` — nunca dado bruto. Isso confirma o
valor da biblioteca: a Decision Engine não precisou saber nada sobre
Dataset, Import ou Content, só sobre a resposta já pronta de cada
pergunta.

## 2. O contrato: `Question` e `QuestionAnswer`

```ts
interface QuestionAnswer<TData> {
  questionId: string;
  question: string;      // a pergunta em linguagem natural
  answeredAt: string;    // ISO — sempre computado sob demanda, nunca persistido
  hasAnswer: boolean;    // false quando não há dado suficiente
  data: TData | null;    // dado estruturado, nunca uma linha crua de tabela
  summary: string;       // resumo em linguagem natural, pronto para exibição
}

interface Question<TContext, TData> {
  id: string;
  question: string;
  answer(context: TContext): QuestionAnswer<TData>;
}
```

Por que `TContext` e `TData` são genéricos por pergunta (em vez de um
contexto único fixo, como o `RuleContext` dos Insights): perguntas
diferentes tendem a precisar de dados diferentes (uma pergunta sobre
tendência ao longo do tempo, por exemplo, não precisa de `books`, mas pode
precisar de `imports`). Fixar um contexto único desde a primeira pergunta
seria abstração antecipada sem uso real ainda — cada `Question` declara
exatamente o que precisa.

O que **é** compartilhado por todas as perguntas, de propósito, é o formato
da resposta (`QuestionAnswer`): `hasAnswer` + `data` + `summary` é o que
permite qualquer consumidor (Dashboard, IA, API) tratar qualquer pergunta
da mesma forma, sem precisar de um `if` por pergunta.

### Por que a resposta nunca é dado cru

`data` é sempre um objeto já interpretado (ex.: `BestContentAnswerData`),
nunca a linha de uma tabela (`IntelligenceContentRecord`,
`IntelligenceMetricRecord`). E `summary` já é uma frase pronta — um
consumidor de IA ou uma API não precisam saber calcular "qual desses campos
é o mais importante", a Question já decidiu isso. Essa é a diferença central
entre uma Question e simplesmente expor os services existentes: a Question
responde a pergunta, não só busca dados relacionados a ela.

## 3. Pergunta 1: "Qual foi meu melhor conteúdo?"

`src/lib/intelligence/questions/bestContent.ts` — `bestContentQuestion`
(`id: "best-content"`).

### Definição de "melhor"

Usa exatamente a mesma métrica e o mesmo critério já consolidados pelo Top
10 do Dashboard (`dashboard/summary.ts`, Sprint 8): a **leitura mais
recente de `views` por Content** — nunca a soma, porque o CSV do YouTube
Studio reporta o total acumulado até a data do relatório, e Metrics são
imutáveis (cada Import insere uma linha nova, preservando o histórico; ver
[`IMPORTS.md#persistência`](IMPORTS.md#persistência)).

Reusar a mesma definição, em vez de inventar um cálculo novo, é intencional:
evita que o Dashboard diga "seu melhor vídeo foi X" e a resposta desta
pergunta diga "Y" para o mesmo estado de dados.

### O que a resposta contém

```ts
interface BestContentAnswerData {
  contentId: string;
  title: string;
  platform: ImportPlatform;
  datasetName: string;
  metric: string;        // "views" hoje
  value: number;
  measuredAt: string;
  bookTitle?: string;     // só quando o Content já foi vinculado a um Livro (Matching, Sprint 7)
  publishedAt?: string;
}
```

Exemplo de resposta completa (`QuestionAnswer<BestContentAnswerData>`):

```json
{
  "questionId": "best-content",
  "question": "Qual foi meu melhor conteúdo?",
  "answeredAt": "2026-08-01T00:00:00.000Z",
  "hasAnswer": true,
  "data": {
    "contentId": "content-1",
    "title": "Como ler mais em 2026",
    "platform": "youtube",
    "datasetName": "YouTube Studio — Desempenho de vídeos",
    "metric": "views",
    "value": 15420,
    "measuredAt": "2026-08-01T00:00:00.000Z",
    "bookTitle": "Como Ler Mais em 2026"
  },
  "summary": "Seu melhor conteúdo foi \"Como ler mais em 2026\" (YouTube), sobre o livro \"Como Ler Mais em 2026\", com 15.420 de views."
}
```

Quando não há nenhum Content com a métrica usada (nenhum Import ainda, ou
nenhum registro de `views`), `hasAnswer` é `false`, `data` é `null` e
`summary` explica isso em texto ("Ainda não há conteúdo com métricas
suficientes para responder essa pergunta.") — o mesmo padrão de estado
vazio já usado pelo Dashboard e pelos Insights, nunca um erro nem uma
exceção.

### Como chamar

```ts
import { getBestContentAnswer } from "@/lib/services/intelligenceQuestionsService";

const answer = await getBestContentAnswer();
```

`getBestContentAnswer` é o único ponto de entrada de I/O: busca Datasets,
Contents, Metrics (`intelligenceDatasetService.ts`) e Livros
(`bookService.ts`) — as mesmas quatro fontes que o Dashboard já usa — e
delega a resposta para `bestContentQuestion.answer(...)`. Nenhuma consulta
nova, nenhuma tabela nova.

## 4. Pergunta 2: "Qual é o Dataset mais desatualizado?"

`src/lib/intelligence/questions/staleDataset.ts` — `staleDatasetQuestion`
(`id: "stale-dataset"`).

Para cada Dataset, encontra o Import mais recente e calcula há quantos
dias ele aconteceu; a resposta é o Dataset com o **maior** número de dias
sem Import (o mais parado de todos). `hasAnswer` é `true` sempre que existe
pelo menos um Dataset com pelo menos um Import — a Question não decide se
esse número de dias já é "grave"; ela só reporta o fato. Interpretar esse
número (e decidir se vale a pena recomendar uma ação) é responsabilidade
de quem consome a resposta — a Decision Engine usa o mesmo limiar já
validado pela Insight `stale-dataset` (`STALE_DATASET_THRESHOLD_DAYS`,
reexportado por `lib/intelligence/insights`), para as duas camadas
concordarem sobre o que conta como "desatualizado".

```ts
interface StaleDatasetAnswerData {
  datasetId: string;
  datasetName: string;
  platform: ImportPlatform;
  daysSinceLastImport: number;
  lastImportAt: string;
}
```

### Como chamar

```ts
import { getStaleDatasetAnswer } from "@/lib/services/intelligenceQuestionsService";

const answer = await getStaleDatasetAnswer();
```

## 5. Pergunta 3: "Quanto do meu conteúdo ainda não foi vinculado a um Livro?"

`src/lib/intelligence/questions/unmatchedContent.ts` —
`unmatchedContentQuestion` (`id: "unmatched-content"`).

Conta quantos Contents têm `book_id` nulo (o mesmo campo do Matching
assistido, [`MATCHING.md`](MATCHING.md)) e calcula a proporção sobre o
total. `hasAnswer` é `true` sempre que existe pelo menos um Content — de
novo, sem nenhum limiar embutido; o limiar de "isso já justifica uma
recomendação" (`UNMATCHED_CONTENT_RATIO_THRESHOLD`, o mesmo já usado pela
Insight `unmatched-content`) é aplicado por quem consome a resposta.

```ts
interface UnmatchedContentAnswerData {
  totalContents: number;
  unmatchedContents: number;
  unmatchedRatio: number; // 0 a 1
}
```

### Como chamar

```ts
import { getUnmatchedContentAnswer } from "@/lib/services/intelligenceQuestionsService";

const answer = await getUnmatchedContentAnswer();
```

## 6. Consumidores previstos

- **Decision Engine** (`docs/intelligence/DECISIONS_ENGINE.md`, Sprint 11):
  as 3 perguntas de negócio hoje disponíveis já alimentam as 3 primeiras
  Decisions do Dashboard — o único consumidor implementado até agora.
- **IA** (`/admin/intelligence/ia`, ainda vazio): as mesmas funções podem
  alimentar um resumo gerado por IA no futuro — o campo `summary` já é
  texto pronto, útil mesmo sem nenhuma IA de verdade.
- **API**: `QuestionAnswer<T>` já é serializável como JSON sem
  transformação nenhuma — uma futura rota (`/api/intelligence/questions/...`,
  Épico 5: Automation) só precisaria chamar a função e devolver o
  resultado.

## 7. Como adicionar uma nova pergunta

1. Um arquivo novo em `questions/` (ex. `topPlatform.ts`), implementando
   `Question<TContext, TData>` — contexto e dado de resposta próprios da
   pergunta, sem forçar reuso de tipos de outra pergunta.
2. Reusar services já existentes para os dados necessários — nunca criar um
   novo service só para uma pergunta, a menos que o dado realmente não
   exista em nenhum lugar ainda.
3. Uma função de I/O em `intelligenceQuestionsService.ts` (ou um novo
   arquivo de service, se o módulo crescer o suficiente para justificar),
   seguindo o mesmo padrão de `getBestContentAnswer`.
4. Testes cobrindo a `Question` pura (casos com e sem dado) e a função de
   I/O (services chamados corretamente, `null` tratado como lista vazia).
5. Uma seção neste documento.

## 8. O que fica de fora, de propósito

- **Sem registro/engine genérico** (equivalente ao `INTELLIGENCE_RULES` dos
  Insights) — mesmo com 3 perguntas, cada uma ainda é chamada pelo seu
  próprio nome (`getBestContentAnswer`, `getStaleDatasetAnswer`,
  `getUnmatchedContentAnswer`); a Decision Engine (Sprint 11) sabe
  exatamente quais 3 perguntas precisa e as compõe explicitamente em
  `intelligenceDecisionsService.ts`. Se um consumidor futuro precisar de
  "responda todas as perguntas disponíveis" de uma vez, essa é a hora de
  adicionar um registro — não antes.
- **Sem UI própria** — nenhuma tela mostra uma `QuestionAnswer` diretamente;
  a única UI que hoje consome as perguntas é a seção "Próximas ações
  recomendadas" da Decision Engine (Sprint 11), que exibe `Decision`, não
  `QuestionAnswer`.
- **Sem persistência de resposta** — como os Insights, toda `QuestionAnswer`
  é computada sob demanda a partir de dados já persistidos, nunca guardada.
- **Sem alteração na arquitetura congelada** — `dashboard/`, `insights/`,
  `matching/`, `imports/` e os services existentes não foram tocados; o
  cálculo de "leitura mais recente por Content" e o de "Import mais recente
  por Dataset" foram replicados localmente em `questions/bestContent.ts` e
  `questions/staleDataset.ts`, em vez de extraídos de `dashboard/summary.ts`
  ou `insights/rules/`, justamente para não mexer num módulo já congelado.
