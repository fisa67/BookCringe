# v0.4.0

Épico Workspace — Decisions viram ações clicáveis, transformando o
Dashboard numa central de trabalho diário, sem IA e sem alterar a Decision
Engine ou as Questions.

## Added

- Módulo `lib/intelligence/actions/` (contrato `WorkspaceAction`/`ActionBuilder`)

- 3 Action Builders: `repeatBestThemeActionBuilder`, `updateDatasetActionBuilder`, `completeMatchingActionBuilder`

- `workspaceService.getWorkspaceActions`

## Changed

- Dashboard: a seção "Próximas ações recomendadas" (v0.3.0) foi substituída pela seção "Hoje", no topo da tela, com botões funcionais para Livros, Importações e Matching

---

# v0.3.0

Épico Decision Engine — primeira camada de recomendações, sem IA e sem
LLM, construída sobre a arquitetura v0.1 já congelada e sobre a biblioteca
de Questions (v0.2.0), sem alterar nenhuma delas.

## Added

- Módulo `lib/intelligence/decisions/` (contrato `Decision`/`DecisionRule`/`DecisionContext`)

- 3 primeiras Decisions: `repeat-best-theme`, `import-stale-dataset`, `complete-matching`

- `intelligenceDecisionsService.getRecommendedDecisions`

- 2 novas perguntas de negócio: `staleDatasetQuestion` ("Qual é o Dataset mais desatualizado?") e `unmatchedContentQuestion` ("Quanto do meu conteúdo ainda não foi vinculado a um Livro?")

- Seção "Próximas ações recomendadas" no Dashboard

---

# v0.2.0

Épico Questions — biblioteca de perguntas de negócio, construída sobre a
arquitetura v0.1 já congelada, sem alterá-la.

## Added

- Módulo `lib/intelligence/questions/` (contrato `Question`/`QuestionAnswer`)

- Primeira pergunta: "Qual foi meu melhor conteúdo?" (`bestContentQuestion`)

- `intelligenceQuestionsService.getBestContentAnswer`

---

# v0.1.0

Primeira versão funcional do Intelligence.

## Added

- Pipeline

- Detection Preview

- Import Session

- Persistência

- Dataset

- Dashboard

- Matching

- Rules Engine