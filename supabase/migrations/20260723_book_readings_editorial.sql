-- 20260723_book_readings_editorial.sql
--
-- Camada editorial da Curadoria BookCringe (/recomendacoes, /livro/[slug]):
--   1. `recommendation_reason` — texto livre "por que recomendo este livro",
--      editado junto de favorite/would_recommend/review no card "Dados de
--      leitura" do admin. Exibido publicamente só quando o livro já é parte
--      da curadoria (favorite = true OU would_recommend = true) — isso é
--      responsabilidade da camada de apresentação, não do banco.
--   2. `is_recommendation_of_month` — no máximo 1 leitura pode estar
--      marcada por vez em todo o site. Garantido por um índice único
--      parcial (não por trigger): como a coluna só tem 2 valores possíveis
--      e o índice cobre apenas as linhas com `true`, só pode existir 1 linha
--      indexada por vez. A aplicação (`bookReadingService.
--      clearRecommendationOfMonthExcept`) desmarca a leitura anterior antes
--      de marcar a nova, para nunca colidir com esse índice.
--
-- Ambas em `book_readings` (não em `books`): assim como favorite/
-- would_recommend/review, são atributos da leitura/curadoria, não do
-- catálogo do livro em si.
--
-- Idempotente (add column if not exists / create index if not exists).

alter table public.book_readings
  add column if not exists recommendation_reason text,
  add column if not exists is_recommendation_of_month boolean not null default false;

comment on column public.book_readings.recommendation_reason is
  'Texto editorial "por que recomendo este livro" — exibido publicamente apenas quando favorite ou would_recommend também são true.';

comment on column public.book_readings.is_recommendation_of_month is
  'Destaque "Recomendação do mês" em /recomendacoes. No máximo 1 true por vez (ver índice book_readings_one_recommendation_of_month).';

create unique index if not exists book_readings_one_recommendation_of_month
  on public.book_readings ((is_recommendation_of_month))
  where is_recommendation_of_month = true;
