import type { BookInsight, BookInsightRule } from "@/lib/books/insights/types";

/** Nota pessoal (`book_readings.rating`) a partir da qual o livro é considerado "bem avaliado" para fins desta regra. */
export const HIGH_RATING_THRESHOLD = 4;

/**
 * "Sem conteúdo em vídeo": um livro que é a recomendação atual, foi
 * marcado como favorito/recomendado, ou tem nota pessoal alta, é um bom
 * candidato a virar Reel/Short/vídeo — mas ainda não tem nenhum conteúdo
 * desse tipo publicado.
 */
export const noVideoContentRule: BookInsightRule = {
  id: "no-video-content",
  description: "Aponta livros com bom desempenho editorial mas sem nenhum conteúdo em vídeo.",
  evaluate({ book, reading, participations }): BookInsight[] {
    if (participations.hasVideoContent) return [];

    const isStrongCandidate =
      participations.isCurrentRecommendation ||
      reading?.favorite ||
      reading?.would_recommend ||
      (typeof reading?.rating === "number" && reading.rating >= HIGH_RATING_THRESHOLD);

    if (!isStrongCandidate) return [];

    return [
      {
        id: `no-video-content:${book.id}`,
        ruleId: "no-video-content",
        severity: "info",
        title: "Sem conteúdo em vídeo",
        message: "Este livro tem bom desempenho editorial, mas ainda não tem nenhum Reel, Short ou vídeo.",
        actionLabel: "Criar Reel",
        actionHref: `/admin/content/new?bookId=${book.id}&platform=instagram&type=reel`,
      },
    ];
  },
};
