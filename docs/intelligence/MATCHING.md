# Matching: Content (Intelligence) ↔ Livro (CMS)

Sprint 7. Conecta o Intelligence ao CMS existente: cada `Content` importado
(hoje, um vídeo do YouTube) pode ser associado a um `Livro` já cadastrado em
`/admin/books`. Ver [`DATA_MODEL.md`](DATA_MODEL.md#content) para onde
isso se encaixa no modelo canônico.

---

## 1. O que é o Matching

É o processo de dizer "este vídeo é sobre este Livro". Sem isso, o
Intelligence sabe que um vídeo teve 15.420 views, mas não sabe que livro
esse vídeo resenhou — e portanto não consegue responder nada na forma "que
autores/gêneros performam melhor".

**Assistido, nunca automático.** O sistema nunca associa um Content a um
Livro sozinho. Ele só **sugere** — comparando o título do Content com o
título de cada Livro — e cabe sempre a uma pessoa confirmar, escolher outro
Livro, ou não vincular nada. Isso é intencional, não uma limitação
temporária:

- Títulos de vídeo raramente são idênticos ao título do Livro ("Como ler
  mais em 2026 | RESENHA SEM SPOILER" vs. "Como Ler Mais em 2026"). Qualquer
  heurística de texto vai errar às vezes — falso positivo aqui polui
  permanentemente uma análise futura de "desempenho por autor".
- Um Content pode não ser sobre nenhum Livro específico (ex.: uma campanha
  de Meta Ads, um vlog). Forçar uma associação automática obrigaria a
  inventar um "Livro mais parecido" mesmo quando a resposta certa é nenhum.
- O custo de uma pessoa confirmar é baixo (um clique) porque a sugestão já
  faz o trabalho pesado de achar o candidato certo na maioria dos casos.

## 2. Como funciona a sugestão (sem IA, sem busca semântica)

`src/lib/intelligence/matching/`:

- `similarity.ts` — `titleSimilarity(a, b)`: normaliza os dois títulos
  (minúsculas, sem acento/pontuação, espaços colapsados) e calcula o
  **coeficiente de Dice sobre bigramas de caracteres** — a fração de pares
  de letras consecutivas que os dois títulos têm em comum. É um algoritmo de
  texto puro e determinístico (mesma família usada por bibliotecas como
  `string-similarity`), sem chamada a nenhum modelo de linguagem, embedding
  ou serviço externo. Tolera diferenças de capitalização, acentuação,
  pontuação e pequenos sufixos/prefixos extras — exatamente o tipo de
  variação entre um título de vídeo e o título do Livro que ele resenha.
- `suggest.ts` — `findBookMatchCandidates`/`suggestBookMatch`: aplica
  `titleSimilarity` contra a lista de Livros do CMS e filtra pelo
  `MATCH_SUGGESTION_THRESHOLD` (`0.6`, uma constante — ajustável conforme o
  uso real mostrar falsos positivos/negativos).

Isso responde às restrições da sprint: **matching só por título**, sem IA e
sem busca semântica.

## 3. O fluxo assistido, na prática

Tela `/admin/intelligence/conteudos` (`src/app/admin/intelligence/conteudos/`):

1. Lista todos os `Content` importados, agrupados por Dataset.
2. Para cada Content **sem** Livro vinculado, calcula `suggestBookMatch`
   contra todos os Livros do CMS (`getBooks()`, service já existente,
   reaproveitado sem alteração).
3. Se houver sugestão (score ≥ 0.6): mostra o badge **"Livro sugerido"**,
   o título do Livro candidato e o score (ex.: "82% parecido"), com um botão
   **Confirmar**.
4. Sempre existe também uma escolha manual (um `<select>` com todos os
   Livros) — para quando não há sugestão, ou quando a sugestão está errada e
   o Livro certo é outro.
5. Confirmar (sugestão ou escolha manual) chama a Server Action
   `linkContentToBookAction` (`src/app/admin/intelligence/conteudos/actions.ts`),
   que grava **só o `book_id`** no Content (`linkContentToBook`,
   `src/lib/services/intelligenceDatasetService.ts`).
6. Um Content já vinculado mostra "Vinculado a: `<título do Livro>`" e um
   botão **Desvincular** (`unlinkContentFromBookAction`) — a decisão nunca é
   definitiva.

## 4. Salvar só a referência — nunca copiar

`intelligence_contents.book_id` é uma **foreign key** para `public.books.id`
(migration `20260801_intelligence_content_book_match.sql`), com
`on delete set null`: se o Livro for removido do CMS, o Content e todo o
histórico de `Metric` continuam existindo — só perdem o vínculo.

Nenhum outro campo do Livro (`author`, `publisher`, `genres`, `country`,
`publication_year`...) é copiado para `intelligence_contents`. Isso é
proposital, não uma economia de espaço: significa que

- se um editor corrigir o autor ou o gênero de um Livro no CMS amanhã, toda
  análise do Intelligence que já usa esse Livro reflete a correção
  **imediatamente**, sem reprocessar nenhum Import antigo;
- não existem duas fontes de verdade para o mesmo dado (o Livro só existe em
  `public.books`) — o Intelligence sempre lê ao vivo, via `join` por
  `book_id`, nunca duplica.

## 5. Que análises isso desbloqueia

Com `intelligence_contents.book_id` preenchido, qualquer métrica em
`intelligence_metrics` (views, watch time, impressions...) pode ser cruzada
com qualquer campo de `public.books` — sempre via `join`, nunca por dado
duplicado:

| Análise futura | Campo do Livro usado |
|---|---|
| Desempenho por autor | `books.author` |
| Desempenho por editora | `books.publisher` |
| Desempenho por gênero | `books.genres` |
| Desempenho por país | `books.country` |
| Livros nacionais vs. estrangeiros | `books.country` (comparado ao país do BookCringe) |
| Livros clássicos vs. lançamentos | `books.publication_year` (e, se necessário, uma tag futura em `books.metadata`) |

As quatro primeiras linhas já são possíveis hoje, assim que Contents forem
vinculados — `author`, `publisher`, `genres` e `country` já são colunas de
`CmsBookRecord`. A distinção "clássico" não é um campo formal ainda; a
sugestão nesta tabela é o caminho mais simples (ano de publicação, ou uma
tag em `metadata`, que já é um campo flexível existente), não uma proposta
de schema nova — decisão para quando a análise for de fato implementada.

Nenhuma dessas análises é implementada nesta sprint: o objetivo aqui é só a
associação (a "ponte"). O Dashboard que vai fazer essas perguntas continua
como próximo passo (`IMPORTS.md#próxima-sprint`), e vai lendo
exclusivamente dados persistidos + este `join`, nunca arquivo nenhum.

## 6. O que NÃO foi feito nesta sprint (de propósito)

- **Sem IA, sem busca semântica** — por restrição explícita da sprint,
  mesmo sabendo que um embedding pegaria casos que o Dice coefficient não
  pega (ex.: título completamente reescrito). Fica como evolução futura, se
  necessário.
- **Sem re-matching em lote** — se um Livro novo for cadastrado depois, os
  Contents antigos não são automaticamente re-sugeridos; é preciso abrir
  `/admin/intelligence/conteudos` de novo (a sugestão é calculada a cada
  carregamento da página, então já aparece — só não há notificação
  proativa).
- **Um Content = no máximo um Livro** — não há suporte a "este vídeo fala de
  3 livros". Suficiente para o caso de uso atual (YouTube Studio, 1 vídeo =
  1 resenha), reavaliar se um adapter futuro trouxer conteúdo genuinamente
  multi-livro.
- **Sem tela de "revisão em massa"** — cada Content é confirmado
  individualmente. Se o volume crescer a ponto de isso incomodar, é uma
  evolução de UI sobre a mesma base (`book_id` continua sendo só uma coluna).
