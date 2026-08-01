# ADR-001

Cada plataforma possui seu próprio Adapter.

Motivo

Evitar um parser gigante.

Consequências

Novas plataformas podem ser adicionadas isoladamente.

---

# ADR-002

Dashboard nunca lê arquivos.

...

---

# ADR-003

Matching é assistido.

...

---

# ADR-004

Content Intelligence ≠ CMS Content

...

---

# ADR-005

Nenhum dado do Livro é duplicado.

...

---

# ADR-006

Questions é um módulo novo (`src/lib/intelligence/questions/`), adicionado
sobre a arquitetura v0.1 já congelada.

Motivo

Construir uma biblioteca de perguntas de negócio reutilizáveis
(`docs/intelligence/QUESTIONS.md`) sem reabrir ou alterar nenhum módulo já
congelado (`dashboard`, `insights`, `matching`, `imports`, `services`).

Consequências

Toda pergunta reutiliza exclusivamente services existentes — nenhuma
pergunta cria tabela, migration ou service novo para dado que já existe.
Cálculos internos de módulos congelados (ex.: `dashboard/summary.ts`) não
são importados nem refatorados por uma Question; pequenas duplicações
locais são preferíveis a tocar num módulo congelado.

---

# ADR-007

Decisions é um módulo novo (`src/lib/intelligence/decisions/`), adicionado
sobre a arquitetura v0.1 já congelada — assim como Questions (ADR-006).

Motivo

Construir a primeira camada de Decision Engine
(`docs/intelligence/DECISIONS_ENGINE.md`): recomendações determinísticas,
sem IA e sem LLM, geradas a partir de regras que só enxergam
`QuestionAnswer` (`lib/intelligence/questions/`, Sprint 10) — nunca um
Dataset/Import/Content/Metric bruto. Isso mantém a Decision Engine
desacoplada de como cada resposta foi calculada, e mantém a fronteira
entre camadas explícita: dado bruto → Question → Decision.

Consequências

Nenhuma Decision lê Dataset/Import/Content/Metric diretamente; o
`intelligenceDecisionsService.ts` é o único ponto de I/O, e é ele quem
calcula os `QuestionAnswer`s (reutilizando services já existentes) antes
de chamar `runDecisionEngine`. Duas novas perguntas de negócio
(`stale-dataset`, `unmatched-content`) foram adicionadas a
`lib/intelligence/questions/` só para isso — a biblioteca de perguntas
(Sprint 10) se mostrou reutilizável na prática já na sprint seguinte. O
Dashboard (`src/app/admin/intelligence/page.tsx`) ganhou uma nova seção,
"Próximas ações recomendadas", mas `lib/intelligence/dashboard/` (a
agregação congelada) não foi tocado — a página busca as Decisions com uma
chamada separada, em paralelo à `getIntelligenceDashboardData()`.

---

# ADR-008

Workspace é um módulo novo (`src/lib/intelligence/actions/`), adicionado
sobre a Decision Engine (ADR-007) já congelada — mesmo padrão de ADR-006 e
ADR-007.

Motivo

Transformar o Dashboard numa central de trabalho diário
(`docs/intelligence/WORKSPACE.md`): cada Decision passa a virar uma
`WorkspaceAction` clicável (botão + destino), sem que isso exija alterar
`decisions/` ou `questions/` — o Workspace só consome `Decision[]`, nunca
recalcula nada, nunca acessa o banco.

Consequências

Nenhum Action Builder importa um service ou o Supabase; o único ponto de
I/O é `workspaceService.ts`, que reusa `getRecommendedDecisions`
(Sprint 11) sem modificá-lo. A seção "Próximas ações recomendadas"
(Sprint 11) foi substituída pela seção "Hoje", no topo do Dashboard —
`lib/intelligence/dashboard/` continua intocado. Como uma Decision não
carrega IDs de registro (`bookId`, `datasetId`, `contentId`), os destinos
de cada WorkspaceAction são fixos por categoria, não dinâmicos por
registro; se isso mudar no futuro, o dado precisará nascer na própria
Decision — uma evolução da Decision Engine, não do Workspace.