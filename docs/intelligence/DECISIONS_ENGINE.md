# Decision Engine (Sprint 11)

Épico novo, construído **sobre** a arquitetura v0.1 já congelada
([`ARCHITECTURE_FREEZE_v0.1.md`](ARCHITECTURE_FREEZE_v0.1.md)) e sobre a
biblioteca de perguntas de negócio da Sprint 10
([`QUESTIONS.md`](QUESTIONS.md)) — nenhum módulo existente (`imports/`,
`dashboard/`, `matching/`, `insights/`, `services/`) foi alterado para
isso. Ver [`DECISIONS.md`](DECISIONS.md#adr-007) para o registro dessa
decisão de arquitetura.

O objetivo da Decision Engine é transformar respostas de negócio já
calculadas (`QuestionAnswer`) em **ações concretas**: em vez de o
Dashboard só mostrar números e o usuário ter que interpretá-los, a
Decision Engine já diz "o que fazer a seguir".

**Sem IA. Sem LLM.** Toda Decision é gerada por uma regra determinística,
igual ao Rules Engine de Insights (Sprint 9) — a diferença é o que cada
camada enxerga (ver seção 2).

---

## 1. Onde vive

```
src/lib/intelligence/decisions/
├── types.ts                       # Decision, DecisionContext, DecisionRule
├── engine.ts                       # DECISION_RULES + runDecisionEngine
├── engine.test.ts
├── rules/
│   ├── repeatBestTheme.ts           # Decision 1: repetir o melhor tema
│   ├── repeatBestTheme.test.ts
│   ├── importStaleDataset.ts        # Decision 2: importar Dataset desatualizado
│   ├── importStaleDataset.test.ts
│   ├── completeMatching.ts          # Decision 3: concluir Matching de conteúdos
│   └── completeMatching.test.ts
└── index.ts                          # barrel público do módulo
```

```
src/lib/services/
└── intelligenceDecisionsService.ts   # I/O: busca dados via services existentes,
    intelligenceDecisionsService.test.ts  # calcula os QuestionAnswers e chama a engine
```

```
src/lib/intelligence/questions/
├── staleDataset.ts        # Pergunta nova (Sprint 11): "Qual é o Dataset mais desatualizado?"
└── unmatchedContent.ts     # Pergunta nova (Sprint 11): "Quanto do meu conteúdo ainda não foi vinculado a um Livro?"
```

Mesma divisão de responsabilidade de sempre: **I/O fica no service,
cálculo puro fica no módulo de domínio**. `intelligenceDecisionsService.ts`
reutiliza exclusivamente `listDatasets`, `listImports`, `listContents`,
`listMetrics` (`intelligenceDatasetService.ts`) e `getBooks`
(`bookService.ts`) — as mesmas funções que já alimentam o Dashboard e as
Questions. Nenhuma tabela nova, nenhuma migration nova.

## 2. A regra central: Decision só enxerga `QuestionAnswer`

Esta é a restrição mais importante desta sprint, pedida explicitamente:

> A Decision Engine deverá consumir exclusivamente `QuestionAnswer`.

Diferença em relação aos Insights (Sprint 9):

| | Insights (`insights/`) | Decisions (`decisions/`) |
|---|---|---|
| Entrada de cada regra | `RuleContext` — Dataset/Import/Content/Metric **brutos** | `DecisionContext` — só `QuestionAnswer`s **já calculados** |
| O que produz | `Insight` (aviso/observação) | `Decision` (ação recomendada) |
| Fonte de verdade | lê os registros persistidos diretamente | lê a biblioteca de perguntas (`questions/`) |

```ts
interface DecisionContext {
  now: Date;
  bestContent: QuestionAnswer<BestContentAnswerData>;
  staleDataset: QuestionAnswer<StaleDatasetAnswerData>;
  unmatchedContent: QuestionAnswer<UnmatchedContentAnswerData>;
}

interface DecisionRule {
  id: string;
  description: string;
  evaluate(context: DecisionContext): Decision[];
}
```

Nenhum arquivo em `decisions/rules/` importa `intelligenceDatasetService`,
`bookService` ou qualquer tipo de linha de tabela
(`IntelligenceDatasetRecord`, `IntelligenceContentRecord` etc.). Só
`intelligenceDecisionsService.ts` (a camada de I/O) sabe que essas tabelas
existem — ele busca os dados, calcula os 3 `QuestionAnswer`s chamando as
Questions diretamente, e só então entrega o `DecisionContext` pronto para
`runDecisionEngine`.

Por que isso importa: trocar a lógica interna de uma Question (por
exemplo, mudar a definição de "melhor conteúdo" de `views` para outra
métrica) nunca deveria exigir mudar uma Decision — a Decision só
enxerga o contrato estável (`QuestionAnswer`), nunca a implementação por
trás dele.

### Onde fica o limiar ("isso já é grave o suficiente")

As duas Questions novas desta sprint (`stale-dataset`, `unmatched-content`)
só reportam o **fato** (quantos dias, qual proporção), sem decidir se isso
já justifica uma ação — essa interpretação é responsabilidade da
`DecisionRule`, não da `Question`. Isso mantém a mesma pergunta reutilizável
por qualquer consumidor que queira um limiar diferente no futuro.

Os limiares usados pelas Decisions **são os mesmos já validados pelos
Insights** (Sprint 9), reexportados por `lib/intelligence/insights`:

- `STALE_DATASET_THRESHOLD_DAYS` (30 dias) — usado por `import-stale-dataset`.
- `UNMATCHED_CONTENT_RATIO_THRESHOLD` (30%) — usado por `complete-matching`.

Reusar os mesmos limiares evita que Insights e Decisions discordem sobre o
que conta como "desatualizado" ou "matching incompleto" para o mesmo
estado de dados.

## 3. O contrato: `Decision`

```ts
type DecisionPriority = "low" | "medium" | "high";

interface Decision {
  id: string;
  title: string;              // título
  description: string;        // descrição
  priority: DecisionPriority; // prioridade
  recommendedAction: string;  // ação recomendada
  rationale: string;          // justificativa baseada em dados
}
```

`rationale` sempre cita a pergunta e o resumo (`summary`) do
`QuestionAnswer` que originou a Decision — nunca uma frase genérica sem
dado por trás (ex.: `Baseado na pergunta "Qual é o Dataset mais
desatualizado?": O Dataset mais desatualizado é "YouTube Studio —
Desempenho de vídeos", sem uma nova importação há 45 dia(s).`).

## 4. As 3 Decisions da Sprint 11

### 4.1 `repeat-best-theme` — "Repita o que já funcionou"

Lê `bestContent` (`questions/bestContent.ts`, Sprint 10). Dispara sempre
que há uma resposta (não usa limiar — destacar o melhor conteúdo é sempre
uma recomendação de baixo risco).

- **Prioridade**: sempre `medium`.
- **Ação recomendada**: planejar um novo conteúdo sobre o mesmo Livro (se
  já vinculado) ou o mesmo tema.
- **Justificativa**: cita o título, a plataforma e o valor da métrica do
  melhor conteúdo.

### 4.2 `import-stale-dataset` — "Importe um novo relatório"

Lê `staleDataset` (`questions/staleDataset.ts`, novo). Dispara quando o
Dataset mais desatualizado tem `STALE_DATASET_THRESHOLD_DAYS` (30) dias ou
mais sem Import.

- **Prioridade**: `high` se ≥ 60 dias (2× o limiar), senão `medium`.
- **Ação recomendada**: abrir o Import Center e importar um relatório mais
  recente da plataforma daquele Dataset.
- **Justificativa**: cita o nome do Dataset e os dias desde o último
  Import.

### 4.3 `complete-matching` — "Finalize o Matching de conteúdos"

Lê `unmatchedContent` (`questions/unmatchedContent.ts`, novo). Dispara
quando pelo menos `UNMATCHED_CONTENT_RATIO_THRESHOLD` (30%) dos Contents
ainda não têm Livro vinculado.

- **Prioridade**: `high` se ≥ 50% sem vínculo, senão `medium`.
- **Ação recomendada**: abrir Conteúdos e confirmar os matchings sugeridos
  ou vincular manualmente os pendentes.
- **Justificativa**: cita a contagem e a proporção de Contents sem Livro.

## 5. A engine

```ts
export const DECISION_RULES: DecisionRule[] = [
  repeatBestThemeDecision,
  importStaleDatasetDecision,
  completeMatchingDecision,
];

export function runDecisionEngine(context: DecisionContext): Decision[] {
  return DECISION_RULES.flatMap((rule) => rule.evaluate(context)).sort(byPriorityDesc);
}
```

Mesmo formato do `INTELLIGENCE_RULES` dos Insights: uma lista de regras
independentes, cada uma podendo gerar 0 ou mais Decisions. O resultado é
ordenado por prioridade (`high` → `medium` → `low`) para o consumidor (o
Dashboard) mostrar as ações mais urgentes primeiro, sem precisar saber
como a ordenação funciona.

## 6. Como chamar

```ts
import { getRecommendedDecisions } from "@/lib/services/intelligenceDecisionsService";

const decisions = await getRecommendedDecisions();
```

`getRecommendedDecisions` é o único ponto de entrada de I/O: busca
Datasets, Imports, Contents, Metrics (`intelligenceDatasetService.ts`) e
Livros (`bookService.ts`) — uma única vez —, calcula os 3
`QuestionAnswer`s chamando `bestContentQuestion`, `staleDatasetQuestion` e
`unmatchedContentQuestion` diretamente (evitando refazer a mesma busca 3
vezes), e delega para `runDecisionEngine`.

## 7. Dashboard: "Próximas ações recomendadas"

`src/app/admin/intelligence/page.tsx` ganhou uma nova seção, logo abaixo
do resumo geral e acima dos Insights. Ela busca `getRecommendedDecisions()`
em paralelo com `getIntelligenceDashboardData()` — **não** faz parte de
`IntelligenceDashboardData` (`lib/intelligence/dashboard/types.ts`), de
propósito: essa agregação está congelada na v0.1, e a Decision Engine é um
módulo novo construído por cima dela, não dentro dela.

Cada Decision é exibida com título, badge de prioridade (cor por
severidade, mesmo padrão visual dos Insights), descrição, ação recomendada
em destaque e a justificativa em texto menor. Quando não há nenhuma
Decision, a seção mostra um estado vazio positivo ("Nenhuma ação
recomendada no momento...").

## 8. O que fica de fora, de propósito

- **Sem IA, sem LLM** — pedido explícito desta sprint; toda Decision é
  puramente determinística (`if`/comparação de limiar), testável sem
  nenhuma chamada externa.
- **Sem novas migrations, sem novas tabelas** — nenhuma Decision é
  persistida; toda `Decision[]` é recalculada sob demanda a partir de
  dados já persistidos, mesmo padrão dos Insights e das Questions.
- **Sem alteração na arquitetura congelada** — `dashboard/`, `insights/`,
  `matching/`, `imports/` e os services existentes não foram tocados;
  `dashboard/summary.ts` e `dashboard/types.ts` continuam exatamente como
  estavam antes desta sprint.
- **Sem registro genérico de "todas as decisions disponíveis" além de
  `DECISION_RULES`** — com só 3 regras, a lista fixa em `engine.ts` já é
  simples o suficiente; um registro mais sofisticado (com metadados,
  habilitar/desabilitar por regra etc.) só faria sentido com muito mais
  regras.
- **Sem priorização entre Decisions concorrentes** (ex.: e se
  `import-stale-dataset` e `complete-matching` recomendarem coisas que
  competem pelo tempo do usuário?) — cada regra é avaliada de forma
  independente; a única composição feita hoje é a ordenação por
  prioridade, não uma escolha de "só a mais importante".
