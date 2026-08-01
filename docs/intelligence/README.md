# BookCringe Intelligence

BookCringe Intelligence é a plataforma responsável por coletar, normalizar,
persistir, relacionar e analisar dados provenientes de múltiplas plataformas.

Seu objetivo não é apenas mostrar métricas.

Seu objetivo é ajudar o criador de conteúdo a tomar melhores decisões.

---

## Documentação

**Produto e planejamento**

- [`PRODUCT.md`](PRODUCT.md) — visão, missão, problema, solução, princípios
- [`ROADMAP.md`](ROADMAP.md) — épicos e o que vem a seguir
- [`SPRINTS.md`](SPRINTS.md) — o que cada sprint entregou

**Arquitetura e decisões**

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — visão geral do pipeline
- [`ARCHITECTURE_FREEZE_v0.1.md`](ARCHITECTURE_FREEZE_v0.1.md) — estrutura e regras congeladas na v0.1
- [`DECISIONS.md`](DECISIONS.md) — ADRs (decisões de arquitetura)
- [`CHANGELOG.md`](CHANGELOG.md) — histórico de versões

**Domínio e funcionalidades**

- [`DATA_MODEL.md`](DATA_MODEL.md) — modelo canônico (`Platform`, `Dataset`, `Import`, `Content`, `Metric`, `Insight`)
- [`IMPORTS.md`](IMPORTS.md) — pipeline de importações, padrão de colunas canônicas (i18n), persistência e estado por plataforma
- [`DATASETS.md`](DATASETS.md) — ciclo de vida, versionamento e telas do Dataset
- [`DASHBOARD.md`](DASHBOARD.md) — arquitetura e conteúdo do Dashboard
- [`MATCHING.md`](MATCHING.md) — matching assistido Content ↔ Livro
- [`INSIGHTS.md`](INSIGHTS.md) — Rules Engine de Insights
- [`QUESTIONS.md`](QUESTIONS.md) — biblioteca de perguntas de negócio reutilizáveis
- [`DECISIONS_ENGINE.md`](DECISIONS_ENGINE.md) — Decision Engine, recomendações determinísticas a partir de Questions
- [`WORKSPACE.md`](WORKSPACE.md) — Workspace, Decisions transformadas em ações clicáveis ("Hoje")

Ver também [`AGENTS.md`](../../AGENTS.md) para a filosofia geral do projeto.