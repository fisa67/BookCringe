# Insights — Rules Engine (Sprint 9)

O Dashboard (Sprint 8, [`DASHBOARD.md`](DASHBOARD.md))
deixa de só mostrar números e passa a **orientar** o usuário: um card
**"Insights"** com recomendações concretas, geradas por um pequeno motor de
regras — não por IA, não por LLM. `Insight` já era uma entidade conceitual
desde a Sprint 3 ([`DATA_MODEL.md`](DATA_MODEL.md#insight)); esta
sprint implementa sua primeira origem real: **regra**.

---

## 1. Onde vive

```
src/lib/intelligence/insights/
├── types.ts                      # Insight, RuleContext, Rule
├── engine.ts                     # INTELLIGENCE_RULES, runIntelligenceRules
├── index.ts                      # barrel público do módulo
└── rules/
    ├── dateUtils.ts               # helpers puros compartilhados (daysBetween, mostRecentByStartedAt)
    ├── staleDataset.ts            # "Dataset desatualizado"
    ├── lowContentVolume.ts        # "Pouco conteúdo associado"
    ├── noRecentImport.ts          # "Nenhuma importação recente"
    ├── unmatchedContent.ts        # "Conteúdos sem Livro"
    ├── platformWithoutDataset.ts  # "Plataforma sem Dataset"
    └── *.test.ts                  # um teste por regra, mais engine.test.ts
```

Módulo **independente do Dashboard** — não sabe que existe uma página, um
card ou um componente React. Recebe dados, devolve `Insight[]`. Isso é
proposital: a mesma regra pode alimentar, no futuro, um e-mail semanal ou um
alerta, sem alteração.

## 2. O contrato: `Rule`

```ts
interface RuleContext {
  now: Date; // injetável — nenhuma regra chama `new Date()` direto
  datasets: IntelligenceDatasetRecord[];
  imports: IntelligenceImportRecord[];
  contents: IntelligenceContentRecord[];
  metrics: IntelligenceMetricRecord[];
}

interface Rule {
  id: string;
  description: string;
  evaluate(context: RuleContext): Insight[];
}
```

Cada regra é:

- **Isolada** — um arquivo, uma responsabilidade, zero dependência entre
  regras (`staleDataset.ts` não sabe que `unmatchedContent.ts` existe).
- **Testável** — `evaluate` é uma função pura, sem `await`, sem Supabase;
  os testes só montam um `RuleContext` na mão e checam o resultado (ver
  `rules/*.test.ts`, 16 casos no total).
- **Reutilizável** — implementa a mesma interface `Rule`; o motor
  (`engine.ts`) não sabe nada sobre a lógica interna de cada uma, só chama
  `.evaluate()` e concatena.

`now` é sempre passado pelo chamador (nunca lido de dentro de uma regra) —
é assim que `staleDatasetRule`/`noRecentImportRule` continuam
determinísticas em teste mesmo sendo baseadas em tempo.

## 3. O motor

```ts
export const INTELLIGENCE_RULES: Rule[] = [
  staleDatasetRule,
  lowContentVolumeRule,
  noRecentImportRule,
  unmatchedContentRule,
  platformWithoutDatasetRule,
];

export function runIntelligenceRules(context: RuleContext): Insight[] {
  return INTELLIGENCE_RULES.flatMap((rule) => rule.evaluate(context));
}
```

Adicionar uma regra nova nunca exige tocar nas outras: implementar `Rule`
em `insights/rules/`, escrever o teste, e adicionar 1 linha em
`INTELLIGENCE_RULES`.

## 4. As 5 regras iniciais

| Regra (`id`) | Dispara quando | Severidade | Constante ajustável |
|---|---|---|---|
| `stale-dataset` | O Import mais recente **daquele Dataset** tem ≥ 30 dias | `warning` | `STALE_DATASET_THRESHOLD_DAYS` |
| `low-content-volume` | Um Dataset tem menos de 3 Contents | `info` | `MIN_CONTENTS_PER_DATASET` |
| `no-recent-import` | Nenhum Import, **de nenhuma plataforma**, aconteceu nos últimos 14 dias | `warning` | `RECENT_IMPORT_THRESHOLD_DAYS` |
| `unmatched-content` | Pelo menos 30% dos Contents ainda não têm `book_id` | `info` | `UNMATCHED_CONTENT_RATIO_THRESHOLD` |
| `platform-without-dataset` | Uma plataforma com persistência pronta (hoje só YouTube) ainda não tem nenhum Dataset | `info` | `PLATFORMS_WITH_PERSISTENCE` |

Todas as constantes são exportadas de seus respectivos arquivos (e
reexportadas por `insights/index.ts`) — ajustar um limiar nunca exige mexer
na lógica da regra.

### `stale-dataset` vs. `no-recent-import` — por que as duas existem

`stale-dataset` avalia **cada Dataset isoladamente**: com várias
plataformas ativas, uma pode estar atualizada e outra parada — e cada uma
merece seu próprio aviso. `no-recent-import` é uma pergunta diferente,
**global**: "alguém, de alguma plataforma, trouxe dado novo recentemente?"
— só dispara se a resposta for não para todas ao mesmo tempo. Hoje, com só
o YouTube, as duas costumam disparar juntas; a distinção só rende valor de
verdade quando houver mais plataformas — arquitetura já pronta para isso.

### `platform-without-dataset` — a única regra "estrutural"

As outras 4 regras leem o que já existe (Datasets, Contents, Imports). Esta
lê o que **deveria** existir: a lista `PLATFORMS_WITH_PERSISTENCE`
(`insights/rules/platformWithoutDataset.ts`) espelha a coluna
"Persistência" da tabela "Estado por plataforma"
(`IMPORTS.md#estado-por-plataforma`). Quando um adapter futuro
(Instagram, TikTok...) ganhar seu `persistence.ts`, basta adicionar a
plataforma a essa lista — a regra passa a cobri-la automaticamente.

## 5. Como o Dashboard consome

`buildIntelligenceDashboardData` (`lib/intelligence/dashboard/summary.ts`)
chama `runIntelligenceRules` com os mesmos dados que já busca para os
outros cards, e inclui o resultado em `IntelligenceDashboardData.insights`
— nenhuma consulta adicional, nenhuma mudança em
`intelligenceDashboardService.ts`. A página (`app/admin/intelligence/page.tsx`)
ganhou a seção `InsightsSection`, que só desenha a lista (cor por
severidade: `warning` em âmbar, `info` em cinza; `critical` reservado para
o futuro).

Sem nenhuma nova migration, sem nova tabela: todo `Insight` é **computado
sob demanda**, a cada carregamento do Dashboard, nunca persistido — a
mesma decisão já registrada para o conceito de `Insight` desde a Sprint 3
(`DATA_MODEL.md#insight`: "Guardar o texto/resultado da interpretação
e quais Metrics a embasam" ainda não tem tabela; aqui ele nem precisa,
porque o resultado é barato de recalcular e sempre reflete o estado atual).

## 6. O que fica de fora, de propósito

- **Sem IA/LLM** — restrição explícita da sprint. As 5 regras são
  comparações numéricas simples (contagem, diferença de datas, razão).
- **Sem persistência de Insight** — nenhuma migration, nenhuma tabela.
  Um Insight de regra não tem "histórico" (não faz sentido guardar "ontem
  X estava desatualizado"): ele é sempre um retrato do agora.
- **Sem dispensar/silenciar um Insight** — hoje a mesma recomendação
  reaparece toda vez que as condições persistirem. Se isso incomodar na
  prática, é a próxima evolução natural (guardaria estado por Insight —
  aí sim exigiria uma tabela).
- **Sem regras cruzando Metric/Livro ainda** (ex.: "autor X está com queda
  de desempenho") — dependem de mais histórico de Metrics e de mais
  Contents vinculados via Matching; a base (`RuleContext` já recebe
  `metrics` e os `Content.book_id`) já suporta, é só escrever a regra.
