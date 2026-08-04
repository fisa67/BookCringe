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

---

# ADR-009

Datasets "em formato de audiência" persistem como Metric sem Content.

Motivo

A audiência do Instagram (`FollowerHistory`, `FollowerActivity`,
`FollowerGender`, `FollowerTopTerritories`, `platforms/instagram/audience*.ts`)
não tem um item individual identificável — diferente de um vídeo do YouTube
(que tem título, é a unidade natural de um `Content`), cada linha de
audiência é uma medição do próprio canal num instante (um dia, uma hora, uma
categoria). Forçar essas linhas dentro de `Content` criaria entradas sem
sentido ("Content" = "2026-07-25"?), distorceria o Matching (Content ↔
Livro, que pressupõe um item real) e o Dashboard (Top 10 por Content). A
análise completa está em `docs/intelligence/AUDIENCE_PERSISTENCE.md`
(Sprint 14); a conclusão central: `intelligence_metrics.content_id` já era
opcional desde a migration original (`20260801_intelligence_datasets.sql`)
e `docs/intelligence/DATA_MODEL.md` já previa esse caso desde a Sprint 3 —
zero mudança de schema foi necessária.

Consequências

- `platforms/instagram/persistence.ts` (`instagramAudiencePersistence`)
  nunca chama `upsertContent` — só `findOrCreateDataset`, `createImport` e
  `insertMetrics`, com `content_id` sempre ausente nas linhas gravadas.
- Um único Dataset (`platform: "instagram"`, nome `"Instagram —
  Audiência"`) cobre os 4 formatos — nenhuma chave composta
  `(platform, kind)` foi criada nesta sprint; `Metric.key` (convenção
  `followers`/`followersDelta`/`activeFollowers`/`gender:<label>`/
  `territory:<código>`) já basta para não colidir entre os 4 `datasetKind`.
  Essa composição só passa a ser necessária se o Instagram ganhar um
  segundo Adapter "em formato de conteúdo" (ex.: Reels) que precise
  coexistir com a audiência sob a mesma Platform.
- Qualquer plataforma futura sem um item individual (ex.: métricas
  agregadas de campanha) deve seguir o mesmo padrão — Metric direto no
  Dataset — em vez de inventar uma entidade `Content` artificial só para
  caber no modelo existente.
- O Rules Engine (`insights/rules/low-content-volume.ts`) e o Dashboard
  (Top 10 por Content) ainda enxergam esse Dataset como "0 Contents" — a
  Sprint 14 deliberadamente não mexeu nessas leituras (ver
  `AUDIENCE_PERSISTENCE.md` seção 5); ajustar isso é trabalho da Sprint 15.

---

# ADR-010

Datasets "em formato de campanha" (custo + resultado de mídia paga) são uma
terceira categoria de forma de dado — Campaign-shaped —, distinta de
Content-shaped (ADR-001, YouTube) e Audience-shaped (ADR-009, Instagram), e
persistem sobre o mesmo modelo `Dataset → Import → Content → Metric`, sem
tabela nova.

Motivo

A análise arquitetural da Sprint 19 (TikTok Promotions, primeiro caso
concreto) identificou um dado que não é nem Content-shaped nem
Audience-shaped: introduz uma dimensão nunca modelada antes (custo, ex.
`ad_cost_brl`), mistura métricas de fato bruto com métricas derivadas
(`cost_per_view`, `cost_per_follower`) e, dependendo do arquivo, pode ou não
referenciar um item individual (um vídeo promovido tem título; uma campanha
agregada por período não tem). `imports/types.ts` já reservava espaço para
isso — `NormalizedEntityType` inclui `"campaign_metric"` desde antes desta
sprint, sem nenhum Adapter usá-lo ainda. Os detectores já existentes para
Meta Ads (`detection/platformDetectors.ts`, `metaAdsDetector`: "amount
spent", "cpm", "ctr") mostram que esse não é um caso isolado do TikTok, mas
um padrão que vai se repetir em qualquer plataforma de mídia paga.

Das três opções de desenho analisadas (A: forçar Content sempre; B: nunca
usar Content, replicar ADR-009 literalmente; C: híbrida — Content opcional
por linha, chaves de Metric reservadas), a opção **C é a recomendada e
generaliza** para TikTok Promotions, Meta Ads, Google Ads e Amazon Ads: nas
quatro, o traço definidor de "Campaign-shaped" é a dimensão de custo mais a
opcionalidade de `content_id` — nunca a obrigatoriedade de um item
identificável. Google Ads e Amazon Ads, em particular, tipicamente não têm
um Content correspondente (campanha de busca, listagem de produto); forçar
Content nessas (opção A) criaria entradas artificiais, o mesmo erro que a
ADR-009 já rejeitou para audiência.

Sobre a chave de Dataset: `(platform, name)` continua suficiente por ora —
nenhuma migration é necessária — mas passa a ser uma convenção
**obrigatoriamente documentada**, não mais incidental: todo Dataset deve
nomear-se como `"<Plataforma> — <Kind>"` (ex. `"TikTok — Promoções"` vs.
um futuro `"TikTok — Creator Analytics"`), tornando o `kind` sempre
derivável do nome. A chave composta real `(platform, kind)` — já cogitada
como pendência na ADR-009 — só se torna obrigatória quando algum Rule,
Insight ou Question precisar filtrar/consultar Datasets por `kind`
*programaticamente* (não apenas exibir o nome), o que ainda não é o caso.

Consequências

Mudanças arquiteturais obrigatórias (valem para qualquer Adapter de mídia
paga futuro, não só TikTok):

- `content_id` em Metric de dado Campaign-shaped é sempre opcional; um
  Adapter só deve chamar `upsertContent` quando a linha identificar
  inequivocamente um item promovido (ex. título de vídeo já conhecido) —
  caso contrário, grava só o Metric no Dataset, sem Content, igual à
  ADR-009.
- Toda métrica bruta Campaign-shaped usa um namespace de chave reservado e
  documentado (ex. prefixo `promo:` ou `campaign:`) — nunca reaproveita
  chaves de métrica orgânica já existentes (`views`, `followersDelta`
  etc.), para não corromper Top 10, `matchingRate` ou correlações
  existentes ao misturar dado pago com orgânico sob a mesma chave.
- Métricas derivadas por razão (`cost_per_view`, `cost_per_click`,
  `cost_per_follower`, `cost_per_conversion` etc.) nunca são persistidas
  como Metric — são sempre calculadas sob demanda em função pura, seguindo
  o precedente já estabelecido por `matchingRate` e
  `AudienceDatasetSummary`.
- Antes de qualquer Rule/Insight/Dashboard ler dado Campaign-shaped, deve
  existir um classificador equivalente a `isAudienceDataset`/
  `isAudienceMetric` (ex. `isCampaignDataset`/`isCampaignMetric`) para
  evitar repetir o falso-positivo que `low-content-volume` teve com
  Audience antes da Sprint 15.
- Nome de Dataset segue obrigatoriamente o padrão `"<Plataforma> — <Kind>"`
  a partir desta ADR, para qualquer Dataset novo, Campaign-shaped ou não.

Mudanças que podem ser adiadas (fora do escopo desta ADR):

- Coluna real `(platform, kind)` e sua migration — só quando um caso
  concreto exigir filtro programático por `kind`, não apenas exibição.
- Adapter, parser e persistência do TikTok Promotions, Meta Ads, Google Ads
  e Amazon Ads — implementação fica para sprints futuras.
- Seções de Dashboard, novas Questions, Rules de Insight e DecisionRules
  específicas para dado Campaign-shaped — a única garantia fixada agora é
  que, quando chegarem, não vão exigir tabela nova nem quebrar o modelo
  atual.