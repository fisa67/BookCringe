import type { DetailedBook } from "@/lib/types";
import { getFinishedReadingsWithBooks } from "@/lib/services/bookReadingService";
import { getSettings } from "@/lib/services/settingsService";
import { resolveAmazonPurchaseUrl } from "@/lib/services/affiliateService";
import { getPublicContentSummaryByBook } from "@/lib/adapters/contentPublicAdapter";

/**
 * Adapter público de `/recomendacoes` — vitrine curada, subconjunto de
 * `/biblioteca` (que lista as 52 leituras finalizadas sem filtro de
 * qualidade). Reaproveita `getFinishedReadingsWithBooks({})`, a mesma query
 * já usada por `libraryPublicAdapter.getPublicLibraryBooks` — nenhuma
 * chamada nova ao Supabase; o filtro de curadoria é feito em memória.
 *
 * Critério de inclusão: `favorite = true` OU `would_recommend = true` OU,
 * na ausência de curadoria manual suficiente, `rating >= 4.5` (fallback).
 * Sem tipo novo exportado — o retorno é `DetailedBook` (já usado por
 * `/biblioteca`) com uma interseção estrutural para os 2 campos extras
 * necessários aos badges da vitrine.
 */
const RATING_FALLBACK_THRESHOLD = 4.5;

function readingPriority(book: { favorite: boolean; wouldRecommend: boolean }): number {
  if (book.favorite) return 0;
  if (book.wouldRecommend) return 1;
  return 2;
}

export async function getPublicRecommendedBooks(): Promise<
  Array<DetailedBook & { favorite: boolean; wouldRecommend: boolean }>
> {
  const [readings, settings, contentSummaries] = await Promise.all([
    getFinishedReadingsWithBooks({}),
    getSettings(),
    getPublicContentSummaryByBook(),
  ]);

  if (!readings) return [];

  const associateId = settings?.amazon_associate_id;

  return readings
    .filter(
      (reading) =>
        reading.favorite === true ||
        reading.would_recommend === true ||
        (typeof reading.rating === "number" && reading.rating >= RATING_FALLBACK_THRESHOLD)
    )
    .map((reading) => ({
      id: reading.books.id,
      slug: reading.books.slug,
      title: reading.books.title,
      author: reading.books.author,
      rating: reading.rating,
      pages: reading.books.page_count,
      year: reading.books.publication_year,
      genre: reading.books.genres,
      country: reading.books.country,
      readAt: reading.finished_at,
      status: "finished" as const,
      cover: reading.books.cover_path ?? undefined,
      amazonUrl: resolveAmazonPurchaseUrl(reading.books.amazon_url, associateId),
      review: reading.review,
      favorite: reading.favorite,
      wouldRecommend: reading.would_recommend,
      contentCount: contentSummaries.get(reading.books.id)?.count,
      hasVideoContent: contentSummaries.get(reading.books.id)?.hasVideo,
    }))
    // Prioridade de curadoria: favoritos primeiro, depois recomendados,
    // depois os que só entraram pelo fallback de nota. Dentro de cada
    // grupo, nota mais alta primeiro.
    .sort((a, b) => {
      const priorityDiff = readingPriority(a) - readingPriority(b);
      if (priorityDiff !== 0) return priorityDiff;

      return (b.rating ?? 0) - (a.rating ?? 0);
    });
}
