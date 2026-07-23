import type { DetailedBook } from "@/lib/types";
import {
  getFinishedReadingsWithBooks,
  getRecommendationOfMonth,
} from "@/lib/services/bookReadingService";
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
 * Critério de inclusão: `favorite = true` OU `would_recommend = true` —
 * curadoria manual, sempre marcada explicitamente em
 * `/admin/books/[id]/edit`. Sem fallback por nota: uma nota alta, por si só,
 * não coloca um livro aqui (essa página representa curadoria, não um
 * ranking automático — ver `/biblioteca` e `/estatisticas` para os dados
 * de leitura sem esse filtro). Sem tipo novo exportado — o retorno é
 * `DetailedBook` (já usado por `/biblioteca`) com uma interseção
 * estrutural para os 2 campos extras necessários aos badges da vitrine.
 */
function readingPriority(book: { favorite: boolean; wouldRecommend: boolean }): number {
  return book.favorite ? 0 : 1;
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
    .filter((reading) => reading.favorite === true || reading.would_recommend === true)
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
      recommendationReason: reading.recommendation_reason,
      contentCount: contentSummaries.get(reading.books.id)?.count,
      hasVideoContent: contentSummaries.get(reading.books.id)?.hasVideo,
    }))
    // Prioridade de curadoria: favoritos primeiro, depois os "recomendaria".
    // Dentro de cada grupo, nota mais alta primeiro.
    .sort((a, b) => {
      const priorityDiff = readingPriority(a) - readingPriority(b);
      if (priorityDiff !== 0) return priorityDiff;

      return (b.rating ?? 0) - (a.rating ?? 0);
    });
}

/**
 * Destaque "Recomendação do mês" — hero acima da grade em `/recomendacoes`.
 * `null` quando nenhuma leitura está marcada (`is_recommendation_of_month`),
 * ou quando a leitura marcada não é mais parte da curadoria (livro
 * desmarcado de favorite/would_recommend sem desmarcar "Recomendação do
 * mês" também) — defesa em profundidade para nunca destacar um livro que
 * não apareceria na grade abaixo dele.
 */
export async function getPublicRecommendationOfMonth(): Promise<
  (DetailedBook & { favorite: boolean; wouldRecommend: boolean }) | null
> {
  const [reading, settings] = await Promise.all([getRecommendationOfMonth(), getSettings()]);

  if (!reading || (!reading.favorite && !reading.would_recommend)) {
    return null;
  }

  return {
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
    amazonUrl: resolveAmazonPurchaseUrl(reading.books.amazon_url, settings?.amazon_associate_id),
    review: reading.review,
    favorite: reading.favorite,
    wouldRecommend: reading.would_recommend,
    recommendationReason: reading.recommendation_reason,
  };
}
