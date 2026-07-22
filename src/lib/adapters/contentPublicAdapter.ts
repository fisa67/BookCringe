import { getContents } from "@/lib/services/contentService";
import { getBooks } from "@/lib/services/bookService";
import { isContentPublished, isVideoContentType, CONTENT_FILTERS, type ContentFilterKey } from "@/lib/content";
import type { CmsContentRecord, CmsBookRecord } from "@/lib/types/cms";

/**
 * Adapter público do módulo de Conteúdos (Fase 1 — reels/shorts/vídeos/
 * carrosséis/reviews vinculados a livros). Reaproveita `contentService`
 * (mesma tabela `contents` usada pelo admin) e `bookService.getBooks()`
 * para o embed de livro (título/autor/slug) — nenhuma tabela nova, nenhum
 * SQL novo, filtragem "publicado" (ver `isContentPublished`) sempre em
 * memória, igual às demais páginas públicas deste projeto.
 *
 * Consumido por: seção "Conteúdos sobre este livro" (`/livro/[slug]`),
 * "Últimos conteúdos" (Home), `/conteudos`, e pelos badges de contagem em
 * Biblioteca/Recomendações/Home (`getPublicContentSummaryByBook`).
 */

export interface PublicContentWithBook extends CmsContentRecord {
  book: Pick<CmsBookRecord, "id" | "title" | "author" | "slug">;
}

async function fetchPublishedContentsWithBooks(): Promise<PublicContentWithBook[]> {
  const [contents, books] = await Promise.all([getContents({ sort: "recent" }), getBooks()]);
  if (!contents || !books) return [];

  const booksById = new Map(books.map((book) => [book.id, book]));

  const withBooks: PublicContentWithBook[] = [];
  for (const content of contents) {
    if (!isContentPublished(content.published_at)) continue;
    const book = booksById.get(content.book_id);
    if (!book) continue; // conteúdo órfão (livro removido) — não exibido publicamente
    withBooks.push({
      ...content,
      book: { id: book.id, title: book.title, author: book.author, slug: book.slug },
    });
  }

  return withBooks;
}

/**
 * Conteúdos publicados de um livro específico, do mais recente para o
 * mais antigo (`published_at` desc) — usado pela seção "Conteúdos sobre
 * este livro". Sem priorizar destaque aqui: na página do próprio livro a
 * ordem cronológica é mais previsível para o leitor; destaque só afeta a
 * ordem em listagens de múltiplos livros (`getPublicRecentContents`).
 */
export async function getPublicContentsForBook(bookId: string): Promise<PublicContentWithBook[]> {
  const all = await fetchPublishedContentsWithBooks();
  return all
    .filter((content) => content.book_id === bookId)
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
}

export interface ContentSummary {
  /** Quantidade de conteúdos publicados do livro. */
  count: number;
  /** true quando há ao menos 1 conteúdo do tipo reel/short/youtube/video — dispara o CTA "▶ Assistir vídeo". */
  hasVideo: boolean;
}

/**
 * Map bookId -> resumo de conteúdo (contagem + presença de vídeo). Uma
 * única busca, reaproveitada pelos 3 adapters que precisam dos badges de
 * conteúdo (biblioteca, recomendações, últimas leituras da Home) — evita
 * repetir a query de `contents` em cada um.
 */
export async function getPublicContentSummaryByBook(): Promise<Map<string, ContentSummary>> {
  const all = await fetchPublishedContentsWithBooks();
  const summaries = new Map<string, ContentSummary>();

  for (const content of all) {
    const current = summaries.get(content.book_id) ?? { count: 0, hasVideo: false };
    summaries.set(content.book_id, {
      count: current.count + 1,
      hasVideo: current.hasVideo || isVideoContentType(content.content_type),
    });
  }

  return summaries;
}

/**
 * Total de conteúdos publicados (qualquer livro/tipo) — contador
 * "N conteúdos publicados" da Home (`RecentContents`).
 */
export async function getPublicContentsCount(): Promise<number> {
  const all = await fetchPublishedContentsWithBooks();
  return all.length;
}

/**
 * Últimos N conteúdos publicados, de qualquer livro — Home ("Últimos
 * conteúdos"). Destaques (`is_featured`) sempre primeiro, depois mais
 * recentes dentro de cada grupo.
 */
export async function getPublicRecentContents(limit = 8): Promise<PublicContentWithBook[]> {
  const all = await fetchPublishedContentsWithBooks();
  return all
    .sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return (b.published_at ?? "").localeCompare(a.published_at ?? "");
    })
    .slice(0, limit);
}

/**
 * Livros distintos com pelo menos um conteúdo publicado, ordenados por
 * título — popula o filtro "por livro" de `/conteudos`
 * (`ContentsExplorer`, client-side).
 */
export async function getPublicContentBookOptions(): Promise<
  Array<{ id: string; title: string; author: string }>
> {
  const all = await fetchPublishedContentsWithBooks();
  const byId = new Map<string, { id: string; title: string; author: string }>();

  for (const content of all) {
    if (!byId.has(content.book_id)) {
      byId.set(content.book_id, {
        id: content.book.id,
        title: content.book.title,
        author: content.book.author,
      });
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
}

export interface PublicContentFilters {
  filter?: ContentFilterKey;
  bookId?: string;
}

/** Todos os conteúdos publicados, com os filtros da página `/conteudos`. */
export async function getPublicContents(
  filters: PublicContentFilters = {}
): Promise<PublicContentWithBook[]> {
  const all = await fetchPublishedContentsWithBooks();
  const activeFilter = CONTENT_FILTERS.find((item) => item.key === filters.filter);
  const allowedTypes = activeFilter?.types;

  return all
    .filter((content) => !allowedTypes || allowedTypes.includes(content.content_type))
    .filter((content) => !filters.bookId || content.book_id === filters.bookId)
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
}
