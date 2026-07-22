import {
  mockStats,
  mockRecentBooks,
  mockGenreBreakdown,
  mockCountryBreakdown,
  mockMonthlyBreakdown,
} from "@/data/mock/stats";
import type { ReadingStats, DetailedBook } from "@/lib/types";
import type { CmsFinishedReadingWithBook, CmsStatisticsRecord } from "@/lib/types/cms";
import { getFinishedReadingsWithBooks } from "@/lib/services/bookReadingService";
import { getStatisticsByYear } from "@/lib/services/statsService";
import { getSettings } from "@/lib/services/settingsService";
import {
  computeAverageRating,
  computeDistinctAuthorsCount,
  computeDistinctCountriesCount,
  computeDistinctGenresCount,
  computeGenreBreakdown,
  computeCountryBreakdown,
  computeMonthlyBreakdown,
  computeTotalPagesRead,
  computeTotalReadingHours,
  mapToDetailedBooks,
  type GenreBreakdownItem,
  type CountryBreakdownItem,
  type MonthlyBreakdownItem,
} from "@/lib/adapters/readingStatsAggregators";
import { getPublicContentSummaryByBook } from "@/lib/adapters/contentPublicAdapter";

/**
 * Fase 1 da migração pública de Estatísticas (somente leitura).
 *
 * Este adapter lê do Supabase reutilizando `bookReadingService` e
 * `statsService`, agrega em memória via `readingStatsAggregators` e devolve
 * os dados exatamente nos tipos já consumidos hoje pela página pública
 * (`ReadingStats`, `DetailedBook[]` — os mesmos tipos de `mockStats`/
 * `mockRecentBooks` em `src/data/mock/stats.ts`). Isso permite que, quando
 * as páginas trocarem o import estático por `getPublicReadingStats`/
 * `getPublicRecentBooks`, nenhum componente visual precise mudar — este
 * módulo ainda NÃO é importado por nenhuma página.
 *
 * Fallback: se a busca ao Supabase falhar, ou não houver nenhuma leitura
 * finalizada, as funções devolvem `mockStats`/`mockRecentBooks` inteiros.
 * Campos individuais (como `avgRating`) também caem para o valor do mock
 * quando existem leituras, mas nenhuma tem aquele dado específico — exceto
 * `hoursRead`, que reflete 0 de verdade nesse caso (ver `readingStatsAggregators`).
 */

/**
 * Monta o `ReadingStats` público a partir dos dados já buscados
 * (`statistics` da tabela + leituras finalizadas com livro embutido).
 * Função pura — não busca dados, apenas combina o que já foi carregado.
 * Extraída para ser reaproveitada por `getPublicReadingStats` e
 * `getPublicReadingStatsDetailed` sem duplicar a lógica nem exigir uma
 * segunda consulta ao Supabase.
 */
function buildReadingStats(
  statistics: CmsStatisticsRecord | null,
  readings: readonly CmsFinishedReadingWithBook[]
): ReadingStats {
  return {
    booksRead: statistics?.books_read ?? readings.length,
    pagesRead: statistics?.pages_read ?? computeTotalPagesRead(readings),
    hoursRead: computeTotalReadingHours(readings),
    avgRating: computeAverageRating(readings) ?? mockStats.avgRating,
    authorsRead: computeDistinctAuthorsCount(readings),
    genresRead: computeDistinctGenresCount(readings),
    countriesRead: computeDistinctCountriesCount(readings),
    annualGoal: statistics?.annual_goal ?? mockStats.annualGoal,
    annualProgress: statistics?.books_read ?? readings.length,
  };
}

/**
 * Retorna as estatísticas de leitura públicas (`ReadingStats`) para o ano
 * informado, combinando os contadores persistidos em `statistics` com
 * métricas agregadas ao vivo a partir de `books`/`book_readings`. Cai para
 * `mockStats` em caso de erro ou ausência de leituras finalizadas.
 */
export async function getPublicReadingStats(
  year: number = new Date().getFullYear()
): Promise<ReadingStats> {
  try {
    const [statistics, readings] = await Promise.all([
      getStatisticsByYear(year),
      getFinishedReadingsWithBooks({ year }),
    ]);

    if (!readings || readings.length === 0) {
      return mockStats;
    }

    return buildReadingStats(statistics, readings);
  } catch (error) {
    console.error(
      "[readingStatsPublicAdapter] Falha ao buscar estatísticas do Supabase, usando fallback estático.",
      error
    );
    return mockStats;
  }
}

/**
 * Retorna os livros lidos recentemente (`DetailedBook[]`), das leituras
 * finalizadas mais recentes por `finished_at`. Cai para `mockRecentBooks`
 * em caso de erro ou ausência de leituras finalizadas.
 */
export async function getPublicRecentBooks(limit = 4): Promise<DetailedBook[]> {
  try {
    const [readings, settings, contentSummaries] = await Promise.all([
      getFinishedReadingsWithBooks({ limit }),
      getSettings(),
      getPublicContentSummaryByBook(),
    ]);

    if (!readings || readings.length === 0) {
      return mockRecentBooks;
    }

    return mapToDetailedBooks(readings, limit, settings?.amazon_associate_id, contentSummaries);
  } catch (error) {
    console.error(
      "[readingStatsPublicAdapter] Falha ao buscar livros recentes do Supabase, usando fallback estático.",
      error
    );
    return mockRecentBooks;
  }
}

/**
 * Estatísticas detalhadas de leitura para a página pública de Estatísticas
 * (`/estatisticas`): os mesmos contadores de `ReadingStats` (em `stats`)
 * mais os três recortes usados pelos gráficos hoje hardcoded — por
 * gênero, por país e por mês. `stats` fica aninhado (em vez de espalhado
 * no nível raiz) para não colidir com os nomes dos arrays de breakdown.
 */
export interface PublicReadingStatsDetailed {
  stats: ReadingStats;
  genreBreakdown: GenreBreakdownItem[];
  countryBreakdown: CountryBreakdownItem[];
  monthlyBreakdown: MonthlyBreakdownItem[];
}

/**
 * Retorna `ReadingStats` + os três breakdowns (gênero, país, mês) para o
 * ano informado, em uma única busca ao Supabase (estatísticas + leituras
 * finalizadas com livro embutido), reaproveitando os agregadores da Fase 3
 * e o `buildReadingStats` também usado por `getPublicReadingStats`. Cai
 * para os quatro mocks estáticos (`mockStats`, `mockGenreBreakdown`,
 * `mockCountryBreakdown`, `mockMonthlyBreakdown`) em bloco — nunca mistura
 * dados reais parciais com mock parcial — em caso de erro ou ausência de
 * leituras finalizadas.
 */
export async function getPublicReadingStatsDetailed(
  year: number = new Date().getFullYear()
): Promise<PublicReadingStatsDetailed> {
  const fallback: PublicReadingStatsDetailed = {
    stats: mockStats,
    genreBreakdown: mockGenreBreakdown,
    countryBreakdown: mockCountryBreakdown,
    monthlyBreakdown: mockMonthlyBreakdown,
  };

  try {
    const [statistics, readings] = await Promise.all([
      getStatisticsByYear(year),
      getFinishedReadingsWithBooks({ year }),
    ]);

    if (!readings || readings.length === 0) {
      return fallback;
    }

    return {
      stats: buildReadingStats(statistics, readings),
      genreBreakdown: computeGenreBreakdown(readings),
      countryBreakdown: computeCountryBreakdown(readings),
      monthlyBreakdown: computeMonthlyBreakdown(readings, year),
    };
  } catch (error) {
    console.error(
      "[readingStatsPublicAdapter] Falha ao buscar estatísticas detalhadas do Supabase, usando fallback estático.",
      error
    );
    return fallback;
  }
}
