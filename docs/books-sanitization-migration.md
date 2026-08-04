# Pacote de saneamento de Books

Pacote preparado para execução posterior no Supabase. Nenhum SQL deste pacote
foi executado neste ambiente.

## Arquivos

- [`books-sanitization-audit.sql`](./books-sanitization-audit.sql): auditoria
  somente leitura.
- [`books-sanitization-repair.sql`](./books-sanitization-repair.sql): reparos
  determinísticos, com backup persistente e bloqueio para casos que exigem
  decisão manual.
- [`../supabase/migrations/20260803_books_sanitization.sql`](../supabase/migrations/20260803_books_sanitization.sql):
  migration final transacional.
- [`books-sanitization-rollback.sql`](./books-sanitization-rollback.sql):
  rollback transacional.

## Ordem de execução recomendada

1. Fazer backup lógico do projeto/banco e revisar os resultados da auditoria.
2. Executar a auditoria sem alterações.
3. Se necessário, revisar e executar o script de reparo como uma única
   transação.
4. Definir a estratégia de compatibilidade da aplicação descrita abaixo.
5. Executar a migration final.
6. Rodar novamente as seções aplicáveis da auditoria (campanhas e ISBN) e
   executar as validações pós-migration. A consulta de consistência de
   `monthly_recommendations` é pré-migration, pois referencia a coluna que foi
   removida.
7. Manter as tabelas `_books_sanitation_*_backup` durante a janela de rollback.
8. Removê-las somente após a aprovação operacional. Se houver necessidade de
   reversão, executar o rollback antes de removê-las.

O script de reparo não deve ser usado como substituto da auditoria. Ele não
escolhe automaticamente um Book canônico para ISBN duplicado nem inventa dados
editoriais ausentes.

## Critérios de liberação

A migration final deve ser bloqueada se qualquer um destes critérios falhar:

- existir `monthly_recommendations` cujo `book_reading_id` seja órfão;
- `monthly_recommendations.book_id` for diferente de
  `book_readings.book_id`;
- existir item de campanha com `book_id` e qualquer campo manual preenchido;
- existir item manual sem `title`, `image_url` ou `affiliate_url`;
- existir mais de um `books.isbn` após a normalização.

Os detalhes retornados pela auditoria devem ser revisados, não apenas a
contagem. A expectativa para as consultas de inconsistência é **0 linhas**.
ISBN `NULL`, vazio ou composto apenas por separadores é permitido pelo índice e
aparece em contagem separada. Valores com tamanho normalizado diferente de 10
ou 13 são apenas informativos neste pacote; a migration não valida o dígito
verificador.

## 1. monthly_recommendations

### Regra aplicada

`monthly_recommendations.book_id` permanece como identidade canônica do Book.
`book_reading_id` é uma referência histórica redundante e é removida apenas
depois da validação:

```text
monthly_recommendations.book_id = book_readings.book_id
```

### Reparo

O script de reparo:

- salva o vínculo original em
  `_books_sanitation_monthly_backup`;
- corrige somente divergências para as quais existe exatamente uma leitura
  candidata para o `book_id`;
- bloqueia divergências que sejam órfãs ou tenham múltiplas leituras
  candidatas;
- não altera `monthly_recommendations.book_id`.

Se não houver uma leitura única, a correção precisa ser decidida
manualmente. Não é seguro escolher uma leitura arbitrariamente.

Ter múltiplas leituras para um Book, por si só, não bloqueia a remoção: as
linhas históricas já têm o `book_reading_id` validado. Isso apenas limita a
reconstrução automática de linhas criadas depois da migration caso seja
necessário executar rollback.

### Migration e rollback

A migration repete o preflight, salva o vínculo caso o reparo não tenha sido
necessário e remove `book_reading_id`. O rollback recria a coluna, restaura os
valores salvos e tenta reconstruir apenas linhas novas que tenham exatamente
uma leitura candidata. Se alguma linha não puder ser reconstruída, o rollback
falha sem remover o backup.

### Compatibilidade obrigatória da aplicação

O runtime atual ainda envia `book_reading_id` em
`monthlyRecommendationService.ts` e o tipo CMS ainda o declara. Antes de
remover a coluna, a aplicação precisa ser coordenada com a migration:

- deixar de inserir `book_reading_id`;
- remover o campo do tipo de registro;
- deixar de depender desse campo em consultas, adapters ou páginas;
- manter `book_id` como identificador da recomendação.

Não se deve publicar apenas essa alteração de código antes da migration final:
enquanto a coluna atual for `NOT NULL`, o insert sem `book_reading_id` falhará.
Há duas opções seguras:

- janela coordenada: pausar gravações, aplicar a migration, publicar a
  aplicação sem o campo e reabrir as gravações;
- rollout sem downtime: primeiro fazer uma etapa de expansão que torne a coluna
  legada nullable, publicar código compatível com ambos os schemas, e só então
  aplicar esta migration final.

Essa alteração de aplicação e a etapa opcional de expansão não foram feitas
neste pacote para não deixar o código atual incompatível com o schema atual.

## 2. promotional_campaign_items

### Constraint final proposta

A regra formal preserva também a exigência existente para itens manuais:

```sql
check (
  (
    book_id is not null
    and title is null
    and image_url is null
    and description is null
    and affiliate_url is null
  )
  or (
    book_id is null
    and title is not null
    and image_url is not null
    and affiliate_url is not null
  )
)
```

Assim:

- Book vinculado é a única fonte de título, capa, descrição e URL de compra;
- item manual não pode coexistir com `book_id`;
- `description` continua opcional para item manual;
- `price`, `position`, `is_active` e `item_type` não são tratados como
  duplicação bibliográfica e permanecem fora da regra.

O reparo salva e limpa os campos manuais apenas dos itens que já possuem
`book_id`. Itens manuais incompletos ficam bloqueados para decisão editorial.
O rollback restaura os valores salvos e recria a constraint anterior.

## 3. books.isbn

### Estratégia recomendada

Usar um índice único parcial sobre expressão, sem reescrever os valores
originais:

```sql
regexp_replace(upper(btrim(isbn)), '[^0-9X]', '', 'g')
```

A expressão:

- remove espaços;
- remove hífens e outros separadores;
- converte `x` para `X`;
- permite que ISBN-10 com `X` seja comparado corretamente;
- preserva `NULL` e valores vazios fora do índice;
- não confunde ISBN-10 e ISBN-13 diferentes do mesmo livro, pois são chaves
  distintas.

O índice não valida o dígito verificador nem transforma ISBN-10 em ISBN-13.
Ele garante apenas unicidade da representação normalizada. A validação
semântica do ISBN pode ser tratada posteriormente, fora desta migration.

### Duplicidades

Duplicidades normalizadas bloqueiam a migration. O pacote não escolhe qual
Book excluir nem zera ISBN automaticamente, porque isso pode remover a
identidade bibliográfica correta. A decisão deve escolher o registro canônico,
preservar referências e depois atualizar ou limpar o duplicado com backup.

O reparo só converte `isbn` vazio ou composto apenas por espaços em `NULL`,
salvando o valor original. ISBNs preenchidos não são reformatados.

### Rollback

O rollback remove o índice único. Se o reparo tiver convertido vazios em
`NULL`, restaura os valores salvos antes de remover a tabela de backup.

## Validações pós-migration

Executar novamente as seções de campanhas e ISBN da auditoria e confirmar:

- nenhuma linha de campanha violando a origem exclusiva;
- nenhum grupo duplicado de ISBN normalizado;
- `pg_indexes` contendo
  `books_isbn_normalized_unique_idx`;
- `pg_constraint` contendo
  `promotional_campaign_items_book_source_check`;
- ausência da coluna `monthly_recommendations.book_reading_id`;
- consultas públicas e administrativas usando `book_id` continuam retornando
  os mesmos registros esperados.

Para `monthly_recommendations`, validar o estado pós-migration sem referenciar a
coluna removida:

```sql
select count(*) as total_monthly_recommendations
from public.monthly_recommendations;

select 1
from information_schema.columns
where table_schema = 'public'
  and table_name = 'monthly_recommendations'
  and column_name = 'book_reading_id';
-- Esperado: 0 linhas.
```

Também é necessário validar o deployment da aplicação com atenção ao cache
das páginas públicas, pois a mudança de fonte canônica não invalida
automaticamente páginas já geradas.

## Riscos remanescentes

- ISBNs logicamente duplicados exigem decisão editorial/manual.
- O rollback de recomendações criadas após a remoção depende de existir uma
  única leitura para cada Book; caso contrário ele bloqueia.
- Exclusões de linhas depois da migration impedem rollback automático dessas
  linhas.
- A remoção de `book_reading_id` não elimina os fallbacks estáticos já
  identificados no Clube e na Biblioteca.
- A migration não altera Intelligence, Dashboard, Questions, Decisions,
  Workspace, Instagram ou TikTok.

## Limpeza posterior dos backups

Somente depois de expirar a janela de rollback e validar o ambiente, remover
as tabelas auxiliares:

```sql
begin;

drop table if exists public._books_sanitation_monthly_backup;
drop table if exists public._books_sanitation_campaign_item_backup;
drop table if exists public._books_sanitation_isbn_backup;

commit;
```
