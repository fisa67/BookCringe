import type { CmsFinishedReadingWithBook } from "@/lib/types/cms";
import type { DetailedBook } from "@/lib/types";
import { resolveAmazonPurchaseUrl } from "@/lib/services/affiliateService";
import type { ContentSummary } from "@/lib/adapters/contentPublicAdapter";

/**
 * Funções puras de agregação sobre leituras finalizadas (com o livro
 * relacionado embutido). Nenhuma função aqui chama o Supabase — recebem
 * sempre o array já carregado por `bookReadingService.getFinishedReadingsWithBooks`,
 * o que as mantém testáveis isoladamente e reutilizáveis por qualquer adapter.
 */

type Reading = CmsFinishedReadingWithBook;

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

export interface GenreBreakdownItem {
  genre: string;
  count: number;
}

export interface CountryBreakdownItem {
  country: string;
  count: number;
}

export interface MonthlyBreakdownItem {
  month: string;
  books: number;
}

/**
 * `reading_time_seconds` é bigint no Postgres — o Supabase-JS serializa
 * bigint como string para não perder precisão acima de
 * `Number.MAX_SAFE_INTEGER`. Nenhuma leitura real chega perto desse limite
 * em segundos, então converter para `number` aqui é seguro.
 */
function toSeconds(value?: string | null): number {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Nota média das leituras com `rating` preenchido. `undefined` se nenhuma tiver. */
export function computeAverageRating(readings: readonly Reading[]): number | undefined {
  const rated = readings.filter(
    (r): r is Reading & { rating: number } => typeof r.rating === "number"
  );
  if (rated.length === 0) return undefined;

  const sum = rated.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / rated.length) * 10) / 10;
}

/** Quantidade de autores distintos entre as leituras. */
export function computeDistinctAuthorsCount(readings: readonly Reading[]): number {
  return new Set(readings.map((r) => r.books.author)).size;
}

/** Quantidade de gêneros distintos entre as leituras (achatando books.genres). */
export function computeDistinctGenresCount(readings: readonly Reading[]): number {
  return new Set(readings.flatMap((r) => r.books.genres ?? [])).size;
}

/** Quantidade de países distintos entre as leituras (ignorando nulos). */
export function computeDistinctCountriesCount(readings: readonly Reading[]): number {
  return new Set(
    readings.map((r) => r.books.country).filter((country): country is string => Boolean(country))
  ).size;
}

/**
 * Soma de `reading_time_seconds` convertida para horas. Leituras sem o
 * campo preenchido contam como 0 — não distorcem a soma nem geram valor
 * fabricado. Retorna 0 (não um fallback fake) quando nenhuma leitura tem
 * tempo informado, mesmo que existam leituras finalizadas.
 */
export function computeTotalReadingHours(readings: readonly Reading[], precision = 1): number {
  const totalSeconds = readings.reduce((acc, r) => acc + toSeconds(r.reading_time_seconds), 0);
  const factor = 10 ** precision;
  return Math.round((totalSeconds / 3600) * factor) / factor;
}

/** Soma de `books.page_count` das leituras (para cross-check com statistics.pages_read). */
export function computeTotalPagesRead(readings: readonly Reading[]): number {
  return readings.reduce((acc, r) => acc + (r.books.page_count ?? 0), 0);
}

/**
 * Contagem de leituras por gênero, achatando `books.genres` (um livro com
 * múltiplos gêneros contribui para cada um). Ordenado do maior para o
 * menor e limitado a `topN` — sem bucket "Outros", no mesmo formato de
 * `genreData` em `src/app/estatisticas/page.tsx`. Devolve array vazio
 * quando não há leituras ou nenhuma tem gênero cadastrado.
 */
export function computeGenreBreakdown(
  readings: readonly Reading[],
  topN = 6
): GenreBreakdownItem[] {
  const counts = new Map<string, number>();

  for (const reading of readings) {
    for (const genre of reading.books.genres ?? []) {
      counts.set(genre, (counts.get(genre) ?? 0) + 1);
    }
  }

  return Array.from(counts, ([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

/**
 * Contagem de leituras por país de origem do livro (`books.country`),
 * ordenada do maior para o menor. Mantém os `topN` países individualmente
 * e agrupa o restante em um item `{ country: "Outros" }` — mesmo formato
 * de `countryData` em `src/app/estatisticas/page.tsx`. Livros sem país
 * cadastrado são ignorados (não contam nem para um país nem para
 * "Outros"). Se houver `topN` ou menos países distintos, nenhum bucket
 * "Outros" é adicionado.
 */
export function computeCountryBreakdown(
  readings: readonly Reading[],
  topN = 5
): CountryBreakdownItem[] {
  const counts = new Map<string, number>();

  for (const reading of readings) {
    const country = reading.books.country;
    if (!country) continue;
    counts.set(country, (counts.get(country) ?? 0) + 1);
  }

  const sorted = Array.from(counts, ([country, count]) => ({ country, count })).sort(
    (a, b) => b.count - a.count
  );

  if (sorted.length <= topN) return sorted;

  const top = sorted.slice(0, topN);
  const othersCount = sorted.slice(topN).reduce((acc, item) => acc + item.count, 0);

  return othersCount > 0 ? [...top, { country: "Outros", count: othersCount }] : top;
}

/**
 * Contagem de leituras finalizadas por mês do `year` informado (default:
 * ano atual). Sempre devolve os 12 meses, na ordem Jan→Dez, com
 * `books: 0` para meses sem nenhuma leitura — mesmo formato de
 * `monthlyData` em `src/app/estatisticas/page.tsx`. Leituras fora do ano
 * pedido ou sem `finished_at` são ignoradas (filtragem defensiva: mesmo
 * que o caller já tenha filtrado por ano na query, esta função não
 * assume isso).
 */
export function computeMonthlyBreakdown(
  readings: readonly Reading[],
  year: number = new Date().getFullYear()
): MonthlyBreakdownItem[] {
  const counts = new Array<number>(12).fill(0);

  for (const reading of readings) {
    if (!reading.finished_at) continue;

    const finishedDate = new Date(reading.finished_at);
    if (Number.isNaN(finishedDate.getTime()) || finishedDate.getUTCFullYear() !== year) continue;

    counts[finishedDate.getUTCMonth()] += 1;
  }

  return MONTH_LABELS.map((month, index) => ({ month, books: counts[index] }));
}

/**
 * Mapeia leituras finalizadas para o formato público `DetailedBook[]`,
 * já ordenadas por `finished_at` desc (garantido pela query do service).
 *
 * `associateId` (settings.amazon_associate_id) é opcional e, quando
 * ausente, preserva o comportamento anterior (URL crua de `amazon_url`) —
 * `resolveAmazonPurchaseUrl` já cai para a URL crua nesse caso. Passe o
 * Associate ID sempre que a chamada tiver acesso a `settings` para os
 * links já saírem com a tag de afiliado.
 *
 * `contentSummaries` (opcional) é o mapa `bookId -> { count, hasVideo }` de
 * `contentPublicAdapter.getPublicContentSummaryByBook` — quando ausente,
 * `contentCount`/`hasVideoContent` ficam `undefined` e os badges de
 * conteúdo (`BookCard`) simplesmente não aparecem, sem quebrar nada.
 */
export function mapToDetailedBooks(
  readings: readonly Reading[],
  limit?: number,
  associateId?: string | null,
  contentSummaries?: Map<string, ContentSummary>
): DetailedBook[] {
  const sliced = typeof limit === "number" ? readings.slice(0, limit) : readings;

  return sliced.map((r) => {
    const summary = contentSummaries?.get(r.books.id);
    return {
      id: r.books.id,
      slug: r.books.slug,
      title: r.books.title,
      author: r.books.author,
      rating: r.rating,
      pages: r.books.page_count,
      year: r.books.publication_year,
      genre: r.books.genres,
      country: r.books.country,
      readAt: r.finished_at,
      status: "finished",
      cover: r.books.cover_path ?? undefined,
      amazonUrl: resolveAmazonPurchaseUrl(r.books.amazon_url, associateId),
      contentCount: summary?.count,
      hasVideoContent: summary?.hasVideo,
    };
  });
}
