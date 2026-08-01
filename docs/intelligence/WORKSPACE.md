# Workspace (Sprint 12)

Épico novo, construído **sobre** a Decision Engine já existente
([`DECISIONS_ENGINE.md`](DECISIONS_ENGINE.md)) e sobre a arquitetura v0.1
já congelada ([`ARCHITECTURE_FREEZE_v0.1.md`](ARCHITECTURE_FREEZE_v0.1.md))
— nenhum módulo existente (`questions/`, `decisions/`, `dashboard/`,
`insights/`, `matching/`, `imports/`, `services/`) foi alterado para isso.
Nenhuma migration nova, nenhuma nova IA.

## 1. Conceito

Até a Sprint 11, o Dashboard sabia **o que recomendar** (Decision: título,
descrição, prioridade, ação recomendada, justificativa) — mas era só
texto. O usuário lia a recomendação e tinha que descobrir sozinho para
onde ir no admin para agir.

O Workspace fecha esse ciclo: transforma cada Decision em uma
**WorkspaceAction** — a mesma recomendação, mas já com um botão que leva
direto para onde a ação acontece (Livros, Matching ou Importações). O
Dashboard deixa de ser um mural de avisos e passa a ser uma central de
trabalho diário: a seção **"Hoje"**, no topo da tela, é a lista de ações
priorizadas que valem a pena resolver agora.

## 2. Arquitetura

```
src/lib/intelligence/actions/
├── types.ts                        # WorkspaceAction, WorkspaceActionCategory, ActionBuilder
├── engine.ts                        # ACTION_BUILDERS + buildWorkspaceActions
├── engine.test.ts
├── builders/
│   ├── repeatBestTheme.ts             # Decision "repeat-best-theme" → ação com destino a Livros
│   ├── repeatBestTheme.test.ts
│   ├── updateDataset.ts               # Decision "import-stale-dataset" → ação com destino a Importações
│   ├── updateDataset.test.ts
│   ├── completeMatching.ts            # Decision "complete-matching" → ação com destino a Matching
│   └── completeMatching.test.ts
└── index.ts                            # barrel público do módulo
```

```
src/lib/services/
└── workspaceService.ts    # I/O: busca Decisions via getRecommendedDecisions e chama buildWorkspaceActions
    workspaceService.test.ts
```

Mesma divisão de responsabilidade das camadas anteriores: **I/O fica no
service, cálculo puro fica no módulo de domínio**. Nenhum Action Builder
importa Supabase, `intelligenceDatasetService` ou `bookService` — só
`workspaceService.ts` sabe que a Decision Engine existe, e nenhuma camada
do Workspace sabe que Dataset/Import/Content/Metric existem.

### Regra central: um Action Builder só enxerga `Decision[]`

> Cada Action Builder deverá consumir exclusivamente Decision. Nunca
> acessar banco diretamente.

```ts
interface ActionBuilder {
  id: string;               // igual ao id da Decision de origem
  description: string;
  build(decisions: Decision[]): WorkspaceAction[];
}
```

Cada builder procura, dentro de `Decision[]`, a Decision com o `id` que ele
sabe transformar (ex.: `repeatBestThemeActionBuilder` procura
`"repeat-best-theme"`) e devolve `[]` se ela não existir naquele momento
(a Decision Engine não a gerou, porque a condição dela não se aplica). Não
há nenhum `if` sobre dado bruto em lugar nenhum dentro de `actions/`.

### O contrato: `WorkspaceAction`

```ts
type WorkspaceActionCategory = "book" | "dataset" | "matching";

interface WorkspaceAction {
  id: string;
  title: string;              // título
  description: string;        // descrição
  priority: DecisionPriority;  // prioridade (mesmo tipo já usado por Decision)
  category: WorkspaceActionCategory; // categoria
  rationale: string;           // justificativa baseada em dados (herdada da Decision)
  buttonLabel: string;          // texto do botão
  href: string;                  // destino
}
```

`priority` e `rationale` são copiados diretamente da Decision de origem —
o Action Builder nunca reinterpreta prioridade nem reescreve a
justificativa, só adiciona o que faltava para a recomendação virar uma
ação clicável (`category`, `buttonLabel`, `href`).

### Por que os destinos são fixos, não dinâmicos

Nenhuma Decision carrega um ID de registro (`bookId`, `datasetId`,
`contentId`) — só texto (título, descrição, justificativa). Como o Action
Builder não pode acessar o banco para descobrir esse ID, os destinos são
fixos por categoria:

| Decision | Categoria | Botão | Destino |
|---|---|---|---|
| `repeat-best-theme` | `book` | "Ver Livros" | `/admin/books` |
| `import-stale-dataset` | `dataset` | "Importar agora" | `/admin/intelligence/importacoes` |
| `complete-matching` | `matching` | "Ver Matching" | `/admin/intelligence/conteudos` |

Se uma Decision futura precisar de um destino específico (ex.: o Livro
exato a repetir), o dado necessário (`bookId`) precisaria nascer na
própria Decision — isso é uma evolução da Decision Engine, fora do escopo
desta sprint (que explicitamente não altera `decisions/`).

## 3. Fluxo

```
QuestionAnswer (Sprint 10)
        ↓
     Decision (Sprint 11, Decision Engine)
        ↓
  WorkspaceAction (Sprint 12, Workspace)
        ↓
      Usuário
```

1. `getRecommendedDecisions()` (`intelligenceDecisionsService.ts`, Sprint
   11) busca os dados persistidos, calcula os `QuestionAnswer`s e roda a
   Decision Engine — sem nenhuma mudança nesta sprint.
2. `getWorkspaceActions()` (`workspaceService.ts`, novo) chama
   `getRecommendedDecisions()` e delega o resultado para
   `buildWorkspaceActions(decisions)`.
3. `buildWorkspaceActions` roda cada `ActionBuilder` (`ACTION_BUILDERS`)
   contra o mesmo array de Decisions, concatena o resultado e ordena por
   prioridade (`high` → `medium` → `low`) — mesmo critério já usado por
   `runDecisionEngine`.
4. O Dashboard (`src/app/admin/intelligence/page.tsx`) busca
   `getWorkspaceActions()` em paralelo com `getIntelligenceDashboardData()`
   e renderiza a seção **"Hoje"**, no topo da tela — substituindo a antiga
   seção "Próximas ações recomendadas" (Sprint 11).
5. O usuário vê a ação, o motivo (justificativa citando a pergunta de
   negócio original) e clica no botão, que já leva para a tela certa
   (Livros, Matching ou Import Center).

## 4. Como chamar

```ts
import { getWorkspaceActions } from "@/lib/services/workspaceService";

const actions = await getWorkspaceActions();
```

## 5. Como adicionar uma WorkspaceAction para uma Decision nova

1. Um arquivo novo em `actions/builders/` (ex. `forecastAlert.ts`),
   implementando `ActionBuilder` com o mesmo `id` da Decision de origem.
2. Escolher (ou criar) uma `WorkspaceActionCategory` e o par
   `buttonLabel`/`href` correspondente.
3. Listar o builder em `ACTION_BUILDERS` (`actions/engine.ts`).
4. Testes cobrindo: a Decision existe → gera a ação certa; a Decision não
   existe → devolve `[]`.
5. Uma linha na tabela da seção 2 deste documento.

## 6. O que fica de fora, de propósito

- **Sem IA, sem LLM** — pedido explícito desta sprint; toda WorkspaceAction
  é uma transformação determinística de uma Decision já determinística.
- **Sem novas plataformas, sem novas migrations** — nenhuma tabela nova,
  nenhuma WorkspaceAction é persistida; tudo é recalculado sob demanda.
- **Sem alteração em `questions/` ou `decisions/`** — as duas Questions da
  Sprint 11 e as 3 Decision Rules continuam exatamente como estavam;
  `getRecommendedDecisions()` não foi tocado.
- **Sem destino dinâmico por registro** (ver seção 2.3) — os 3 destinos
  são fixos por categoria, porque a Decision não carrega IDs de registro.
- **Sem registro genérico de "todas as WorkspaceActions disponíveis" além
  de `ACTION_BUILDERS`** — com só 3 builders, a lista fixa em `engine.ts`
  já é simples o suficiente.
