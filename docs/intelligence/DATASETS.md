# Datasets — Sprint 5 (Design)

Este documento projeta a experiência completa do conceito de **Dataset** no
Intelligence: o que ele é, seu ciclo de vida, como ele se relaciona com as
demais entidades, como versionamento vai funcionar, e como as telas de
"Importações" evoluem para "Datasets".

**Esta é uma sprint de design, não de implementação.** Nenhum código foi
alterado. Não há banco, migration ou persistência aqui — apenas a
consolidação do conceito antes de construí-lo de verdade na próxima sprint.
A definição formal de Dataset já existe em
[`DATA_MODEL.md`](DATA_MODEL.md#dataset); este documento aprofunda o
ciclo de vida, o versionamento e a experiência de produto em cima dela.

> **Atualização (Sprint 6):** a seção 7 abaixo foi implementada — migration,
> tabelas e nomenclatura ficaram exatamente como planejado aqui. Ver
> [`IMPORTS.md`](IMPORTS.md#persistência) para o estado real
> (o que existe, o que ainda não existe, e por quê). As telas da seção 5
> (Lista de Datasets, Dataset Detail, comparação) continuam só design —
> ainda não implementadas.
>
> **Atualização (Sprint 7):** a aba "Conteúdos" descrita na seção 5.2 abaixo
> ganhou uma implementação real, só que ainda como tela própria
> (`/admin/intelligence/conteudos`, listando Contents de todos os Datasets)
> em vez de uma aba dentro do Dataset Detail — que continua sem existir.
> Junto veio o Matching assistido Content ↔ Livro do CMS, não previsto
> originalmente neste documento. Ver
> [`MATCHING.md`](MATCHING.md).

---

## 1. O que é um Dataset

Um Dataset é o **recipiente de longo prazo** de uma origem de dados: "os
dados de desempenho de vídeos do YouTube do BookCringe", por exemplo — não
um arquivo, não uma importação, mas a coleção contínua que essas importações
alimentam ao longo do tempo.

Hoje, com um adapter por Platform, a identidade de um Dataset é simples:

```
Dataset = Platform + formato de dado que ela produz
```

Ou seja, **1 Platform → 1 Dataset**, por enquanto: "YouTube" produz o
Dataset "YouTube Studio — Desempenho de vídeos". Isso é intencional — o
AGENTS.md pede simplicidade sobre abstração antecipada, e hoje cada adapter
só sabe produzir um tipo de relatório.

Essa identidade, porém, foi desenhada para crescer sem quebrar nada: no
futuro, uma mesma Platform pode ter mais de um Dataset (ex.: "YouTube —
Desempenho de vídeos" e "YouTube — Audiência", se o adapter passar a
suportar os dois relatórios do Studio). Quando isso acontecer, a chave de
identidade passa a ser `Platform + kind` (um slug do tipo de relatório), não
mais só a Platform. Nada na experiência descrita abaixo depende de haver
exatamente um Dataset por Platform.

---

## 2. Ciclo de vida

### 2.1 Nascimento — criação implícita

**Um Dataset nasce automaticamente no primeiro Import bem-sucedido** de uma
combinação Platform + kind que ainda não existe. O usuário nunca precisa
"criar um Dataset" antes de importar — ele simplesmente importa um CSV do
YouTube Studio no Import Center (já existente desde a Sprint 4), e se não
houver ainda um Dataset para "YouTube — Desempenho de vídeos", a
Persistência cria um automaticamente e associa o Import a ele.

Por quê implícito, e não um botão "Criar Dataset"?

- Hoje só existe um `kind` por Platform — pedir para o usuário escolher ou
  nomear um Dataset antes de importar é fricção sem valor (viola "nunca
  criar arquitetura sem entregar valor").
- O Dataset é, por definição, derivado do que os dados *são* — quem sabe
  disso é o adapter da plataforma, não o usuário.

Isso não impede criação manual futura: quando existir mais de um `kind`
possível por Platform, a tela de Dataset Detail ganha uma ação
"Renomear"/"Editar" (seção 5.2), e o fluxo de import pode perguntar "isto é
um novo Dataset ou continuação de um existente?" quando a detecção for
ambígua. Mas isso é evolução de UI sobre a mesma persistência — não muda o
modelo.

### 2.2 Vida — atualização

Cada novo Import bem-sucedido para o mesmo Dataset:

- Adiciona (ou atualiza, se o Content já existir — ex.: o mesmo vídeo
  reimportado com números mais recentes) Content/Metric daquele Dataset.
- Atualiza o "último atualizado em" do Dataset.
- Nunca apaga histórico anterior — Imports antigos e as Metrics que
  produziram continuam existindo, associadas ao seu `importId` original
  (isso é a base do versionamento, seção 3).

### 2.3 Estados visíveis

Um Dataset não tem uma máquina de estados complexa — só um indicador
derivado, calculado a partir de `lastImportAt`, para orientar o usuário:

| Estado | Condição | Onde aparece |
|---|---|---|
| **Ativo** | Recebeu Import nos últimos 30 dias | Badge verde |
| **Sem atualizações recentes** | Sem Import há mais de 30 dias | Badge âmbar |
| **Arquivado** | Marcado manualmente como arquivado | Badge cinza, fora da listagem padrão |

"Sem atualizações recentes" é só um alerta de UI — o Dataset continua
totalmente funcional, o Dashboard continua lendo dele normalmente. É um
lembrete para o time ("ninguém importa TikTok há 2 meses"), não um bloqueio.

### 2.4 Fim — arquivamento, não exclusão

Um Dataset **não é excluído** no fluxo normal de uso. Os dados que ele
guarda (Content/Metric históricos) têm valor de auditoria mesmo se a origem
parar de ser usada. A ação disponível é **arquivar**:

- Remove o Dataset da listagem padrão (ele some do "grid" ativo).
- Mantém todo o histórico intacto e consultável (via filtro "Ver
  arquivados").
- Pode ser revertida ("Reativar") a qualquer momento — inclusive
  automaticamente, se um novo Import chegar para aquele Dataset arquivado.
- Não afeta Insights já gerados a partir dele.

**Exclusão permanente** existe apenas como uma ação administrativa rara e
explícita (ex.: "importamos a plataforma errada por engano, isso nunca
deveria existir"), protegida por confirmação, e está fora do escopo desta
sprint de design — quando for necessária, deve seguir o mesmo padrão de
confirmação já usado em outras exclusões destrutivas do CMS.

---

## 3. Relacionamento com Platform, Import, Content e Metric

```
Platform (1) ──▶ (N) Dataset (1) ──▶ (N) Import
                      │
                      ├──▶ (N) Content
                      │        │
                      │        └──▶ (N) Metric
                      └──────────────────▶ (N) Metric   (métricas sem Content, ex.: agregados do Dataset)
```

Regras de relacionamento que valem a pena deixar explícitas:

- **Platform → Dataset**: uma Platform pode ter 0, 1 ou vários Datasets
  (hoje, no máximo 1 na prática, por causa do ponto 1). Um Dataset pertence
  a exatamente uma Platform — nunca é compartilhado entre plataformas.
- **Dataset → Import**: relação de log — todo Import aponta para o Dataset
  que ele alimentou. Um Import nunca migra de Dataset depois de criado.
- **Dataset → Content**: um Content pertence a exatamente um Dataset, para
  sempre. Se a Platform um dia se dividir em dois Datasets (ex.: "vídeos" e
  "audiência"), o Content antigo **não migra** — ele continua no Dataset em
  que nasceu. Um novo Dataset começa com histórico vazio, mesmo que a
  origem (Platform) seja a mesma.
- **Dataset → Metric**: a maioria das Metrics está associada a um Content
  (ex.: views de um vídeo específico). Métricas que descrevem o Dataset como
  um todo, sem um Content associado (ex.: "total de inscritos do canal
  naquele mês"), pertencem diretamente ao Dataset.
- **Import → Content/Metric**: todo Content/Metric criado ou atualizado
  carrega o `importId` de origem — é essa referência, não uma tabela de
  versões separada, que sustenta o versionamento (seção 4).

---

## 4. Versionamento (futuro)

"Versionar um Dataset" cobre dois problemas diferentes — vale a pena
resolvê-los separadamente em vez de criar uma entidade "Version" genérica:

### 4.1 Versão de schema (o formato dos dados muda)

Quando o YouTube Studio adicionar uma coluna nova (ex.: "duração média de
visualização"), o adapter passa a emitir uma `key` de Metric que não existia
antes. Isso é **aditivo por design**: Imports antigos simplesmente não têm
valor para essa `key` (ausente, não zero). Nenhuma migração de dados
antigos é necessária — o Dataset aceita registros com formatos que evoluem
ao longo do tempo, e a UI trata `key` ausente como "sem dado", não como
erro.

Não existe (nem deve existir) uma tabela `dataset_schema_versions`: a lista
de `keys` conhecidas de um Dataset é derivada consultando as Metrics
existentes, não declarada antecipadamente.

### 4.2 Versão como "estado no tempo" (snapshot)

"Como estava esse Dataset antes do último Import?" não precisa de uma
entidade de versão própria — já temos tudo isso pela cadeia
`Metric.importId → Import.startedAt`. "A versão do Dataset até o Import
#482" é uma **query** (`WHERE importId <= 482` ou `WHERE measuredAt <=
data_do_import_482`), não um registro armazenado.

Isso evita criar uma tabela de versões que precisaria ser mantida em
sincronia manualmente — outra aplicação do princípio "simplicidade sobre
abstração desnecessária".

O único campo de conveniência que vale a pena o Dataset guardar diretamente
é um ponteiro para leitura rápida:

- `lastImportId` / `lastImportAt`: evita ter que agregar todos os Imports
  toda vez que a listagem de Datasets precisa mostrar "atualizado há 3
  dias".

Esse ponteiro é só cache de leitura — a fonte de verdade continua sendo a
cadeia Import → Metric.

---

## 5. Telas

Estas quatro telas substituem, conceitualmente, a seção "Importações" atual
(`/admin/intelligence/importacoes`). A tela de Import Center da Sprint 4
não é descartada — ela passa a viver *dentro* do fluxo de Dataset, como o
mecanismo de alimentar um Dataset com um novo Import (ver seção 6).

### 5.1 Lista de Datasets

Tela inicial da seção — substitui o grid "Importadores disponíveis" +
"Histórico de importações" de hoje por uma visão centrada em dado, não em
plataforma.

```
┌─────────────────────────────────────────────────────────────────┐
│ Datasets                                    [+ Nova importação]  │
│ O que o Intelligence já sabe sobre cada origem de dados.         │
├─────────────────────────────────────────────────────────────────┤
│ Filtrar: [Todos ▾] [Ativos ▾]                     Buscar: [    ] │
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────┐  ┌───────────────────────┐            │
│ │ ▶ YouTube        Ativo│  │ 🎵 TikTok   Sem atual. │            │
│ │ Desempenho de vídeos  │  │ Creator Analytics      │            │
│ │                       │  │                        │            │
│ │ 12 vídeos             │  │ 8 vídeos               │            │
│ │ 37.520 visualizações  │  │ 4.102 visualizações     │            │
│ │ Atualizado há 2 dias  │  │ Atualizado há 41 dias  │            │
│ │              Ver →    │  │              Ver →     │            │
│ └───────────────────────┘  └───────────────────────┘            │
│                                                                   │
│ [Ver Datasets arquivados (2)]                                    │
└─────────────────────────────────────────────────────────────────┘
```

Cada card mostra: ícone + nome da Platform, nome do Dataset, badge de
estado (§2.3), 1-2 métricas de destaque (as mais relevantes daquele
`kind` — para vídeos, contagem + views; para ads, gasto + resultados),
"atualizado há X" e um link para o detalhe. Datasets arquivados ficam atrás
de um link secundário, não somem de vez.

O botão principal continua sendo **"Nova importação"**, não "Criar
Dataset" — reforça que Datasets nascem de importar, nunca são criados a
seco (§2.1).

### 5.2 Dataset Detail

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Datasets                                                       │
│ ▶ YouTube — Desempenho de vídeos                    [Ativo]      │
│ Criado em 12/06/2026 · Atualizado há 2 dias · 6 imports          │
│                                       [Nova importação] [⋯ Mais] │
├─────────────────────────────────────────────────────────────────┤
│ [ 12 vídeos ] [ 37.520 views ] [ 812h watch time ] [ 4,2% CTR ]  │
├─────────────────────────────────────────────────────────────────┤
│ Visão geral │ Conteúdos │ Importações │ Configurações            │
├─────────────────────────────────────────────────────────────────┤
│ (aba ativa: Importações)                                         │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Data       Arquivo                    Status   Aceitos     │   │
│ │ 30/07/26   youtube-julho.csv          ✓ ok     12          │   │
│ │ 02/07/26   youtube-junho.csv          ✓ ok     11           │   │
│ │ 05/06/26   youtube-maio.csv           ⚠ parcial 9 (1 falha) │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

- **Cabeçalho**: nome, Platform, badge de estado, metadados
  (criado/atualizado/nº de imports), ação "Nova importação" (pré-seleciona
  este Dataset como destino) e um menu "⋯ Mais" com "Arquivar" /
  "Renomear".
- **Cards de resumo**: as métricas agregadas mais recentes daquele Dataset
  (o que hoje o Dashboard mostraria por plataforma).
- **Abas**:
  - *Visão geral*: os mesmos cards de resumo, com um pouco mais de contexto
    (tendência vs. import anterior, quando existir mais de um Import).
  - *Conteúdos*: lista de Content daquele Dataset (vídeos, campanhas...)
    com suas métricas mais recentes — a granularidade "por vídeo" que hoje
    não existe em lugar nenhum da UI.
  - *Importações*: o histórico auditável de Imports — literalmente o
    "Histórico de importações" que já existe hoje na tela de Importações,
    só que escopado a este Dataset em vez de global. Clicar num Import abre
    o snapshot daquela Detection Preview (auditoria: "o que foi importado
    exatamente naquele dia").
  - *Configurações*: renomear o Dataset, arquivar/reativar.

### 5.3 Estado vazio

Aparece na Lista de Datasets quando nenhum Dataset existe ainda (instalação
nova, ou nenhum import bem-sucedido até agora):

```
┌─────────────────────────────────────────────────────────────────┐
│ Datasets                                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                    │
│                         (ícone de banco de dados)                 │
│                                                                    │
│                    Nenhum Dataset ainda                           │
│      Datasets nascem automaticamente na primeira importação       │
│         bem-sucedida de uma plataforma. Comece importando          │
│              um relatório do YouTube Studio.                       │
│                                                                    │
│                      [ Importar agora ]                           │
│                                                                    │
└─────────────────────────────────────────────────────────────────┘
```

Reforça o modelo mental correto desde o primeiro uso: você não "cria" um
Dataset, você importa e ele aparece. O CTA leva direto ao Import Center.

Um segundo caso de estado vazio, mais raro, é um Dataset que existe mas
ainda não tem nenhum Content associado — não deveria acontecer na prática
(um Dataset só nasce quando um Import é bem-sucedido, e um Import bem-
sucedido sempre produz ao menos um Content), mas se surgir (ex.: Import que
só trouxe métricas agregadas, sem itens individuais), a aba "Conteúdos"
mostra uma variação simples da mesma mensagem: "Este Dataset ainda não tem
conteúdos individuais — só métricas agregadas."

### 5.4 Comparação entre Datasets (conceitual)

Ponto de entrada: um botão "Comparar" na Lista de Datasets (seleciona 2+
cards) ou dentro do Dataset Detail ("Comparar com outro Dataset").

```
┌─────────────────────────────────────────────────────────────────┐
│ Comparar Datasets                                                 │
│ [ YouTube — Desempenho de vídeos ▾ ]  vs  [ TikTok — Creator ▾ ]  │
│ Período: [ Últimos 30 dias ▾ ]                                    │
├─────────────────────────────────────────────────────────────────┤
│                        YouTube          TikTok                    │
│ Visualizações          37.520           4.102                     │
│ Itens (vídeos)         12               8                         │
│ Atualizado             há 2 dias        há 41 dias                │
│ ─────────────────────────────────────────────────────            │
│ Watch time (h)         812              — não disponível —         │
│ Gasto (R$)             — não disponível —      —                   │
└─────────────────────────────────────────────────────────────────┘
```

Este é o caso onde a natureza "Intelligence não pertence a nenhuma
plataforma" (AGENTS.md/DATA_MODEL.md) mais aparece na UI: comparar dois
Datasets de plataformas diferentes é o objetivo, não um efeito colateral.
Duas decisões de design valem registro para quando isso for implementado:

- A comparação só alinha **métricas com a mesma `key`** entre os Datasets
  selecionados (ex.: "visualizações" existe nos dois). `keys` que só um dos
  dois produz aparecem marcadas como "não disponível" para o outro, em vez
  de forçar uma conversão artificial.
- Normalizar métricas de naturezas diferentes (ex.: "visualizações" do
  YouTube vs. "alcance" do Instagram são conceitos parecidos, mas não
  idênticos) é um problema de **Insight**, não de Dataset — a tela de
  comparação mostra os números brutos lado a lado; qualquer interpretação
  ("YouTube performou melhor") é gerada depois, como Insight, e fica fora
  do escopo desta tela.
- Comparar o **mesmo** Dataset em dois períodos (este mês vs. mês passado)
  é um caso diferente — não é "entre Datasets", é uma variação de filtro
  dentro do próprio Dataset Detail (§5.2, aba Visão geral), não desta tela.

---

## 6. De "Importações" para "Datasets" — o que muda na navegação

A seção do admin hoje chamada **Importações** (`IntelligenceNav.tsx`,
`/admin/intelligence/importacoes`) passa conceitualmente a se chamar
**Datasets**, com a Lista de Datasets (§5.1) como tela inicial. O Import
Center construído na Sprint 4 não desaparece — ele passa a ser acessado a
partir de "Nova importação" (na lista ou dentro de um Dataset), continuando
exatamente como está: seleção de arquivo → Detection Preview → Validação →
Pronto para importar. A única mudança de fluxo é o que acontece *depois* de
"Importar" ser clicado de verdade (Sprint de Persistência): em vez de só
simular, o resultado passa a aparecer dentro do Dataset correspondente.

**Essa renomeação de rota/menu é intencionalmente deixada para a sprint de
Persistência**, não para agora — mudar a navegação e criar uma tela "Lista
de Datasets" antes de existir persistência significaria ou (a) mostrar uma
lista sempre vazia, ou (b) mockar dados falsos, e nenhuma das duas entrega
valor real nem seria "uma funcionalidade utilizável" (filosofia do
AGENTS.md). Esta sprint entrega o design; a sprint seguinte entrega dado
real para preenchê-lo.

---

## 7. Como a futura Persistência deve usar este conceito

Guia para a próxima sprint, sem implementar nada ainda:

1. **Nomes de tabela**: usar prefixo `intelligence_` para evitar colisão
   com tabelas existentes do CMS — em especial `Content` do Intelligence
   não pode virar a tabela `contents`, que já existe para conteúdo
   editorial. Sugestão: `intelligence_datasets`, `intelligence_imports`,
   `intelligence_contents`, `intelligence_metrics`,
   `intelligence_insights`. `Platform` pode continuar como um enum/const
   (como já é em `ImportPlatform`) em vez de tabela própria, já que seus
   valores são fixos e conhecidos em código.
2. **Ordem de implementação** (menor risco primeiro, cada passo já
   utilizável):
   - `intelligence_datasets` + lógica de "encontrar ou criar" (Platform +
     kind) — usada pela Persistência do YouTube antes de gravar qualquer
     Content/Metric.
   - `intelligence_imports`, persistindo o que hoje só vive em memória como
     `ImportBatch`.
   - `intelligence_contents` / `intelligence_metrics`, recebendo o mapa de
     `NormalizedImportRecord[]` já produzido pelo pipeline do YouTube.
3. **Sem tabela de versão**: como descrito em §4, versionamento é derivado
   de `importId`/`measuredAt`, não uma entidade própria — economiza uma
   migration e uma fonte de inconsistência.
4. **Sem tabela de "estado" do Dataset**: `Ativo` / `Sem atualizações
   recentes` (§2.3) é calculado no momento da leitura a partir de
   `lastImportAt` — só `archived_at` (nullable) precisa ser uma coluna
   real, porque é a única transição que não é derivável de outra coisa.
5. **O clique em "Importar"** no Import Center (Sprint 4, hoje uma
   simulação) passa a chamar uma Server Action que: encontra ou cria o
   Dataset daquela Platform, cria o `Import`, e persiste
   `Content`/`Metric` a partir do `NormalizedImportRecord[]` já calculado
   pela Detection Preview — nenhuma lógica de parsing muda, só o destino
   final dos dados.
6. **Dashboard** nunca lê arquivo nem `NormalizedImportRecord` — ele
   consulta Datasets (e, através deles, Content/Metric agregados). Cada
   card do Dashboard corresponde a um Dataset; quando existir mais de um
   Dataset por Platform, o Dashboard agrupa por Platform e lista os
   Datasets dentro dela.

---

## 8. Fora de escopo desta sprint

Para deixar explícito o que **não** foi feito, por decisão do escopo:

- Nenhuma tabela, migration ou client Supabase.
- Nenhuma alteração em `imports/`, `session/` ou `model.ts`.
- Nenhuma alteração na navegação (`IntelligenceNav.tsx`) ou nas rotas
  atuais — `/admin/intelligence/importacoes` continua exatamente como
  ficou na Sprint 4.
- Nenhum componente novo em `src/components/admin/intelligence/`.

Este documento é a base para a próxima sprint (Persistência), que deve
implementar §7 em cima do modelo já consolidado em
[`DATA_MODEL.md`](DATA_MODEL.md) e `src/lib/intelligence/model.ts`.
