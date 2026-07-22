import type { DetailedBook } from "@/lib/types";
import { getBookBySlug } from "@/lib/services/bookService";
import { getReadingByBook } from "@/lib/services/bookReadingService";
import { getSettings } from "@/lib/services/settingsService";
import { resolveAmazonPurchaseUrl } from "@/lib/services/affiliateService";
import { getPublicContentsForBook, type PublicContentWithBook } from "@/lib/adapters/contentPublicAdapter";
import { isVideoContentType } from "@/lib/content";

/**
 * Adapter da página pública `/livro/[slug]` — primeira página de detalhe
 * de livro do site (antes só existiam listagens: Biblioteca, Recomendações,
 * Clube). Combina `books` + `book_readings` (nota/review/favorito) +
 * `contents` (conteúdos publicados) numa única chamada, reaproveitando os
 * services já existentes — nenhuma query nova.
 */
export interface PublicBookDetail extends DetailedBook {
  favorite: boolean;
  wouldRecommend: boolean;
  contents: PublicContentWithBook[];
}

export async function getPublicBookDetail(slug: string): Promise<PublicBookDetail | null> {
  const book = await getBookBySlug(slug);
  if (!book) return null;

  const [reading, settings, contents] = await Promise.all([
    getReadingByBook(book.id),
    getSettings(),
    getPublicContentsForBook(book.id),
  ]);

  return {
    id: book.id,
    slug: book.slug,
    title: book.title,
    author: book.author,
    cover: book.cover_path ?? undefined,
    amazonUrl: resolveAmazonPurchaseUrl(book.amazon_url, settings?.amazon_associate_id),
    status: reading?.status === "finished" ? "finished" : undefined,
    rating: reading?.rating,
    pages: book.page_count,
    year: book.publication_year,
    genre: book.genres,
    country: book.country,
    readAt: reading?.finished_at,
    review: reading?.review,
    favorite: reading?.favorite ?? false,
    wouldRecommend: reading?.would_recommend ?? false,
    contentCount: contents.length,
    hasVideoContent: contents.some((content) => isVideoContentType(content.content_type)),
    contents,
  };
}
