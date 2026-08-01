# v0.4.1

Padrão oficial de **colunas canônicas** para todos os importadores do
Intelligence — detector e parser compartilham a mesma fonte de verdade,
independente do idioma da conta da plataforma.

## Added

- `imports/columns.ts` — `CanonicalColumnSchema`, `matchColumns`, `getColumnValue`
- `detection/canonicalColumnDetector.ts` — factory de detecção por colunas canônicas
- `platforms/youtube/columns.ts` com aliases en/pt/es; parser e detector do YouTube migrados
- Esqueletos `columns.ts` para Instagram, TikTok, Meta Ads e Google Analytics
- Fixtures pt-BR do YouTube Studio (`youtube-studio-report-pt.csv`, `youtube-studio-table-data-pt.csv`)

## Changed

- Detection Preview do YouTube reconhece exports em português (ex.: `Table data.csv`)
- Parser do YouTube ignora linha agregada `Total` e colunas extras; métricas opcionais ausentes viram 0
- Documentação em `IMPORTS.md` atualizada com o guia do padrão canônico

---

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