# Arquitetura alvo do BookCringe CMS

> Documento de referência (bússola). Não é um plano de sprint — descreve a
> visão de longo prazo do domínio para orientar toda decisão de modelagem
> futura, tanto para quem desenvolve quanto para o Cursor.
>
> ⚠️ Não confundir com [`docs/intelligence/`](./intelligence/README.md): aquele
> módulo é o centro de métricas de plataformas externas (YouTube, Instagram,
> TikTok, Meta Ads, Google Analytics — ver `AGENTS.md`). Este documento trata
> do **domínio editorial** do CMS (Biblioteca, Conteúdos, Campanhas, Clube,
> Recomendações, Avaliações, Newsletter, Estatísticas).

## Objetivo

Transformar o BookCringe em um CMS editorial onde **cada informação existe
apenas uma vez**. Cada módulo consome entidades já existentes — nunca
duplica dados. A **Biblioteca** é a principal fonte de verdade do sistema.

---

## Princípios

### 1. Single Source of Truth

Cada informação deve existir em apenas um lugar.

| Informação | Fonte de verdade |
|---|---|
| Livro | Biblioteca (`books`) |
| Autor *(futuro)* | Cadastro de autores |
| Editora *(futuro)* | Cadastro de editoras |
| Campanha | Campanhas (`promotional_campaigns`) |
| Conteúdo | Conteúdos (`contents`) |
| Avaliação | Avaliações (`book_ratings`) |
| Newsletter | Newsletter (`newsletter_subscribers`, `newsletter_campaigns`) |

Nunca copiar: capa, autor, título, link afiliado, slug. **Sempre
referenciar** — via chave estrangeira nullable apontando para a entidade
dona do dado (ver `contents.book_id`, `promotional_campaign_items.book_id`,
`bookclub_month_books.book_id`).

### 2. Tudo deve ser vinculável

Sempre que fizer sentido, um módulo aponta para outro:

```
Conteúdo → Livro → Autor → Campanha → Newsletter → Recomendação
```

Hoje o "hub" de todas essas setas é o livro (`books.id`). Cada módulo tem
sua própria tabela de junção pura (sem duplicar dados do livro):

- `contents.book_id` (nullable — permite "conteúdo geral", sem livro)
- `promotional_campaign_items.book_id` (nullable — permite item manual)
- `bookclub_month_books.book_id`
- `book_readings.book_id`
- `book_ratings.book_id`
- `monthly_recommendations.book_id`

### 3. Filosofia de decisão

Antes de criar qualquer campo ou tabela nova, responder em ordem:

1. **Essa informação já existe em algum módulo?**
   Se sim → referenciar (FK nullable). Nunca copiar.
2. **Essa informação poderá ser usada em mais de um lugar?**
   Se sim → vale criar uma entidade própria (tabela + service + adapter).
3. **É apenas um detalhe visual de um módulo específico?**
   Se sim → guardar só ali, sem promover a entidade.

---

## Entidades

### Biblioteca (`books`) — o coração do sistema

Contém tudo que é intrínseco ao livro: título, autor, capa (`cover_path`),
slug, link Amazon, ISBN, páginas, ano, país, gêneros. Dados de leitura
pessoal (status, nota, review, recomendação, motivo) vivem em
`book_readings`, ligada 1:1 via `book_id` — separados do catálogo em si
porque nem todo livro da Biblioteca foi necessariamente lido/avaliado.

Tudo o resto do sistema **apenas referencia** um livro.

### Conteúdos (`contents`)

Pode ser:

- **Vinculado a um livro** (`book_id` presente, `content_category = "book"`)
  — título, capa e slug usados automaticamente da Biblioteca; o formulário
  não permite mais digitar esses campos manualmente.
- **Conteúdo geral** (`book_id` nulo) — sem livro associado (ex.: "Como
  criar o hábito da leitura"), com título e categoria próprios.

### Campanhas (`promotional_campaigns` / `promotional_campaign_items`)

Um item pode ser:

- **Vinculado a um livro** (`book_id` presente) — capa, título, autor, link
  afiliado e página pública resolvidos via `resolveCampaignItem`
  (`src/lib/campaigns.ts`), nunca duplicados na tabela do item.
- **Produto manual** (`book_id` nulo) — para o que não pertence à
  Biblioteca: Kindle, Kobo, luminária, marcador, caneca, souvenir, mochila,
  bolsa, acessório. Mantém `title`/`image_url`/`description`/`affiliate_url`
  próprios.

Extensível: vincular uma futura entidade (Autor, Coleção, Editora) repete a
mesma receita — uma nova coluna nullable com FK própria — em vez de um
`entity_type`/`entity_id` genérico.

### Recomendações (`monthly_recommendations`)

Nunca guarda informação do livro — apenas `book_id` (+ histórico de quando
foi/deixou de ser a recomendação do mês). Título, capa etc. são sempre lidos
via join com `books`.

### Clube de Leitura (`bookclub_years` / `bookclub_months` / `bookclub_month_books`)

Cada mês do clube aponta para um ou mais livros via `book_id` em
`bookclub_month_books` — mesmo padrão de junção pura.

### Avaliações (`book_ratings`)

Avaliações da comunidade, sempre por `book_id`. Nota/quantidade agregadas
sob demanda (`bookRatingService.getPublicBookRatingSummary`), nunca
persistidas de volta no livro.

### Estatísticas (`estatisticas`, `statsService`)

Sempre agregadas a partir da Biblioteca e dos módulos acima
(`book_readings`, `book_ratings`, `contents`) no momento da leitura. Nenhuma
tabela própria de números "prontos" — evita números divergindo da origem.

### Newsletter (`newsletter_subscribers` / `newsletter_campaigns`)

Módulo independente (inscritos, campanhas de e-mail, Crew Literário). Pode
referenciar um livro (ex.: campanha sobre uma recomendação), mas hoje ainda
não tem esse vínculo modelado — candidato natural a ganhar `book_id`
nullable se/quando a necessidade aparecer (não implementar preventivamente).

---

## Futuras entidades (visão — não implementar sem sprint dedicado)

| Entidade | Campos previstos | Desbloqueia |
|---|---|---|
| **Autor** | nome, foto, biografia, instagram, site, país | Página do autor, livros do autor, conteúdos do autor, campanhas do autor |
| **Editora** | nome, logo, site | Todos os livros da editora, parcerias, campanhas |
| **Coleção** | nome, livros, ordem de leitura | Página da coleção (ex.: Harry Potter, Mistborn, Duna, Percy Jackson) |
| **Parceiro** | logo, cupom, site, tipo de parceria | Amazon, Companhia das Letras, Suma, DarkSide, Intrínseca, Arqueiro |
| **Pessoa** *(guarda-chuva)* | — | Autores, influenciadores, convidados, entrevistados, parceiros |

Cada uma dessas, quando implementada, segue a mesma receita: tabela própria
+ FK nullable nos módulos que precisarem referenciá-la (nunca um
`entity_type`/`entity_id` genérico — ver Princípio 2 em `AGENTS.md`).

---

## Fluxo ideal

```
                         Biblioteca
                             │
              ┌──────────────┼──────────────┐
          Conteúdos     Recomendações      Clube
              └──────────────┼──────────────┘
                       Página do Livro
              ┌──────────────┼──────────────┐
          Campanhas      Avaliações     Newsletter
                             │
                       Estatísticas
```

O livro é o hub central que conecta todos os módulos editoriais. Cada seta é
uma FK nullable — nunca uma cópia de dado.

---

## Objetivo de longo prazo

O BookCringe não será apenas um site de recomendações. Será um **CMS
editorial completo**, onde cada livro funciona como um "hub" central que
conecta conteúdos, campanhas, avaliações, estatísticas, newsletters,
recomendações e futuras entidades como autores, editoras e coleções. Essa
arquitetura reduz duplicação de dados, facilita manutenção e permite
adicionar novas funcionalidades com muito menos esforço, mantendo
consistência em todo o ecossistema.
